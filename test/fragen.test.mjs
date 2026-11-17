import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createApi, READS_PER_MINUTE } from '../lib/api.js';
import { checkToken, hashPassphrase, issueToken, tokenKey } from '../lib/auth.js';
import { hardHits, softHits } from '../lib/checker.js';
import { CC0, createFragen, GRUENDE, ZUSTIMMUNG } from '../lib/fragen.js';
import { createHandler } from '../lib/mod.js';
import { openPending } from '../lib/pending.js';
import { createPublisher, publishAll } from '../lib/publish.js';
import { openSpool } from '../lib/spool.js';
import { askPage, indexPage, robotsTxt } from '../lib/site.js';
import { openStore } from '../lib/store.js';

const CODE = 'nur-fuer-den-test';
const PASSPHRASE = 'passphrase-fuer-den-test';
const FRAGE = 'Warum ist Backpropagation effizient?';
const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 1 MB' };
const zitat = { titel: 'Backpropagation', pfad: ['Das Muster'], text: 'Wörtliches Zitat.', url: 'https://skript.test/a/' };
const seed = { id: 's01', text: 'Was ist ein Neuron?', kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [] };
const KAPITEL = 'Backpropagation';

async function setup({ spooling = true, now = Date.now } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([seed], [[1, 0, 0]], { ...site, fragen: true, entwurf: spooling });
  store.saveModerator('konrad', 'admin', await hashPassphrase(PASSPHRASE));
  await publishAll(live, store);
  const pending = openPending(path.join(dir, 'pending.db'), { now });
  const spool = spooling ? openSpool(path.join(dir, 'schlange')) : null;
  const publish = createPublisher(live, store);
  const fragen = createFragen({ store, pending, spool, publish, now });
  const hash = await hashPassphrase(CODE);
  const api = createApi({ fragen, pending, store, hash, now });
  const mod = createHandler({ store, live, publish, fragen });
  const server = http.createServer((req, res) => (req.url.startsWith('/eidl/api/') ? api : mod)(req, res));
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = async (name, body, { token, from = origin, headers = {} } = {}) => {
    const res = await fetch(`${origin}/eidl/api/${name}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', Origin: from, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    });
    return { status: res.status, data: await res.json() };
  };
  const token = async () => (await post('token', { kurscode: CODE })).data.token;
  const ask = async (fields = {}, auth) => post('fragen', { frage: FRAGE, zustimmung: ZUSTIMMUNG.version, ...fields }, { token: auth ?? await token() });
  const form = (url, fields, cookie) => fetch(`${origin}${url}`, {
    method: 'POST',
    redirect: 'manual',
    body: new URLSearchParams(fields),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin, ...(cookie ? { Cookie: cookie } : {}) },
  });
  const signIn = async () => (await form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE })).headers.get('set-cookie').split(';')[0];
  const page = async (url, cookie) => (await fetch(`${origin}${url}`, { headers: { Cookie: cookie } })).text();
  const inbox = () => (spool ? spool.jobs().map(j => j.entry) : []);
  /** was ein Worker abliefern würde, ohne Worker */
  const deliver = (id, result = { status: 'ok', modell: 'attrappe', text: 'Antwort.[1]', zitate: [zitat], kapitel: KAPITEL, vektor: [0, 1, 0] }) => {
    const job = spool.jobs().find(j => j.entry.id === id);
    spool.finish(job.file, { id, ...result });
    return fragen.collect();
  };
  const mine = async (id, geheimnis) => (await post('meine', { fragen: [{ id, geheimnis }] })).data.fragen[0];
  const file = name => path.join(live, 'eidl', name);
  return { dir, store, pending, spool, fragen, post, token, ask, form, signIn, page, inbox, deliver, mine, file, close: () => server.close() };
}

test('der Kurscode gibt ein Token aus, ein falscher nicht, und ohne Token gibt es keine Frage', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal((await c.post('token', { kurscode: 'falsch' })).status, 401);
  assert.equal((await c.ask({}, 'erfunden.signatur')).status, 401);
  assert.equal(c.pending.count(), 0);
  assert.equal((await c.ask()).status, 201);
});

test('nach zehn falschen Codes hilft auch der richtige nicht mehr', async t => {
  const c = await setup();
  t.after(c.close);
  for (let i = 0; i < 10; i++) await c.post('token', { kurscode: 'falsch' });
  assert.equal((await c.post('token', { kurscode: CODE })).status, 429);
});

test('gleichzeitige Fehlversuche kommen nicht an der Grenze vorbei', async t => {
  const c = await setup();
  t.after(c.close);
  const results = await Promise.all(Array.from({ length: 40 }, (_, i) => c.post('token', { kurscode: `falsch-${i}` })));
  assert.equal(results.filter(r => r.status === 401).length, 10);
  assert.equal(results.filter(r => r.status === 429).length, 30);
});

test('ein richtiger Code zählt nicht als Fehlversuch, auch nicht zwischen falschen', async t => {
  const c = await setup();
  t.after(c.close);
  const results = await Promise.all(Array.from({ length: 10 }, (_, i) => c.post('token', { kurscode: i === 4 ? CODE : 'falsch' })));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal((await c.post('token', { kurscode: CODE })).status, 200, 'neun Fehlversuche, der zehnte Platz ist wieder frei');
  await c.post('token', { kurscode: 'falsch' });
  assert.equal((await c.post('token', { kurscode: CODE })).status, 429);
});

test('Adressen aus demselben /64 teilen sich die Grenze, das Nachbarnetz nicht', async t => {
  const c = await setup();
  t.after(c.close);
  const von = address => ({ headers: { 'X-Forwarded-For': address } });
  for (let i = 1; i <= 10; i++) await c.post('token', { kurscode: 'falsch' }, von(`2001:db8:1:2::${i}`));
  assert.equal((await c.post('token', { kurscode: CODE }, von('2001:db8:1:2:ffff::1'))).status, 429);
  assert.equal((await c.post('token', { kurscode: CODE }, von('2001:db8:1:3::1'))).status, 200);
});

test('„Meine Fragen“ und Löschen haben eine Bremse je Adresse, andere merken davon nichts', async t => {
  const c = await setup();
  t.after(c.close);
  const hier = { headers: { 'X-Forwarded-For': '203.0.113.9' } };
  const statuses = [];
  for (let sent = 0; sent < READS_PER_MINUTE + 5; sent += 121) {
    statuses.push(...(await Promise.all(Array.from({ length: 121 }, () => c.post('meine', { fragen: [] }, hier)))).map(r => r.status));
  }
  assert.equal(statuses.length, READS_PER_MINUTE + 5);
  assert.equal(statuses.filter(s => s === 200).length, READS_PER_MINUTE);
  assert.equal(statuses.filter(s => s === 429).length, 5);
  assert.equal((await c.post('loeschen', { id: 'x', geheimnis: 'y' }, hier)).status, 429);
  assert.equal((await c.post('meine', { fragen: [] })).status, 200);
});

test('eine zurückgezogene Frage ist für „Meine Fragen“ weg, eine sichtbare kommt ohne Antworten und Vektor', async t => {
  const c = await setup();
  t.after(c.close);
  const shown = await c.mine('s01', 'egal');
  assert.deepEqual(Object.keys(shown).sort(), ['html', 'id', 'url', 'zustand']);
  assert.equal(shown.zustand, 'öffentlich');
  c.store.setQuestionStatus('s01', 'zurückgezogen', 'admin');
  assert.deepEqual(await c.mine('s01', 'egal'), { id: 's01', zustand: 'weg' });
});

test('ein Hörsaal hinter einer Adresse kommt rein, erst der 31. Zugang wartet', async t => {
  const c = await setup();
  t.after(c.close);
  for (let i = 0; i < 30; i++) assert.equal((await c.post('token', { kurscode: CODE })).status, 200);
  assert.equal((await c.post('token', { kurscode: CODE })).status, 429);
});

test('eine fremde Seite kann nichts einreichen', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal((await c.post('token', { kurscode: CODE }, { from: 'https://fremd.test' })).status, 403);
});

test('I1: Ohne Einwilligung erreicht die Frage die Schlange nicht', async t => {
  const c = await setup();
  t.after(c.close);
  const { status, data } = await c.ask({ einwilligung: false });
  assert.equal(status, 201);
  assert.deepEqual(c.inbox(), []);
  assert.equal(c.pending.get(data.id).einwilligung, false);
  assert.equal(c.pending.get(data.id).zustand, 'wartet');
});

test('I1: Nur ein echtes true ist eine Einwilligung', async t => {
  const c = await setup();
  t.after(c.close);
  for (const einwilligung of ['true', 1, 'ja', {}]) assert.equal((await c.ask({ einwilligung })).status, 201);
  assert.equal(c.pending.count(), 4);
  assert.deepEqual(c.inbox(), []);
});

test('I1: Harte Treffer werden gar nicht erst gespeichert, auch mit Einwilligung', async t => {
  const c = await setup();
  t.after(c.close);
  const { status, data } = await c.ask({ frage: 'Meine Matrikelnummer ist 1234567, warum ist das so?', einwilligung: true });
  assert.equal(status, 422);
  assert.ok(data.treffer.length);
  assert.equal(c.pending.count(), 0);
  assert.deepEqual(c.inbox(), []);
});

test('I1: Weiche Treffer halten den Entwurf zurück, die Frage wartet auf die Moderation', async t => {
  const c = await setup();
  t.after(c.close);
  for (const frage of ['Ich heiße Anna und verstehe Tensoren nicht.', 'Hat Herr Völkel das in der Vorlesung erklärt?', 'Ich habe ein Attest, wie geht Backpropagation?']) {
    const { status, data } = await c.ask({ frage, einwilligung: true });
    assert.equal(status, 201);
    assert.equal(data.entwurf, false);
    assert.equal(data.zurueckgehalten, true);
  }
  assert.deepEqual(c.inbox(), []);
});

test('mit Einwilligung geht genau der Text in die Schlange, ohne Geheimnis und ohne Token', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  assert.deepEqual(c.inbox(), [{ id: data.id, text: FRAGE }]);
  assert.equal(c.pending.get(data.id).zustand, 'entwurf');
});

test('ohne Schlange ist die Einwilligung gegenstandslos, die Frage kommt trotzdem an', async t => {
  const c = await setup({ spooling: false });
  t.after(c.close);
  const { status, data } = await c.ask({ einwilligung: true });
  assert.equal(status, 201);
  assert.equal(c.pending.get(data.id).zustand, 'wartet');
});

test('Frage und Entwurf sieht nur, wer das Geheimnis hat, und öffentlich steht nichts davon', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  assert.equal((await c.mine(data.id, data.geheimnis)).zustand, 'entwurf');
  await c.deliver(data.id);
  const own = await c.mine(data.id, data.geheimnis);
  assert.equal(own.text, FRAGE);
  assert.match(own.entwurf.html, /Entwurf/);
  assert.match(own.entwurf.html, /Sprachmodell/);
  assert.match(own.entwurf.html, /Wörtliches Zitat/);
  assert.deepEqual(await c.mine(data.id, 'falsch'), { id: data.id, zustand: 'weg' });

  assert.equal(fs.existsSync(c.file(`f/${data.id}/index.html`)), false);
  for (const name of ['index.html', 'daten/fragen.json', 'sitemap.xml', 'f/lernen/index.html']) assert.ok(!fs.readFileSync(c.file(name), 'utf8').includes(FRAGE), name);
  assert.equal(c.store.question(data.id), null);
});

test('Scheitert der Entwurf, wartet die Frage ohne Text von Claude auf die Moderation', async t => {
  const c = await setup();
  t.after(c.close);
  for (const status of ['fehler', 'deckel', 'verweigert']) {
    const { data } = await c.ask({ einwilligung: true });
    await c.deliver(data.id, { status });
    const own = await c.mine(data.id, data.geheimnis);
    assert.equal(own.zustand, 'wartet');
    assert.equal(own.entwurf.html, '');
  }
});

test('Geht der Auftrag verloren, hängt die Frage nicht', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  fs.rmSync(path.join(c.dir, 'schlange/eingang', `${data.id}.json`));
  await c.fragen.collect();
  assert.equal(c.pending.get(data.id).zustand, 'wartet');
});

test('Löschen ist der Widerruf: Text weg, Auftrag weg, ein spätes Ergebnis verfällt', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  assert.equal((await c.post('loeschen', { id: data.id, geheimnis: 'falsch' })).status, 404);
  assert.equal(c.pending.count(), 1);
  assert.equal((await c.post('loeschen', { id: data.id, geheimnis: data.geheimnis })).status, 200);
  assert.equal(c.pending.get(data.id), null);
  assert.deepEqual(c.inbox(), []);
  c.spool.finish(path.join(c.dir, 'nichts'), { id: data.id, status: 'ok', text: 'Zu spät.', zitate: [zitat] });
  await c.fragen.collect();
  assert.equal(c.store.question(data.id), null);
  assert.deepEqual(c.spool.results(), []);
});

test('Freigeben trägt Frage und Entwurf nach public.db, ohne Geheimnis und ohne Revision', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  await c.deliver(data.id);
  const cookie = await c.signIn();
  const overview = await c.page('/eidl/mod/', cookie);
  assert.match(overview, /Neue Fragen \(1\)/);
  assert.match(await c.page(`/eidl/mod/neu/${data.id}/`, cookie), /nicht öffentlich/);

  const res = await c.form(`/eidl/mod/neu/${data.id}/`, { frage: `${FRAGE} `, kapitel: KAPITEL, antwort: 'Bearbeitet.[1]', aktion: 'pruefen' }, cookie);
  assert.equal(res.status, 303);
  const question = c.store.question(data.id);
  assert.equal(question.herkunft, 'forum');
  assert.deepEqual(question.vektor, [0, 1, 0]);
  assert.equal(question.antworten[0].status, 'geprüft');
  assert.equal(question.antworten[0].text, 'Bearbeitet.[1]');
  assert.equal(question.antworten[0].bearbeitet, true);
  assert.equal(question.antworten[0].zitate[0].text, 'Wörtliches Zitat.');
  assert.deepEqual(c.store.revisions(data.id), []);
  assert.equal(c.pending.get(data.id), null);
  assert.deepEqual(await c.mine(data.id, data.geheimnis), { id: data.id, zustand: 'öffentlich', url: `f/${data.id}/`, html: FRAGE });
  assert.ok(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8').includes(FRAGE));
  assert.ok(fs.readFileSync(c.file('f/lernen/index.html'), 'utf8').includes(FRAGE));
});

test('I1: Erst die Freigabe bringt eine Frage ohne Einwilligung in die Schlange, und die Antwort erscheint ungeprüft', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  const cookie = await c.signIn();
  assert.deepEqual(c.inbox(), []);
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: 'Warum ist das Verfahren effizient?', kapitel: KAPITEL, aktion: 'freigeben' }, cookie);
  assert.deepEqual(c.inbox(), [{ id: data.id, text: 'Warum ist das Verfahren effizient?', titel: true }], 'mit der Antwort kommt der Vorschlag für den Kurztitel');
  assert.deepEqual(c.store.question(data.id).vektor, [0, 0, 0]);
  assert.match(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8'), /noch keine Antwort/);

  await c.deliver(data.id);
  const question = c.store.question(data.id);
  assert.deepEqual(question.vektor, [0, 1, 0]);
  assert.equal(question.antworten[0].status, 'ungeprüft');
  assert.match(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8'), /Wörtliches Zitat/);
});

test('der Checker läuft auch auf der Antwort nach der Freigabe', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' }, await c.signIn());
  await c.deliver(data.id, { status: 'ok', modell: 'attrappe', text: 'Schreiben Sie an jemand@example.test.[1]', zitate: [zitat], vektor: [0, 1, 0] });
  assert.deepEqual(c.store.question(data.id).antworten, []);
});

test('die Moderation kann nichts freigeben, was der Checker sperrt, und weiche Treffer muss sie bestätigen', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ frage: 'Hat Frau Beispiel dazu etwas geschrieben, bitte?', einwilligung: true });
  const cookie = await c.signIn();
  const url = `/eidl/mod/neu/${data.id}/`;
  assert.equal((await c.form(url, { frage: 'Frage mit 1234567 als Zahl?', kapitel: KAPITEL, aktion: 'freigeben', gesehen: '1' }, cookie)).status, 422);
  assert.equal((await c.form(url, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' }, cookie)).status, 422);
  assert.equal((await c.form(url, { frage: FRAGE, kapitel: 'Erfunden', aktion: 'freigeben', gesehen: '1' }, cookie)).status, 422);
  assert.equal(c.store.question(data.id), null);
  assert.equal((await c.form(url, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben', gesehen: '1' }, cookie)).status, 303);
  assert.equal(c.store.question(data.id).text, FRAGE);
});

test('ohne Anmeldung lässt sich nichts freigeben', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' });
  assert.equal(c.store.question(data.id), null);
});

test('Ablehnen löscht den Text sofort, der Grund bleibt für die fragende Person', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  await c.deliver(data.id);
  const res = await c.form(`/eidl/mod/neu/${data.id}/`, { aktion: 'ablehnen', grund: 'uebung' }, await c.signIn());
  assert.equal(res.status, 303);
  const row = c.pending.get(data.id);
  assert.equal(row.text, null);
  assert.equal(row.entwurf, null);
  assert.deepEqual(await c.mine(data.id, data.geheimnis), { id: data.id, zustand: 'abgelehnt', grund: GRUENDE.uebung });
  c.pending.close();
  assert.ok(!fs.readFileSync(path.join(c.dir, 'pending.db')).includes(FRAGE), 'der Text steht nicht mehr in der Datei');
  assert.ok(!fs.existsSync(path.join(c.dir, 'pending.db-wal')) || !fs.readFileSync(path.join(c.dir, 'pending.db-wal')).includes(FRAGE));
});

test('Fristen: Unbearbeitetes verschwindet nach 28 Tagen, der Grund einer Ablehnung nach 7', async t => {
  let time = Date.parse('2026-11-05T12:00:00Z');
  const day = 86_400_000;
  const c = await setup({ now: () => time });
  t.after(c.close);
  const offen = (await c.ask()).data;
  const abgelehnt = (await c.ask()).data;
  c.fragen.reject(abgelehnt.id, GRUENDE.sonst);
  time += 7 * day;
  assert.equal(c.fragen.sweep(), 0);
  time += day;
  assert.equal(c.fragen.sweep(), 1);
  assert.equal(c.pending.get(abgelehnt.id), null);
  time += 20 * day;
  assert.equal(c.fragen.sweep(), 0);
  time += day;
  assert.equal(c.fragen.sweep(), 1);
  assert.equal(c.pending.get(offen.id), null);
});

test('zwei Fragen in der Stunde je Token', async t => {
  const c = await setup();
  t.after(c.close);
  const token = await c.token();
  assert.equal((await c.ask({}, token)).status, 201);
  assert.equal((await c.ask({}, token)).status, 201);
  assert.equal((await c.ask({}, token)).status, 429);
});

test('ohne die aktuelle Zustimmung gibt es keine Frage', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal((await c.ask({ zustimmung: 0 })).status, 400);
  assert.equal((await c.post('fragen', { frage: FRAGE }, { token: await c.token() })).status, 400);
  assert.equal(c.pending.count(), 0);
});

test('die Datenbank hält keine IP-Adresse und kein Token fest', async t => {
  const c = await setup();
  t.after(c.close);
  const token = await c.token();
  const { data } = await c.ask({ einwilligung: true }, token);
  c.pending.close();
  const raw = fs.readFileSync(path.join(c.dir, 'pending.db'));
  assert.ok(raw.includes(FRAGE), 'die Datei ist die richtige');
  for (const secret of [token, data.geheimnis, '127.0.0.1']) assert.ok(!raw.includes(secret), secret);
});

test('der Web-Prozess kennt das SDK nicht, der Worker keine Datenbank', () => {
  const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
  for (const name of ['server/web.mjs', 'lib/api.js', 'lib/mod.js', 'lib/fragen.js', 'lib/spool.js', 'lib/pending.js']) assert.ok(!/anthropic-ai|ANTHROPIC/.test(read(name)), name);
  for (const name of ['server/worker.mjs', 'lib/draft.js', 'lib/spool.js', 'lib/corpus.js']) assert.ok(!/sqlite|pending\.js|store\.js/.test(read(name)), name);
});

test('ein neuer Kurscode macht alte Tokens ungültig', async () => {
  const [alt, neu] = await Promise.all([hashPassphrase('alter-code'), hashPassphrase('neuer-code')]);
  const token = issueToken(tokenKey(alt));
  assert.ok(checkToken(tokenKey(alt), token));
  assert.ok(!checkToken(tokenKey(neu), token));
  assert.ok(!checkToken(tokenKey(alt), `${token}x`));
  assert.ok(!checkToken(tokenKey(alt), ''));
});

test('keine Beispielfrage schlägt im Checker an, sie gingen sonst nie sofort an Claude', () => {
  const seeds = JSON.parse(fs.readFileSync(new URL('../seeds/fragen.json', import.meta.url), 'utf8'));
  assert.ok(seeds.length >= 29);
  for (const { frage } of seeds) assert.deepEqual([...hardHits(frage), ...softHits(frage)], [], frage);
});

test('weiche Regeln: Personen schlagen an, Fachwörter nicht', () => {
  for (const text of ['Mein Name ist Anna.', 'Laut Prof. Völkel gilt das nicht.', 'Mit freundlichen Grüßen', 'Ich bin krank und brauche einen Nachteilsausgleich.']) assert.ok(softHits(text).length, text);
  for (const text of ['Warum heißt das Herrschaft der Gradienten?', 'Was ist ein Frauenhofer-Filter?', 'Wie grüßt ein Agent die Umgebung?']) assert.deepEqual(softHits(text), [], text);
});

test('die Einwilligung ist nicht vorbelegt, und ohne Schlange gibt es sie gar nicht', () => {
  const page = askPage({ ...site, fragen: true, entwurf: true });
  assert.match(page, /<input type="checkbox" id="einwilligung">/);
  assert.match(page, /<input type="checkbox" id="zustimmung" required>/);
  assert.ok(page.includes(ZUSTIMMUNG.entwurf));
  assert.ok(!askPage({ ...site, fragen: true, entwurf: false }).includes('einwilligung'));
  assert.match(page, /noindex/);
});

test('der Knopf erscheint erst, wenn der Fragepfad offen ist', () => {
  assert.ok(!indexPage([], site).includes('f/neu/'));
  assert.ok(!indexPage([], site).includes('id="neue-frage"'));
  assert.match(indexPage([], { ...site, fragen: true }), /id="neue-frage" data-mindestens="10" hidden/);
  assert.match(indexPage([], site), /noch nicht stellen/);
  assert.ok(indexPage([], { ...site, fragen: true }).includes('f/neu/'));
  assert.match(robotsTxt(site), /Disallow: \/eidl\/api\//);
});


const OWN = 'Das ist Geschmackssache.';
const noEvidence = { status: 'kein_beleg', modell: 'attrappe', vektor: [0, 1, 0] };

test('Findet Claude nichts, kann die Moderation bei der Freigabe selbst antworten; der Worker bekommt nur noch den Auftrag für den Kurztitel', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  await c.deliver(data.id, noEvidence);
  const cookie = await c.signIn();
  assert.match(await c.page(`/eidl/mod/neu/${data.id}/`, cookie), /Eigene Antwort der Moderation/);
  assert.equal((await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, antwort: OWN, aktion: 'freigeben' }, cookie)).status, 303);
  const [answer] = c.store.question(data.id).antworten;
  assert.deepEqual([answer.art, answer.status, answer.text, answer.modell, answer.zitate], ['moderation', 'geprüft', OWN, null, []]);
  assert.deepEqual(c.inbox(), [{ id: data.id, text: FRAGE, titel: true, nurTitel: true }]);
  const html = fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8');
  assert.match(html, /<strong>Konrad Völkel<\/strong><\/a><span class="rolle">Moderation</);
  assert.match(html, /<strong>Anonymer Nutzer<\/strong>/);
  assert.ok(html.includes(OWN));
  for (const bot of ['class="bot"', 'Sprachmodell erzeugt (Claude', 'Originaltext aus dem Skript']) assert.ok(!html.includes(bot), bot);
});

test('Ohne Einwilligung und mit eigener Antwort geht die Frage nie an Claude', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, antwort: OWN, aktion: 'freigeben' }, await c.signIn());
  assert.equal(c.store.question(data.id).antworten[0].art, 'moderation');
  assert.deepEqual(c.inbox(), []);
});

test('Bleibt das Feld leer, gilt weiter „nichts gefunden“, und die Frage hängt nicht bei Ungeprüft', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  await c.deliver(data.id, noEvidence);
  const cookie = await c.signIn();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, antwort: '', aktion: 'freigeben' }, cookie);
  assert.equal(c.store.question(data.id).antworten[0].status, 'kein_beleg');
  assert.deepEqual(c.inbox(), [{ id: data.id, text: FRAGE, titel: true, nurTitel: true }], 'keine zweite Frage nach der Antwort, nur der Kurztitel');
  const overview = await c.page('/eidl/mod/', cookie);
  assert.match(overview, /Kein Beleg \(1\)/);
});

test('Auch nach der Freigabe lässt sich ein „kein Beleg“ durch eine eigene Antwort ersetzen, und der Verlauf behält das', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  await c.deliver(data.id, noEvidence);
  const cookie = await c.signIn();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' }, cookie);
  const url = `/eidl/mod/f/${data.id}/`;
  assert.match(await c.page(url, cookie), /Eigene Antwort der Moderation/);

  assert.equal((await c.form(url, { frage: FRAGE, antwort: '', aktion: 'speichern' }, cookie)).status, 303);
  assert.equal(c.store.question(data.id).antworten[0].status, 'kein_beleg');

  assert.equal((await c.form(url, { frage: FRAGE, antwort: OWN, aktion: 'speichern' }, cookie)).status, 303);
  const question = c.store.question(data.id);
  assert.equal(question.antworten.length, 1);
  assert.deepEqual([question.antworten[0].art, question.antworten[0].status], ['moderation', 'geprüft']);
  assert.equal(c.store.revisions(data.id)[0].nachher, OWN);
  assert.equal(c.store.counters().find(k => k.art === 'moderationsantwort').anzahl, 1);
  assert.ok(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8').includes(OWN));

  /** danach ist es eine normale Antwort: bearbeitbar, aber ohne „Zurück auf ungeprüft“ */
  const page = await c.page(url, cookie);
  assert.ok(!page.includes('Zurück auf ungeprüft'));
  await c.form(url, { frage: FRAGE, antwort: `${OWN} Nachtrag.`, aktion: 'speichern' }, cookie);
  assert.equal(c.store.question(data.id).antworten[0].text, `${OWN} Nachtrag.`);
});

test('Auch die eigene Antwort läuft durch den Checker, und Verweise auf Zitate gibt es dort nicht', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  const cookie = await c.signIn();
  const url = `/eidl/mod/neu/${data.id}/`;
  assert.equal((await c.form(url, { frage: FRAGE, kapitel: KAPITEL, antwort: 'Schreiben Sie an jemand@example.test.', aktion: 'freigeben' }, cookie)).status, 422);
  assert.equal((await c.form(url, { frage: FRAGE, kapitel: KAPITEL, antwort: 'Das steht in [1].', aktion: 'freigeben' }, cookie)).status, 422);
  assert.equal(c.store.question(data.id), null);
});

test('Auch beim nachträglichen Antworten läuft der Checker', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  const cookie = await c.signIn();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' }, cookie);
  const url = `/eidl/mod/f/${data.id}/`;
  assert.equal((await c.form(url, { frage: FRAGE, antwort: 'Schreiben Sie an jemand@example.test.', aktion: 'speichern' }, cookie)).status, 422);
  assert.equal((await c.form(url, { frage: FRAGE, antwort: 'Das steht in [1].', aktion: 'speichern' }, cookie)).status, 422);
  assert.deepEqual(c.store.question(data.id).antworten, []);
});

test('Ein spätes Ergebnis von Claude überschreibt die Moderation nicht, der Vektor kommt trotzdem an', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask();
  const cookie = await c.signIn();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' }, cookie);
  await c.form(`/eidl/mod/f/${data.id}/`, { frage: FRAGE, antwort: OWN, aktion: 'speichern' }, cookie);
  await c.deliver(data.id);
  const question = c.store.question(data.id);
  assert.equal(question.antworten.length, 1);
  assert.equal(question.antworten[0].text, OWN);
  assert.deepEqual(question.vektor, [0, 1, 0]);
});

test('„Meine Fragen“ bekommt den Fragetext gesetzt, vor und nach der Freigabe', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ frage: 'Was bedeutet $x^2$ hier genau?' });
  assert.match((await c.mine(data.id, data.geheimnis)).html, /katex/);
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: 'Was bedeutet $x^2$ hier genau?', kapitel: KAPITEL, aktion: 'freigeben' }, await c.signIn());
  assert.match((await c.mine(data.id, data.geheimnis)).html, /katex/);
});

const NOCHMAL = '/eidl/mod/f/s01/';
const neu = { status: 'ok', modell: 'neu', text: 'Neue Antwort.[1]', zitate: [{ ...zitat, text: 'Neues Zitat.' }], kapitel: KAPITEL, vektor: [0, 1, 0] };
const again = async (c, cookie) => (await c.form(NOCHMAL, { aktion: 'nochmal' }, cookie)).status;

test('D23: Der Vorschlag wartet in der Moderation, öffentlich wird er erst mit der Übernahme, und der Verlauf behält die alte Antwort', async t => {
  const c = await setup();
  t.after(c.close);
  c.store.addAnswer('s01', { art: 'bot', status: 'ungeprüft', modell: 'alt', text: 'Alte Antwort.[1]', zitate: [zitat] });
  const cookie = await c.signIn();
  assert.match(await c.page(NOCHMAL, cookie), /value="nochmal"/);
  assert.equal(await again(c, cookie), 303);
  assert.deepEqual(c.inbox(), [{ id: 's01', text: seed.text, gruendlich: true }]);
  assert.equal(await again(c, cookie), 409, 'ein Auftrag reicht');
  assert.match(await c.page(NOCHMAL, cookie), /Claude arbeitet daran/);

  await c.deliver('s01', neu);
  assert.equal(c.store.question('s01').antworten[0].text, 'Alte Antwort.[1]');
  assert.ok(!fs.readFileSync(c.file('f/s01/index.html'), 'utf8').includes('Neue Antwort'));
  assert.match(await c.page(NOCHMAL, cookie), /class="vorschlag">Neue Antwort/);

  assert.equal((await c.form(NOCHMAL, { aktion: 'uebernehmen_pruefen' }, cookie)).status, 303);
  const [answer] = c.store.question('s01').antworten;
  assert.deepEqual([answer.art, answer.status, answer.modell, answer.text, answer.bearbeitet, answer.zitate.map(z => z.text)], ['bot', 'geprüft', 'neu', 'Neue Antwort.[1]', false, ['Neues Zitat.']]);
  assert.equal(c.store.question('s01').antworten.length, 1);
  assert.equal(c.store.proposal('s01'), null);
  assert.ok(fs.readFileSync(c.file('f/s01/index.html'), 'utf8').includes('Neue Antwort'));
  assert.equal(c.store.revisions('s01')[0].vorher, 'Alte Antwort.[1]');
});

test('D23, I1: Eine zurückgezogene Frage geht nicht noch einmal zu Claude, und ohne Schlange gibt es den Knopf nicht', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  c.store.setQuestionStatus('s01', 'zurückgezogen', 'admin');
  assert.doesNotMatch(await c.page(NOCHMAL, cookie), /value="nochmal"/);
  assert.equal(await again(c, cookie), 409);
  assert.deepEqual(c.inbox(), []);
  const off = await setup({ spooling: false });
  t.after(off.close);
  const session = await off.signIn();
  assert.doesNotMatch(await off.page(NOCHMAL, session), /value="nochmal"/);
  assert.equal(await again(off, session), 409);
});

test('D23: Ein Ergebnis ohne Text lässt sich nur verwerfen, ein „kein Beleg“ weicht einem echten Vorschlag', async t => {
  const c = await setup();
  t.after(c.close);
  c.store.addAnswer('s01', { art: 'bot', status: 'kein_beleg', modell: 'alt', text: null, zitate: [] });
  const cookie = await c.signIn();
  await again(c, cookie);
  await c.deliver('s01', { status: 'kein_beleg', modell: 'neu' });
  assert.match(await c.page(NOCHMAL, cookie), /auch in den ganzen Kapiteln nichts/);
  assert.equal((await c.form(NOCHMAL, { aktion: 'uebernehmen' }, cookie)).status, 400);
  assert.equal((await c.form(NOCHMAL, { aktion: 'verwerfen' }, cookie)).status, 303);
  assert.equal(c.store.proposal('s01'), null);

  await again(c, cookie);
  await c.deliver('s01', neu);
  await c.form(NOCHMAL, { aktion: 'uebernehmen' }, cookie);
  const [answer] = c.store.question('s01').antworten;
  assert.deepEqual([answer.art, answer.status, answer.text], ['bot', 'ungeprüft', 'Neue Antwort.[1]']);
});

test('D23: Der Checker läuft auch auf dem Vorschlag, und ein Neustart lässt ihn nicht ewig laufen', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await again(c, cookie);
  await c.deliver('s01', { ...neu, text: 'Matrikelnummer 1234567 gehört hierher.' });
  assert.equal(c.store.proposal('s01').entwurf.status, 'checker');
  assert.equal((await c.form(NOCHMAL, { aktion: 'uebernehmen' }, cookie)).status, 400);
  assert.doesNotMatch(await c.page(NOCHMAL, cookie), /1234567/);

  await again(c, cookie);
  c.spool.cancel('s01');
  await c.fragen.collect();
  assert.equal(c.store.proposal('s01').entwurf.status, 'fehler');
  assert.match(await c.page(NOCHMAL, cookie), /Ein Ergebnis kam nicht zustande/);
});

test('D27: Endgültig löschen nimmt den wartenden Auftrag mit, und ein spätes Ergebnis legt nichts wieder an', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.equal(await again(c, cookie), 303);
  assert.equal(c.inbox().length, 1);
  assert.equal((await c.form(NOCHMAL, { aktion: 'loeschen', bestaetigt: '1' }, cookie)).status, 303);
  assert.deepEqual(c.inbox(), [], 'der Text geht nach dem Löschen nicht mehr zu Claude');
  assert.equal(c.store.proposal('s01'), null);
  /** der Worker hatte den Auftrag schon gelesen und liefert jetzt */
  c.spool.submit({ id: 's01', text: 'egal' });
  await c.deliver('s01', neu);
  assert.equal(c.store.question('s01'), null);
  assert.equal(c.store.proposal('s01'), null);
  assert.deepEqual(c.spool.results(), []);
});

test('kein Text verspricht, dass nur die fragende Person etwas sieht: Die Moderation sieht es auch', () => {
  for (const name of ['../lib/fragen.js', '../lib/site.js', '../site/fragen.js', '../site/texte/datenschutz-fragen.md']) {
    assert.doesNotMatch(fs.readFileSync(new URL(name, import.meta.url), 'utf8'), /nur ich\b|nur Sie (?!und die Moderation)/, name);
  }
});


test('ein Kapitelhinweis von der Kapitelseite landet in der Schlange und ist bei der Moderation vorgewählt', async t => {
  const c = await setup();
  t.after(c.close);
  const { status, data } = await c.ask({ kapitel: 'backpropagation' });
  assert.equal(status, 201);
  assert.equal(c.pending.get(data.id).kapitel, 'Backpropagation');
  const cookie = await c.signIn();
  const page = await c.page(`/eidl/mod/neu/${data.id}/`, cookie);
  assert.match(page, /Die Frage kam von der Kapitelseite „Backpropagation“/);
  assert.match(page, /<option selected>Backpropagation<\/option>/);
});

test('ein unbekannter Kapitelhinweis fällt weg, die Frage kommt trotzdem an', async t => {
  const c = await setup();
  t.after(c.close);
  const { status, data } = await c.ask({ kapitel: '<script>' });
  assert.equal(status, 201);
  assert.equal(c.pending.get(data.id).kapitel, null);
});

test('die Kapitelseiten liegen nach dem Start in live/, auch die noch leeren', async t => {
  const c = await setup();
  t.after(c.close);
  const page = fs.readFileSync(c.file('f/kapitel/backpropagation/index.html'), 'utf8');
  assert.match(page, /Zu diesem Kapitel gibt es noch keine Frage/);
  assert.ok(fs.existsSync(c.file('f/kapitel/optimierer/index.html')));
});

const titleOf = html => html.match(/<title>(.*?)<\/title>/)[1];

test('D31: Vor der Freigabe geht kein Auftrag für einen Kurztitel hinaus, danach wartet der Vorschlag, und öffentlich wird er erst mit dem Speichern', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  assert.deepEqual(c.inbox(), [{ id: data.id, text: FRAGE }], 'die Einwilligung gilt dem Entwurf, nicht dem Titel');
  await c.deliver(data.id);
  const cookie = await c.signIn();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, antwort: 'Antwort.[1]', aktion: 'pruefen' }, cookie);
  assert.deepEqual(c.inbox(), [{ id: data.id, text: FRAGE, titel: true, nurTitel: true }]);

  await c.deliver(data.id, { art: 'titel', titel: 'Backpropagation: Warum effizient?' });
  assert.deepEqual(c.inbox(), []);
  const question = c.store.question(data.id);
  assert.deepEqual([question.kurztitel, question.titelvorschlag], [null, 'Backpropagation: Warum effizient?']);
  assert.equal(titleOf(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8')), 'Warum ist Backpropagation effizient? | hAInrich2', 'ein Vorschlag ist noch kein Titel');
  const edit = await c.page(`/eidl/mod/f/${data.id}/`, cookie);
  assert.match(edit, /name="kurztitel" maxlength="53" value="Backpropagation: Warum effizient\?"/);
  assert.match(edit, /Vorschlag von Claude, er gilt erst mit dem Speichern/);
  assert.doesNotMatch(edit, /value="titel_vorschlagen"/, 'ein zweiter Vorschlag wäre ein zweiter Aufruf');

  await c.form(`/eidl/mod/f/${data.id}/`, { frage: FRAGE, antwort: 'Antwort.[1]', kurztitel: 'Backpropagation: Warum effizient?', aktion: 'speichern' }, cookie);
  assert.equal(titleOf(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8')), 'Backpropagation: Warum effizient? | hAInrich2');
  assert.equal(c.store.counters().some(z => z.art === 'entwurf_undefined'), false, 'ein Kurztitel ist kein Entwurf und zählt nicht als einer');
});

test('D31: Wer den Kurztitel bei der Freigabe selbst setzt, braucht keinen Vorschlag', async t => {
  const c = await setup();
  t.after(c.close);
  const { data } = await c.ask({ einwilligung: true });
  await c.deliver(data.id);
  const cookie = await c.signIn();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, antwort: 'Antwort.[1]', kurztitel: 'Backpropagation und Aufwand', aktion: 'freigeben' }, cookie);
  assert.deepEqual(c.inbox(), []);
  assert.equal(c.store.question(data.id).kurztitel, 'Backpropagation und Aufwand');
  assert.equal(titleOf(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8')), 'Backpropagation und Aufwand | hAInrich2');
});

test('D31: Den Vorschlag gibt es auch auf Knopfdruck, aber nur für eine öffentliche Frage und nicht neben einem laufenden Auftrag', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.match(await c.page('/eidl/mod/f/s01/', cookie), /value="titel_vorschlagen"/);
  assert.equal((await c.form('/eidl/mod/f/s01/', { aktion: 'titel_vorschlagen' }, cookie)).status, 303);
  assert.deepEqual(c.inbox(), [{ id: 's01', text: 'Was ist ein Neuron?', titel: true, nurTitel: true }]);
  assert.equal((await c.form('/eidl/mod/f/s01/', { aktion: 'titel_vorschlagen' }, cookie)).status, 409, 'es läuft schon einer');
  await c.deliver('s01', { art: 'titel', titel: 'Neuron: Was ist das?' });
  assert.equal(c.store.question('s01').titelvorschlag, 'Neuron: Was ist das?');
  await c.form('/eidl/mod/f/s01/', { aktion: 'zurueckziehen' }, cookie);
  assert.equal(c.fragen.suggest('s01'), false, 'zurückgezogen');
});

test('D31: Ein Vorschlag, den der Checker sperrt, der zu lang ist oder zu keiner Frage gehört, verfällt', async t => {
  const c = await setup();
  t.after(c.close);
  for (const titel of ['Schreib an max@example.org wegen Neuronen', 'x'.repeat(54), '', null, 17]) {
    c.fragen.suggest('s01');
    await c.deliver('s01', { art: 'titel', titel });
    assert.equal(c.store.question('s01').titelvorschlag, null, String(titel));
  }
  c.spool.finish(path.join(c.dir, 'nirgends.json'), { id: 'gibt-es-nicht', art: 'titel', titel: 'Ein Titel ohne Frage' });
  await c.fragen.collect();
  assert.deepEqual(c.spool.results(), []);
});

test('D30: Eine Frage mit Zustimmung ab Version 3 ist gemeinfrei, eine ältere trägt keinen Vermerk', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal(ZUSTIMMUNG.version, 3);
  assert.match(ZUSTIMMUNG.oeffentlich, /gemeinfrei \(CC0 1\.0\)/);
  assert.match(ZUSTIMMUNG.oeffentlich, /eine Antwort und einen Kurztitel/);
  const cookie = await c.signIn();
  const { data } = await c.ask();
  await c.form(`/eidl/mod/neu/${data.id}/`, { frage: FRAGE, kapitel: KAPITEL, aktion: 'freigeben' }, cookie);
  assert.equal(c.store.question(data.id).lizenz, CC0.kennung);
  assert.match(fs.readFileSync(c.file(`f/${data.id}/index.html`), 'utf8'), /Diese Frage ist gemeinfrei \(<a href="https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/deed\.de" rel="noopener">CC0 1\.0<\/a>\)/);

  const alt = c.pending.add({ text: 'Eine Frage aus der Zeit davor?', zustimmung: 2, einwilligung: false, treffer: [], zustand: 'wartet' });
  await c.form(`/eidl/mod/neu/${alt.id}/`, { frage: 'Eine Frage aus der Zeit davor?', kapitel: KAPITEL, aktion: 'freigeben' }, cookie);
  assert.equal(c.store.question(alt.id).lizenz, null);
  assert.doesNotMatch(fs.readFileSync(c.file(`f/${alt.id}/index.html`), 'utf8'), /gemeinfrei/);
  assert.equal((await c.ask({ zustimmung: 2 })).status, 400, 'mit der alten Fassung lässt sich nichts mehr einreichen');
});

test('D35: Eine bearbeitete Frage bekommt ihren Vektor neu, lokal im Worker; die Suche im Browser sieht ihn danach', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.fragen.collect();
  assert.deepEqual(c.inbox(), [], 'ohne Bearbeitung kein Auftrag');
  await c.form('/eidl/mod/f/s01/', { frage: 'Was ist ein künstliches Neuron?', aktion: 'speichern' }, cookie);
  assert.deepEqual(c.store.staleVectors(), [{ id: 's01', text: 'Was ist ein künstliches Neuron?' }]);
  await c.fragen.collect();
  assert.deepEqual(c.inbox(), [{ id: 's01', text: 'Was ist ein künstliches Neuron?', nurVektor: true }]);
  await c.fragen.collect();
  assert.equal(c.inbox().length, 1, 'kein zweiter Auftrag, solange einer liegt');

  const { textDigest } = await import('../lib/spool.js');
  await c.deliver('s01', { art: 'vektor', vektor: [0, 0, 1], von: textDigest('Was ist ein künstliches Neuron?') });
  assert.deepEqual(c.store.question('s01').vektor, [0, 0, 1]);
  assert.deepEqual(c.store.staleVectors(), []);
  assert.deepEqual(JSON.parse(fs.readFileSync(c.file('daten/fragen.json'), 'utf8')).find(f => f.id === 's01').vektor, [0, 0, 1]);
  assert.deepEqual(c.inbox(), []);
  assert.equal(c.store.counters().some(z => z.art.startsWith('entwurf_')), false, 'ein Vektor ist kein Entwurf');
});

test('D35: Ein Vektor für einen Wortlaut, den es nicht mehr gibt, verfällt, und der nächste Auftrag trägt den neuen', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const { textDigest } = await import('../lib/spool.js');
  await c.form('/eidl/mod/f/s01/', { frage: 'Erste Fassung der Frage?', aktion: 'speichern' }, cookie);
  await c.fragen.collect();
  await c.form('/eidl/mod/f/s01/', { frage: 'Zweite Fassung der Frage?', aktion: 'speichern' }, cookie);
  await c.deliver('s01', { art: 'vektor', vektor: [9, 9, 9], von: textDigest('Erste Fassung der Frage?') });
  assert.deepEqual(c.store.question('s01').vektor, [1, 0, 0], 'der Vektor der ersten Fassung gehört nicht zur zweiten');
  assert.deepEqual(c.inbox(), [{ id: 's01', text: 'Zweite Fassung der Frage?', nurVektor: true }]);
  await c.deliver('s01', { art: 'vektor', vektor: 'kein Vektor', von: textDigest('Zweite Fassung der Frage?') });
  assert.deepEqual(c.store.question('s01').vektor, [1, 0, 0]);

  await c.form('/eidl/mod/f/s01/', { aktion: 'zurueckziehen' }, cookie);
  for (const job of c.spool.jobs()) c.spool.drop(job.file);
  await c.fragen.collect();
  assert.deepEqual(c.inbox(), [], 'eine zurückgezogene Frage sucht niemand');
});

test('D35: Läuft für die Frage schon ein anderer Auftrag, wartet der Vektor, statt ihn zu überschreiben', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { aktion: 'titel_vorschlagen' }, cookie);
  await c.form('/eidl/mod/f/s01/', { frage: 'Was ist ein künstliches Neuron?', aktion: 'speichern' }, cookie);
  await c.fragen.collect();
  assert.deepEqual(c.inbox(), [{ id: 's01', text: 'Was ist ein Neuron?', titel: true, nurTitel: true }]);
  await c.deliver('s01', { art: 'titel', titel: 'Neuron: Was ist das?' });
  assert.deepEqual(c.inbox(), [{ id: 's01', text: 'Was ist ein künstliches Neuron?', nurVektor: true }]);
});
