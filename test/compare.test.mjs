import test from 'node:test';
import assert from 'node:assert/strict';
import { blindOrder, blindView, reveal, summarize } from '../lib/compare.js';

const keys = ['opus', 'sonnet', 'haiku'];

test('die Reihenfolge ist je Frage fest und nicht überall gleich', () => {
  assert.deepEqual(blindOrder('s01', keys), blindOrder('s01', [...keys].reverse()));
  const orders = new Set(Array.from({ length: 30 }, (_, i) => blindOrder(`s${i}`, keys).join()));
  assert.ok(orders.size > 1);
});

test('der Browser erfährt das Modell nicht', () => {
  const rows = keys.map(key => ({ key, model: `claude-${key}`, status: 'ok', text: 'T', cited: [], input: 1, output: 2, attempt: 1 }));
  const json = JSON.stringify(blindView({ id: 's01', frage: 'F', kapitel: 'k' }, rows));
  for (const word of ['opus', 'sonnet', 'haiku', 'claude', 'attempt', 'input']) assert.doesNotMatch(json, new RegExp(word));
});

test('reveal passt zur gezeigten Reihenfolge', () => {
  const order = blindOrder('s01', keys);
  assert.equal(reveal('s01', keys, 'B'), order[1]);
});

test('die Auswertung zählt je Modell und überspringt schlechte Fragen', () => {
  const order = blindOrder('s01', keys);
  const { rated, table } = summarize({
    s01: { beste: 'A', urteil: { A: 'gut', B: 'falsch' } },
    s02: { frageSchlecht: true, beste: 'A' },
  }, { s01: keys, s02: keys });
  assert.equal(rated, 1);
  assert.equal(table[order[0]].beste, 1);
  assert.equal(table[order[0]].gut, 1);
  assert.equal(table[order[1]].falsch, 1);
});
