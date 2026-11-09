import test from 'node:test';
import assert from 'node:assert/strict';
import { changedPassages, staleAnswers } from '../lib/skriptstand.js';

const passage = (id, page, text) => ({ id, page, text });

test('geänderte Passagen zählen je Kapitel einmal als weg und einmal als neu', () => {
  const before = [passage('a-1', 'a', 'Alt.'), passage('a-2', 'a', 'Bleibt.'), passage('b-1', 'b', 'Fällt weg.')];
  const after = [passage('a-3', 'a', 'Neu.'), passage('a-2', 'a', 'Bleibt.')];
  const { weg, neu, kapitel } = changedPassages(before, after);
  assert.deepEqual(weg.map(p => p.id), ['a-1', 'b-1']);
  assert.deepEqual(neu.map(p => p.id), ['a-3']);
  assert.deepEqual(kapitel, [{ page: 'a', weg: 1, neu: 1 }, { page: 'b', weg: 1, neu: 0 }]);
});

test('gleicher Stand: nichts geändert', () => {
  const same = [passage('a-1', 'a', 'Text.')];
  assert.deepEqual(changedPassages(same, same), { weg: [], neu: [], kapitel: [] });
});

test('veraltet ist nur ein Zitat, dessen Wortlaut nirgends mehr steht', () => {
  const passages = [passage('a-9', 'a', 'Davor. Der Kosinus misst Richtungen, siehe [Kapitel](https://x.test/neu/). Danach.')];
  const answers = [
    { id: 's01', zitate: [{ text: 'Der Kosinus misst Richtungen, siehe [Kapitel](https://x.test/alt/).' }] },
    { id: 's02', zitate: [{ text: 'Davor.' }, { text: 'Der Kosinus misst Winkel.' }] },
    { id: 's03', zitate: [] },
  ];
  assert.deepEqual(staleAnswers(answers, passages), [{ id: 's02', nummern: [2] }]);
});

test('der Folienlink am Kapitelanfang macht ein Zitat nicht veraltet', () => {
  const passages = [passage('a-1', 'a', 'Ein Satz.')];
  const answers = [{ id: 's01', zitate: [{ text: '[Folien VL 3, S. 2](https://x.test/vl3.pdf#page=2)\n\nEin Satz.' }] }];
  assert.deepEqual(staleAnswers(answers, passages), []);
});
