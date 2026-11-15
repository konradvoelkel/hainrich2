#!/usr/bin/env node
/**
 * Rechnet mit der installierten Fassung von transformers.js alle Passagen eines Korpus neu, so wie tools/build-corpus.mjs, und die
 * Seed-Fragen so wie site/build.mjs, aber ungerundet. passagen.json muss Byte für Byte die vectors.json des Korpus sein, sonst rechnet
 * die Fassung anders als die, mit der der Korpus gebaut ist (Playbook §3.6). Ohne Netz.
 *
 *   node research/2026-11-15-transformers-4.3.2/node-vektoren.mjs <korpus> <ausgabe>
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createEmbedder } from '../../lib/embedder.js';

const [korpus, ausgabe] = process.argv.slice(2);
if (!korpus || !ausgabe) throw new Error('Aufruf: node-vektoren.mjs <korpus> <ausgabe>');

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const fassung = name => readJson(path.join(repo, 'node_modules', name, 'package.json')).version;
const sha = text => crypto.createHash('sha256').update(text).digest('hex');

const { passages } = readJson(path.join(korpus, 'corpus.json'));
const seeds = readJson(path.join(repo, 'seeds/fragen.json'));
const embedder = await createEmbedder();

const passagen = [];
for (const p of passages) passagen.push(await embedder.passage([p.title, ...p.path, p.text].join('\n')));
const fragen = [];
for (const s of seeds) fragen.push(await embedder.query(s.frage));

fs.mkdirSync(ausgabe, { recursive: true });
const dateien = { 'passagen.json': JSON.stringify(passagen), 'fragen.json': JSON.stringify(fragen) };
for (const [name, text] of Object.entries(dateien)) fs.writeFileSync(path.join(ausgabe, name), text);

console.log(`transformers.js ${fassung('@huggingface/transformers')}, onnxruntime-node ${fassung('onnxruntime-node')}, Node ${process.version}`);
console.log(`Passagen ${passagen.length}, Fragen ${fragen.length}`);
for (const [name, text] of Object.entries(dateien)) console.log(`${sha(text)}  ${name}`);
const gebaut = fs.readFileSync(path.join(korpus, 'vectors.json'), 'utf8');
console.log(`${sha(gebaut)}  vectors.json des Korpus`);
console.log(gebaut === dateien['passagen.json'] ? 'Passagen: Byte für Byte wie im Korpus' : 'Passagen: WEICHEN AB');
process.exitCode = gebaut === dateien['passagen.json'] ? 0 : 1;
