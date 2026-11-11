// Gleichzeitige Fehlversuche gegen Token-Endpunkt und Moderations-Anmeldung, lokal, ohne Netz nach aussen.
import http from 'node:http';
import { createApi } from '../../lib/api.js';
import { hashPassphrase } from '../../lib/auth.js';
import { createHandler } from '../../lib/mod.js';

const listen = handler => new Promise(resolve => { const s = http.createServer(handler).listen(0, '127.0.0.1', () => resolve(s)); });
const tally = list => list.reduce((t, s) => ({ ...t, [s]: (t[s] ?? 0) + 1 }), {});
const N = +process.argv[2] || 300;

// 1) Kurscode
const hash = await hashPassphrase('der-richtige-kurscode');
const store = { count() {}, question: () => null, moderator: name => (name === 'konrad' ? { name, rolle: 'admin', hash } : null) };
const api = await listen(createApi({ fragen: {}, pending: {}, store, hash }));
const tokenUrl = 'http://127.0.0.1:' + api.address().port + '/eidl/api/token';
const guess = i => fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-origin', 'X-Forwarded-For': '203.0.113.7' }, body: JSON.stringify({ kurscode: 'falsch-' + i }) }).then(r => r.status);
let t = Date.now();
const first = await Promise.all(Array.from({ length: N }, (_, i) => guess(i)));
console.log('Kurscode,', N, 'gleichzeitig von EINER Adresse (Grenze 10 je Adresse, 60 gesamt):', tally(first), (Date.now() - t) + ' ms');
console.log('  danach einzeln:', tally(await Promise.all([guess('a'), guess('b')])));

// 2) Anmeldung der Moderation
const mod = await listen(createHandler({ store, live: '/nonexistent', publish: async () => {} }));
const loginUrl = 'http://127.0.0.1:' + mod.address().port + '/eidl/mod/anmelden';
const login = i => fetch(loginUrl, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Sec-Fetch-Site': 'same-origin', 'X-Forwarded-For': '203.0.113.8' }, body: 'name=konrad&passphrase=falsch-' + i }).then(r => r.status);
t = Date.now();
const second = await Promise.all(Array.from({ length: N }, (_, i) => login(i)));
console.log('Anmeldung,', N, 'gleichzeitig von EINER Adresse (Grenze 5 je Adresse, 30 gesamt):', tally(second), (Date.now() - t) + ' ms');
console.log('  danach einzeln, auch mit richtiger Passphrase von anderer Adresse:', await fetch(loginUrl, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Sec-Fetch-Site': 'same-origin', 'X-Forwarded-For': '198.51.100.1' }, body: 'name=konrad&passphrase=der-richtige-kurscode' }).then(r => r.status));
process.exit(0);
