import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { hashPassphrase } from '../lib/auth.js';
import { createHandler, MOD_CSP } from '../lib/mod.js';
import { publishAll } from '../lib/publish.js';
import { openStore } from '../lib/store.js';

const PASSPHRASE = 'nur-fuer-den-test';
const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 1 MB' };
const question = (id, text, antwort) => ({
  id,
  text,
  kapitel: 'Tensoren',
  herkunft: 'beispiel',
  tag: '2026-11-04',
  antworten: [{ art: 'bot', status: 'ungeprüft', modell: 'test-modell', text: antwort, zitate: [{ titel: 'Titel', pfad: ['Abschnitt'], text: 'Wörtliches Zitat.', url: 'https://skript.test/a/' }] }],
});

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([question('s01', 'Was ist ein Neuron?', 'Ein Neuron rechnet.[1]'), question('s02', 'Was ist ein Tensor?', 'Ein Tensor ist ein Array.[1]')], [[1, 0], [0, 1]], site);
  store.saveModerator('konrad', 'admin', await hashPassphrase(PASSPHRASE));
  await publishAll(live, store);
  const server = http.createServer(createHandler({ store, live }));
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const form = (url, fields, { cookie, from = origin, fetchSite } = {}) => fetch(`${origin}${url}`, {
    method: 'POST',
    redirect: 'manual',
    body: new URLSearchParams(fields),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(from ? { Origin: from } : {}),
      ...(fetchSite ? { 'Sec-Fetch-Site': fetchSite } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
  });
  const get = (url, cookie) => fetch(`${origin}${url}`, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });
  const signIn = async () => (await form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE })).headers.get('set-cookie').split(';')[0];
  const file = name => path.join(live, 'eidl', name);
  const read = name => fs.readFileSync(file(name), 'utf8');
  return { store, form, get, signIn, file, read, close: () => server.close() };
}

const edit = { frage: 'Was ist ein Neuron?', antwort: 'Ein Neuron rechnet.[1]', aktion: 'speichern' };

test('ohne Sitzung gibt es nur die Anmeldung, und nichts lässt sich ändern', async t => {
  const c = await setup();
  t.after(c.close);
  assert.match(await (await c.get('/eidl/mod/')).text(), /Passphrase/);
  assert.equal((await c.get('/eidl/mod/f/s01/')).status, 303);
  const res = await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'Eingeschleust.[1]' });
  assert.equal(res.status, 303);
  assert.equal(c.store.question('s01').antworten[0].text, 'Ein Neuron rechnet.[1]');
});

test('das Cookie ist HttpOnly, Secure, SameSite=Strict und gilt nur unter /eidl/', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = (await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE })).headers.get('set-cookie');
  for (const part of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/eidl/']) assert.ok(cookie.includes(part), part);
});

test('falscher Name und falsche Passphrase bekommen dieselbe Antwort', async t => {
  const c = await setup();
  t.after(c.close);
  const wrongPass = await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: 'falsch' });
  const wrongName = await c.form('/eidl/mod/anmelden', { name: 'niemand', passphrase: 'falsch' });
  assert.equal(wrongPass.status, 401);
  assert.equal(await wrongPass.text(), await wrongName.text());
});

test('nach fünf Fehlversuchen hilft auch die richtige Passphrase nicht mehr', async t => {
  const c = await setup();
  t.after(c.close);
  for (let i = 0; i < 5; i++) await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: 'falsch' });
  assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE })).status, 429);
});

test('POST von fremder Seite oder ohne Origin wird abgewiesen', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.equal((await c.form('/eidl/mod/f/s01/', edit, { cookie, from: 'https://boese.test' })).status, 403);
  assert.equal((await c.form('/eidl/mod/f/s01/', edit, { cookie, from: null })).status, 403);
  assert.equal((await c.form('/eidl/mod/f/s01/', edit, { cookie, from: 'null' })).status, 403);
  assert.equal((await c.form('/eidl/mod/f/s01/', edit, { cookie, fetchSite: 'cross-site' })).status, 403);
  assert.equal((await c.form('/eidl/mod/f/s01/', edit, { cookie, fetchSite: 'same-site' })).status, 403);
});

test('unter no-referrer schickt der Browser Origin: null, das Formular geht trotzdem durch', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const res = await c.form('/eidl/mod/f/s01/', edit, { cookie, from: 'null', fetchSite: 'same-origin' });
  assert.equal(res.status, 303);
});

test('jede Antwort trägt CSP und no-store, Abmelden beendet die Sitzung', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const page = await c.get('/eidl/mod/', cookie);
  assert.equal(page.headers.get('content-security-policy'), MOD_CSP);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.ok(!(await page.text()).includes('<script'), 'die Übersicht braucht kein Skript');
  const edit = await (await c.get('/eidl/mod/f/s01/', cookie)).text();
  assert.deepEqual(edit.match(/<script[^>]*>/g), ['<script src="/eidl/mod/tasten.js" defer>'], 'nur das eine Skript, nichts inline');
  assert.ok(!MOD_CSP.includes('unsafe'));
  await c.form('/eidl/mod/abmelden', {}, { cookie });
  assert.match(await (await c.get('/eidl/mod/', cookie)).text(), /Passphrase/);
});

test('bearbeiten schreibt die Seite samt komprimierter Geschwister und hinterlässt eine Revision', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.equal((await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'Ein Neuron rechnet neu.[1]' }, { cookie })).status, 303);
  const page = c.read('f/s01/index.html');
  assert.match(page, /Ein Neuron rechnet neu/);
  assert.match(page, /die Moderation hat sie bearbeitet/);
  assert.match(page, /Sprachmodell/, 'der Bot bleibt erkennbar (I8)');
  const file = c.file('f/s01/index.html');
  assert.equal(zlib.brotliDecompressSync(fs.readFileSync(`${file}.br`)).toString(), page);
  assert.equal(zlib.gunzipSync(fs.readFileSync(`${file}.gz`)).toString(), page);
  assert.equal(zlib.zstdDecompressSync(fs.readFileSync(`${file}.zst`)).toString(), page);
  const [revision] = c.store.revisions('s01');
  assert.deepEqual([revision.feld, revision.vorher, revision.nachher, revision.rolle], ['antwort', 'Ein Neuron rechnet.[1]', 'Ein Neuron rechnet neu.[1]', 'admin']);
});

test('die Frage lässt sich ändern, Startseite und Suche ziehen mit', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { ...edit, frage: 'Was rechnet ein Neuron?' }, { cookie });
  assert.match(c.read('f/grundlagen/index.html'), /Was rechnet ein Neuron\?/);
  assert.match(c.read('f/s01/index.html'), /<h1>Was rechnet ein Neuron\?<\/h1>/);
  assert.equal(JSON.parse(c.read('daten/fragen.json'))[0].text, 'Was rechnet ein Neuron?');
});

test('Zurückziehen nimmt die Seite weg, die Vektoren bleiben bei ihren Fragen, Wiederherstellen bringt sie zurück', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { aktion: 'zurueckziehen' }, { cookie });
  assert.ok(!fs.existsSync(c.file('f/s01/index.html')));
  assert.ok(!c.read('f/grundlagen/index.html').includes('Was ist ein Neuron?'));
  assert.match(c.read('index.html'), /Grundlagen<\/a>[\s\S]*?<td data-label="Themen">1<\/td>/, 'die Zahl auf der Startseite zieht mit');
  assert.deepEqual(JSON.parse(c.read('daten/fragen.json')).map(f => [f.id, f.vektor]), [['s02', [0, 1]]]);
  await c.form('/eidl/mod/f/s01/', { aktion: 'wiederherstellen' }, { cookie });
  assert.ok(fs.existsSync(c.file('f/s01/index.html')));
});

test('in der Vorschau bleibt auch Geprüftes noindex, erst danach ist es indexierbar (I9)', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { ...edit, aktion: 'pruefen' }, { cookie });
  assert.equal(c.store.question('s01').antworten[0].status, 'geprüft');
  assert.match(c.read('f/s01/index.html'), /class="badge gut">geprüft/);
  assert.match(c.read('f/grundlagen/index.html'), /class="badge gut">geprüft/);
  assert.match(c.read('index.html'), /Grundlagen<\/a>[\s\S]*?<td data-label="Themen">2<\/td><td data-label="Geprüft">1<\/td>/);
  const forum = c.file('f/grundlagen/index.html');
  assert.equal(zlib.brotliDecompressSync(fs.readFileSync(`${forum}.br`)).toString(), c.read('f/grundlagen/index.html'));
  assert.match(c.read('f/s01/index.html'), /content="noindex"/);
  assert.ok(!c.read('sitemap.xml').includes('<url>'));
  c.store.setSite('vorschau', false);
  await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'Ein Neuron rechnet immer.[1]' }, { cookie });
  assert.match(c.read('f/s01/index.html'), /content="index,follow"/);
  assert.match(c.read('sitemap.xml'), /f\/s01\//);
  assert.ok(!c.read('sitemap.xml').includes('s02'));
  await c.form('/eidl/mod/f/s01/', { aktion: 'zuruecksetzen' }, { cookie });
  assert.match(c.read('f/s01/index.html'), /content="noindex"/);
});

test('harte Treffer und tote Verweise werden nicht gespeichert, der Text bleibt im Formular', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const mail = await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'Schreiben Sie an jemand@example.test.[1]' }, { cookie });
  assert.equal(mail.status, 422);
  const html = await mail.text();
  assert.match(html, /E-Mail-Adresse/);
  assert.match(html, /jemand@example\.test/, 'nichts Getipptes geht verloren');
  assert.equal((await c.form('/eidl/mod/f/s01/', { ...edit, frage: 'Matrikelnummer 1234567 sagt was?' }, { cookie })).status, 422);
  assert.equal((await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'Siehe [7].' }, { cookie })).status, 422);
  assert.equal((await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'Code `x[7]` ist kein Verweis.' }, { cookie })).status, 303);
  assert.equal(c.store.question('s01').text, 'Was ist ein Neuron?');
  assert.ok(!c.read('f/s01/index.html').includes('jemand@'));
});

test('HTML wird nirgends zu HTML, weder öffentlich noch in der Moderation', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { frage: 'Was tut <script>alert(1)</script> hier?', antwort: '<img src=x onerror=alert(1)> [x](javascript:alert(1))', aktion: 'speichern' }, { cookie });
  const page = c.read('f/s01/index.html');
  assert.ok(!page.includes('<script>alert'));
  assert.ok(!page.includes('<img src=x'));
  assert.ok(!page.includes('href="javascript:'));
  const mod = await (await c.get('/eidl/mod/f/s01/', cookie)).text();
  assert.ok(!mod.includes('<script>alert'));
  assert.ok(!(await (await c.get('/eidl/mod/', cookie)).text()).includes('<script>alert'));
});

test('Weiter und Zurück folgen der festen Reihenfolge, auch nach dem Prüfen und im Fehlerfall', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const first = await (await c.get('/eidl/mod/f/s01/', cookie)).text();
  assert.match(first, /rel="next" href="\/eidl\/mod\/f\/s02\/"/);
  assert.ok(!first.includes('rel="prev"'));
  assert.match(first, /1 von 2/);
  await c.form('/eidl/mod/f/s01/', { ...edit, aktion: 'pruefen' }, { cookie });
  const last = await (await c.get('/eidl/mod/f/s02/', cookie)).text();
  assert.match(last, /rel="prev" href="\/eidl\/mod\/f\/s01\/"/, 'Geprüftes bleibt in der Reihe');
  assert.ok(!last.includes('rel="next"'));
  assert.match(last, /2 von 2/);
  const failed = await c.form('/eidl/mod/f/s01/', { ...edit, antwort: 'a@example.test' }, { cookie });
  assert.match(await failed.text(), /rel="next"/);
});

test('das Skript der Cursortasten kommt mit dem richtigen Typ, auch ohne Sitzung', async t => {
  const c = await setup();
  t.after(c.close);
  const res = await c.get('/eidl/mod/tasten.js');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^text\/javascript/);
  assert.match(await res.text(), /ArrowRight/);
});

test('unbekannte Fragen und Aktionen enden sauber', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.equal((await c.get('/eidl/mod/f/s99/', cookie)).status, 404);
  assert.equal((await c.get('/eidl/mod/f/..%2f..%2fetc/', cookie)).status, 404);
  assert.equal((await c.form('/eidl/mod/f/s01/', { aktion: 'loeschen' }, { cookie })).status, 400);
});
