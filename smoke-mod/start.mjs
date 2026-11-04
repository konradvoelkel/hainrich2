/**
 * Startet für `npm run smoke:mod` den Verbund wie auf dem Server: Web-Prozess und statische Site mit Aufteilung, gegen eine
 * Wegwerf-Datenbank. Die Fragen stammen aus dem gebauten Baum, die Antworten sind Attrappen. Erst `node site/build.mjs`.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { hashPassphrase } from '../lib/auth.js';
import { createHandler } from '../lib/mod.js';
import { publishAll } from '../lib/publish.js';
import { openStore } from '../lib/store.js';
import { MOD_PORT, PASSPHRASE, PORT } from './konstanten.mjs';

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
  { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: true, ladegroesse: 'rund 24 MB' },
);
store.saveModerator('test', 'admin', await hashPassphrase(PASSPHRASE));
await publishAll(live, store);
http.createServer(createHandler({ store, live })).listen(MOD_PORT, '127.0.0.1');
const site = spawn('node', ['site/serve.mjs', String(PORT), built], { stdio: 'inherit', env: { ...process.env, HAINRICH2_MOD: `http://127.0.0.1:${MOD_PORT}`, HAINRICH2_LIVE: live } });
process.on('exit', () => site.kill());
