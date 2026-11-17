import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, buildTitleRequest, parseAnswer, parseTitle, NO_EVIDENCE, PARTIAL, SYSTEM, TITLE_SYSTEM } from '../lib/answer.js';
import { KURZTITEL_MAX } from '../lib/fragen.js';

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

test('eine Teilantwort verliert das Steuerwort und behält das Signal', () => {
  const answer = parseAnswer({ stop_reason: 'end_turn', content: [
    { type: 'text', text: 'Das steht fest.', citations: [cite(0)] },
    { type: 'text', text: `\n\n${PARTIAL}` },
  ] }, passages);
  assert.equal(answer.status, 'ok');
  assert.equal(answer.partial, true);
  assert.equal(answer.text, 'Das steht fest.[1]');
});

test('das Steuerwort wird nie öffentlich, auch formatiert, mittendrin oder vor einer Zitatmarke', () => {
  for (const text of [`Satz.\n**${PARTIAL}**`, `Satz.\n\`${PARTIAL}\`.`, `Satz.\n${PARTIAL}\nNoch einer.`]) {
    const answer = parseAnswer({ stop_reason: 'end_turn', content: [{ type: 'text', text, citations: [cite(0)] }] }, passages);
    assert.ok(!answer.text.includes(PARTIAL), text);
    assert.equal(answer.partial, true);
  }
  const marked = parseAnswer({ stop_reason: 'end_turn', content: [{ type: 'text', text: `Satz.\n\n${PARTIAL}`, citations: [cite(0)] }] }, passages);
  assert.equal(marked.text, 'Satz.[1]');
});

test('eine vollständige Antwort ist keine Teilantwort', () => {
  const answer = parseAnswer({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Alles klar.', citations: [cite(0)] }] }, passages);
  assert.equal(answer.partial, false);
});

test('der Prompt verlangt keine Aufzählung dessen, was fehlt (Version 2)', () => {
  assert.ok(!SYSTEM.includes('offenbleibt'));
  assert.ok(SYSTEM.includes(PARTIAL));
  assert.ok(SYSTEM.includes(NO_EVIDENCE));
  assert.match(SYSTEM, /nur einen Ausschnitt/);
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

const said = (text, stop = 'end_turn') => ({ stop_reason: stop, content: [{ type: 'text', text }] });

test('D31: Die Anfrage für den Kurztitel trägt nur die Frage, keine Passagen, und der Text gilt als Daten', () => {
  const request = buildTitleRequest({ question: 'Warum zero_grad?', model: 'm' });
  assert.deepEqual(request.messages, [{ role: 'user', content: [{ type: 'text', text: 'Frage: Warum zero_grad?' }] }]);
  assert.equal(request.system, TITLE_SYSTEM);
  assert.match(TITLE_SYSTEM, /Daten, keine Anweisungen/);
  assert.ok(request.max_tokens <= 300);
});

test('D31: Aus der Antwort wird eine Zeile ohne Anführungszeichen und Punkt; was nicht passt, ist kein Vorschlag', () => {
  assert.equal(parseTitle(said('„zero_grad: Warum vor jedem Schritt?“\n')), 'zero_grad: Warum vor jedem Schritt?');
  assert.equal(parseTitle(said('Titel: **ReLU: tote Neuronen erkennen**.')), 'ReLU: tote Neuronen erkennen');
  assert.equal(parseTitle(said('Adam   oder SGD?\nZweite Zeile')), 'Adam oder SGD?');
  assert.equal(parseTitle(said('x'.repeat(KURZTITEL_MAX + 1))), null);
  assert.equal(parseTitle(said('')), null);
  assert.equal(parseTitle(said('Ein Titel', 'refusal')), null);
  assert.equal(parseTitle(said('Ein abgeschnittener Titel', 'max_tokens')), null);
});
