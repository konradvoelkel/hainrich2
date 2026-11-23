/**
 * Ein Batch mit Buchung vorab, für Messungen (research/2026-11-23-antworten-v2/). Der schlimmste Fall steht im Kostenbuch, bevor der
 * Batch hinausgeht, und zwischen Prüfen und Buchen steht kein `await` (Plan D26, CLAUDE.md „Was beißt“ 13). Sind alle Ergebnisse da,
 * weicht die Buchung vorab den echten Zahlen, zum Batchpreis. tools/answer-seeds.mjs bucht erst danach; es stammt von vor D26.
 *
 * Startet das Skript neu, läuft derselbe Batch weiter: Seine Kennung steht in `state`, die Buchung vorab bleibt, bezahlt wird nichts
 * doppelt. Stirbt der Prozess zwischen dem Anlegen und dem Sichern der Kennung, legte ein Neustart einen zweiten Batch an; das Buch
 * zeigt dann zu wenig. Das Fenster ist ein einziger Aufruf breit.
 */
import { costOf } from '../lib/budget.js';

/** Obergrenze ohne Zählen: Deutsch hat rund vier Zeichen je Token, gerechnet wird mit zwei, dazu die volle Länge der Ausgabe */
export function worstCase(params) {
  const chars = JSON.stringify(params.system ?? '').length + JSON.stringify(params.messages).length;
  return costOf(params.model, { input_tokens: Math.ceil(chars / 2), output_tokens: params.max_tokens }, { batch: true });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function runBatch({ client, ledger, state, saveState, name, jobs, wait = sleep, log = console.log }) {
  if (!jobs.length) return [];
  const label = `${name}:vorab`;
  let hold = ledger.entries.find(e => e.label === label && e.offen) ?? null;
  if (!state[name]) {
    if (!hold) {
      const worst = jobs.reduce((sum, job) => sum + worstCase(job.params), 0);
      ledger.assertRoom(worst);
      hold = ledger.reserve(label, jobs[0].params.model, worst);
    }
    let batch;
    try {
      batch = await client.messages.batches.create({ requests: jobs.map(job => ({ custom_id: job.id, params: job.params })) });
    } catch (error) {
      /** eine Absage der API: Zustande kam nichts. Ohne Status ist offen, ob der Batch angelegt wurde, also bleibt die Buchung */
      if (Number.isInteger(error?.status)) ledger.release(hold);
      throw error;
    }
    state[name] = batch.id;
    saveState(state);
    log(`${name}: ${jobs.length} Anfragen gestartet, vorab gebucht ${hold.dollars.toFixed(3)} $`);
  }
  for (;;) {
    const batch = await client.messages.batches.retrieve(state[name]);
    if (batch.processing_status === 'ended') break;
    log(`${name}: ${batch.processing_status} ${JSON.stringify(batch.request_counts)}`);
    await wait(30_000);
  }
  const results = new Map();
  for await (const item of await client.messages.batches.results(state[name])) results.set(item.custom_id, item.result);
  if (hold) ledger.release(hold);
  for (const [id, result] of results) {
    if (result.type === 'succeeded' && !ledger.entries.some(e => e.label === `${name}:${id}`)) ledger.add(`${name}:${id}`, result.message.model, result.message.usage, { batch: true });
  }
  return jobs.map(job => ({ job, result: results.get(job.id) ?? { type: 'fehlt' } }));
}

/**
 * Was Prompt-Version 2 verbietet (lib/answer.js): Aussagen darüber, was im Skript steht oder fehlt, Aufzählungen des Fehlenden und
 * Verweise auf Vorlesung, Sprechstunde oder Literatur. Ein Treffer ist ein Hinweis zum Lesen, kein Urteil.
 */
const WENDUNGEN = [
  ['über das Skript', /\b(?:nicht\w*|kein\w*)\b[^.!?\n]{0,60}\b(?:Skript\w*|Passage\w*|Ausschnitt\w*|Abschnitt\w*|Quelle\w*)\b|\b(?:Skript\w*|Passage\w*|Ausschnitt\w*)\b[^.!?\n]{0,60}\b(?:nicht\w*|kein\w*)\b/i],
  ['was fehlt', /\boffen\s*bleibt|\bbleibt\s+offen|\bfehlt\b|\bfehlen\b|\bnicht\s+beantwort\w*|\bweiterführend\w*|\bdarüber\s+hinaus/i],
  ['Verweis', /\b(?:Vorlesung|Sprechstunde|Literatur|Tutorium|Übungsgruppe|Lehrbuch)\b/i],
  ['Steuerwort sichtbar', /KEIN_BELEG|TEILANTWORT/],
  ['englisch über das Skript', /\b(?:not|no)\b[^.!?\n]{0,60}\b(?:script|passage\w*|excerpt\w*|lecture notes)\b|\b(?:script|passage\w*|excerpt\w*)\b[^.!?\n]{0,60}\b(?:not|no)\b/i],
];

export function wendungen(text) {
  return WENDUNGEN.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
}
