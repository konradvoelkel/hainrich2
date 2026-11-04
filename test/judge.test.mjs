import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicate, listRequest } from '../lib/judge.js';

const reply = value => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });
const stub = (...answers) => {
  const calls = [];
  return { calls, call: async request => { calls.push(request); return reply(answers.shift()); } };
};

test('ein bestätigter Treffer ist das Duplikat', async () => {
  const s = stub({ nummer: 2 }, { duplikat: true });
  assert.equal(await findDuplicate('neu', ['a', 'b'], s.call), 'b');
  assert.equal(s.calls.length, 2);
});

test('lehnt die Bestätigung ab, gibt es kein Duplikat', async () => {
  assert.equal(await findDuplicate('neu', ['a'], stub({ nummer: 1 }, { duplikat: false }).call), null);
});

test('0 und eine Nummer außerhalb der Liste heißen: keines, ohne zweiten Aufruf', async () => {
  for (const nummer of [0, 7]) {
    const s = stub({ nummer });
    assert.equal(await findDuplicate('neu', ['a'], s.call), null);
    assert.equal(s.calls.length, 1);
  }
});

test('ohne Kandidaten gibt es keinen Aufruf', async () => {
  const s = stub();
  assert.equal(await findDuplicate('neu', [], s.call), null);
  assert.equal(s.calls.length, 0);
});

test('die Kandidaten stehen nummeriert in der Anfrage', () => {
  assert.match(listRequest('neu', ['a', 'b']).messages[0].content, /1\. a\n2\. b/);
});
