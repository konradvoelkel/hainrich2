import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Ledger } from '../lib/budget.js';
import { draftFor, REQUESTS_PER_DAY, runJobs } from '../lib/draft.js';
import { openSpool } from '../lib/spool.js';

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
  await runJobs({ spool, corpus, call: async () => { throw failure; }, ledger: ledger(), day: DAY });
  assert.deepEqual(spool.jobs(), []);
  assert.deepEqual(spool.results().map(r => r.entry.status), ['fehler', 'fehler']);
  assert.ok(!logged.join('\n').includes('geheime'));
});
