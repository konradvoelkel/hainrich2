import test from 'node:test';
import assert from 'node:assert/strict';
import { centerPassages, profile, rankQuestions } from '../lib/rank.js';

const passages = [[1, 0, 0], [0.9, 0.1, 0], [0, 1, 0], [0, 0.9, 0.1], [0, 0, 1]];

test('Mittelwert je Dimension ist nach dem Zentrieren null', () => {
  const centered = centerPassages(passages);
  for (let d = 0; d < 3; d++) assert.ok(Math.abs(centered.reduce((a, v) => a + v[d], 0)) < 1e-12);
});

test('das Profil behält k Passagen und hat Länge eins', () => {
  const p = profile(centerPassages(passages), [1, 0, 0], 2);
  assert.equal(p.filter(x => x !== 0).length, 2);
  assert.ok(Math.abs(p.reduce((a, x) => a + x * x, 0) - 1) < 1e-12);
  assert.ok(p[0] > 0 && p[1] > 0);
});

test('die Frage zum selben Thema steht vorn', () => {
  const centered = centerPassages(passages);
  const questions = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
  const profiles = questions.map(v => profile(centered, v, 2));
  assert.equal(rankQuestions([0.95, 0.05, 0], questions, profiles, centered)[0], 1);
});

test('eine einzige Frage bricht nichts', () => {
  const centered = centerPassages(passages);
  assert.deepEqual(rankQuestions([1, 0, 0], [[1, 0, 0]], [profile(centered, [1, 0, 0], 2)], centered), [0]);
});
