/**
 * Blindvergleich: je Frage drei Antworten in fester, aber pro Frage gemischter Reihenfolge, damit Reload
 * und Fortsetzen dieselben Buchstaben zeigen. Das Modell bleibt bis zur Auswertung verborgen.
 */
import { createHash } from 'node:crypto';

export const LETTERS = ['A', 'B', 'C', 'D'];

export function blindOrder(seedId, keys) {
  const rank = key => createHash('sha256').update(`${seedId}:${key}`).digest('hex');
  return [...keys].sort((a, b) => (rank(a) < rank(b) ? -1 : 1));
}

/** was der Browser sieht: nie Modell, Tokens oder Anlauf */
export function blindView(seed, rows) {
  const byKey = new Map(rows.map(r => [r.key, r]));
  return {
    id: seed.id,
    frage: seed.frage,
    kapitel: seed.kapitel,
    antworten: blindOrder(seed.id, [...byKey.keys()]).map((key, i) => {
      const r = byKey.get(key);
      return { buchstabe: LETTERS[i], status: r.status, text: r.text, cited: r.cited, check: r.check ?? null };
    }),
  };
}

/** Buchstabe zu Modell, erst für die Auswertung */
export function reveal(seedId, keys, letter) {
  return blindOrder(seedId, keys)[LETTERS.indexOf(letter)];
}

export function summarize(ratings, keysBySeed) {
  const table = {};
  const row = key => (table[key] ??= { beste: 0, gut: 0, ungenau: 0, falsch: 0 });
  let rated = 0;
  for (const [seedId, rating] of Object.entries(ratings)) {
    const keys = keysBySeed[seedId];
    if (!keys || rating.frageSchlecht) continue;
    if (rating.beste || Object.keys(rating.urteil ?? {}).length) rated++;
    if (rating.beste) row(reveal(seedId, keys, rating.beste)).beste++;
    for (const [letter, verdict] of Object.entries(rating.urteil ?? {})) row(reveal(seedId, keys, letter))[verdict]++;
  }
  return { rated, table };
}
