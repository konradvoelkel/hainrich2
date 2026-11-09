/**
 * Hat sich das Skript seit dem Korpus geändert, und welche Antworten trifft das (Plan §15, Phase 4)? Ohne Netz und ohne API: Den
 * Abruf macht tools/skriptstand.mjs. Die Zitate in public.db prüft die Moderation gegen den ausgespielten Korpus.
 */
import { quotedIn } from './citations.js';

export const SKRIPT_SITE = 'https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de';

/** Passagen, die es so nur im alten oder nur im neuen Stand gibt, und wie viele je Kapitel. Die ID hängt am Wortlaut */
export function changedPassages(before, after) {
  const now = new Set(after.map(p => p.id));
  const then = new Set(before.map(p => p.id));
  const weg = before.filter(p => !now.has(p.id));
  const neu = after.filter(p => !then.has(p.id));
  const kapitel = new Map();
  const zaehle = (p, art) => {
    if (!kapitel.has(p.page)) kapitel.set(p.page, { page: p.page, weg: 0, neu: 0 });
    kapitel.get(p.page)[art] += 1;
  };
  weg.forEach(p => zaehle(p, 'weg'));
  neu.forEach(p => zaehle(p, 'neu'));
  return { weg, neu, kapitel: [...kapitel.values()] };
}

/** Antworten mit einem Zitat, dessen Wortlaut keine Passage mehr hat: die Kennung und die Nummern der Zitate, ab 1 */
export function staleAnswers(answers, passages) {
  const quoted = quotedIn(passages);
  return answers
    .map(({ id, zitate }) => ({ id, nummern: zitate.flatMap((z, i) => (quoted(z) ? [] : [i + 1])) }))
    .filter(a => a.nummern.length);
}
