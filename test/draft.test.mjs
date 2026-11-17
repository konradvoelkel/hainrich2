import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Ledger } from '../lib/budget.js';
import { draftFor, REQUESTS_PER_DAY, runJobs, TITLES_PER_DAY } from '../lib/draft.js';
import { MAX_AUFTRAG, openSpool } from '../lib/spool.js';

const DAY = '2026-11-05';
const passage = { id: 'p', title: 'Backpropagation', path: ['Das Muster'], text: 'Der Aufwand ist etwa das Doppelte.', page: 'backpropagation', link: 'https://skript.test/backpropagation#das-muster' };
const corpus = {
  embedder: { query: async () => [0.123456, 0.5] },
  select: async () => [passage],
  chapters: async () => [passage, passage],
};
const cited = text => ({ model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 100 }, content: [{ type: 'text', text, citations: [{ document_index: 0 }] }] });
const plain = (text, extra = {}) => ({ model: 'claude-opus-5-5', stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 100 }, content: [{ type: 'text', text }], ...extra });

const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
const ledger = (limit = 15) => new Ledger(path.join(temp(), 'kosten.json'), limit);
const job = { id: 'abc', text: 'Warum rückwärts?' };
const timeout = () => Object.assign(new Error('Request timed out.'), { name: 'APIConnectionTimeoutError' });
const refusal = status => Object.assign(new Error('abgewiesen'), { status });
const nowait = async () => {};
/** arbeitet die Liste ab: Fehler werden geworfen, alles andere ist die Antwort */
const scripted = list => {
  const calls = { count: 0 };
  return Object.assign(async () => {
    calls.count += 1;
    const next = list.shift();
    if (next instanceof Error) throw next;
    return next;
  }, { calls });
};

test('ein Entwurf trägt Zitat aus dem Korpus, Kapitel und gerundeten Vektor, und das Kostenbuch zählt ihn', async () => {
  const book = ledger();
  const result = await draftFor(job, { corpus, call: async () => cited('Weil es billiger ist.'), ledger: book, day: DAY });
  assert.equal(result.status, 'ok');
  assert.match(result.text, /\[1\]/);
  assert.equal(result.zitate[0].text, passage.text);
  assert.equal(result.kapitel, 'Backpropagation');
  assert.deepEqual(result.vektor, [0.1235, 0.5]);
  assert.equal(book.entries.length, 1);
});

test('wer noch einmal fragt, bekommt gleich ganze Kapitel und keinen weiteren Anlauf', async () => {
  const counts = [];
  const book = ledger();
  const again = { ...corpus, select: async () => assert.fail('Passagen gab es schon'), chapters: async (_, count) => { counts.push(count); return [passage]; } };
  const result = await draftFor({ ...job, gruendlich: true }, { corpus: again, call: async () => plain('KEIN_BELEG'), ledger: book, day: DAY });
  assert.equal(result.status, 'kein_beleg');
  assert.deepEqual(counts, [3]);
  assert.equal(book.entries.length, 1);
});

test('ohne Beleg gibt es einen zweiten Anlauf mit ganzen Kapiteln', async () => {
  const seen = [];
  const answers = [plain('KEIN_BELEG'), cited('Doch.')];
  const result = await draftFor(job, { corpus, call: async request => { seen.push(request.messages[0].content.length); return answers.shift(); }, ledger: ledger(), day: DAY });
  assert.equal(result.status, 'ok');
  assert.deepEqual(seen, [2, 3]);
});

test('der Tagesdeckel verhindert den Aufruf, der Vektor entsteht trotzdem', async () => {
  const book = ledger();
  for (let i = 0; i < REQUESTS_PER_DAY; i++) book.add(DAY, 'claude-opus-5-5', { input_tokens: 1 });
  const result = await draftFor(job, { corpus, call: () => assert.fail('kein Aufruf über dem Deckel'), ledger: book, day: DAY });
  assert.equal(result.status, 'deckel');
  assert.ok(result.vektor);
});

test('der Monatsdeckel verhindert den Aufruf', async () => {
  const book = ledger(0.5);
  const result = await draftFor(job, { corpus, call: () => assert.fail('kein Aufruf über dem Deckel'), ledger: book, day: DAY });
  assert.equal(result.status, 'deckel');
});

test('Fallback: alle Versuche zählen, auch auf einem Modell ohne eigenen Preis', () => {
  const book = ledger();
  book.addResponse(DAY, plain('x', { model: 'claude-opus-5', usage: { input_tokens: 1000, output_tokens: 100, iterations: [{ type: 'message', model: 'claude-opus-5-5', input_tokens: 1000, output_tokens: 0 }, { type: 'fallback_message', model: 'claude-opus-unbekannt', input_tokens: 1000, output_tokens: 100 }] } }));
  assert.equal(book.entries.length, 2);
  assert.ok(book.total > 0);
});

test('jeder Auftrag endet mit einem Ergebnis, auch wenn die API ausfällt, und das Log kennt den Text nicht', async t => {
  const spool = openSpool(temp());
  spool.submit({ id: 'a', text: 'Eine geheime Formulierung?' });
  spool.submit({ id: 'b', text: 'Noch eine?' });
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args.join(' ')));
  t.mock.method(console, 'log', (...args) => logged.push(args.join(' ')));
  const failure = Object.assign(new Error('Eine geheime Formulierung?'), { status: 529 });
  const book = ledger();
  await runJobs({ spool, corpus, call: async () => { throw failure; }, ledger: book, day: DAY, wait: nowait });
  assert.deepEqual(book.entries, [], 'eine Absage der API kostet nichts');
  assert.deepEqual(spool.jobs(), []);
  assert.deepEqual(spool.results().map(r => r.entry.status), ['fehler', 'fehler']);
  assert.ok(!logged.join('\n').includes('geheime'));
});

test('bricht ein Aufruf ohne Antwort ab, bleibt der schlimmste Fall im Buch, zählt für den Tag, und es gibt keinen zweiten Versuch', async () => {
  const book = ledger();
  const call = scripted([timeout(), cited('Zu spät.')]);
  await assert.rejects(draftFor(job, { corpus, call, ledger: book, day: DAY, wait: nowait }), /timed out/);
  assert.equal(call.calls.count, 1);
  assert.deepEqual(book.entries.map(e => [e.label, e.dollars, e.offen]), [[DAY, 0.6, true]]);
});

test('abgebrochene Aufrufe füllen den Tagesdeckel wie beantwortete', async () => {
  const book = ledger(1000);
  for (let i = 0; i < REQUESTS_PER_DAY; i++) await assert.rejects(draftFor(job, { corpus, call: scripted([timeout()]), ledger: book, day: DAY, wait: nowait }));
  const result = await draftFor(job, { corpus, call: () => assert.fail('kein Aufruf über dem Deckel'), ledger: book, day: DAY });
  assert.equal(result.status, 'deckel');
});

test('bei Überlast gibt es zwei weitere Versuche mit Pause, und gebucht wird nur die Antwort', async () => {
  const book = ledger();
  const pauses = [];
  const call = scripted([refusal(529), refusal(503), cited('Doch.')]);
  const result = await draftFor(job, { corpus, call, ledger: book, day: DAY, wait: async ms => pauses.push(ms) });
  assert.equal(result.status, 'ok');
  assert.deepEqual(pauses, [2000, 8000]);
  assert.deepEqual(book.entries.map(e => !!e.offen), [false]);
});

test('nach drei Absagen ist Schluss, eine Absage wegen der Anfrage selbst wird nicht wiederholt, und im Buch steht nichts', async () => {
  const book = ledger();
  const busy = scripted([refusal(529), refusal(529), refusal(529), cited('Nie.')]);
  await assert.rejects(draftFor(job, { corpus, call: busy, ledger: book, day: DAY, wait: nowait }));
  assert.equal(busy.calls.count, 3);
  const invalid = scripted([refusal(400), cited('Nie.')]);
  await assert.rejects(draftFor(job, { corpus, call: invalid, ledger: book, day: DAY, wait: nowait }));
  assert.equal(invalid.calls.count, 1);
  assert.deepEqual(book.entries, []);
});

test('nach der Frist fängt der Worker keinen Auftrag mehr an, der Rest bleibt in der Schlange', async t => {
  t.mock.method(console, 'log', () => {});
  const spool = openSpool(temp());
  for (const id of ['a', 'b', 'c']) spool.submit({ id, text: 'Eine Frage?' });
  let time = 0;
  const call = async () => { time += 60; return cited('Ja.'); };
  const done = await runJobs({ spool, corpus, call, ledger: ledger(), day: DAY, until: 100, now: () => time });
  assert.equal(done, 2);
  assert.equal(spool.jobs().length, 1);
  assert.equal(spool.results().length, 2);
});

const titled = text => plain(text);
/** unterscheidet die beiden Anfragen an ihrer Form: Die für den Titel hat keine Passagen */
const beides = (antwort, titel) => {
  const seen = [];
  return Object.assign(async request => {
    const art = request.messages[0].content.some(block => block.type === 'document') ? 'antwort' : 'titel';
    seen.push(art);
    const next = art === 'titel' ? titel : antwort;
    if (next instanceof Error) throw next;
    return next;
  }, { seen });
};

test('D31: Mit `titel` kommt zum Entwurf ein Kurztitel, als eigener Aufruf nach der Antwort, eigens gebucht', async () => {
  const book = ledger();
  const call = beides(cited('Weil es billiger ist.'), titled('Backpropagation: Warum rückwärts?'));
  const result = await draftFor({ ...job, titel: true }, { corpus, call, ledger: book, day: DAY });
  assert.deepEqual(call.seen, ['antwort', 'titel']);
  assert.deepEqual([result.status, result.titel], ['ok', 'Backpropagation: Warum rückwärts?']);
  assert.deepEqual(book.entries.map(e => [e.label, e.art ?? null, !!e.offen]), [[DAY, null, false], [DAY, 'titel', false]]);
  const ohne = await draftFor(job, { corpus, call: beides(cited('Ja.'), new Error('kein Titel verlangt')), ledger: ledger(), day: DAY });
  assert.equal('titel' in ohne, false);
});

test('D31: `nurTitel` fragt nicht nach einer Antwort und rechnet keinen Vektor', async () => {
  const book = ledger();
  const call = beides(new Error('keine Antwort verlangt'), titled('Rückwärts statt vorwärts'));
  const stumm = { embedder: { query: () => assert.fail('kein Vektor') }, select: () => assert.fail('keine Suche'), chapters: () => assert.fail('keine Suche') };
  assert.deepEqual(await draftFor({ ...job, titel: true, nurTitel: true }, { corpus: stumm, call, ledger: book, day: DAY }), { id: 'abc', art: 'titel', titel: 'Rückwärts statt vorwärts' });
  assert.deepEqual(call.seen, ['titel']);
});

test('D31: Scheitert der Kurztitel, steht der Entwurf trotzdem; eine Absage kostet nichts, ein Abbruch bleibt im Buch', async t => {
  t.mock.method(console, 'error', () => {});
  const book = ledger();
  const abgewiesen = await draftFor({ ...job, titel: true }, { corpus, call: beides(cited('Ja.'), refusal(529)), ledger: book, day: DAY });
  assert.deepEqual([abgewiesen.status, abgewiesen.titel], ['ok', undefined]);
  assert.deepEqual(book.entries.map(e => e.art ?? null), [null]);
  const abgebrochen = await draftFor({ ...job, titel: true }, { corpus, call: beides(cited('Ja.'), timeout()), ledger: book, day: DAY });
  assert.equal(abgebrochen.status, 'ok');
  assert.deepEqual(book.entries.map(e => [e.art ?? null, !!e.offen]), [[null, false], [null, false], ['titel', true]]);
});

test('D31: Kurztitel zählen nicht gegen die Anfragen des Tages, und umgekehrt', async () => {
  const book = ledger(1000);
  for (let i = 0; i < REQUESTS_PER_DAY; i++) book.reserve(DAY, 'claude-opus-5-5', 0.01);
  const titel = await draftFor({ ...job, nurTitel: true }, { corpus, call: async () => titled('Ein Titel trotz Deckel'), ledger: book, day: DAY });
  assert.equal(titel.titel, 'Ein Titel trotz Deckel');
  const buch = ledger(1000);
  for (let i = 0; i < TITLES_PER_DAY; i++) buch.reserve(DAY, 'claude-opus-5-5', 0.01, 'titel');
  const antwort = await draftFor({ ...job, titel: true }, { corpus, call: beides(cited('Ja.'), new Error('über dem Deckel')), ledger: buch, day: DAY });
  assert.deepEqual([antwort.status, antwort.titel], ['ok', undefined]);
});

test('D31: Gleichzeitige Aufträge kommen nicht am Tagesdeckel der Kurztitel vorbei, und über dem Monatsdeckel geht keiner hinaus', async () => {
  const book = ledger(1000);
  for (let i = 0; i < TITLES_PER_DAY - 3; i++) book.reserve(DAY, 'claude-opus-5-5', 0.01, 'titel');
  let calls = 0;
  const call = async () => { calls += 1; await new Promise(done => setTimeout(done, 5)); return titled('Ein Titel für alle'); };
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => draftFor({ id: `j${i}`, text: 'Eine Frage?', nurTitel: true }, { corpus, call, ledger: book, day: DAY })));
  assert.equal(calls, 3);
  assert.equal(results.filter(r => r.titel).length, 3);
  const voll = ledger(0.04);
  assert.equal((await draftFor({ ...job, nurTitel: true }, { corpus, call: () => assert.fail('kein Aufruf über dem Deckel'), ledger: voll, day: DAY })).titel, null);
  assert.deepEqual(voll.entries, []);
});

test('D4: Der Worker glaubt der Schlange nicht: Ohne gültige Kennung verschwindet der Auftrag, ein zu langer Text endet als Fehler, beides ohne Anfrage', async t => {
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args.join(' ')));
  t.mock.method(console, 'log', () => {});
  const dir = temp();
  const spool = openSpool(dir);
  assert.throws(() => spool.submit({ id: '../../etc/passwd', text: 'Eine Frage?' }), /ungültige Kennung/);
  assert.throws(() => spool.finish('nirgends', { id: 'A B', status: 'ok' }), /ungültige Kennung/);
  /** was ein übernommener Web-Prozess an `submit` vorbei in die Schlange legen könnte */
  const legen = (name, entry) => fs.writeFileSync(path.join(dir, 'eingang', name), JSON.stringify(entry));
  legen('a.json', { id: '../../ausgang/x', text: 'Eine geheime Frage?' });
  legen('b.json', { id: 'lang', text: 'x'.repeat(MAX_AUFTRAG + 1) });
  legen('c.json', { id: 'ohne' });
  legen('d.json', { id: 7, text: 'Eine Frage?' });
  legen('e.json', null);
  const book = ledger();
  const done = await runJobs({ spool, corpus, call: () => assert.fail('keine Anfrage für einen ungültigen Auftrag'), ledger: book, day: DAY });
  assert.equal(done, 5);
  assert.deepEqual(spool.jobs(), []);
  assert.deepEqual(spool.results().map(r => [r.entry.id, r.entry.status]).sort(), [['lang', 'fehler'], ['ohne', 'fehler']]);
  assert.deepEqual(book.entries, []);
  assert.ok(!logged.join('\n').includes('geheime'));
});

test('D35: `nurVektor` rechnet lokal, fragt niemanden und bucht nichts; das Ergebnis nennt seinen Wortlaut nur als Kennzeichen', async () => {
  const { textDigest } = await import('../lib/spool.js');
  const book = ledger();
  const result = await draftFor({ ...job, nurVektor: true }, { corpus, call: () => assert.fail('keine Anfrage für einen Vektor'), ledger: book, day: DAY });
  assert.deepEqual(result, { id: 'abc', art: 'vektor', vektor: [0.1235, 0.5], von: textDigest(job.text) });
  assert.deepEqual(book.entries, []);
  assert.ok(!JSON.stringify(result).includes('rückwärts'));
});

test('D35: Jedes Ergebnis mit Vektor nennt das Kennzeichen seines Wortlauts, auch ohne Beleg', async () => {
  const { textDigest } = await import('../lib/spool.js');
  const mit = await draftFor(job, { corpus, call: async () => cited('Ja.'), ledger: ledger(), day: DAY });
  const ohne = await draftFor(job, { corpus, call: async () => plain('KEIN_BELEG'), ledger: ledger(), day: DAY });
  assert.deepEqual([mit.von, ohne.von], [textDigest(job.text), textDigest(job.text)]);
});
