#!/usr/bin/env node
/**
 * Antworten aller Modelle auf die Seeds, als Batch zum halben Preis. Ohne Beleg gibt es einen zweiten
 * Anlauf mit ganzen Kapiteln (Plan §7.2). Refusal-Fallbacks sind hier bewusst aus: Im Blindvergleich darf
 * kein anderes Modell einspringen. Für den Worker in Phase 4 gehören sie dazu.
 *
 *   node tools/answer-seeds.mjs <arbeitsverzeichnis> <fragen.json> <antworten.json>
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { openCorpus } from '../lib/corpus.js';
import { buildRequest, parseAnswer, PROMPT_VERSION } from '../lib/answer.js';
import { Ledger } from '../lib/budget.js';

const [dir, seedsFile, out] = process.argv.slice(2);
const MODELS = { opus: 'claude-opus-5-5', sonnet: 'claude-sonnet-5-5', haiku: 'claude-haiku-5-5' };
const seeds = JSON.parse(fs.readFileSync(seedsFile, 'utf8'));
const corpus = await openCorpus(dir);
const ledger = new Ledger(path.join(dir, 'ledger.json'), 5);
const client = new Anthropic();
const stateFile = path.join(dir, 'batches.json');
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};

/** startet oder setzt fort; ein Neustart des Skripts zahlt einen laufenden Batch nicht doppelt */
async function runBatch(name, jobs) {
  if (!jobs.length) return [];
  if (!state[name]) {
    const batch = await client.messages.batches.create({ requests: jobs.map(j => ({ custom_id: j.id, params: j.params })) });
    state[name] = batch.id;
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 1));
    console.log(name, 'gestartet', batch.id, jobs.length);
  }
  for (;;) {
    const batch = await client.messages.batches.retrieve(state[name]);
    if (batch.processing_status === 'ended') break;
    console.log(name, batch.processing_status, JSON.stringify(batch.request_counts));
    await new Promise(r => setTimeout(r, 30000));
  }
  const byId = new Map(jobs.map(j => [j.id, j]));
  const results = [];
  for await (const item of await client.messages.batches.results(state[name])) {
    const job = byId.get(item.custom_id);
    if (item.result.type !== 'succeeded') {
      console.log('Fehler', item.custom_id, item.result.type, JSON.stringify(item.result).slice(0, 200));
      results.push({ job, answer: { status: 'fehler', text: '', cited: [] }, usage: {} });
      continue;
    }
    const { message } = item.result;
    if (!ledger.entries.some(e => e.label === `${name}:${item.custom_id}`)) ledger.add(`${name}:${item.custom_id}`, message.model, message.usage, { batch: true });
    results.push({ job, answer: parseAnswer(message, job.passages), usage: message.usage });
  }
  return results;
}

const jobs = [];
for (const seed of seeds) {
  const passages = await corpus.select(seed.frage);
  for (const [key, model] of Object.entries(MODELS)) {
    jobs.push({ id: `${seed.id}-${key}`, seed, key, passages, params: buildRequest({ question: seed.frage, passages, model }) });
  }
}
ledger.assertRoom(2.5);
const first = await runBatch('antworten', jobs);

const retry = [];
for (const { job, answer } of first) {
  if (answer.status !== 'kein_beleg') continue;
  const passages = await corpus.chapters(job.seed.frage);
  retry.push({ id: `${job.id}-kapitel`, seed: job.seed, key: job.key, passages, params: buildRequest({ question: job.seed.frage, passages, model: MODELS[job.key] }) });
}
console.log('zweiter Anlauf', retry.length);
ledger.assertRoom(retry.length * 0.1);
const second = await runBatch('kapitel', retry);

const final = new Map(first.map(r => [r.job.id, { ...r, attempt: 1 }]));
for (const r of second) final.set(r.job.id.replace(/-kapitel$/, ''), { ...r, attempt: 2 });
const rows = [...final.values()].map(({ job, answer, usage, attempt }) => ({
  seed: job.seed.id,
  model: MODELS[job.key],
  key: job.key,
  attempt,
  status: answer.status,
  text: answer.text,
  cited: answer.cited.map(p => ({ id: p.id, page: p.page, title: p.title, path: p.path, link: p.link, hash: p.hash, text: p.text })),
  input: usage.input_tokens,
  output: usage.output_tokens,
  promptVersion: PROMPT_VERSION,
}));
fs.writeFileSync(out, `${JSON.stringify(rows, null, 1)}\n`);
const count = {};
for (const r of rows) count[`${r.key} ${r.status}${r.attempt > 1 ? ' (2. Anlauf)' : ''}`] = (count[`${r.key} ${r.status}${r.attempt > 1 ? ' (2. Anlauf)' : ''}`] ?? 0) + 1;
console.log(count, 'Kosten bisher', ledger.total.toFixed(3), '$');
