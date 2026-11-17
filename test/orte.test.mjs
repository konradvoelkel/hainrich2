import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/** was nie versioniert ist oder nicht von hier stammt */
const DRAUSSEN = new Set(['node_modules', '.git', '.claude', '.daten', 'test-results', 'playwright-report', 'models', 'wasm', '.venv', '__pycache__']);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (DRAUSSEN.has(e.name) ? []
  : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const LOKAL = new Set(['.env.local', 'site/deploy.local.env', 'BRANDING.md', 'CLAUDE.local.md', 'HUMAN_RELEASE_CHECKLIST.md']);

test('keine versionierte Datei nennt einen Pfad dieses Rechners: Der Ort der Daten steht in der gitignorten .env.local', () => {
  /** ein Benutzerverzeichnis oder ein eingehängtes Laufwerk, mit einem Namen dahinter */
  const pfad = new RegExp(`/(?:${['home', 'media', 'Users'].join('|')})/[a-z][a-z0-9_-]+/`);
  const treffer = [];
  for (const file of walk(repo)) {
    const name = path.relative(repo, file);
    if (LOKAL.has(name) || /\.(png|jpg|ico|woff2|db|onnx|wasm)$/.test(name)) continue;
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (pfad.test(line)) treffer.push(`${name}:${i + 1}: ${line.trim().slice(0, 90)}`);
    });
  }
  assert.deepEqual(treffer, []);
});

test('was tools/app-files.mjs auf den Server schickt, bringt jede eigene Datei mit, die es importiert', () => {
  const dateien = new Set(execFileSync('node', [path.join(repo, 'tools/app-files.mjs')], { encoding: 'utf8' }).split('\n').filter(Boolean));
  const eigene = [...dateien].filter(f => /^(lib|server|tools)\/.*\.m?js$/.test(f));
  assert.ok(eigene.length > 20, 'die Liste nennt die eigenen Dateien einzeln');
  const fehlt = [];
  for (const file of eigene) {
    const source = fs.readFileSync(path.join(repo, file), 'utf8');
    for (const [, ziel] of source.matchAll(/(?:from|import\()\s*'(\.\.?\/[^']+)'/g)) {
      const name = path.normalize(path.join(path.dirname(file), ziel));
      if (!dateien.has(name)) fehlt.push(`${file} braucht ${name}`);
    }
  }
  assert.deepEqual(fehlt, []);
});

test('lib/orte.js nimmt den Ort aus der Umgebung, und jeder Teil hängt daran', () => {
  const aus = env => execFileSync('node', ['-e', "import('./lib/orte.js').then(m => console.log(m.ort('work', 'phase1')))"], { cwd: repo, env: { ...process.env, ...env }, encoding: 'utf8' }).trim();
  assert.equal(aus({ HAINRICH2_DATEN: '/irgendwo' }), '/irgendwo/work/phase1');
});
