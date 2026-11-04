#!/usr/bin/env node
/**
 * Prüft Kandidaten für Lücken gegen den ganzen Korpus: Steht das Thema irgendwo, und kam die Stelle bei den Modellen an? Ohne
 * API. „Steht nicht in den Passagen“ sagt nur etwas über die Auswahl der Suche, nicht über das Skript.
 *
 *   node research/2026-11-05-skriptluecken/pruefen.mjs <arbeitsverzeichnis>
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildBm25, dot, fuse, withNeighbours } from '../../lib/search.js';
import { createEmbedder } from '../../lib/embedder.js';

const dir = process.argv[2];
const { passages } = JSON.parse(fs.readFileSync(path.join(dir, 'corpus.json'), 'utf8'));
const vectors = JSON.parse(fs.readFileSync(path.join(dir, 'vectors.json'), 'utf8'));
const seeds = new Map(JSON.parse(fs.readFileSync(new URL('../../seeds/fragen.json', import.meta.url), 'utf8')).map(s => [s.id, s]));
const lexical = buildBm25(passages.map(p => [p.title, ...p.path, p.text].join(' ')));
const embedder = await createEmbedder();

/** Seed, Thema als Frage, Muster für die Textsuche */
const CHECKS = JSON.parse(fs.readFileSync(new URL('./kandidaten.json', import.meta.url), 'utf8'));

for (const [id, topic, pattern] of CHECKS) {
  const seed = seeds.get(id);
  const sv = await embedder.query(seed.frage);
  const seen = new Set(withNeighbours(fuse(vectors.map(x => dot(x, sv)), lexical(seed.frage)), passages));
  const tv = await embedder.query(topic);
  const order = fuse(vectors.map(x => dot(x, tv)), lexical(topic)).slice(0, 4);
  const rule = new RegExp(pattern, 'i');
  const hits = passages.map((p, i) => [p, i]).filter(([p]) => rule.test(p.text));
  const clip = (p, m) => {
    const at = m ? Math.max(0, m.index - 70) : 0;
    return p.text.slice(at, at + 210).replace(/\s+/g, ' ');
  };
  console.log(`\n### ${id}: ${topic}`);
  console.log(`Textsuche /${pattern}/: ${hits.length}`);
  for (const [p, i] of hits.slice(0, 5)) console.log(`  [${seen.has(i) ? 'GESEHEN' : 'ungesehen'}] ${p.id.slice(0, 34)} | ${clip(p, p.text.match(rule))}`);
  console.log('Nächste Passagen zum Thema:');
  for (const i of order) console.log(`  [${seen.has(i) ? 'GESEHEN' : 'ungesehen'}] ${passages[i].id.slice(0, 34)} | ${clip(passages[i])}`);
}
process.exit(0);
