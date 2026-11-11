import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { costOf, Ledger } from '../lib/budget.js';

const file = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-')), 'l.json');

test('Kosten folgen den Preisen, Batch kostet die Hälfte', () => {
  const usage = { input_tokens: 10000, output_tokens: 2000 };
  assert.equal(costOf('claude-opus-5-5', usage).toFixed(3), '0.080');
  assert.equal(costOf('claude-opus-5-5', usage, { batch: true }).toFixed(3), '0.040');
});

test('ein unbekanntes Modell wirft, statt 0 $ zu buchen', () => {
  assert.throws(() => costOf('claude-unbekannt', {}));
});

test('der Deckel greift vor dem Aufruf', () => {
  const ledger = new Ledger(file(), 0.1);
  ledger.add('a', 'claude-opus-5-5', { input_tokens: 10000, output_tokens: 2000 });
  assert.doesNotThrow(() => ledger.assertRoom(0.01));
  assert.throws(() => ledger.assertRoom(0.05), /Budget/);
});

test('das Kostenbuch überlebt einen Neustart', () => {
  const f = file();
  new Ledger(f, 1).add('a', 'claude-haiku-5-5', { input_tokens: 1e6, output_tokens: 0 });
  assert.equal(new Ledger(f, 1).total.toFixed(2), '0.10');
});

test('eine Buchung vor dem Aufruf steht auf der Platte, bis eine Antwort sie durch die echten Zahlen ersetzt', () => {
  const f = file();
  const ledger = new Ledger(f, 15);
  const hold = ledger.reserve('2026-11-11', 'claude-opus-5-5', 0.6);
  assert.equal(new Ledger(f, 15).total, 0.6, 'stürbe der Prozess jetzt, bliebe sie stehen');
  assert.equal(new Ledger(f, 15).entries[0].offen, true);
  ledger.settle(hold, { model: 'claude-opus-5-5', usage: { input_tokens: 10000, output_tokens: 2000 } });
  const read = new Ledger(f, 15);
  assert.equal(read.total.toFixed(3), '0.080');
  assert.deepEqual(read.entries.map(e => [e.label, !!e.offen]), [['2026-11-11', false]]);
});

test('weist die API ab, verschwindet die Buchung wieder', () => {
  const f = file();
  const ledger = new Ledger(f, 15);
  ledger.add('2026-11-11', 'claude-opus-5-5', { input_tokens: 10000, output_tokens: 2000 });
  ledger.release(ledger.reserve('2026-11-11', 'claude-opus-5-5', 0.6));
  assert.equal(new Ledger(f, 15).entries.length, 1);
});
