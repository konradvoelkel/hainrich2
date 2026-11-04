#!/usr/bin/env node
/**
 * Beispielfragen (Plan §12): Opus schreibt rund 100 Kandidaten aus Inhaltsverzeichnis, Glossar und den
 * lokal erschlossenen Hörsaalfragen, nie aus dem Skripttext. Der Richter entdoppelt, je Kapitel bleibt
 * mindestens eine Frage, Reste gehen an die größten Kapitel.
 *
 *   node tools/gen-seeds.mjs <arbeitsverzeichnis> <seeds.json> [--reuse]
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { openCorpus } from '../lib/corpus.js';
import { Ledger } from '../lib/budget.js';
import { findDuplicate, JUDGE_MODEL } from '../lib/judge.js';
import { dot } from '../lib/search.js';

const [dir, out] = process.argv.slice(2);
const reuse = process.argv.includes('--reuse');
const TARGET = 30;
const MODEL = 'claude-opus-5-5';
const candidatesFile = path.join(dir, 'seed-candidates.json');
const corpus = await openCorpus(dir);
const ledger = new Ledger(path.join(dir, 'ledger.json'), 5);
const client = new Anthropic();

const SYSTEM = `Du schreibst Beispielfragen für das Forum zur Bachelor-Vorlesung „Einführung in Deep Learning“ an der Informatik. Die Fragen sollen klingen wie von echten Studierenden: kurz, manchmal umgangssprachlich oder unsicher, nie wie Klausuraufgaben oder Lehrbuchüberschriften.

Mische die Arten: Verwechslungen zwischen Begriffen, Warum-Fragen, Intuition hinter einer Formel, einzelne Rechenschritte, Stolperstellen im PyTorch-Code, Zusammenhänge zwischen Kapiteln. Nur wenige einfache „Was ist X?“-Fragen.

Schreibe aus diesen Blickwinkeln:
- anfaenger: sicher in Python, unsicher in Mathematik
- mathe: will die Herleitung verstehen
- praxis: schreibt gerade PyTorch-Code und hängt
- skeptisch: fragt, warum man das überhaupt so macht
- pruefung: wiederholt Begriffe und will sie sauber trennen
- international: fragt auf Englisch

Nur inhaltliche Fragen. Keine Fragen zu Übungsaufgaben, Übungsblättern, Klausuren, Terminen oder Organisatorischem. Keine Namen.

Schreibe etwa 100 Fragen, gleichmäßig über alle Kapitel verteilt, etwa fünf davon auf Englisch. Gib zu jeder den Slug des Kapitels an. Übernimm gute Fragen aus der Liste „aus dem Hörsaal“ in eigener Formulierung und setze dann hoersaal auf true.`;

const schema = {
  type: 'object',
  properties: {
    fragen: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          frage: { type: 'string' },
          kapitel: { type: 'string' },
          blick: { type: 'string', enum: ['anfaenger', 'mathe', 'praxis', 'skeptisch', 'pruefung', 'international'] },
          hoersaal: { type: 'boolean' },
        },
        required: ['frage', 'kapitel', 'blick', 'hoersaal'],
        additionalProperties: false,
      },
    },
  },
  required: ['fragen'],
  additionalProperties: false,
};

async function generate() {
  const toc = corpus.toc.filter(c => c.slug !== 'glossar').map(c => `Kapitel ${c.slug}\n${c.headings.join('\n')}`).join('\n\n');
  const glossary = corpus.passages.filter(p => p.page === 'glossar').map(p => p.path.at(-1) ?? '').filter(Boolean);
  const hall = JSON.parse(fs.readFileSync(path.join(dir, 'hall.json'), 'utf8')).map(h => `- ${h.frage}`).join('\n');
  const content = `Inhaltsverzeichnis:\n\n${toc}\n\nBegriffe aus dem Glossar: ${[...new Set(glossary)].join(', ')}\n\nAus dem Hörsaal (aus den Antworten des Dozenten erschlossen, Qualität schwankt):\n${hall}`;
  ledger.assertRoom(0.6);
  const stream = client.messages.stream({ model: MODEL, max_tokens: 32000, system: SYSTEM, messages: [{ role: 'user', content }], output_config: { effort: 'medium', format: { type: 'json_schema', schema } } });
  const response = await stream.finalMessage();
  const dollars = ledger.add('seeds', MODEL, response.usage);
  console.log(`Opus: rein ${response.usage.input_tokens}, raus ${response.usage.output_tokens}, ${(dollars * 100).toFixed(1)} ct, ${response.stop_reason}`);
  const { fragen } = JSON.parse(response.content.find(b => b.type === 'text').text);
  fs.writeFileSync(candidatesFile, JSON.stringify(fragen, null, 1));
  return fragen;
}

const candidates = reuse ? JSON.parse(fs.readFileSync(candidatesFile, 'utf8')) : await generate();
const chapters = new Map(corpus.toc.filter(c => c.slug !== 'glossar').map(c => [c.slug, corpus.passages.filter(p => p.page === c.slug).length]));
const known = candidates.filter(c => chapters.has(c.kapitel));
console.log(`Kandidaten ${candidates.length}, mit gültigem Kapitel ${known.length}, Hörsaal ${candidates.filter(c => c.hoersaal).length}`);

const call = async request => {
  ledger.assertRoom(0.01);
  const response = await client.messages.create(request);
  ledger.add('seeds-richter', JUDGE_MODEL, response.usage);
  return response;
};

/** zwei englische Fragen, damit die Sprachregel mitgetestet wird, dann Hörsaalfragen, sonst feste Reihenfolge */
const english = new Set(known.filter(c => c.blick === 'international').slice(0, 2));
const priority = c => (english.has(c) ? 0 : c.hoersaal ? 1 : 2);
const pool = [...known].sort((a, b) => priority(a) - priority(b));
const quota = new Map([...chapters.keys()].map(k => [k, 1]));
const big = [...chapters.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
for (let i = 0; quota.size + i < TARGET; i++) quota.set(big[i % big.length], quota.get(big[i % big.length]) + 1);

const picked = [];
const vectors = new Map();
for (const c of pool) {
  if (picked.length >= TARGET || (quota.get(c.kapitel) ?? 0) < 1) continue;
  const v = await corpus.embedder.query(c.frage);
  const near = picked.map(p => [dot(vectors.get(p), v), p]).sort((a, b) => b[0] - a[0]).slice(0, 8).map(([, p]) => p);
  const duplicate = await findDuplicate(c.frage, near.map(p => p.frage), call);
  if (duplicate) {
    console.log('Duplikat:', c.frage.slice(0, 60), '=', duplicate.slice(0, 60));
    continue;
  }
  vectors.set(c, v);
  picked.push(c);
  quota.set(c.kapitel, quota.get(c.kapitel) - 1);
}
const seeds = picked
  .sort((a, b) => [...chapters.keys()].indexOf(a.kapitel) - [...chapters.keys()].indexOf(b.kapitel))
  .map((c, i) => ({ id: `s${String(i + 1).padStart(2, '0')}`, ...c }));
fs.writeFileSync(out, `${JSON.stringify(seeds, null, 1)}\n`);
const open = [...quota.entries()].filter(([, n]) => n > 0).map(([k]) => k);
console.log(`Gewählt ${seeds.length}, Hörsaal ${seeds.filter(s => s.hoersaal).length}, Kapitel ohne Frage: ${open.join(', ') || 'keine'}, Kosten bisher ${ledger.total.toFixed(3)} $`);
