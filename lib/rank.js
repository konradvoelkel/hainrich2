/**
 * Rangfolge ähnlicher Fragen: Kosinus plus Profil über die Skriptpassagen (Plan §6.3). Das Profil einer
 * Frage sind ihre k ähnlichsten Passagen, die Mischung z-normiert mit doppeltem Gewicht fürs Profil.
 * Liefert Kandidaten, entscheidet nichts. Reine Funktionen, Browser und Node nutzen denselben Code.
 */
import { dot } from './search.js';

const mean = values => values.reduce((a, c) => a + c, 0) / values.length;

function zscore(values) {
  const m = mean(values);
  const sd = Math.sqrt(mean(values.map(v => (v - m) ** 2)));
  return values.map(v => (sd ? (v - m) / sd : 0));
}

/** Passagenvektoren minus Mittelwert je Dimension */
export function centerPassages(vectors) {
  const center = vectors[0].map((_, d) => mean(vectors.map(v => v[d])));
  return vectors.map(v => v.map((x, d) => x - center[d]));
}

export function profile(centered, vector, k = 20) {
  const scores = centered.map(p => dot(p, vector));
  const m = mean(scores);
  const shifted = scores.map(s => s - m);
  const top = new Set(shifted.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, k).map(([, i]) => i));
  const sparse = shifted.map((s, i) => (top.has(i) ? s : 0));
  const norm = Math.sqrt(dot(sparse, sparse));
  return sparse.map(s => (norm ? s / norm : 0));
}

/** Indizes der Fragen, beste zuerst */
export function rankQuestions(query, questionVectors, questionProfiles, centered, { weight = 2 } = {}) {
  const own = profile(centered, query);
  const direct = zscore(questionVectors.map(v => dot(v, query)));
  const viaCorpus = zscore(questionProfiles.map(p => dot(p, own)));
  return direct.map((d, i) => [d + weight * viaCorpus[i], i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
}
