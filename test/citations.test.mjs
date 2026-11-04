import test from 'node:test';
import assert from 'node:assert/strict';
import { moveCitation } from '../lib/citations.js';

const passage = (id, page, hash, text) => ({ id, page, hash, text });
const cited = passage('alt-1', 'alt', 'h1', 'Der Kosinus misst Richtungen, siehe [Kapitel](https://x.test/alt/).');

test('unverändert bleibt ein Zitat, wie es ist', () => {
  const same = passage('alt-1', 'alt', 'h1', cited.text);
  assert.deepEqual(moveCitation(cited, [same]), { passage: same, how: 'gleich' });
});

test('gleicher Text unter neuer Seite zieht mit', () => {
  const moved = passage('neu-1', 'neu', 'h1', cited.text);
  assert.deepEqual(moveCitation(cited, [moved]), { passage: moved, how: 'verschoben' });
});

test('nur das Ziel eines Links geändert: zieht mit', () => {
  const relinked = passage('alt-2', 'alt', 'h2', 'Der Kosinus misst Richtungen, siehe [Kapitel](https://x.test/neu/).');
  assert.equal(moveCitation(cited, [relinked]).how, 'neuer Link');
});

test('der Wortlaut steht in einer größeren Passage: zieht mit', () => {
  const larger = passage('alt-3', 'alt', 'h3', `Davor ein Satz. ${cited.text} Danach einer.`);
  assert.equal(moveCitation(cited, [larger]).how, 'neu geschnitten');
});

test('geänderter Wortlaut zieht nicht um, auch nicht bei gleichem Linktext', () => {
  const changed = passage('alt-4', 'alt', 'h4', 'Der Kosinus misst Winkel, siehe [Kapitel](https://x.test/alt/).');
  assert.equal(moveCitation(cited, [changed]), null);
});

test('der Text eines Links zählt zum Wortlaut', () => {
  const renamed = passage('alt-5', 'alt', 'h5', 'Der Kosinus misst Richtungen, siehe [Abschnitt](https://x.test/alt/).');
  assert.equal(moveCitation(cited, [renamed]), null);
});

test('bei gleichem Wortlaut gewinnt die eigene Seite', () => {
  const elsewhere = passage('fremd-1', 'fremd', 'h6', cited.text.replace('/alt/', '/a/'));
  const home = passage('alt-6', 'alt', 'h7', cited.text.replace('/alt/', '/b/'));
  assert.equal(moveCitation(cited, [elsewhere, home]).passage, home);
});
