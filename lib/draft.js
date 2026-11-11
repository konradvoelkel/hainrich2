/**
 * Was der Worker je Auftrag tut (Plan §7.2): Passagen suchen, Claude fragen, beim zweiten Anlauf ganze Kapitel. Keine Datenbank: Er kennt nur
 * die Schlange (I1). Jeder Auftrag endet mit einem Ergebnis, sonst startet die `.path`-Unit ihn immer wieder. Den Text einer Frage
 * schreibt er nie ins Log.
 */
import { buildRequest, parseAnswer } from './answer.js';
import { quoteUrl } from './segment.js';

/** Vorgabe, bis der Blindvergleich das Antwortmodell entscheidet (Plan §17 Punkt 3) */
export const DRAFT_MODEL = 'claude-opus-5-5';
/** Plan §7.4; Anfragen, nicht Fragen: Ein zweiter Anlauf zählt doppelt */
export const REQUESTS_PER_DAY = 50;
export const DOLLARS_PER_MONTH = 15;
const WORST_CASE = 0.6;
const ROUND = 4;
const GRUENDLICH_KAPITEL = 3;

/** Pausen vor dem zweiten und dritten Versuch, wenn die API abweist. Das SDK wiederholt hier nichts (`maxRetries: 0` im Worker) */
const PAUSES_MS = [2000, 8000];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
/** Ein Fehler mit Status ist eine Absage der API: Zustande kam nichts, also auch kein `usage` */
const rejected = error => Number.isInteger(error?.status);
const worthAnotherTry = error => [408, 409, 429].includes(error.status) || error.status >= 500;

const quoted = passage => ({ titel: passage.title, pfad: passage.path, text: passage.text, url: quoteUrl(passage) });

export async function draftFor({ id, text, gruendlich = false }, { corpus, call, ledger, day, model = DRAFT_MODEL, wait = sleep }) {
  /** rechnet lokal und kostet nichts, also auch über dem Deckel; ohne Vektor findet die Suche die Frage nur über Stichworte */
  const vektor = (await corpus.embedder.query(text)).map(x => +x.toFixed(ROUND));
  /**
   * Jede einzelne Anfrage steht im Buch, bevor sie hinausgeht. Weist die API sie ab, verschwindet die Buchung, und bei Überlast gibt es
   * bis zu zwei weitere Versuche. Bricht die Verbindung ab oder läuft die Zeit ab, kann die Anfrage trotzdem gerechnet haben: Die
   * Buchung bleibt, und einen weiteren Versuch gibt es nicht.
   */
  const attempt = async passages => {
    for (let tries = 0; ; tries += 1) {
      const used = ledger.entries.filter(e => e.label === day).length;
      if (used >= REQUESTS_PER_DAY || ledger.total + WORST_CASE > ledger.limit) return { status: 'deckel' };
      const hold = ledger.reserve(day, model, WORST_CASE);
      let response;
      try {
        response = await call(buildRequest({ question: text, passages, model }));
      } catch (error) {
        if (!rejected(error)) throw error;
        ledger.release(hold);
        if (tries >= PAUSES_MS.length || !worthAnotherTry(error)) throw error;
        await wait(PAUSES_MS[tries]);
        continue;
      }
      ledger.settle(hold, response);
      return { ...parseAnswer(response, passages), modell: response.model };
    }
  };
  /** wer noch einmal fragt, hatte die Passagen schon: Dieselben ergäben dieselbe Antwort */
  let answer = await attempt(gruendlich ? await corpus.chapters(text, GRUENDLICH_KAPITEL) : await corpus.select(text));
  if (!gruendlich && answer.status === 'kein_beleg') answer = await attempt(await corpus.chapters(text));
  if (answer.status !== 'ok') return { id, status: answer.status, modell: answer.modell, vektor };
  return { id, status: 'ok', modell: answer.modell, text: answer.text, teilantwort: !!answer.partial, zitate: answer.cited.map(quoted), kapitel: answer.cited[0].title, vektor };
}

/**
 * Arbeitet die Schlange ab, bis sie leer ist; was währenddessen dazukommt, nimmt er mit. Nach `until` fängt er keinen Auftrag mehr an:
 * Die Unit bricht einen Lauf nach fester Zeit ab, und was liegen bleibt, startet die `.path`-Unit sofort wieder.
 */
export async function runJobs({ spool, until = Infinity, now = Date.now, ...context }) {
  let done = 0;
  for (let jobs = spool.jobs(); jobs.length; jobs = spool.jobs()) {
    for (const { file, entry } of jobs) {
      if (now() >= until) return done;
      let result;
      try {
        result = await draftFor(entry, context);
      } catch (error) {
        /** nur Art und Status: Die Fehlermeldung einer Anfrage kann Teile davon enthalten */
        console.error('Entwurf gescheitert:', error.name, error.status ?? '');
        result = { id: entry.id, status: 'fehler' };
      }
      spool.finish(file, result);
      console.log(result.status);
      done += 1;
    }
  }
  return done;
}
