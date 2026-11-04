#!/usr/bin/env node
/**
 * Liest das Skript aus der veröffentlichten llms-full.txt, zerlegt es in Passagen, holt die Anker aus dem
 * HTML und rechnet die Vektoren. Keine Kopie im Repo: Das Ergebnis liegt im Arbeitsverzeichnis.
 *
 *   node tools/build-corpus.mjs <arbeitsverzeichnis>
 */
import fs from 'node:fs';
import path from 'node:path';
import { parsePages, pagePassages, parseBlocks } from '../lib/segment.js';
import { createEmbedder } from '../lib/embedder.js';

const SITE = 'https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de';
const dir = process.argv[2];

const plain = html => html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const key = text => text.replace(/[`*_$\\]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\W+/gu, ' ').trim().toLowerCase();

/** Überschrift zu Anker einer Seite, in Reihenfolge des HTML */
async function anchors(url) {
  const html = await (await fetch(url)).text();
  return [...html.matchAll(/<h([1-6])\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g)].map(m => ({ id: m[2], key: key(plain(m[3])) }));
}

const response = await fetch(`${SITE}/llms-full.txt`);
const text = await response.text();
const pages = parsePages(text);
const passages = [];
let linked = 0;
for (const page of pages) {
  const list = pagePassages(page);
  if (!list.length) continue;
  const found = await anchors(page.url);
  for (const p of list) {
    const heading = p.path.at(-1);
    const anchor = heading ? found.find(a => a.key === key(heading)) : null;
    p.link = anchor ? `${page.url}#${anchor.id}` : page.url;
    if (anchor || !heading) linked++;
    passages.push(p);
  }
}
const seen = new Set();
const unique = passages.filter(p => !seen.has(p.id) && seen.add(p.id));
const toc = pages.filter(p => p.slug && p.slug !== 'readme').map(p => ({
  slug: p.slug,
  url: p.url,
  headings: parseBlocks(p.body).filter(b => b.kind === 'heading' && b.level <= 3).map(b => `${'#'.repeat(b.level)} ${b.text}`),
}));
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'corpus.json'), JSON.stringify({ fetched: new Date().toISOString(), etag: response.headers.get('etag'), toc, passages: unique }));
console.log(`Seiten ${pages.length}, Passagen ${unique.length}, mit Anker ${linked}, Zeichen ${unique.reduce((s, p) => s + p.text.length, 0)}`);
const sizes = unique.map(p => p.text.length).sort((a, b) => a - b);
console.log('Größe min/median/p95/max', sizes[0], sizes[sizes.length >> 1], sizes[Math.floor(sizes.length * 0.95)], sizes.at(-1));

const embedder = await createEmbedder();
const vectors = [];
for (const p of unique) vectors.push(await embedder.passage([p.title, ...p.path, p.text].join('\n')));
fs.writeFileSync(path.join(dir, 'vectors.json'), JSON.stringify(vectors));
console.log('Vektoren', vectors.length);
