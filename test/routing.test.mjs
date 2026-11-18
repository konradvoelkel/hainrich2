import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createApi } from '../lib/api.js';
import { hashPassphrase } from '../lib/auth.js';
import { createFragen } from '../lib/fragen.js';
import { createRouter, plainPath } from '../lib/http.js';
import { createHandler } from '../lib/mod.js';
import { openPending } from '../lib/pending.js';
import { createPublisher, publishAll } from '../lib/publish.js';
import { openStore } from '../lib/store.js';

const BASE = '/eidl/';
const site = { origin: 'https://example.test', base: BASE, skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 1 MB' };
const seed = { id: 's01', text: 'Was ist ein Neuron?', kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [] };

/**
 * Pfade, die der Webserver für etwas anderes halten kann als die App: `new URL()` löst sie zur Moderation auf, roh beginnen sie nicht
 * mit ihr. Vor der Moderation steht eine Schranke des Webservers (Plan D50), und sie entscheidet an seinem Bild des Pfads.
 */
const SCHIEF = ['/eidl/API/%2e%2e/mod/', '/eidl/API/%2E%2E/mod/', '/eidl/API/..\\mod/', '/eidl/API/../mod/', '/eidl/api/../mod/', '/eidl/x/.%2e/mod/', '/eidl/mod/../mod/'];

/** roh, wie es auf der Leitung steht: `fetch` würde den Pfad vorher selbst auflösen */
const raw = (origin, pfad, method = 'GET') => new Promise((resolve, reject) => {
  const { hostname, port } = new URL(origin);
  const req = http.request({ hostname, port, path: pfad, method }, res => {
    const chunks = [];
    res.on('data', chunk => chunks.push(chunk));
    res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8'), headers: res.headers }));
  });
  req.on('error', reject);
  req.end();
});

async function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const store = openStore(path.join(dir, 'public.db'));
  store.importQuestions([seed], [[1, 0, 0]], { ...site, fragen: true, entwurf: false });
  store.saveModerator('konrad', 'admin', await hashPassphrase('passphrase-fuer-den-test'));
  await publishAll(live, store);
  const pending = openPending(path.join(dir, 'pending.db'));
  const publish = createPublisher(live, store);
  const fragen = createFragen({ store, pending, spool: null, publish });
  const api = createApi({ fragen, pending, store, hash: await hashPassphrase('nur-fuer-den-test') });
  const mod = createHandler({ store, live, publish, fragen });
  const listen = async handler => {
    const server = http.createServer(handler);
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
  };
  return { api, mod, listen };
}

test('plainPath gibt einen Pfad nur zurück, wenn er roh schon so dasteht, wie er aufgelöst würde', () => {
  assert.equal(plainPath('/eidl/mod/'), '/eidl/mod/');
  assert.equal(plainPath('/eidl/mod/f/s01/?ok=gespeichert'), '/eidl/mod/f/s01/', 'die Abfrage gehört nicht zum Pfad');
  assert.equal(plainPath('/eidl/api/token'), '/eidl/api/token');
  assert.equal(plainPath('/eidl/API/..%5Cmod/'), '/eidl/API/..%5Cmod/', 'ein kodierter Backslash bleibt, was er ist: kein Trenner');
  for (const pfad of SCHIEF) assert.equal(plainPath(pfad), null, pfad);
  for (const pfad of ['', 'eidl/mod/', '//fremd.test/eidl/mod/', 'http://x/eidl/mod/', '/eidl/mod/\t', '/eidl/mod/#anker', '/eidl/mod/ ', '/eidl/möd/', '/eidl/mod/./']) assert.equal(plainPath(pfad), null, JSON.stringify(pfad));
  assert.equal(plainPath(undefined), null);
});

test('die Verteilung kennt Abstimmen, Fragepfad und Moderation; alles andere bekommt 404, nichts fällt an die Moderation', async t => {
  const seen = [];
  const handler = name => (req, res) => { seen.push(name); res.writeHead(200).end(name); };
  const mit = createRouter({ base: BASE, api: handler('api'), mod: handler('mod'), voting: handler('stimme') });
  const ohne = createRouter({ base: BASE, api: handler('api'), mod: handler('mod') });
  const ask = async (router, url) => {
    seen.length = 0;
    const res = { status: 0, writeHead(status) { this.status = status; return this; }, end() {} };
    router({ url }, res);
    return seen[0] ?? res.status;
  };
  assert.equal(await ask(mit, '/eidl/api/stimme'), 'stimme');
  assert.equal(await ask(ohne, '/eidl/api/stimme'), 'api', 'ohne Abstimmen antwortet der Fragepfad, wie bisher');
  assert.equal(await ask(mit, '/eidl/api/stimme?x=1'), 'api', 'wie bisher: nur die genaue Adresse stimmt ab');
  assert.equal(await ask(mit, '/eidl/api/token'), 'api');
  assert.equal(await ask(mit, '/eidl/api/'), 'api');
  assert.equal(await ask(mit, '/eidl/mod'), 'mod');
  assert.equal(await ask(mit, '/eidl/mod/'), 'mod');
  assert.equal(await ask(mit, '/eidl/mod/f/s01/?ok=gespeichert'), 'mod');
  for (const url of ['/eidl/API/token', '/EIDL/MOD/', '/eidl/modx', '/eidl/irgendwas', '/eidl/', '/', '/eidl/api', ...SCHIEF]) assert.equal(await ask(mit, url), 404, url);
});

test('ein schiefer Pfad erreicht die Anmeldeseite der Moderation nicht, weder über die Verteilung noch an der Moderation selbst', async t => {
  const c = await setup();
  const hinterVerteilung = await c.listen(createRouter({ base: BASE, api: c.api, mod: c.mod }));
  const direkt = await c.listen(c.mod);
  t.after(() => { hinterVerteilung.close(); direkt.close(); });

  const gerade = await raw(hinterVerteilung.origin, '/eidl/mod/');
  assert.equal(gerade.status, 200);
  assert.match(gerade.text, /name="passphrase"/, 'die Gegenprobe: So sieht die Anmeldeseite aus');

  for (const pfad of [...SCHIEF, '/eidl/API/token', '/EIDL/MOD/', '/eidl/irgendwas']) {
    const res = await raw(hinterVerteilung.origin, pfad);
    assert.equal(res.status, 404, pfad);
    assert.doesNotMatch(res.text, /name="passphrase"/, pfad);
    assert.equal((await raw(hinterVerteilung.origin, pfad, 'POST')).status, 404, `POST ${pfad}`);
  }
  /** Die Moderation prüft es selbst noch einmal: Sie hängt in manchen Tests und bei der Wache des Servers ohne Verteilung am Port */
  for (const pfad of SCHIEF) {
    const res = await raw(direkt.origin, pfad);
    assert.equal(res.status, 404, `direkt ${pfad}`);
    assert.doesNotMatch(res.text, /name="passphrase"/, `direkt ${pfad}`);
  }
  assert.equal((await raw(direkt.origin, '/eidl/mod/')).status, 200);
});

test('der Fragepfad antwortet auf einen schiefen Pfad mit 404 und sonst wie bisher', async t => {
  const c = await setup();
  const server = await c.listen(createRouter({ base: BASE, api: c.api, mod: c.mod }));
  const direkt = await c.listen(c.api);
  t.after(() => { server.close(); direkt.close(); });
  assert.equal((await raw(server.origin, '/eidl/api/token')).status, 405, 'woran site/deploy-app.sh erkennt, dass die App antwortet');
  assert.equal((await raw(direkt.origin, '/eidl/api/token')).status, 405);
  for (const pfad of ['/eidl/api/../api/token', '/eidl/api/%2e%2e/api/token', '/eidl/api/..\\api\\token']) {
    assert.equal((await raw(server.origin, pfad)).status, 404, pfad);
    assert.equal((await raw(direkt.origin, pfad)).status, 404, `direkt ${pfad}`);
    assert.equal((await raw(direkt.origin, pfad, 'POST')).status, 404, `direkt POST ${pfad}`);
  }
});
