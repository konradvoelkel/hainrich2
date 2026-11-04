import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, parseAnswer, NO_EVIDENCE } from '../lib/answer.js';

const passages = [
  { id: 'a', title: 'Kapitel', path: ['Abschnitt'], text: 'Eins.' },
  { id: 'b', title: 'Kapitel', path: [], text: 'Zwei.' },
];
const cite = i => ({ type: 'content_block_location', document_index: i, start_block_index: 0, end_block_index: 1, cited_text: 'x' });

test('jede Passage wird ein eigenes zitierbares Dokument, die Frage kommt zuletzt', () => {
  const { messages } = buildRequest({ question: 'Warum?', passages, model: 'm' });
  const content = messages[0].content;
  assert.equal(content.length, 3);
  assert.equal(content[0].citations.enabled, true);
  assert.equal(content[0].title, 'Kapitel › Abschnitt');
  assert.equal(content[1].source.content[0].text, 'Zwei.');
  assert.equal(content[2].text, 'Frage: Warum?');
});

test('Marken folgen der ersten Nennung, doppelte Zitate zählen einmal', () => {
  const answer = parseAnswer({ stop_reason: 'end_turn', content: [
    { type: 'thinking', thinking: '' },
    { type: 'text', text: 'Erstens.', citations: [cite(1)] },
    { type: 'text', text: ' Zweitens.', citations: [cite(0), cite(1)] },
    { type: 'text', text: ' Schluss.' },
  ] }, passages);
  assert.equal(answer.status, 'ok');
  assert.equal(answer.text, 'Erstens. Zweitens. Schluss.'.replace('Erstens.', 'Erstens.[1]').replace('Zweitens.', 'Zweitens.[2][1]'));
  assert.deepEqual(answer.cited.map(p => p.id), ['b', 'a']);
});

test('das Schlüsselwort wird zum Status, auch mit Formatierung', () => {
  for (const text of [NO_EVIDENCE, `**${NO_EVIDENCE}**.`, `${NO_EVIDENCE}\n`]) {
    assert.equal(parseAnswer({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }, passages).status, 'kein_beleg');
  }
});

test('eine Antwort ohne Zitat zählt nicht als Antwort', () => {
  const answer = parseAnswer({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Aus dem Bauch.' }] }, passages);
  assert.equal(answer.status, 'ohne_zitat');
});

test('Verweigerung und Abbruch werden nicht als Text gelesen', () => {
  assert.equal(parseAnswer({ stop_reason: 'refusal', content: [] }, passages).status, 'verweigert');
  assert.equal(parseAnswer({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'Halb' }] }, passages).status, 'abgeschnitten');
});

test('ein Zitat auf ein unbekanntes Dokument fällt auf', () => {
  assert.throws(() => parseAnswer({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'x', citations: [cite(9)] }] }, passages));
});
