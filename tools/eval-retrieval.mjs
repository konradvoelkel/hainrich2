#!/usr/bin/env node
/**
 * Kapitel-Trefferquote der Suche auf dem Testset aus Phase 0, je Verfahren.
 *
 *   node tools/eval-retrieval.mjs <arbeitsverzeichnis> <set2.json> <skript-verzeichnis> <commit>
 *
 * Das Testset nennt Kapitelnummern, und die wandern mit dem Skript. <commit> ist der Stand, zu dem sie
 * gehören (09251b0); mit dem Arbeitsbaum zeigen die Sollwerte still auf falsche Kapitel. Plan §19 ist die
 * Gegenprobe: Vektor 91 / 95 / 99 % muss herauskommen.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildBm25, dot, fuse } from '../lib/search.js';
import { createEmbedder } from '../lib/embedder.js';

const [work, setFile, skript, stand] = process.argv.slice(2);
if (!stand) throw new Error('<commit> fehlt: Zu welchem Skriptstand gehören die Kapitelnummern?');
const { passages } = JSON.parse(fs.readFileSync(path.join(work, 'corpus.json'), 'utf8'));
const vectors = JSON.parse(fs.readFileSync(path.join(work, 'vectors.json'), 'utf8'));
const set = JSON.parse(fs.readFileSync(setFile, 'utf8'));
const prefixOf = {};
for (const file of execFileSync('git', ['-C', skript, 'ls-tree', '-r', '--name-only', stand], { encoding: 'utf8' }).split('\n')) {
  const m = file.match(/^part-[^/]+\/(\d\d-)(.+)\.md$/);
  if (m) prefixOf[m[2]] = m[1];
}
/** nach dem Stand des Testsets umbenannt */
prefixOf['latente-raeume-geometrisch'] = prefixOf['latente-raeume'];
const lexical = buildBm25(passages.map(p => [p.title, ...p.path, p.text].join(' ')));
const embedder = await createEmbedder();
const queries = set.pos.flatMap(([a, b, gold]) => [[a, gold], [b, gold]]);
const methods = { Vektor: [], BM25: [], Hybrid: [] };
const misses = [];
for (const [query, gold] of queries) {
  const v = await embedder.query(query);
  const vs = vectors.map(x => dot(x, v));
  const ls = lexical(query);
  const order = s => s.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const hit = o => {
    const r = o.slice(0, 12).findIndex(i => gold.includes(prefixOf[passages[i].page]));
    return r < 0 ? 99 : r + 1;
  };
  methods.Vektor.push(hit(order(vs)));
  methods.BM25.push(hit(order(ls)));
  const h = hit(fuse(vs, ls));
  methods.Hybrid.push(h);
  if (h > 12) misses.push(query.slice(0, 60));
}
for (const [name, r] of Object.entries(methods)) {
  const share = k => `${Math.round(100 * r.filter(x => x <= k).length / r.length)} %`;
  console.log(name.padEnd(8), 'Top 1', share(1), 'Top 3', share(3), 'Top 5', share(5), 'Top 12', share(12));
}
console.log('Hybrid nicht in den Top 12:', misses);
