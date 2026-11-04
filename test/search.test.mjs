import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, buildBm25, fuse, withNeighbours } from '../lib/search.js';

test('tokenize behält Umlaute und Unterstriche und lässt Füllwörter weg', () => {
  assert.deepEqual(tokenize('Warum ist zero_grad für Überanpassung nötig?'), ['zero_grad', 'überanpassung', 'nötig']);
});

test('BM25 findet das seltene Wort', () => {
  const score = buildBm25(['Gradient Gradient Lernrate', 'Gradient Autoencoder', 'Gradient Faltung']);
  const s = score('Autoencoder');
  assert.ok(s[1] > 0);
  assert.equal(s[0], 0);
});

test('fuse bevorzugt, was beide Listen hoch einordnen', () => {
  const order = fuse([0.9, 0.8, 0.1], [0, 5, 4]);
  assert.equal(order[0], 1);
});

test('ohne lexikalischen Treffer zählt nur der Vektor', () => {
  const order = fuse([0.9, 0.1], [0, 0]);
  assert.equal(order[0], 0);
});

/** 40 Dokumente, Dokument i steht in der Vektorsuche auf Rang i + 1 */
const vectorRanks = Array.from({ length: 40 }, (_, i) => 40 - i);

test('ein guter Vektortreffer bleibt vor mittelmäßigen Treffern aus beiden Listen', () => {
  const lexical = vectorRanks.map((_, i) => (i >= 18 && i <= 29 ? 30 - i : 0));
  const order = fuse(vectorRanks, lexical);
  assert.ok(order.indexOf(3) < order.indexOf(29), 'Vektor Rang 4 vor Vektor Rang 30 mit Stichwort Rang 12');
});

test('ein exakter Bezeichner gewinnt, auch wenn der Vektor ihn nicht kennt', () => {
  const lexical = vectorRanks.map((_, i) => (i === 39 ? 7 : 0));
  assert.equal(fuse(vectorRanks, lexical)[0], 39);
});

const passages = n => Array.from({ length: n }, (_, i) => ({ page: i < 3 ? 'a' : 'b', text: 'x'.repeat(10) }));

test('Nachbarn kommen dazu, aber nicht über die Seitengrenze', () => {
  assert.deepEqual(withNeighbours([2], passages(5), { hits: 1 }), [1, 2]);
});

test('das Zeichenbudget hält', () => {
  const chosen = withNeighbours([0, 1, 2, 3, 4], passages(5), { hits: 5, maxChars: 25 });
  assert.equal(chosen.length, 2);
});
