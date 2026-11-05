/**
 * Startet für `npm run smoke:mod` den Verbund wie auf dem Server: Web-Prozess, Worker und statische Site mit Aufteilung, gegen
 * eine Wegwerf-Datenbank. Die Fragen stammen aus dem gebauten Baum, die Antworten sind Attrappen, und auch Claude ist eine:
 * Kein Test ruft die echte API. Erst `node site/build.mjs`.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createApi } from '../lib/api.js';
import { hashPassphrase } from '../lib/auth.js';
import { runJobs } from '../lib/draft.js';
import { createFragen } from '../lib/fragen.js';
import { createHandler } from '../lib/mod.js';
import { openPending } from '../lib/pending.js';
import { createPublisher, publishAll } from '../lib/publish.js';
import { openSpool } from '../lib/spool.js';
import { createVoting } from '../lib/stimmen.js';
import { openStore } from '../lib/store.js';
import { KURSCODE, MOD_PORT, PASSPHRASE, PORT } from './konstanten.mjs';

const built = process.env.HAINRICH2_SITE ?? '/media/konrad/xtraspace/hainrich2/site';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hainrich2-mod-'));
const live = path.join(dir, 'live');
process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
process.on('SIGTERM', () => process.exit(0));

const fragen = JSON.parse(fs.readFileSync(path.join(built, 'eidl/daten/fragen.json'), 'utf8')).slice(0, 4);
const store = openStore(path.join(dir, 'public.db'));
store.importQuestions(
  fragen.map(f => ({
    id: f.id,
    text: f.text,
    kapitel: f.kapitel,
    herkunft: 'beispiel',
    tag: '2026-11-04',
    antworten: [{ art: 'bot', status: 'ungeprüft', modell: 'attrappe', text: 'Eine Antwort mit Formel $a^2$.[1]', zitate: [{ titel: 'Titel', pfad: ['Abschnitt'], text: 'Wörtliches Zitat.', url: 'https://skript.test/a/' }] }],
  })),
  fragen.map(f => f.vektor),
  { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 24 MB', fragen: true, entwurf: true, stimmen: true },
);
store.saveModerator('test', 'admin', await hashPassphrase(PASSPHRASE));
await publishAll(live, store);

const publish = createPublisher(live, store);
const pending = openPending(path.join(dir, 'pending.db'));
const spool = openSpool(path.join(dir, 'schlange'));
const frageweg = createFragen({ store, pending, spool, publish });
const passage = { id: 'p', title: 'Tensoren', path: ['Abschnitt'], text: 'Ein wörtliches Zitat aus dem Skript.', page: 'tensoren', link: 'https://skript.test/tensoren#abschnitt' };
const corpus = { embedder: { query: async () => fragen[0].vektor }, select: async () => [passage], chapters: async () => [passage] };
const call = async request => ({
  model: 'attrappe',
  stop_reason: 'end_turn',
  usage: {},
  content: [/Keras/.test(request.messages[0].content.at(-1).text) ? { type: 'text', text: 'KEIN_BELEG' } : { type: 'text', text: 'Ein Entwurf mit Formel $c^2$.', citations: [{ document_index: 0 }] }],
});
const ledger = { entries: [], total: 0, limit: 1, addResponse() {} };
setInterval(async () => {
  await runJobs({ spool, corpus, call, ledger, day: '2026-11-05', model: 'attrappe' });
  await frageweg.collect();
}, 300);

const kosten = path.join(dir, 'kosten');
fs.mkdirSync(kosten);
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(kosten, `kosten-${today.slice(0, 7)}.json`), JSON.stringify([{ label: today, model: 'claude-opus-5-5', input: 16000, output: 900, dollars: 0.082 }]));
const mod = createHandler({ store, live, publish, fragen: frageweg, kosten });
const api = createApi({ fragen: frageweg, pending, store, hash: await hashPassphrase(KURSCODE) });
const voting = createVoting({ store, publish });
setInterval(() => voting.flush(), 300);
const routeOf = ({ url }) => (url === '/eidl/api/stimme' ? voting.handle : url.startsWith('/eidl/api/') ? api : mod);
http.createServer((req, res) => routeOf(req)(req, res)).listen(MOD_PORT, '127.0.0.1');
const site = spawn('node', ['site/serve.mjs', String(PORT), built], { stdio: 'inherit', env: { ...process.env, HAINRICH2_MOD: `http://127.0.0.1:${MOD_PORT}`, HAINRICH2_LIVE: live } });
process.on('exit', () => site.kill());
