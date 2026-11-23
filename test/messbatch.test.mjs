import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { costOf, Ledger } from '../lib/budget.js';
import { runBatch, wendungen, worstCase } from '../tools/messbatch.mjs';

/** Kein Test ruft die echte API (CLAUDE.md „Was beißt“ 6): eine Attrappe des Batch-Teils aus dem SDK */
function attrappe({ ledger, scheitert = null } = {}) {
  const calls = [];
  const usage = { input_tokens: 10_000, output_tokens: 1000 };
  const client = {
    messages: {
      batches: {
        async create({ requests }) {
          calls.push({ art: 'create', offen: ledger?.entries.filter(e => e.offen).length, anzahl: requests.length });
          if (scheitert) throw scheitert;
          client.ids = requests.map(r => r.custom_id);
          return { id: `batch-${calls.length}` };
        },
        async retrieve() {
          return { processing_status: 'ended', request_counts: {} };
        },
        async results() {
          return (async function* () {
            for (const id of client.ids) yield { custom_id: id, result: { type: 'succeeded', message: { model: 'claude-opus-5-5', usage, content: [] } } };
          })();
        },
      },
    },
  };
  return { client, calls, usage };
}

const job = id => ({ id, params: { model: 'claude-opus-5-5', max_tokens: 8000, system: 'Du antwortest.', messages: [{ role: 'user', content: 'x'.repeat(30_000) }] } });

function buch(t, limit = 5) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-messung-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return new Ledger(path.join(dir, 'ledger.json'), limit);
}

test('der schlimmste Fall steht im Buch, bevor der Batch hinausgeht; danach die echten Zahlen zum Batchpreis', async t => {
  const ledger = buch(t);
  const { client, calls, usage } = attrappe({ ledger });
  const state = {};
  const ergebnisse = await runBatch({ client, ledger, state, saveState: () => {}, name: 'stufe1', jobs: [job('a'), job('b')], log: () => {} });
  assert.deepEqual(calls, [{ art: 'create', offen: 1, anzahl: 2 }], 'beim Anlegen steht genau eine Buchung vorab im Buch');
  assert.equal(state.stufe1, 'batch-1');
  assert.equal(ledger.entries.filter(e => e.offen).length, 0, 'die Buchung vorab ist weg');
  assert.deepEqual(ledger.entries.map(e => [e.label, e.batch]), [['stufe1:a', true], ['stufe1:b', true]]);
  assert.equal(ledger.total, 2 * costOf('claude-opus-5-5', usage, { batch: true }));
  assert.deepEqual(ergebnisse.map(e => e.result.type), ['succeeded', 'succeeded']);
});

test('was nicht unter den Deckel passt, geht nicht hinaus, auch nicht zweimal gleichzeitig', async t => {
  const knapp = buch(t, 0.01);
  const a = attrappe({ ledger: knapp });
  await assert.rejects(runBatch({ client: a.client, ledger: knapp, state: {}, saveState: () => {}, name: 'zu-teuer', jobs: [job('a')], log: () => {} }), /Budget/);
  assert.equal(a.calls.length, 0);
  assert.equal(knapp.entries.length, 0);

  /** Platz für genau einen: Der zweite sieht die Buchung des ersten, weil zwischen Prüfen und Buchen kein `await` steht */
  const einer = buch(t, worstCase(job('a').params) * 1.5);
  const b = attrappe({ ledger: einer });
  const laeufe = await Promise.allSettled(['x', 'y'].map(name => runBatch({ client: b.client, ledger: einer, state: {}, saveState: () => {}, name, jobs: [job('a')], log: () => {} })));
  assert.deepEqual(laeufe.map(l => l.status).sort(), ['fulfilled', 'rejected']);
  assert.equal(b.calls.length, 1);
});

test('ein Neustart setzt denselben Batch fort und bucht nicht doppelt', async t => {
  const ledger = buch(t);
  const hold = ledger.reserve('stufe1:vorab', 'claude-opus-5-5', 1.2);
  const { client, calls } = attrappe({ ledger });
  client.ids = ['a'];
  await runBatch({ client, ledger, state: { stufe1: 'batch-alt' }, saveState: () => {}, name: 'stufe1', jobs: [job('a')], log: () => {} });
  assert.equal(calls.length, 0, 'kein zweiter Batch');
  assert.ok(!ledger.entries.includes(hold));
  assert.deepEqual(ledger.entries.map(e => e.label), ['stufe1:a']);
});

test('eine Absage der API nimmt die Buchung zurück, ein Abbruch ohne Antwort nicht', async t => {
  const ledger = buch(t);
  const abgelehnt = attrappe({ ledger, scheitert: Object.assign(new Error('abgelehnt'), { status: 400 }) });
  await assert.rejects(runBatch({ client: abgelehnt.client, ledger, state: {}, saveState: () => {}, name: 'n1', jobs: [job('a')], log: () => {} }));
  assert.equal(ledger.entries.length, 0);
  const weg = attrappe({ ledger, scheitert: new Error('Verbindung weg') });
  await assert.rejects(runBatch({ client: weg.client, ledger, state: {}, saveState: () => {}, name: 'n2', jobs: [job('a')], log: () => {} }));
  assert.deepEqual(ledger.entries.map(e => [e.label, e.offen]), [['n2:vorab', true]], 'vielleicht läuft er doch: Das Buch zeigt lieber zu viel');
});

test('die Suche nach verbotenen Wendungen schlägt an, wo Prompt-Version 2 es verbietet, und nicht an gewöhnlichen Sätzen', () => {
  assert.deepEqual(wendungen('Dazu steht in den Passagen nichts.'), ['über das Skript']);
  assert.deepEqual(wendungen('Das Skript behandelt JAX nicht.'), ['über das Skript']);
  assert.deepEqual(wendungen('Was offen bleibt: die Wahl der Lernrate.'), ['was fehlt']);
  assert.deepEqual(wendungen('Mehr dazu in der Vorlesung.'), ['Verweis']);
  assert.deepEqual(wendungen('Rest\nTEILANTWORT'), ['Steuerwort sichtbar']);
  assert.deepEqual(wendungen('The script does not cover this.'), ['englisch über das Skript']);
  assert.deepEqual(wendungen('Die Lernrate ist ein Hyperparameter, kein Parameter: Sie wird nicht gelernt.[1]'), []);
});
