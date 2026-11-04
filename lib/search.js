/**
 * Hybride Suche über Passagen: BM25 und Embeddings, zusammengeführt per Reciprocal Rank Fusion.
 * Reine Funktionen; die Vektoren kommen von außen, damit Browser und Node denselben Code nutzen können.
 */
const STOP = new Set('der die das den dem des ein eine einen einem einer eines und oder aber wie was wer wo wann warum wieso weshalb wozu ist sind war waren sein wird werden wurde wurden hat haben man ich du sie wir er es mir mich mit von zu zum zur im in an am auf aus bei für nach über um durch als auch nicht noch nur so dass denn wenn dann da doch mal kann können muss müssen soll sollte the a an of to is are and or how why what'.split(' '));

export function tokenize(text) {
  return (text.toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []).filter(t => t.length > 1 && !STOP.has(t));
}

export function buildBm25(docs, { k1 = 1.2, b = 0.75 } = {}) {
  const terms = docs.map(tokenize);
  const lengths = terms.map(t => t.length);
  const average = lengths.reduce((a, c) => a + c, 0) / Math.max(1, docs.length);
  const counts = terms.map(t => t.reduce((m, w) => m.set(w, (m.get(w) ?? 0) + 1), new Map()));
  const documentFrequency = new Map();
  for (const c of counts) for (const w of c.keys()) documentFrequency.set(w, (documentFrequency.get(w) ?? 0) + 1);
  return query => {
    const words = [...new Set(tokenize(query))];
    return counts.map((c, i) => words.reduce((sum, w) => {
      const f = c.get(w);
      if (!f) return sum;
      const n = documentFrequency.get(w);
      const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
      return sum + idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * lengths[i] / average));
    }, 0));
  };
}

export function dot(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

const ranks = scores => {
  const order = scores.map((s, i) => [s, i]).sort((x, y) => y[0] - x[0]);
  const rank = new Array(scores.length);
  order.forEach(([, i], r) => { rank[i] = r; });
  return rank;
};

/** Indizes der besten Dokumente; ein Dokument ohne BM25-Treffer bekommt von dort nichts */
export function fuse(vectorScores, lexicalScores, { k = 60 } = {}) {
  const v = ranks(vectorScores);
  const l = ranks(lexicalScores);
  return vectorScores
    .map((_, i) => [1 / (k + v[i]) + (lexicalScores[i] > 0 ? 1 / (k + l[i]) : 0), i])
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i);
}

/**
 * Wählt Treffer samt Nachbarpassagen bis zum Zeichenbudget. Die Reihenfolge folgt dem Skript, damit
 * zusammengehörige Passagen hintereinander stehen.
 */
export function withNeighbours(order, passages, { hits = 12, maxChars = 24000 } = {}) {
  const chosen = new Set();
  let size = 0;
  const take = i => {
    if (i < 0 || i >= passages.length || chosen.has(i)) return true;
    if (size + passages[i].text.length > maxChars) return false;
    chosen.add(i);
    size += passages[i].text.length;
    return true;
  };
  for (const i of order.slice(0, hits)) if (!take(i)) break;
  for (const i of order.slice(0, hits)) {
    for (const n of [i - 1, i + 1]) {
      if (passages[n]?.page === passages[i].page && !take(n)) return [...chosen].sort((a, b) => a - b);
    }
  }
  return [...chosen].sort((a, b) => a - b);
}
