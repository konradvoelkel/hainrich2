#!/usr/bin/env node
/**
 * Hat sich das veröffentlichte Skript seit dem Korpus geändert, und was muss nachgezogen werden? Vergleicht llms-full.txt mit
 * corpus.json im Korpusverzeichnis, Vorgabe ist der Verweis work/korpus-aktuell, und prüft die Zitate in antworten.json aus Phase 1.
 * Ohne API, schreibt nichts. Die Zitate in public.db zeigt die Moderation, sobald der neue Korpus ausgespielt ist.
 *
 *   node tools/skriptstand.mjs [korpusverzeichnis] [antworten.json]
 *
 * Exit 0: nichts zu tun. 1: nachziehen. 2: Das Skript war nicht zu erreichen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pagePassages, parsePages } from '../lib/segment.js';
import { changedPassages, SKRIPT_SITE, staleAnswers } from '../lib/skriptstand.js';

const dir = process.argv[2] ?? '/media/konrad/xtraspace/hainrich2/work/korpus-aktuell';
const answersFile = process.argv[3] ?? '/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json';
const corpus = JSON.parse(fs.readFileSync(path.join(dir, 'corpus.json'), 'utf8'));

let response;
try {
  response = await fetch(`${SKRIPT_SITE}/llms-full.txt`);
  if (!response.ok) throw new Error(`Status ${response.status}`);
} catch (error) {
  console.error(`Das Skript war nicht zu erreichen: ${error.message}`);
  process.exit(2);
}
const passages = parsePages(await response.text()).flatMap(pagePassages);
const { weg, neu, kapitel } = changedPassages(corpus.passages, passages);
console.log(`Korpus vom ${corpus.fetched.slice(0, 10)}, Skript veröffentlicht ${response.headers.get('last-modified') ?? 'ohne Datum'}`);
if (!weg.length && !neu.length) {
  const etag = response.headers.get('etag') === corpus.etag ? '' : ' Das ETag ist neu, der Text nicht.';
  console.log(`Nichts zu tun: ${passages.length} Passagen, alle wie im Korpus.${etag}`);
  process.exit(0);
}

console.log(`${weg.length} Passagen geändert oder weggefallen, ${neu.length} geändert oder neu, in ${kapitel.length} Kapiteln:`);
for (const k of kapitel) console.log(`  ${k.page.padEnd(36)} −${k.weg} +${k.neu}`);

const rows = JSON.parse(fs.readFileSync(answersFile, 'utf8'));
for (const model of [...new Set(rows.map(r => r.model))]) {
  const stale = staleAnswers(rows.filter(r => r.model === model).map(r => ({ id: r.seed, zitate: r.cited ?? [] })), passages).sort((a, b) => a.id.localeCompare(b.id));
  console.log(`${model}: ${stale.length ? `${stale.length} Antworten zitieren Wortlaut, den das Skript nicht mehr hat: ${stale.map(a => `${a.id} [${a.nummern.join(', ')}]`).join(', ')}` : 'alle Zitate stehen noch so im Skript'}`);
}
console.log(`
Nachziehen: Korpus neu bauen wie unter „Skript geändert“ in .claude/TODO.md, korpus-aktuell darauf zeigen lassen, die Site bauen,
dann beides ausspielen. Danach listet die Moderation die öffentlichen Antworten, deren Zitat das Skript so nicht mehr hat;
„Claude noch einmal fragen“ holt Zitate aus dem neuen Stand.`);
process.exit(1);
