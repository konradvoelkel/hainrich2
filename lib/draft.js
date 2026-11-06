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
export const REQUESTS_PER_DAY = 20;
export const DOLLARS_PER_MONTH = 15;
const WORST_CASE = 0.6;
const ROUND = 4;
const GRUENDLICH_KAPITEL = 3;

const quoted = passage => ({ titel: passage.title, pfad: passage.path, text: passage.text, url: quoteUrl(passage) });

export async function draftFor({ id, text, gruendlich = false }, { corpus, call, ledger, day, model = DRAFT_MODEL }) {
  /** rechnet lokal und kostet nichts, also auch über dem Deckel; ohne Vektor findet die Suche die Frage nur über Stichworte */
  const vektor = (await corpus.embedder.query(text)).map(x => +x.toFixed(ROUND));
  const attempt = async passages => {
    const used = ledger.entries.filter(e => e.label === day).length;
    if (used >= REQUESTS_PER_DAY || ledger.total + WORST_CASE > ledger.limit) return { status: 'deckel' };
    const response = await call(buildRequest({ question: text, passages, model }));
    ledger.addResponse(day, response);
    return { ...parseAnswer(response, passages), modell: response.model };
  };
  /** wer noch einmal fragt, hatte die Passagen schon: Dieselben ergäben dieselbe Antwort */
  let answer = await attempt(gruendlich ? await corpus.chapters(text, GRUENDLICH_KAPITEL) : await corpus.select(text));
  if (!gruendlich && answer.status === 'kein_beleg') answer = await attempt(await corpus.chapters(text));
  if (answer.status !== 'ok') return { id, status: answer.status, modell: answer.modell, vektor };
  return { id, status: 'ok', modell: answer.modell, text: answer.text, teilantwort: !!answer.partial, zitate: answer.cited.map(quoted), kapitel: answer.cited[0].title, vektor };
}

/** arbeitet die Schlange ab, bis sie leer ist; was währenddessen dazukommt, nimmt er mit */
export async function runJobs({ spool, ...context }) {
  let done = 0;
  for (let jobs = spool.jobs(); jobs.length; jobs = spool.jobs()) {
    for (const { file, entry } of jobs) {
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
