import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { moveCitation, relinker } from '../lib/citations.js';
import { quoteUrl } from '../lib/segment.js';
import { openStore } from '../lib/store.js';

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

test('fällt nur der Folienlink am Kapitelanfang weg: zieht mit', () => {
  const slides = passage('alt-1', 'alt', 'h1', `[Folien VL 12, S. 2–8](https://x.test/vl12.pdf#page=2)\n\n${cited.text}`);
  const shorter = passage('alt-4', 'alt', 'h4', cited.text);
  assert.equal(moveCitation(slides, [shorter]).how, 'neuer Link');
});

test('ein Zitat aus nichts als dem Folienlink zieht nicht um', () => {
  const slides = passage('alt-1', 'alt', 'h1', '[Folien VL 12, S. 2–8](https://x.test/vl12.pdf#page=2)');
  assert.equal(moveCitation(slides, [passage('alt-4', 'alt', 'h4', cited.text)]), null);
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

const stelle = (title, trail, link, text) => ({ id: link, page: 'x', hash: 'h', title, path: trail, link, text });
const WORTLAUT = 'Der Kosinus misst nur die Richtung zweier Vektoren, ihre Länge spielt keine Rolle.';
const altesZitat = { titel: 'Lineare Algebra', pfad: ['Kosinus'], text: WORTLAUT, url: 'https://skript.test/lineare-algebra/#kosinus:~:text=Der%20Kosinus' };

test('D36: Steht der Wortlaut unter neuer Überschrift, zieht das Zitat dorthin um, und der Wortlaut bleibt', () => {
  const neu = stelle('Hintergrundwissen Lineare Algebra', ['Winkel und Kosinus'], 'https://skript.test/lineare-algebra/#winkel-und-kosinus', WORTLAUT);
  const move = relinker([stelle('Anderes', [], 'https://skript.test/anderes/', 'Etwas ganz anderes steht hier.'), neu], quoteUrl);
  assert.deepEqual(move(altesZitat), { titel: 'Hintergrundwissen Lineare Algebra', pfad: ['Winkel und Kosinus'], text: WORTLAUT, url: quoteUrl(neu) });
  assert.match(move(altesZitat).url, /#winkel-und-kosinus:~:text=Der%20Kosinus/);
});

test('D36: Ist das Zitat Teil einer größeren Passage geworden, bleibt sein Text, nur die Adresse zeigt auf die neue Stelle', () => {
  const groesser = stelle('Lineare Algebra', ['Kosinus'], 'https://skript.test/lineare-algebra/#kosinus-neu', `Ein Satz davor. ${WORTLAUT} Und einer danach.`);
  const neu = relinker([groesser], quoteUrl)(altesZitat);
  assert.equal(neu.text, WORTLAUT);
  assert.match(neu.url, /^https:\/\/skript\.test\/lineare-algebra\/#kosinus-neu:~:text=Der%20Kosinus%20misst/);
});

test('D36: Nur das Ziel eines Links im Zitat ist neu: Der Text kommt aus dem Korpus; gibt es den Wortlaut zweimal, gewinnt dieselbe Seite', () => {
  const mitLink = { ...altesZitat, text: 'Siehe [Kapitel](https://skript.test/alt/) zum Kosinus zweier Vektoren im Raum.' };
  const fremd = stelle('Fremd', [], 'https://skript.test/fremd/#a', 'Siehe [Kapitel](https://skript.test/fremd-ziel/) zum Kosinus zweier Vektoren im Raum.');
  const hier = stelle('Lineare Algebra', ['Kosinus'], 'https://skript.test/lineare-algebra/#kosinus', 'Siehe [Kapitel](https://skript.test/neu/) zum Kosinus zweier Vektoren im Raum.');
  assert.equal(relinker([fremd, hier], quoteUrl)(mitLink).text, hier.text);
});

test('D36: Steht der Wortlaut nirgends mehr, bleibt das Zitat, wie es ist, und gilt weiter als veraltet', () => {
  assert.equal(relinker([stelle('Lineare Algebra', ['Kosinus'], 'https://skript.test/lineare-algebra/#kosinus', 'Der Kosinus misst jetzt etwas anderes.')], quoteUrl)(altesZitat), null);
});

test('D36: Die Datenbank schreibt nur, was sich ändert, vermerkt alte und neue Adresse und ändert beim zweiten Lauf nichts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-'));
  const store = openStore(path.join(dir, 'public.db'));
  const frage = (id, zitate) => ({ id, text: `Frage ${id}?`, kapitel: 'Tensoren', herkunft: 'beispiel', tag: '2026-11-04', antworten: [{ art: 'bot', status: 'geprüft', modell: 'm', text: 'Antwort.[1]', zitate }] });
  const weg = { titel: 'Weg', pfad: [], text: 'Diesen Satz gibt es im Skript nicht mehr.', url: 'https://skript.test/weg/#a' };
  const neu = stelle('Hintergrundwissen Lineare Algebra', ['Winkel und Kosinus'], 'https://skript.test/lineare-algebra/#winkel-und-kosinus', WORTLAUT);
  store.importQuestions([frage('s01', [altesZitat, weg]), frage('s02', [{ titel: neu.title, pfad: neu.path, text: neu.text, url: quoteUrl(neu) }])], [[1, 0], [0, 1]], { base: '/eidl/' });
  const move = relinker([neu], quoteUrl);

  assert.deepEqual(store.relinkCitations(move), ['s01']);
  const [umgezogen, geblieben] = store.question('s01').antworten[0].zitate;
  assert.deepEqual(umgezogen, { titel: 'Hintergrundwissen Lineare Algebra', pfad: ['Winkel und Kosinus'], text: WORTLAUT, url: quoteUrl(neu) });
  assert.deepEqual(geblieben, weg);
  assert.equal(store.question('s01').antworten[0].status, 'geprüft', 'der Wortlaut ist derselbe, die Prüfung gilt weiter');
  assert.deepEqual(store.revisions('s01').map(r => [r.feld, r.vorher, r.nachher, r.rolle]), [['zitat', altesZitat.url, quoteUrl(neu), 'korpus']]);
  assert.deepEqual(store.revisions('s02'), []);
  assert.deepEqual(store.relinkCitations(move), []);
  store.close();
  fs.rmSync(dir, { recursive: true });
});
