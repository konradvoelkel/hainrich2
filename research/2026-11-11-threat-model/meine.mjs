// Was kostet eine Anfrage an api/meine den Web-Prozess? Und was sieht das Kostenbuch, wenn ein API-Aufruf scheitert?
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApi } from '../../lib/api.js';
import { hashPassphrase } from '../../lib/auth.js';
import { Ledger } from '../../lib/budget.js';
import { draftFor } from '../../lib/draft.js';
import { createFragen } from '../../lib/fragen.js';
import { openPending } from '../../lib/pending.js';
import { openStore } from '../../lib/store.js';

const store = openStore(':memory:');
const vec = () => Array.from({ length: 384 }, () => +Math.random().toFixed(4));
const zitat = { titel: 'Kapitel', pfad: ['A', 'B'], text: 'x'.repeat(900), url: 'https://example.org/' };
const qs = Array.from({ length: 40 }, (_, i) => ({ id: 's' + i, text: 'Wie hängt $\\nabla_\\theta L$ mit $\\frac{\\partial L}{\\partial w}$ zusammen, Nummer ' + i + '?', kapitel: 'Kapitel', herkunft: 'beispiel', tag: '2026-11-01', antworten: [{ art: 'bot', status: 'ungeprüft', modell: 'm', text: 'Antwort [1]', zitate: [zitat, zitat, zitat] }] }));
store.importQuestions(qs, qs.map(vec), { base: '/eidl/' });
const pending = openPending(':memory:');
const fragen = createFragen({ store, pending, publish: async () => {} });
const api = createApi({ fragen, pending, store, hash: await hashPassphrase('x'.repeat(12)) });
const server = await new Promise(r => { const s = http.createServer(api).listen(0, '127.0.0.1', () => r(s)); });
const url = 'http://127.0.0.1:' + server.address().port + '/eidl/api/meine';
const body = JSON.stringify({ fragen: Array.from({ length: 50 }, (_, i) => ({ id: 's' + (i % 40), geheimnis: 'egal' })) });
const call = () => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin' }, body }).then(r => r.text());
await call();
let t = Date.now(); const n = 100;
const sizes = await Promise.all(Array.from({ length: n }, call));
const ms = Date.now() - t;
console.log('api/meine ohne Token, 50 öffentliche Kennungen je Anfrage:', n, 'Anfragen in', ms, 'ms =', (ms / n).toFixed(1), 'ms Rechenzeit je Anfrage;', body.length, 'Byte rein,', sizes[0].length, 'Byte raus');

// Kostenbuch: ein Aufruf, der wie ein Timeout scheitert
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-'));
const ledger = new Ledger(path.join(dir, 'kosten.json'), 15);
const corpus = { embedder: { query: async () => [0.1, 0.2] }, select: async () => [{ title: 't', path: [], text: 'p' }], chapters: async () => [] };
let calls = 0;
const failing = async () => { calls += 1; const e = new Error('Request timed out.'); e.name = 'APIConnectionTimeoutError'; throw e; };
let result; try { result = await draftFor({ id: 'a1', text: 'Frage' }, { corpus, call: failing, ledger, day: '2026-11-11' }); } catch (e) { result = 'wirft: ' + e.name; }
console.log('Aufruf scheitert nach', calls, 'Versuch(en) im Stub (das SDK macht daraus bis zu 3 echte Anfragen): Ergebnis', JSON.stringify(result), '| Einträge im Kostenbuch:', ledger.entries.length, '| gezählt für den Tagesdeckel:', ledger.entries.filter(e => e.label === '2026-11-11').length);
process.exit(0);
