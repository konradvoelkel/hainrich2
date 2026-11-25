/**
 * Das Ende der Vorschau hat zwei Schalter: `site/build.mjs --release` für die statischen Seiten und `vorschau` in public.db für alles,
 * was der Web-Prozess schreibt. Dieser Test hält den zweiten fest (research/2026-11-16-seo-audit, Befund 4).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { publishAll } from '../lib/publish.js';
import { openStore } from '../lib/store.js';

const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 1 MB', fragen: true };
const frage = (id, kapitel, status) => ({ id, text: `Frage ${id}?`, kapitel, herkunft: 'beispiel', tag: '2026-11-04', antworten: [{ art: 'bot', status, modell: 'm', text: 'Eine Antwort.', zitate: [] }] });

test('mit vorschau bleibt alles draußen; ohne kommen geprüfte Fragen hinein und was zu ihnen führt', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const live = path.join(dir, 'live');
  const store = openStore(path.join(dir, 'public.db'));
  const fragen = [frage('s01', 'Tensoren', 'geprüft'), frage('s02', 'Tensoren', 'geprüft'), frage('s03', 'Tensoren', 'geprüft'), frage('s04', 'Backpropagation', 'geprüft'), frage('s05', 'Autoencoder', 'ungeprüft')];
  store.importQuestions(fragen, fragen.map(() => [1, 0]), site);
  const lies = name => fs.readFileSync(path.join(live, 'eidl', name), 'utf8');
  const robots = name => lies(name).match(/name="robots" content="([^"]+)"/)[1];

  await publishAll(live, store);
  for (const seite of ['index.html', 'f/s01/index.html', 'f/grundlagen/index.html', 'f/kapitel/tensoren/index.html']) assert.equal(robots(seite), 'noindex', seite);
  assert.doesNotMatch(lies('sitemap.xml'), /<url>/);
  assert.match(lies('index.html'), /class="vorschau"/);

  store.setSite('vorschau', false);
  await publishAll(live, store);
  assert.equal(robots('index.html'), 'index,follow');
  assert.equal(robots('f/s01/index.html'), 'index,follow');
  assert.equal(robots('f/s05/index.html'), 'noindex', 'ungeprüft');
  assert.equal(robots('f/grundlagen/index.html'), 'index,follow');
  assert.equal(robots('f/architekturen/index.html'), 'noindex', 'nur Ungeprüftes');
  assert.equal(robots('f/kapitel/tensoren/index.html'), 'index,follow', 'drei geprüfte Fragen, ab zwei indexierbar');
  assert.equal(robots('f/kapitel/backpropagation/index.html'), 'noindex', 'eine geprüfte Frage reicht nicht');
  assert.equal(robots('f/neu/index.html'), 'noindex');
  const orte = [...lies('sitemap.xml').matchAll(/<loc>https:\/\/example\.test\/eidl\/([^<]*)<\/loc>/g)].map(m => m[1]).sort();
  assert.deepEqual(orte, ['', 'f/grundlagen/', 'f/kapitel/tensoren/', 'f/lernen/', 'f/s01/', 'f/s02/', 'f/s03/', 'f/s04/', 'ueber/']);
  assert.doesNotMatch(lies('index.html'), /class="vorschau"/);
  fs.rmSync(dir, { recursive: true });
});
