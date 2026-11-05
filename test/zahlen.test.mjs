import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { hashPassphrase } from '../lib/auth.js';
import { Ledger } from '../lib/budget.js';
import { REQUESTS_PER_DAY } from '../lib/draft.js';
import { createFragen } from '../lib/fragen.js';
import { createHandler } from '../lib/mod.js';
import { openPending } from '../lib/pending.js';
import { createPublisher, publishAll } from '../lib/publish.js';
import { openSpool } from '../lib/spool.js';
import { openStore } from '../lib/store.js';
import { figures, readCosts } from '../lib/zahlen.js';

const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 1 MB', fragen: true };
const seed = { id: 's01', text: 'Was ist ein Tensor?', kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [] };
const TODAY = new Date().toISOString().slice(0, 10);
const PASS = 'passphrase-fuer-den-test';
const FRAGE = 'Eine geheime Frage von außen?';
const entry = (tag, dollar, modell = 'claude-opus-5-5') => ({ tag, modell, rein: 1000, raus: 100, dollar });
const base = { counters: [], questions: [], offen: [], stimmen: { anzahl: 0, summe: 0 }, today: '2026-11-05' };

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const kosten = path.join(dir, 'kosten');
  fs.mkdirSync(kosten);
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([seed], [[1, 0]], site);
  store.saveModerator('konrad', 'admin', await hashPassphrase(PASS));
  store.saveModerator('tutorin', 'moderator', await hashPassphrase(PASS));
  await publishAll(live, store);
  const publish = createPublisher(live, store);
  const pending = openPending(path.join(dir, 'pending.db'));
  const spool = openSpool(path.join(dir, 'schlange'));
  const fragen = createFragen({ store, pending, spool, publish });
  const server = http.createServer(createHandler({ store, live, publish, fragen, kosten }));
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const signIn = async name => (await fetch(`${origin}/eidl/mod/anmelden`, {
    method: 'POST', redirect: 'manual', body: new URLSearchParams({ name, passphrase: PASS }), headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: origin },
  })).headers.get('set-cookie').split(';')[0];
  const get = (url, cookie) => fetch(`${origin}${url}`, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });
  return { dir, kosten, store, pending, spool, fragen, signIn, get, close: () => server.close() };
}

test('Zeiträume, Deckel und Modelle kommen aus dem Kostenbuch', () => {
  const entries = [entry('2026-11-05', 0.1), entry('2026-11-05', 0.2, 'claude-opus-5'), entry('2026-11-01', 0.3), entry('2026-10-20', 1)];
  const z = figures({ ...base, entries });
  assert.deepEqual(z.zeitraeume.map(p => [p.name, p.anfragen]), [['Heute', 2], ['7 Tage', 3], ['Dieser Monat', 3], ['Insgesamt', 4]]);
  assert.equal(z.deckel.tag.wert, 2);
  assert.equal(z.deckel.tag.max, REQUESTS_PER_DAY);
  assert.ok(Math.abs(z.deckel.monat.wert - 0.6) < 1e-9);
  assert.deepEqual(z.modelle.map(m => [m.modell, m.anfragen]), [['claude-opus-5', 1], ['claude-opus-5-5', 2]]);
});

test('das Kostenbuch des Worker liest sich so, wie er es schreibt, über Monate hinweg', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  new Ledger(path.join(dir, 'kosten-2026-10.json'), 15).add('2026-10-31', 'claude-opus-5-5', { input_tokens: 1000, output_tokens: 100 });
  new Ledger(path.join(dir, 'kosten-2026-11.json'), 15).add('2026-11-05', 'claude-opus-5-5', { input_tokens: 2000, output_tokens: 200 });
  fs.writeFileSync(path.join(dir, 'kosten-2026-11.json.neu'), 'halb geschrieben');
  const { entries, fehler } = readCosts(dir);
  assert.equal(fehler, null);
  assert.deepEqual(entries.map(e => [e.tag, e.rein]), [['2026-10-31', 1000], ['2026-11-05', 2000]]);
  assert.ok(entries[0].dollar > 0);
});

test('Ein unlesbares Kostenbuch kostet nicht die Seite', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  fs.writeFileSync(path.join(dir, 'kosten-2026-11.json'), 'kaputt');
  assert.match(readCosts(dir).fehler, /nicht lesen/);
  assert.deepEqual(readCosts(path.join(dir, 'gibtsnicht')), { entries: [], fehler: null });
  assert.match(readCosts(null).fehler, /nicht eingebunden/);
});

test('Das Forum zählt nach Stand und Herkunft, beste Fragen zuerst', () => {
  const q = (id, status, punkte, herkunft = 'forum', art = 'bot') => ({ id, text: id, herkunft, punkte, antworten: status ? [{ status, art }] : [] });
  const z = figures({ ...base, entries: [], offen: [{}], stimmen: { anzahl: 3, summe: 1 }, questions: [q('a', 'geprüft', 2, 'beispiel'), q('b', 'ungeprüft', 5), q('c', 'kein_beleg', -1), q('d', null, 0), q('e', 'geprüft', 0, 'forum', 'moderation')] });
  const { forum } = z;
  assert.deepEqual([forum.sichtbar, forum.beispiele, forum.vonAussen, forum.geprueft, forum.ungeprueft, forum.keinBeleg, forum.ohneAntwort, forum.vonModeration, forum.offen], [5, 1, 4, 2, 1, 1, 1, 1, 1]);
  assert.deepEqual(forum.beste.map(b => b.id), ['b', 'a']);
});

test('der Verlauf zeigt nur Tage, an denen etwas war', () => {
  const counters = [{ tag: '2026-11-05', art: 'frage', anzahl: 2 }, { tag: '2026-11-03', art: 'stimme', anzahl: 7 }, { tag: '2026-10-01', art: 'frage', anzahl: 9 }];
  const z = figures({ ...base, entries: [entry('2026-11-04', 0.1)], counters });
  assert.deepEqual(z.verlauf.map(d => [d.tag, d.fragen, d.stimmen, d.anfragen]), [['2026-11-05', 2, 0, 0], ['2026-11-04', 0, 0, 1], ['2026-11-03', 0, 7, 0]]);
  assert.equal(z.fragen.eingereicht, 2);
});

test('Die Seite gehört der Rolle admin', async t => {
  const c = await setup();
  t.after(c.close);
  assert.equal((await c.get('/eidl/mod/zahlen/')).status, 303);
  assert.equal((await c.get('/eidl/mod/zahlen/', await c.signIn('tutorin'))).status, 403);
  const admin = await c.signIn('konrad');
  const res = await c.get('/eidl/mod/zahlen/', admin);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Anfragen heute/);
  assert.match(await (await c.get('/eidl/mod/', admin)).text(), /mod\/zahlen\//);
  assert.ok(!(await (await c.get('/eidl/mod/', await c.signIn('tutorin'))).text()).includes('mod/zahlen/'));
});

test('Tageszähler zählen Ereignisse und Ergebnisse, nie den Text, und auch ein verfallenes Ergebnis', async t => {
  const c = await setup();
  t.after(c.close);
  const { id } = c.fragen.ask({ text: FRAGE, einwilligung: true });
  c.fragen.ask({ text: 'Mein Name ist Anna, was ist ein Tensor?', einwilligung: true });
  const job = c.spool.jobs().find(j => j.entry.id === id);
  c.spool.finish(job.file, { id, status: 'ok', teilantwort: true, modell: 'attrappe', text: 'Antwort.[1]', zitate: [], vektor: [0, 1] });
  await c.fragen.collect();
  c.fragen.withdraw(id);
  const counts = Object.fromEntries(c.store.counters().map(k => [k.art, k.anzahl]));
  assert.deepEqual(counts, { frage: 2, frage_einwilligung: 2, frage_zurueckgehalten: 1, entwurf_ok: 1, entwurf_teilantwort: 1, widerrufen: 1 });
  assert.ok(c.store.counters().every(k => k.tag === TODAY));
  const page = await (await c.get('/eidl/mod/zahlen/', await c.signIn('konrad'))).text();
  assert.ok(!page.includes(FRAGE));
});
