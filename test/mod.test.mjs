import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { checkDevice, DEVICE_SECONDS, hashPassphrase, issueDevice } from '../lib/auth.js';
import { createHandler, MOD_CSP } from '../lib/mod.js';
import { publishAll } from '../lib/publish.js';
import { openStore } from '../lib/store.js';
import { questionPage } from '../lib/site.js';

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

async function setup({ passages = null } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([question('s01', 'Was ist ein Neuron?', 'Ein Neuron rechnet.[1]'), question('s02', 'Was ist ein Tensor?', 'Ein Tensor ist ein Array.[1]')], [[1, 0], [0, 1]], site);
  store.saveModerator('konrad', 'admin', await hashPassphrase(PASSPHRASE));
  await publishAll(live, store);
  const server = http.createServer(createHandler({ store, live, passages }));
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const form = (url, fields, { cookie, from = origin, fetchSite, adresse } = {}) => fetch(`${origin}${url}`, {
    method: 'POST',
    redirect: 'manual',
    body: new URLSearchParams(fields),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(from ? { Origin: from } : {}),
      ...(fetchSite ? { 'Sec-Fetch-Site': fetchSite } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      /** wie hinter Caddy: Die Adresse des Besuchers steht als Letztes in X-Forwarded-For */
      ...(adresse ? { 'X-Forwarded-For': adresse } : {}),
    },
  });
  const get = (url, cookie) => fetch(`${origin}${url}`, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });
  const signIn = async () => (await form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE })).headers.get('set-cookie').split(';')[0];
  const file = name => path.join(live, 'eidl', name);
  const read = name => fs.readFileSync(file(name), 'utf8');
  return { dir, store, form, get, signIn, file, read, close: () => server.close() };
}

const edit = { frage: 'Was ist ein Neuron?', antwort: 'Ein Neuron rechnet.[1]', aktion: 'speichern' };

test('Zitate, die das ausgespielte Skript so nicht mehr hat, stehen in der Übersicht und an der Frage', async t => {
  const c = await setup({ passages: [{ id: 'p', page: 'tensoren', text: 'Ein anderer Wortlaut.' }] });
  t.after(c.close);
  const cookie = await c.signIn();
  assert.match(await (await c.get('/eidl/mod/', cookie)).text(), /Zitat steht so nicht mehr im Skript \(2\)/);
  assert.match(await (await c.get('/eidl/mod/f/s01/', cookie)).text(), /Nicht mehr wörtlich im Skript: \[1\]\./);
});

test('steht der Wortlaut noch da oder fehlt der Korpus, gibt es keine Liste', async () => {
  for (const passages of [[{ id: 'p', page: 'tensoren', text: 'Davor. Wörtliches Zitat. Danach.' }], null]) {
    const c = await setup({ passages });
    const cookie = await c.signIn();
    const html = await (await c.get('/eidl/mod/', cookie)).text() + await (await c.get('/eidl/mod/f/s01/', cookie)).text();
    c.close();
    assert.doesNotMatch(html, /nicht mehr (wörtlich )?im Skript/);
  }
});

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

test('gleichzeitige Fehlversuche bei der Anmeldung kommen nicht an der Grenze vorbei', async t => {
  const c = await setup();
  t.after(c.close);
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: `falsch-${i}` })));
  assert.equal(results.filter(r => r.status === 401).length, 5);
  assert.equal(results.filter(r => r.status === 429).length, 15);
});

test('richtige Anmeldungen verbrauchen nichts, auch nicht von der Grenze für alle', async t => {
  const c = await setup();
  t.after(c.close);
  for (let i = 0; i < 31; i++) assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE })).status, 303);
});

/** 30 Fehlversuche von sechs fremden Adressen: Danach ist die Grenze für alle erreicht */
const aussperren = async c => {
  for (let i = 0; i < 30; i++) assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: 'falsch' }, { adresse: `203.0.113.${Math.floor(i / 5) + 1}` })).status, 401);
};
const geraetOf = res => res.headers.getSetCookie().find(c => c.startsWith('__Secure-geraet=')).split(';')[0];

test('D41: Nach einer Anmeldung bekommt das Gerät ein Cookie für ein halbes Jahr, nur für die Moderation; die Sitzung bleibt das erste', async t => {
  const c = await setup();
  t.after(c.close);
  const res = await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE });
  const [sitzung, geraet] = res.headers.getSetCookie();
  assert.match(sitzung, /^__Secure-sitzung=[^;]+; Path=\/eidl\/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200$/);
  assert.match(geraet, /^__Secure-geraet=[\w.-]+; Path=\/eidl\/mod\/; HttpOnly; Secure; SameSite=Strict; Max-Age=15552000$/);
  assert.equal((await c.get('/eidl/mod/', geraet.split(';')[0])).status, 200);
  assert.match(await (await c.get('/eidl/mod/', geraet.split(';')[0])).text(), /<h1>Anmelden<\/h1>/, 'das Geräte-Cookie meldet niemanden an');
});

test('D41: Sind die Versuche für alle verbraucht, kommt ein bekanntes Gerät mit der richtigen Passphrase hinein, ein fremdes nicht', async t => {
  const c = await setup();
  t.after(c.close);
  const geraet = geraetOf(await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE }));
  await aussperren(c);
  assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE }, { adresse: '198.51.100.7' })).status, 429, 'ohne Cookie ausgesperrt, auch mit der richtigen Passphrase');
  const gefaelscht = geraet.replace(/.$/, last => (last === 'A' ? 'B' : 'A'));
  assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE }, { adresse: '198.51.100.8', cookie: gefaelscht })).status, 429, 'ein gefälschtes Cookie zählt wie keines');
  assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE }, { adresse: '198.51.100.9', cookie: geraet })).status, 303);
});

test('D41: Gleichzeitige Fehlversuche mit Geräte-Cookie: fünf werden geprüft, und keiner zählt gegen die Grenze für alle', async t => {
  const c = await setup();
  t.after(c.close);
  const geraet = geraetOf(await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE }));
  /** jede Anfrage von einer anderen Adresse: Es bremst nur die Grenze des Geräts */
  const results = await Promise.all(Array.from({ length: 40 }, (_, i) => c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: `falsch-${i}` }, { adresse: `192.0.2.${i + 1}`, cookie: geraet })));
  assert.equal(results.filter(r => r.status === 401).length, 5);
  assert.equal(results.filter(r => r.status === 429).length, 35);
  assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: PASSPHRASE }, { adresse: '198.51.100.9', cookie: geraet })).status, 429, 'auch das Gerät hat eine Grenze: Ein gestohlenes Cookie ist kein Freibrief');
  /** die Grenze für alle ist unberührt: 30 Fremde können noch scheitern, erst der 31. wird abgewiesen */
  await aussperren(c);
  assert.equal((await c.form('/eidl/mod/anmelden', { name: 'konrad', passphrase: 'falsch' }, { adresse: '198.51.100.10' })).status, 429);
});

test('D41: Das Geräte-Cookie gilt für seine Passphrase und seine Frist, und nur unverändert', async () => {
  const jetzt = Date.UTC(2026, 10, 17);
  const hashOf = name => ({ konrad: 'hash-eins' })[name];
  const cookie = issueDevice('konrad', 'hash-eins', jetzt);
  assert.match(checkDevice(cookie, hashOf, jetzt), /^[\w-]{16}$/);
  assert.equal(checkDevice(cookie, hashOf, jetzt + DEVICE_SECONDS * 1000 - 1000), checkDevice(cookie, hashOf, jetzt), 'bis zum letzten Tag dieselbe Kennung');
  assert.equal(checkDevice(cookie, hashOf, jetzt + DEVICE_SECONDS * 1000), null, 'abgelaufen');
  assert.equal(checkDevice(cookie, () => 'hash-zwei', jetzt), null, 'eine neue Passphrase macht alle alten Cookies ungültig');
  assert.equal(checkDevice(cookie, () => undefined, jetzt), null, 'das Konto gibt es nicht mehr');
  const [name, id, until, signatur] = cookie.split('.');
  assert.equal(checkDevice([name, id, +until + 1, signatur].join('.'), hashOf, jetzt), null, 'die Frist lässt sich nicht verlängern');
  assert.equal(checkDevice([Buffer.from('anna').toString('base64url'), id, until, signatur].join('.'), () => 'hash-eins', jetzt), null, 'und der Name nicht tauschen');
  for (const unsinn of [undefined, '', 'a.b', `${cookie}.x`, 'a.b.c.d']) assert.equal(checkDevice(unsinn, hashOf, jetzt), null);
  assert.notEqual(issueDevice('konrad', 'hash-eins', jetzt), cookie, 'jedes Gerät bekommt seine eigene Kennung');
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
  assert.match(MOD_CSP, /require-trusted-types-for 'script'; trusted-types 'none'/, 'keine Senke, also auch keine Policy');
  assert.match(edit, /<meta name="color-scheme" content="light dark">/);
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

test('jede Seite der Moderation führt zurück zur öffentlichen Site, eine zurückgezogene Frage hat keinen Link dorthin', async t => {
  const c = await setup();
  t.after(c.close);
  const kopf = /<header class="kopf"><a class="marke" href="\/eidl\/mod\/">Moderation<\/a><a href="\/eidl\/">Zum Forum<\/a>/;
  assert.match(await (await c.get('/eidl/mod/')).text(), kopf, 'auch von der Anmeldung aus');
  const cookie = await c.signIn();
  const uebersicht = await (await c.get('/eidl/mod/', cookie)).text();
  assert.match(uebersicht, kopf);
  for (const id of ['s01', 's02']) assert.ok(uebersicht.includes(` · <a href="/eidl/f/${id}/">öffentliche Seite</a>`), id);
  for (const seite of ['/eidl/mod/titel/', '/eidl/mod/zahlen/', '/eidl/mod/f/s01/']) assert.match(await (await c.get(seite, cookie)).text(), kopf, seite);
  assert.ok((await (await c.get('/eidl/mod/titel/', cookie)).text()).includes('<a href="/eidl/f/s01/">öffentliche Seite</a>'));
  for (const id of ['s01', 's02']) assert.ok(fs.existsSync(c.file(`f/${id}/index.html`)), 'der Link zeigt auf eine Seite, die es gibt');
  await c.form('/eidl/mod/f/s02/', { aktion: 'zurueckziehen' }, { cookie });
  const danach = await (await c.get('/eidl/mod/', cookie)).text();
  assert.ok(!danach.includes('<a href="/eidl/f/s02/">öffentliche Seite</a>'), 'zurückgezogen: Die Seite gibt es nicht, also kein Link');
  assert.ok(danach.includes('<a href="/eidl/f/s01/">öffentliche Seite</a>'));
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
  assert.equal((await c.form('/eidl/mod/f/s01/', { aktion: 'umbenennen' }, { cookie })).status, 400);
});

const MARKE = 'Erika Musterfrau aus Gruppe 7';
/** alles unter dem Verzeichnis, roh gelesen: Datenbank, WAL und jede veröffentlichte Datei */
const everything = dir => fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter(e => e.isFile())
  .map(e => fs.readFileSync(path.join(e.parentPath, e.name)).toString('latin1')).join('\n');

test('D27: Endgültig löschen nimmt Frage, Antwort, Zitate, Verlauf und Stimmen weg, öffentlich und aus der Datenbankdatei', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { ...edit, frage: `Was meint ${MARKE} mit Neuron?` }, { cookie });
  c.store.vote('s01', 'kennung', 1);
  assert.ok(everything(c.dir).includes(MARKE), 'Gegenprobe: vorher steht der Text in den Dateien');
  const res = await c.form('/eidl/mod/f/s01/', { aktion: 'loeschen', bestaetigt: '1' }, { cookie });
  assert.equal(res.status, 303);
  assert.match(res.headers.get('location'), /\/eidl\/mod\/\?ok=geloescht$/);
  assert.equal(c.store.question('s01'), null);
  assert.equal(c.store.voteTotals().anzahl, 0);
  assert.deepEqual(c.store.revisions('s01').map(r => [r.feld, r.vorher, r.nachher, r.rolle]), [['gelöscht', null, null, 'admin']], 'wer wann gelöscht hat, bleibt, ohne Text');
  assert.equal(c.store.counters().find(z => z.art === 'geloescht').anzahl, 1);
  assert.ok(!fs.existsSync(c.file('f/s01/index.html')));
  assert.deepEqual(JSON.parse(c.read('daten/fragen.json')).map(f => f.id), ['s02']);
  assert.ok(!everything(c.dir).includes(MARKE), 'weder in der Datenbank noch im WAL noch in einer Seite');
  assert.equal((await c.get('/eidl/mod/f/s01/', cookie)).status, 404);
  assert.match(await (await c.get('/eidl/mod/?ok=geloescht', cookie)).text(), /Endgültig gelöscht/);
  assert.ok(c.store.question('s02'), 'die andere Frage bleibt');
});

test('D27: Ohne Haken wird nichts gelöscht, und Löschen bleibt der Rolle admin vorbehalten', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  for (const aktion of ['loeschen', 'verlauf_bereinigen']) {
    const ohne = await c.form('/eidl/mod/f/s01/', { aktion }, { cookie });
    assert.equal(ohne.status, 422);
    assert.match(await ohne.text(), /nicht rückgängig machen lässt/);
  }
  c.store.saveModerator('tutorin', 'moderator', await hashPassphrase(PASSPHRASE));
  const tutorin = (await c.form('/eidl/mod/anmelden', { name: 'tutorin', passphrase: PASSPHRASE })).headers.get('set-cookie').split(';')[0];
  for (const aktion of ['loeschen', 'verlauf_bereinigen']) assert.equal((await c.form('/eidl/mod/f/s01/', { aktion, bestaetigt: '1' }, { cookie: tutorin })).status, 403);
  assert.ok(c.store.question('s01'));
  assert.ok(fs.existsSync(c.file('f/s01/index.html')));
  assert.doesNotMatch(await (await c.get('/eidl/mod/f/s01/', tutorin)).text(), /endgültig löschen/);
  assert.match(await (await c.get('/eidl/mod/f/s01/', cookie)).text(), /endgültig löschen/);
  assert.equal((await c.form('/eidl/mod/f/s01/', { aktion: 'zurueckziehen' }, { cookie: tutorin })).status, 303, 'Zurückziehen bleibt für alle der schnelle Weg');
});

test('D27: Nach einer Redaktion verschwindet der alte Wortlaut aus Verlauf und Datenbankdatei, wer wann geändert hat, bleibt', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.doesNotMatch(await (await c.get('/eidl/mod/f/s01/', cookie)).text(), /Alte Fassungen aus dem Verlauf entfernen/, 'ohne Verlauf gibt es nichts zu bereinigen');
  await c.form('/eidl/mod/f/s01/', { ...edit, frage: `Was meint ${MARKE} mit Neuron?` }, { cookie });
  await c.form('/eidl/mod/f/s01/', { ...edit, frage: 'Was ist ein Neuron genau?' }, { cookie });
  assert.ok(everything(c.dir).includes(MARKE), 'Gegenprobe: Der Verlauf hält den alten Wortlaut fest');
  assert.ok(!c.read('f/s01/index.html').includes(MARKE));
  const res = await c.form('/eidl/mod/f/s01/', { aktion: 'verlauf_bereinigen', bestaetigt: '1' }, { cookie });
  assert.equal(res.status, 303);
  assert.ok(!everything(c.dir).includes(MARKE));
  assert.deepEqual(c.store.revisions('s01').map(r => [r.feld, r.vorher, r.nachher, r.rolle]), [['verlauf bereinigt', null, null, 'admin'], ['frage', null, null, 'admin'], ['frage', null, null, 'admin']]);
  assert.equal(c.store.question('s01').text, 'Was ist ein Neuron genau?');
  assert.match(c.read('f/s01/index.html'), /Was ist ein Neuron genau\?/);
  const page = await (await c.get(res.headers.get('location'), cookie)).text();
  assert.match(page, /alten Fassungen sind aus dem Verlauf entfernt/);
  assert.match(page, /frage · admin · Text entfernt/);
  assert.doesNotMatch(page, /Alte Fassungen aus dem Verlauf entfernen/);
});

test('D27: Auch was vor `secure_delete` in freien Seiten liegen blieb, ist nach dem Löschen aus der Datei', async t => {
  const c = await setup();
  t.after(c.close);
  const file = path.join(c.dir, 'public.db');
  /** eine zweite Verbindung ohne `secure_delete`, wie die Datenbank bis 2026-11-11 lief */
  const raw = new DatabaseSync(file);
  raw.prepare("INSERT INTO revisions (question, feld, vorher, nachher, rolle, zeit) VALUES ('s02', 'frage', ?, 'x', 'admin', '2026-11-01T00:00:00Z')").run(`${MARKE} `.repeat(40));
  raw.exec("DELETE FROM revisions WHERE question = 's02'; PRAGMA wal_checkpoint(TRUNCATE);");
  raw.close();
  if (!everything(c.dir).includes(MARKE)) return t.skip('dieses SQLite überschreibt Gelöschtes schon von sich aus');
  const cookie = await c.signIn();
  await c.form('/eidl/mod/f/s01/', { aktion: 'loeschen', bestaetigt: '1' }, { cookie });
  assert.ok(!everything(c.dir).includes(MARKE));
});

const titleOf = html => html.match(/<title>(.*?)<\/title>/)[1];

test('D31: Der Vorschlag steht im Feld und gilt mit dem Speichern; zu lang oder mit Treffer des Checkers wird nichts gespeichert', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  assert.equal(c.store.suggestTitles({ s01: 'Neuron: Was rechnet es?', s99: 'Gibt es nicht' }), 1);
  const page = await (await c.get('/eidl/mod/f/s01/', cookie)).text();
  assert.match(page, /name="kurztitel" maxlength="53" value="Neuron: Was rechnet es\?"/);
  assert.match(page, /Vorschlag von Claude, er gilt erst mit dem Speichern/);
  assert.equal(titleOf(c.read('f/s01/index.html')), 'Was ist ein Neuron? | hAInrich2');

  const fields = { frage: 'Was ist ein Neuron?', antwort: 'Ein Neuron rechnet.[1]', aktion: 'speichern' };
  for (const kurztitel of ['x'.repeat(54), 'abc', 'Frag max@example.org nach Neuronen']) {
    const res = await c.form('/eidl/mod/f/s01/', { ...fields, kurztitel }, { cookie });
    assert.equal(res.status, 422, kurztitel);
    assert.match(await res.text(), /Der Kurztitel (?:braucht 5 bis 53 Zeichen|enthält etwas)/);
  }
  assert.equal(c.store.question('s01').kurztitel, null);

  assert.equal((await c.form('/eidl/mod/f/s01/', { ...fields, kurztitel: '  Neuron:   Was rechnet es? ' }, { cookie })).status, 303);
  assert.equal(c.store.question('s01').kurztitel, 'Neuron: Was rechnet es?');
  assert.equal(titleOf(c.read('f/s01/index.html')), 'Neuron: Was rechnet es? | hAInrich2');
  assert.deepEqual(c.store.revisions('s01').map(r => [r.feld, r.vorher, r.nachher]), [['kurztitel', null, 'Neuron: Was rechnet es?']]);

  await c.form('/eidl/mod/f/s01/', { ...fields, kurztitel: '' }, { cookie });
  assert.equal(c.store.question('s01').kurztitel, null);
  assert.equal(titleOf(c.read('f/s01/index.html')), 'Was ist ein Neuron? | hAInrich2', 'leer heißt: der Anfang der Frage');
  await c.form('/eidl/mod/f/s01/', { ...fields, kurztitel: 'Neuron und Summe' }, { cookie });
  await c.form('/eidl/mod/f/s01/', fields, { cookie });
  assert.equal(c.store.question('s01').kurztitel, 'Neuron und Summe', 'ein Formular ohne das Feld nimmt den Titel nicht zurück');
});

test('D31: Alle Kurztitel auf einer Seite, ein Knopf; bei einem Fehler wird nichts gespeichert und die Eingaben bleiben stehen', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  c.store.suggestTitles({ s01: 'Neuron: Was rechnet es?' });
  const page = await (await c.get('/eidl/mod/titel/', cookie)).text();
  assert.match(page, /name="t-s01" maxlength="53" value="Neuron: Was rechnet es\?"/);
  assert.match(page, /Vorschlag von Claude, noch nicht gespeichert/);
  assert.match(page, /name="t-s02" maxlength="53" value=""/);
  assert.match(await (await c.get('/eidl/mod/', cookie)).text(), /Kurztitel \(2 offen\)/);

  const schlecht = await c.form('/eidl/mod/titel/', { 't-s01': 'Neuron: Was rechnet es?', 't-s02': 'x'.repeat(60), aktion: 'titel_speichern' }, { cookie });
  assert.equal(schlecht.status, 422);
  const wieder = await schlecht.text();
  assert.match(wieder, /s02: Der Kurztitel braucht 5 bis 53 Zeichen, es sind 60/);
  assert.match(wieder, new RegExp(`name="t-s02" maxlength="53" value="${'x'.repeat(60)}"`));
  assert.deepEqual(c.store.questions().map(q => q.kurztitel), [null, null]);

  assert.equal((await c.form('/eidl/mod/titel/', { 't-s01': 'Neuron: Was rechnet es?', 't-s02': 'Tensor oder Array?', aktion: 'titel_speichern' }, { cookie })).status, 303);
  assert.deepEqual(c.store.questions().map(q => q.kurztitel), ['Neuron: Was rechnet es?', 'Tensor oder Array?']);
  assert.equal(titleOf(c.read('f/s02/index.html')), 'Tensor oder Array? | hAInrich2');
  assert.doesNotMatch(await (await c.get('/eidl/mod/', cookie)).text(), /Kurztitel \(/);
  assert.equal((await c.form('/eidl/mod/titel/', { 't-s01': 'Anders', aktion: 'titel_speichern' }, {})).status, 303, 'ohne Anmeldung zurück zur Anmeldung');
  assert.equal(c.store.question('s01').kurztitel, 'Neuron: Was rechnet es?');
});

test('D29: Mit der Prüfung bekommt die Antwort ihr Datum, zurückgesetzt verliert sie es, und die Seite nennt, wer geprüft hat', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(c.store.question('s01').antworten[0].geprueftAm, null);
  await c.form('/eidl/mod/f/s01/', { frage: 'Was ist ein Neuron?', antwort: 'Ein Neuron rechnet.[1]', aktion: 'pruefen' }, { cookie });
  assert.equal(c.store.question('s01').antworten[0].geprueftAm, today);
  assert.match(c.read('f/s01/index.html'), new RegExp(`Antwort eines Sprachmodells, geprüft am ${today.split('-').reverse().join('\\.')} von <a href="../../ueber/#wer-prüft">Konrad Völkel</a>, Autor des Skripts`));
  await c.form('/eidl/mod/f/s01/', { aktion: 'zuruecksetzen' }, { cookie });
  assert.equal(c.store.question('s01').antworten[0].geprueftAm, null);
  assert.doesNotMatch(c.read('f/s01/index.html'), /class="pruefung"/);
});

test('D29: Eine public.db von vor dem 17.11. bekommt die neuen Spalten, und geprüfte Antworten ihr Datum aus dem Verlauf', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const file = path.join(dir, 'public.db');
  const alt = new DatabaseSync(file);
  alt.exec(`
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE questions (id TEXT PRIMARY KEY, corpus TEXT NOT NULL, position INTEGER NOT NULL, text TEXT NOT NULL, kapitel TEXT NOT NULL, herkunft TEXT NOT NULL, tag TEXT NOT NULL, vektor TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('sichtbar', 'zurückgezogen')));
CREATE TABLE answers (id INTEGER PRIMARY KEY, corpus TEXT NOT NULL, question TEXT NOT NULL REFERENCES questions(id), art TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('ungeprüft', 'geprüft', 'kein_beleg')), modell TEXT, text TEXT, bearbeitet INTEGER NOT NULL DEFAULT 0);
CREATE TABLE revisions (id INTEGER PRIMARY KEY, question TEXT NOT NULL, feld TEXT NOT NULL, vorher TEXT, nachher TEXT, rolle TEXT NOT NULL, zeit TEXT NOT NULL);
INSERT INTO questions VALUES ('s01', 'eidl', 0, 'Eins?', 'Tensoren', 'beispiel', '2026-11-04', '[1,0]', 'sichtbar');
INSERT INTO questions VALUES ('s02', 'eidl', 1, 'Zwei?', 'Tensoren', 'beispiel', '2026-11-04', '[0,1]', 'sichtbar');
INSERT INTO questions VALUES ('s03', 'eidl', 2, 'Drei?', 'Tensoren', 'beispiel', '2026-11-04', '[1,1]', 'sichtbar');
INSERT INTO answers VALUES (1, 'eidl', 's01', 'bot', 'geprüft', 'm', 'A', 1);
INSERT INTO answers VALUES (2, 'eidl', 's02', 'bot', 'geprüft', 'm', 'B', 0);
INSERT INTO answers VALUES (3, 'eidl', 's03', 'bot', 'ungeprüft', 'm', 'C', 0);
INSERT INTO revisions VALUES (1, 's01', 'status der antwort', 'ungeprüft', 'geprüft', 'admin', '2026-11-06T09:00:00.000Z');
INSERT INTO revisions VALUES (2, 's01', 'antwort', 'a', 'A', 'admin', '2026-11-12T18:30:00.000Z');
INSERT INTO revisions VALUES (3, 's01', 'frage', 'eins', 'Eins?', 'admin', '2026-11-14T08:00:00.000Z');
INSERT INTO revisions VALUES (4, 's03', 'antwort', 'c', 'C', 'admin', '2026-11-13T08:00:00.000Z');
INSERT INTO revisions VALUES (5, 's01', 'antwort', 'A', 'A', 'konsole', '2026-11-17T13:06:27.038Z');`);
  alt.close();
  for (let lauf = 0; lauf < 2; lauf++) {
    const store = openStore(file);
    assert.deepEqual(store.questions().map(q => [q.id, q.antworten[0].geprueftAm, q.kurztitel, q.titelvorschlag, q.lizenz]), [
      ['s01', '2026-11-12', null, null, 'CC0-1.0'],
      ['s02', '2026-11-04', null, null, 'CC0-1.0'],
      ['s03', null, null, null, 'CC0-1.0'],
    ], 'letzte Änderung an Antwort oder Status durch die Moderation, sonst der Tag der Frage; Ungeprüftes bleibt ohne Datum, ein Eingriff von der Konsole zählt nicht');
    assert.deepEqual(store.staleVectors(), [{ id: 's01', text: 'Eins?' }], 'nur wessen Frage je bearbeitet wurde, rechnet neu');
    store.close();
  }
  fs.rmSync(dir, { recursive: true });
});

test('D30: Eine Frage von außen ohne Erklärung bekommt bei der Migration keine Lizenz, auch wenn sie dem Betreiber gehört', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const file = path.join(dir, 'public.db');
  const store = openStore(file);
  store.importQuestions([{ id: 's01', text: 'Eins?', kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [] }], [[1, 0]], { base: '/eidl/' });
  store.addQuestion({ id: 'abc', text: 'Von außen?', kapitel: 'Tensoren', tag: '2026-11-06' });
  store.close();
  const wieder = openStore(file);
  assert.deepEqual(wieder.questions().map(q => [q.id, q.lizenz]), [['s01', 'CC0-1.0'], ['abc', null]]);
  wieder.close();
  fs.rmSync(dir, { recursive: true });
});

test('D30: Die Konsole erklärt eine Frage von außen nachträglich für gemeinfrei, mit Revision; an Beispielfragen und fremden Lizenzen scheitert sie', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([{ id: 's01', text: 'Eins?', kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [] }], [[1, 0]], { base: '/eidl/' });
  store.addQuestion({ id: 'abc', text: 'Von außen?', kapitel: 'Tensoren', tag: '2026-11-06' });
  assert.equal(store.setLicence('abc', 'CC0-1.0', 'konsole'), true);
  assert.equal(store.question('abc').lizenz, 'CC0-1.0');
  assert.equal(store.setLicence('abc', 'CC0-1.0', 'konsole'), false, 'zweimal dasselbe ändert nichts');
  assert.deepEqual(store.revisions('abc').map(r => [r.feld, r.vorher, r.nachher, r.rolle]), [['lizenz', null, 'CC0-1.0', 'konsole']]);
  assert.match(questionPage(store.question('abc'), { ...store.site(), origin: 'https://example.test', skript: 'https://skript.test/' }), /Diese Frage ist gemeinfrei/);
  assert.throws(() => store.setLicence('abc', 'MIT', 'konsole'), /kennt das Forum nicht/);
  assert.throws(() => store.setLicence('s01', null, 'konsole'), /Beispielfragen/);
  assert.throws(() => store.setLicence('fehlt', 'CC0-1.0', 'konsole'), /gibt es nicht/);
  assert.equal(store.setLicence('abc', null, 'konsole'), true, 'und nimmt es zurück');
  assert.equal(store.question('abc').lizenz, null);
  store.close();
  fs.rmSync(dir, { recursive: true });
});

test('D33: Die Vorschau endet per Schalter, nur für admin und nur mit Haken, und jede Seite wird neu geschrieben', async t => {
  const c = await setup();
  t.after(c.close);
  t.mock.method(console, 'log', () => {});
  const cookie = await c.signIn();
  c.store.saveModerator('tutorin', 'moderator', await hashPassphrase(PASSPHRASE));
  const tutorin = (await c.form('/eidl/mod/anmelden', { name: 'tutorin', passphrase: PASSPHRASE })).headers.get('set-cookie').split(';')[0];
  await c.form('/eidl/mod/f/s01/', { frage: 'Was ist ein Neuron?', antwort: 'Ein Neuron rechnet.[1]', aktion: 'pruefen' }, { cookie });
  const robots = name => c.read(name).match(/name="robots" content="([^"]+)"/)[1];
  assert.match(await (await c.get('/eidl/mod/zahlen/', cookie)).text(), /Die Site ist Vorschau.*value="vorschau_beenden"/s);
  assert.equal(robots('f/s01/index.html'), 'noindex');

  assert.equal((await c.form('/eidl/mod/zahlen/', { aktion: 'vorschau_beenden', bestaetigt: '1' }, { cookie: tutorin })).status, 403);
  assert.equal((await c.form('/eidl/mod/zahlen/', { aktion: 'vorschau_beenden' }, { cookie })).status, 422);
  assert.equal((await c.form('/eidl/mod/zahlen/', { aktion: 'irgendwas', bestaetigt: '1' }, { cookie })).status, 400);
  assert.equal(c.store.site().vorschau, true);

  assert.equal((await c.form('/eidl/mod/zahlen/', { aktion: 'vorschau_beenden', bestaetigt: '1' }, { cookie })).status, 303);
  assert.equal(c.store.site().vorschau, false);
  assert.equal(robots('f/s01/index.html'), 'index,follow');
  assert.equal(robots('f/s02/index.html'), 'noindex', 'ungeprüft bleibt draußen');
  assert.doesNotMatch(c.read('index.html'), /class="vorschau"/);
  assert.match(c.read('sitemap.xml'), /f\/s01\//);
  assert.match(await (await c.get('/eidl/mod/zahlen/', cookie)).text(), /Die Vorschau ist beendet.*value="vorschau_an"/s);

  await c.form('/eidl/mod/zahlen/', { aktion: 'vorschau_an', bestaetigt: '1' }, { cookie });
  assert.equal(robots('f/s01/index.html'), 'noindex');
  assert.match(c.read('index.html'), /class="vorschau"/);
  assert.doesNotMatch(c.read('sitemap.xml'), /<url>/);
});

test('die Moderation kann eine Frage nicht länger machen, als der Worker sie annimmt', async t => {
  const c = await setup();
  t.after(c.close);
  const cookie = await c.signIn();
  const res = await c.form('/eidl/mod/f/s01/', { frage: 'x'.repeat(3001), antwort: 'Ein Neuron rechnet.[1]', aktion: 'speichern' }, { cookie });
  assert.equal(res.status, 422);
  assert.match(await res.text(), /Die Frage ist zu lang, möglich sind 3000 Zeichen/);
});
