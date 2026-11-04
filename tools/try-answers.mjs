#!/usr/bin/env node
/**
 * Probelauf: wenige Fragen, alle Modelle, synchron. Kostet echtes Geld, das Kostenbuch deckelt.
 *
 *   node tools/try-answers.mjs <arbeitsverzeichnis> <modell>... -- <frage>...
 */
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { openCorpus } from '../lib/corpus.js';
import { buildRequest, parseAnswer } from '../lib/answer.js';
import { Ledger } from '../lib/budget.js';

const args = process.argv.slice(2);
const dir = args.shift();
const split = args.indexOf('--');
const models = args.slice(0, split);
const questions = args.slice(split + 1);
const corpus = await openCorpus(dir);
const ledger = new Ledger(path.join(dir, 'ledger.json'), 5);
const client = new Anthropic();

for (const question of questions) {
  const passages = await corpus.select(question);
  console.log(`\n=== ${question}\n    ${passages.length} Passagen, ${passages.reduce((s, p) => s + p.text.length, 0)} Zeichen`);
  for (const model of models) {
    ledger.assertRoom(0.2);
    const t = Date.now();
    const response = await client.messages.create(buildRequest({ question, passages, model }));
    const dollars = ledger.add('probe', model, response.usage);
    const answer = parseAnswer(response, passages);
    console.log(`\n--- ${model} ${answer.status}, ${((Date.now() - t) / 1000).toFixed(1)} s, rein ${response.usage.input_tokens}, raus ${response.usage.output_tokens}, ${(dollars * 100).toFixed(2)} ct`);
    console.log(answer.text);
    console.log('Quellen:', answer.cited.map(p => `${p.page} › ${p.path.at(-1) ?? ''}`));
  }
}
console.log('\nGesamt', ledger.total.toFixed(4), '$');
