#!/usr/bin/env node
/**
 * Messung zu E13 und E14 (Konrad, 2026-11-23, 5 $; Plan D52): Prompt-Version 2 an den 27 Beispielfragen und acht Grenzfällen, mit Modell
 * und Einstellungen des Worker (lib/draft.js), als Batch zum halben Preis. Ergebnisse und Prüfungen landen im Arbeitsverzeichnis, der
 * Bericht steht in research/2026-11-23-antworten-v2/.
 *
 *   node tools/messung-v2.mjs <arbeitsverzeichnis> 1   Antworten und Kurztitel; nach „kein Beleg“ der zweite Anlauf wie im Worker
 *   node tools/messung-v2.mjs <arbeitsverzeichnis> 2   der zweite Anlauf mit ganzen Kapiteln auch für Teilantworten (E13)
 *
 * Das Arbeitsverzeichnis braucht corpus.json und vectors.json, Verweise auf den Korpus, der live ist, und bekommt ein eigenes Kostenbuch
 * mit einem Deckel von 5 $. Der Key kommt aus der Umgebung, nur in einer Subshell. Nichts davon geht an den Server.
 * Mit TROCKEN=1 baut Stufe 1 nur die Anfragen und nennt den schlimmsten Fall, ohne Key und ohne Aufruf.
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { openCorpus } from '../lib/corpus.js';
import { buildRequest, buildTitleRequest, parseAnswer, parseTitle, PARTIAL, PROMPT_VERSION } from '../lib/answer.js';
import { Ledger } from '../lib/budget.js';
import { DRAFT_MODEL } from '../lib/draft.js';
import { runBatch, wendungen, worstCase } from './messbatch.mjs';

const repo = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const [dir, stufe] = process.argv.slice(2);
if (!dir || !['1', '2'].includes(stufe)) throw new Error('Aufruf: node tools/messung-v2.mjs <arbeitsverzeichnis> 1|2');
const DECKEL = 5;
/** deren Spuren schon bekannt sind (DEVELOPMENT_PLAN §19, TODO E13): Die nötige Passage kam bei der Suche nicht an */
const SPUREN = ['s12', 's20', 's21', 's29'];

const lies = name => JSON.parse(fs.readFileSync(name, 'utf8'));
const schreib = (name, data) => fs.writeFileSync(path.join(dir, name), `${JSON.stringify(data, null, 1)}\n`);
const stateFile = path.join(dir, 'batches.json');
const state = fs.existsSync(stateFile) ? lies(stateFile) : {};
const saveState = s => fs.writeFileSync(stateFile, JSON.stringify(s, null, 1));
const ledger = new Ledger(path.join(dir, 'ledger.json'), DECKEL);
/** keine Wiederholung im SDK: Ein wiederholtes Anlegen nach einer Zeitüberschreitung könnte einen zweiten Batch starten; ein Neustart des Skripts setzt fort */
let client = null;
const corpus = await openCorpus(dir);
const batch = (name, jobs) => runBatch({ client: (client ??= new Anthropic({ maxRetries: 0 })), ledger, state, saveState, name, jobs });

const fragen = [
  ...lies(path.join(repo, 'seeds/fragen.json')).map(s => ({ id: s.id, art: 'beispiel', frage: s.frage, soll: s.kapitel, erwartet: null })),
  ...lies(path.join(repo, 'research/2026-11-23-antworten-v2/grenzfaelle.json')).map(g => ({ id: g.id, art: 'grenzfall', frage: g.frage, soll: g.kapitel, erwartet: g.erwartet })),
];

const roh = message => message.content.filter(b => b.type === 'text').map(b => b.text).join('');

/** eine Zeile je Antwort: was der Worker daraus machte, und was die Messung daran prüft */
function zeile(job, result, anlauf) {
  const kopf = { id: job.frage.id, art: job.frage.art, frage: job.frage.frage, soll: job.frage.soll, erwartet: job.frage.erwartet, anlauf, passagen: job.passages.length };
  if (result.type !== 'succeeded') return { ...kopf, status: `fehler:${result.type}` };
  const { message } = result;
  const answer = parseAnswer(message, job.passages);
  const text = roh(message);
  return {
    ...kopf,
    status: answer.status,
    teilantwort: !!answer.partial,
    /** Das Steuerwort gehört in die letzte Zeile; steht es woanders, entfernt parseAnswer es trotzdem */
    teilantwortAmEnde: answer.partial ? text.trim().split('\n').at(-1).replace(/[*_`.\s]/g, '') === PARTIAL : null,
    sollZitiert: job.frage.soll ? answer.cited.some(p => p.page === job.frage.soll) : null,
    wendungen: wendungen(answer.text),
    zitate: answer.cited.map(p => ({ id: p.id, page: p.page, titel: [p.title, ...p.path].join(' › ') })),
    text: answer.text,
    stop: message.stop_reason,
    input: message.usage.input_tokens,
    output: message.usage.output_tokens,
    modell: message.model,
  };
}

const kapitelJob = async (frage, suffix = 'kapitel') => {
  const passages = await corpus.chapters(frage.frage);
  return { id: `${frage.id}-${suffix}`, frage, passages, params: buildRequest({ question: frage.frage, passages, model: DRAFT_MODEL }) };
};

if (stufe === '1') {
  const jobs = [];
  for (const frage of fragen) {
    const passages = await corpus.select(frage.frage);
    jobs.push({ id: `${frage.id}-antwort`, frage, passages, params: buildRequest({ question: frage.frage, passages, model: DRAFT_MODEL }) });
    if (frage.art === 'beispiel') jobs.push({ id: `${frage.id}-titel`, frage, params: buildTitleRequest({ question: frage.frage, model: DRAFT_MODEL }) });
  }
  if (process.env.TROCKEN) {
    const worst = jobs.reduce((sum, job) => sum + worstCase(job.params), 0);
    console.log(`stufe1: ${jobs.length} Anfragen, schlimmster Fall ${worst.toFixed(3)} $, Kostenbuch ${ledger.total.toFixed(3)} $ von ${DECKEL} $`);
    process.exit(0);
  }
  const zeilen = new Map();
  const titel = [];
  for (const { job, result } of await batch('stufe1', jobs)) {
    if (job.id.endsWith('-titel')) {
      const text = result.type === 'succeeded' ? roh(result.message).trim() : null;
      titel.push({ id: job.frage.id, frage: job.frage.frage, roh: text, titel: result.type === 'succeeded' ? parseTitle(result.message) : null, zeichen: text?.length ?? null });
      continue;
    }
    zeilen.set(job.frage.id, { erster: zeile(job, result, 1) });
  }
  /** wie im Worker: ohne Beleg ein zweiter Anlauf mit den zwei besten ganzen Kapiteln */
  const nochmal = [];
  for (const { erster } of zeilen.values()) if (erster.status === 'kein_beleg') nochmal.push(await kapitelJob(fragen.find(f => f.id === erster.id)));
  for (const { job, result } of await batch('stufe1-kapitel', nochmal)) zeilen.get(job.frage.id).zweiter = zeile(job, result, 2);
  schreib('stufe1.json', { promptVersion: PROMPT_VERSION, modell: DRAFT_MODEL, korpus: fs.realpathSync(path.join(dir, 'corpus.json')).split(path.sep).at(-2), zeilen: [...zeilen.values()], titel });
}

if (stufe === '2') {
  const { zeilen } = lies(path.join(dir, 'stufe1.json'));
  const kandidaten = zeilen.filter(z => !z.zweiter && ((z.erster.status === 'ok' && z.erster.teilantwort) || SPUREN.includes(z.erster.id)));
  const jobs = [];
  for (const z of kandidaten) jobs.push(await kapitelJob(fragen.find(f => f.id === z.erster.id)));
  const paare = [];
  for (const { job, result } of await batch('stufe2-kapitel', jobs)) paare.push({ erster: zeilen.find(z => z.erster.id === job.frage.id).erster, zweiter: zeile(job, result, 2) });
  /**
   * Stufe 1 zeigte: Opus 5.5 denkt auch bei `effort: low` nach, und mit `max_tokens: 200` (lib/answer.js) endeten 8 von 27 Kurztiteln
   * ohne Text (`stop_reason: max_tokens`). Abschalten lässt sich das Denken bei diesem Modell nicht. Gemessen wird die Abhilfe: mehr Raum.
   */
  const TITEL_RAUM = 2000;
  const titelJobs = fragen.filter(f => f.art === 'beispiel').map(frage => ({ id: `${frage.id}-titel`, frage, params: buildTitleRequest({ question: frage.frage, model: DRAFT_MODEL, maxTokens: TITEL_RAUM }) }));
  const titel = [];
  for (const { job, result } of await batch('stufe2-titel', titelJobs)) {
    const ok = result.type === 'succeeded';
    titel.push({ id: job.frage.id, stop: ok ? result.message.stop_reason : result.type, output: ok ? result.message.usage.output_tokens : null, roh: ok ? roh(result.message).trim() : null, titel: ok ? parseTitle(result.message) : null });
  }
  schreib('stufe2.json', { paare, titel, titelRaum: TITEL_RAUM });
}

console.log(`Kostenbuch: ${ledger.total.toFixed(3)} $ von ${DECKEL} $`);
