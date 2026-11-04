#!/usr/bin/env node
/**
 * Zieht die Zitate der Antworten auf einen neuen Korpus um, ohne API. Die Antworttexte bleiben, wie sie sind. Passt
 * ein Zitat nicht, schreibt das Skript nichts: Dann hat sich der Wortlaut geändert, und die Antwort gehört geprüft.
 *
 *   node tools/move-citations.mjs <korpus-verzeichnis> <antworten.json>
 */
import fs from 'node:fs';
import path from 'node:path';
import { moveCitation } from '../lib/citations.js';

const [dir, answersFile] = process.argv.slice(2);
const { passages } = JSON.parse(fs.readFileSync(path.join(dir, 'corpus.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(answersFile, 'utf8'));

const count = {};
const missing = [];
for (const row of rows) {
  row.cited = (row.cited ?? []).map(c => {
    const found = moveCitation(c, passages);
    if (!found) {
      missing.push(`${row.seed}/${row.key}: ${c.id}`);
      return c;
    }
    count[found.how] = (count[found.how] ?? 0) + 1;
    if (found.how !== 'gleich') console.log(`${row.seed}/${row.key} ${found.how}: ${c.id} -> ${found.passage.id}`);
    const { id, page, title, path: trail, link, hash, text } = found.passage;
    return { id, page, title, path: trail, link, hash, text };
  });
}
console.log(count);
if (missing.length) {
  console.error(`Wortlaut geändert, nichts geschrieben:\n${missing.join('\n')}`);
  process.exit(1);
}
fs.writeFileSync(answersFile, `${JSON.stringify(rows, null, 1)}\n`);
