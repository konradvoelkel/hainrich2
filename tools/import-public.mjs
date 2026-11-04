#!/usr/bin/env node
/**
 * Legt `public.db` aus dem Bestand an: Seeds, die Antworten eines Modells und die Vektoren der Fragen. Einmalig und auf dem
 * Laptop, weil nur hier das Embedding-Modell liegt. Danach gilt die Datenbank auf dem VPS; eine gefüllte überschreibt das
 * Skript nie. Die Site startet als Vorschau.
 *
 *   node tools/import-public.mjs <arbeitsverzeichnis> <fragen.json> <gebaute-site> <public.db> <modell>
 */
import fs from 'node:fs';
import path from 'node:path';
import { createEmbedder } from '../lib/embedder.js';
import { publicQuestion } from '../lib/site.js';
import { openStore } from '../lib/store.js';

const [dir, seedsFile, built, dbFile, model] = process.argv.slice(2);
if (!model) throw new Error('Aufruf: <arbeitsverzeichnis> <fragen.json> <gebaute-site> <public.db> <modell>');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

const here = path.dirname(new URL(import.meta.url).pathname);
const env = Object.fromEntries(fs.readFileSync(path.join(here, '../site/site.env'), 'utf8').split('\n')
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const { ladegroesse } = readJson(path.join(built, env.SITE_BASE, 'daten/meta.json'));

const seeds = readJson(seedsFile);
const rows = readJson(path.join(dir, 'antworten.json')).filter(r => r.model === model);
const { passages, fetched } = readJson(path.join(dir, 'corpus.json'));
if (rows.length !== seeds.length) throw new Error(`${model}: ${rows.length} Antworten für ${seeds.length} Fragen`);

const store = openStore(dbFile);
if (!store.empty()) throw new Error(`${dbFile} ist nicht leer`);
const day = fetched.slice(0, 10);
const questions = seeds.map(seed => publicQuestion(seed, rows.find(r => r.seed === seed.id), passages, day));
const embedder = await createEmbedder();
const vectors = [];
for (const q of questions) vectors.push((await embedder.query(q.text)).map(x => +x.toFixed(4)));
store.importQuestions(questions, vectors, { origin: env.SITE_ORIGIN, base: env.SITE_BASE, skript: env.SITE_SKRIPT, vorschau: true, ladegroesse });
console.log(`${questions.length} Fragen mit ${model} in ${dbFile}`);
store.close();
process.exit(0);
