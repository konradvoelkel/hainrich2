import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createPublisher, publishAll } from '../lib/publish.js';
import { forumPage, questionPage, searchEntry } from '../lib/site.js';
import { createVoting } from '../lib/stimmen.js';
import { openStore } from '../lib/store.js';
import { UNTERFOREN } from '../lib/forum.js';

const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 1 MB', stimmen: true };
const seed = (id, text) => ({ id, text, kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [] });
const A = 'a'.repeat(32);
const B = 'b'.repeat(32);

async function setup({ now = Date.now } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([seed('s01', 'Was ist ein Tensor?'), seed('s02', 'Was ist ein Skalar?')], [[1, 0], [0, 1]], site);
  await publishAll(live, store);
  let published = 0;
  const write = createPublisher(live, store);
  const voting = createVoting({ store, publish: (...ids) => { published += 1; return write(...ids); }, now });
  const server = http.createServer(voting.handle);
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const vote = async (body, { from = origin, method = 'POST' } = {}) => {
    const res = await fetch(`${origin}/eidl/api/stimme`, { method, body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Origin: from } });
    return { status: res.status, data: await res.json() };
  };
  const page = id => fs.readFileSync(path.join(live, 'eidl/f', id, 'index.html'), 'utf8');
  return { dir, store, voting, vote, page, published: () => published, close: () => server.close() };
}

test('eine Stimme zählt einmal, lässt sich drehen und zurücknehmen', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 })).data.punkte, 1);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 })).data.punkte, 1);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: -1 })).data.punkte, -1);
  assert.equal((await c.vote({ id: 's01', kennung: B, wert: -1 })).data.punkte, -2);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 0 })).data.punkte, -1);
  assert.equal(c.store.question('s01').punkte, -1);
  assert.equal(c.store.question('s02').punkte, 0);
});

test('Unsinn wird abgewiesen und zählt nicht', async t => {
  const c = await setup();
  t.after(c.close);
  for (const body of [{ id: 's01', kennung: 'kurz', wert: 1 }, { id: 's01', kennung: A, wert: 2 }, { id: 's01', kennung: A, wert: '1' }, { id: 's01', wert: 1 }, null]) assert.equal((await c.vote(body)).status, 400, JSON.stringify(body));
  assert.equal((await c.vote({ id: 'gibtsnicht', kennung: A, wert: 1 })).status, 404);
  assert.equal(c.store.question('s01').punkte, 0);
});

test('eine zurückgezogene Frage nimmt keine Stimmen an', async t => {
  const c = await setup();
  t.after(c.close);
  c.store.setQuestionStatus('s01', 'zurückgezogen', 'admin');
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 })).status, 404);
});

test('eine fremde Seite kann nicht abstimmen, und nur POST zählt', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 }, { from: 'https://fremd.test' })).status, 403);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 }, { method: 'PUT' })).status, 405);
  assert.equal(c.store.question('s01').punkte, 0);
});

test('I11: In der Datenbank steht nur der Hash, keine Kennung und keine Adresse', async t => {
  const c = await setup();
  t.after(c.close);
  await c.vote({ id: 's01', kennung: A, wert: 1 });
  c.store.close();
  const raw = ['public.db', 'public.db-wal'].filter(f => fs.existsSync(path.join(c.dir, f))).map(f => fs.readFileSync(path.join(c.dir, f)));
  assert.ok(raw.length);
  for (const data of raw) for (const secret of [A, '127.0.0.1']) assert.ok(!data.includes(secret), secret);
});

test('Der Tageszähler zählt Stimmen als reine Summe, ohne Frage und ohne Kennung', async t => {
  const c = await setup();
  t.after(c.close);
  await c.vote({ id: 's01', kennung: A, wert: 1 });
  await c.vote({ id: 's02', kennung: B, wert: -1 });
  assert.deepEqual(c.store.counters().map(({ art, anzahl }) => [art, anzahl]), [['stimme', 2]]);
  assert.deepEqual(Object.keys(c.store.counters()[0]).sort(), ['anzahl', 'art', 'tag']);
});

test('Stimmen bündeln: viele Klicks, ein Schreiben, und die Summe steht in der Seite', async t => {
  const c = await setup();
  t.after(c.close);
  await c.vote({ id: 's01', kennung: A, wert: 1 });
  await c.vote({ id: 's01', kennung: B, wert: 1 });
  await c.vote({ id: 's02', kennung: A, wert: -1 });
  assert.equal(c.published(), 0);
  assert.match(c.page('s01'), /<span class="punkte" title="Punkte">0<\/span>/);
  await c.voting.flush();
  assert.equal(c.published(), 1);
  assert.match(c.page('s01'), /<span class="punkte" title="Punkte">2<\/span>/);
  assert.match(c.page('s02'), /<span class="punkte" title="Punkte">-1<\/span>/);
  await c.voting.flush();
  assert.equal(c.published(), 1);
});

test('die Grenze je Adresse greift', async t => {
  let time = 0;
  const c = await setup({ now: () => time });
  t.after(c.close);
  for (let i = 0; i < 200; i++) assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 })).status, 200);
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 })).status, 429);
  time += 3600_001;
  assert.equal((await c.vote({ id: 's01', kennung: A, wert: 1 })).status, 200);
});

test('Listen sortieren nach Punkten, bei Gleichstand bleibt die Reihenfolge', () => {
  const forum = UNTERFOREN.find(u => u.kapitel.includes('Tensoren'));
  const questions = [{ ...seed('s01', 'Erste'), punkte: 0 }, { ...seed('s02', 'Zweite'), punkte: 3 }, { ...seed('s03', 'Dritte'), punkte: -1 }, { ...seed('s04', 'Vierte'), punkte: 0 }];
  const page = forumPage(forum, questions, site);
  assert.deepEqual([...page.matchAll(/data-id="(s\d+)"/g)].map(m => m[1]), ['s02', 's01', 's04', 's03']);
});

test('ohne Schalter gibt es weder Pfeile noch Skript', () => {
  const off = { ...site, stimmen: false };
  const page = questionPage({ ...seed('s01', 'Was ist ein Tensor?'), punkte: 3 }, off);
  assert.ok(!page.includes('stimme'));
  assert.doesNotMatch(page, /<script[^>]*src=/);
  assert.ok(questionPage(seed('s01', 'Was ist ein Tensor?'), site).includes('stimmen.js'));
});

/** research/2026-11-21-modern-web-guidance, HTML b9 und b11 */
test('in einer Liste nennen die Pfeile ihre Frage, auf der Frageseite reicht der Name', () => {
  const forum = UNTERFOREN.find(u => u.kapitel.includes('Tensoren'));
  const page = forumPage(forum, [seed('s01', 'Was ist ein Tensor?'), seed('s02', 'Was ist ein Skalar?')], site);
  assert.match(page, /<button type="button" class="pfeil hoch" data-wert="1" aria-label="Gute Frage" aria-describedby="thema-s01"/);
  assert.match(page, /<button type="button" class="pfeil runter" data-wert="-1" aria-label="Schlechte Frage" aria-describedby="thema-s02"/);
  assert.match(page, /<a id="thema-s02" href="\.\.\/s02\/">Was ist ein Skalar\?<\/a>/);
  assert.match(page, /<table class="liste themen" aria-label="Fragen im Unterforum /);
  assert.doesNotMatch(questionPage(seed('s01', 'Was ist ein Tensor?'), site), /aria-describedby/);
});

test('Formeln im Fragetext sind auf der Seite, in der Liste und in der Suche gesetzt', () => {
  const forum = UNTERFOREN.find(u => u.kapitel.includes('Tensoren'));
  const question = { ...seed('s01', 'Was ist $x^2$?'), vektor: [1, 0] };
  assert.match(questionPage(question, site), /<h1>Was ist <span class="katex">/);
  assert.match(forumPage(forum, [question], site), /<a id="thema-s01" href="..\/s01\/">Was ist <span class="katex">/);
  assert.ok(!questionPage(question, site).includes('<h1>Was ist $x^2$'));
  assert.match(searchEntry(question).html, /katex/);
  assert.equal(searchEntry(question).text, 'Was ist $x^2$?');
  assert.deepEqual(Object.keys(searchEntry(seed('s02', 'Ohne Formel?'), [0, 1])), ['id', 'text', 'kapitel', 'vektor']);
});
