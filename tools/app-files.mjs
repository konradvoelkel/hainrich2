#!/usr/bin/env node
/**
 * Was Web-Prozess und Worker auf dem VPS brauchen, eine Datei oder ein Verzeichnis je Zeile. Allowlist statt Kopie des Repos, und die
 * Abhängigkeiten kommen aus `package-lock.json`. Von der ONNX-Runtime nur, was auf der CPU läuft: Die Provider für CUDA allein wiegen
 * 270 MB. `onnxruntime-web` braucht in Node niemand.
 */
import fs from 'node:fs';
import path from 'node:path';

const repo = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const lock = JSON.parse(fs.readFileSync(path.join(repo, 'package-lock.json'), 'utf8')).packages;

const LIB = ['answer', 'api', 'auth', 'budget', 'checker', 'citations', 'corpus', 'draft', 'embedder', 'forum', 'fragen', 'http', 'mod', 'mod-pages', 'mod-tasten', 'model', 'pending', 'publish', 'render', 'search', 'segment', 'site', 'skriptstand', 'spool', 'stimmen', 'store', 'zahlen'];
/** `seeds/kurztitel.json`: Vorschläge für die Kurztitel des Bestands, der Web-Prozess legt sie beim Start in public.db (Plan D31) */
const CODE = ['package.json', 'server/web.mjs', 'server/worker.mjs', 'tools/mod-account.mjs', 'seeds/kurztitel.json', ...LIB.map(n => `lib/${n}.js`)];
const ORT_BIN = 'node_modules/onnxruntime-node/bin/napi-v6/linux/x64';
const ORT = ['package.json', 'dist', 'lib', 'script'].map(n => `node_modules/onnxruntime-node/${n}`).concat(['libonnxruntime.so.1', 'libonnxruntime_providers_shared.so', 'onnxruntime_binding.node'].map(n => `${ORT_BIN}/${n}`));
/** kommen über `optionalDependencies`, also nicht über den Weg unten; ohne sie startet transformers nicht */
const SHARP = ['@img/sharp-linux-x64', '@img/sharp-libvips-linux-x64'].map(n => `node_modules/${n}`);
const SKIP = new Set(['onnxruntime-node', 'onnxruntime-web']);

const needed = new Set();
const visit = name => {
  const key = `node_modules/${name}`;
  if (needed.has(key) || SKIP.has(name)) return;
  if (!lock[key]) throw new Error(`${name} fehlt in package-lock.json`);
  needed.add(key);
  for (const dep of Object.keys(lock[key].dependencies ?? {})) visit(dep);
};
['markdown-it', 'katex', '@anthropic-ai/sdk', '@huggingface/transformers', 'onnxruntime-common'].forEach(visit);

console.log([...CODE, ...ORT, ...SHARP, ...needed].join('\n'));
