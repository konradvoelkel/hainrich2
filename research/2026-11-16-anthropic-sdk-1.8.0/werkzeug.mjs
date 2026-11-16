#!/usr/bin/env node
/**
 * Die Aufrufwege der Werkzeuge, die der Worker nicht geht: `messages.create` ohne Beta (tools/try-answers.mjs), der Richter mit
 * JSON-Schema (tools/gen-seeds.mjs), ein Schema mit `enum` (tools/triage-checks.mjs), `messages.stream` (tools/gen-seeds.mjs) und
 * Batches (tools/answer-seeds.mjs). Der Client entsteht wie dort, Key und Adresse kommen aus der Umgebung. attrappe.mjs startet dieses
 * Skript gegen den Attrappen-Server, von Hand läuft es nie.
 *
 *   node werkzeug.mjs <weg> <ergebnisdatei>
 */
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { buildRequest, parseAnswer } from '../../lib/answer.js';
import { findDuplicate } from '../../lib/judge.js';

const [weg, datei] = process.argv.slice(2);
if (!process.env.ANTHROPIC_BASE_URL?.startsWith('http://127.0.0.1:')) throw new Error('Nur gegen die Attrappe');

const client = new Anthropic();
const passagen = [{ title: 'Kapitel', path: ['Abschnitt'], text: 'Erste Passage mit Größe und Maß.' }, { title: 'Kapitel', path: ['Anderer Abschnitt'], text: 'Zweite Passage.' }];
const anfrage = model => buildRequest({ question: 'Was ist die Schrittweite?', passages: passagen, model });
const format = (properties, extra = {}) => ({ type: 'json_schema', schema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false, ...extra } });

const WEGE = {
  async antwort() {
    return parseAnswer(await client.messages.create(anfrage('claude-opus-5-5')), passagen);
  },
  async richter() {
    return { duplikat: await findDuplicate('neu', ['a', 'b'], request => client.messages.create(request)) };
  },
  async 'schema-enum'() {
    const response = await client.messages.create({
      model: 'claude-haiku-5-5', max_tokens: 2000, system: 'Attrappe', messages: [{ role: 'user', content: 'Attrappe' }],
      output_config: { effort: 'low', format: format({ schwere: { type: 'string', enum: ['schwer', 'leicht'] } }) },
    });
    return JSON.parse(response.content.find(b => b.type === 'text').text);
  },
  async strom() {
    const stream = client.messages.stream({
      model: 'claude-opus-5-5', max_tokens: 32000, system: 'Attrappe', messages: [{ role: 'user', content: 'Attrappe' }],
      output_config: { effort: 'medium', format: format({ fragen: { type: 'array', items: { type: 'string' } } }) },
    });
    return stream.finalMessage();
  },
  async batch() {
    const batch = await client.messages.batches.create({ requests: [{ custom_id: 'probe-opus', params: anfrage('claude-opus-5-5') }, { custom_id: 'probe-haiku', params: anfrage('claude-haiku-5-5') }] });
    const stand = await client.messages.batches.retrieve(batch.id);
    const zeilen = [];
    for await (const item of await client.messages.batches.results(batch.id)) {
      zeilen.push({ id: item.custom_id, art: item.result.type, antwort: item.result.type === 'succeeded' ? parseAnswer(item.result.message, passagen) : null, usage: item.result.message?.usage ?? null });
    }
    return { gestartet: batch.id, stand: stand.processing_status, zeilen };
  },
};

fs.writeFileSync(datei, JSON.stringify(await WEGE[weg](), null, 1));
