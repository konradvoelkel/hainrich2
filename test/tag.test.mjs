import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openStore } from '../lib/store.js';
import { berlinerTag } from '../lib/tag.js';

/** Konrad, 2026-11-23: Fragetag und Prüftag sind Berliner Tage, nicht UTC-Tage */
test('der Berliner Tag beginnt im Winter um 23 Uhr UTC, im Sommer um 22 Uhr', () => {
  assert.equal(berlinerTag(Date.parse('2026-11-22T22:59:59Z')), '2026-11-22');
  assert.equal(berlinerTag(Date.parse('2026-11-22T23:00:00Z')), '2026-11-23');
  assert.equal(berlinerTag(Date.parse('2026-07-01T21:59:59Z')), '2026-07-01');
  assert.equal(berlinerTag(Date.parse('2026-07-01T22:00:00Z')), '2026-07-02');
  assert.equal(berlinerTag(Date.parse('2026-12-31T23:30:00Z')), '2027-01-01', 'auch über den Jahreswechsel');
});

test('eine Antwort, die um 0:30 Uhr Berliner Zeit geprüft wird, trägt diesen Tag', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-tag-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = openStore(path.join(dir, 'public.db'), { now: () => '2026-11-22T23:30:00.000Z' });
  store.importQuestions([{ id: 's01', text: 'Was ist ein Neuron?', kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [{ art: 'bot', status: 'ungeprüft', modell: 'test', text: 'Ein Neuron rechnet.[1]', zitate: [{ titel: 'T', pfad: ['A'], text: 'Z.', url: 'https://skript.test/a/' }] }] }], [null], {});
  const answer = store.question('s01').antworten[0];
  store.setAnswerStatus(answer.id, 'geprüft', 'admin');
  assert.equal(store.question('s01').antworten[0].geprueftAm, '2026-11-23');
});
