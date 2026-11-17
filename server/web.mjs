#!/usr/bin/env node
/**
 * Startet den Web-Prozess: nur auf 127.0.0.1, davor steht Caddy. Beim Start schreibt er alle Seiten neu, damit `live/` nach
 * einem Update zum Code passt. Ohne `HAINRICH2_KURSCODE` (Datei mit dem Hash) bleibt der Fragepfad zu, ohne `HAINRICH2_SCHLANGE` gibt es
 * keine Entwürfe. Abstimmen ist ein eigener Schalter, `HAINRICH2_STIMMEN=1`, es hängt an nichts davon.
 *
 *   HAINRICH2_DB=<public.db> HAINRICH2_LIVE=<verzeichnis> [HAINRICH2_PENDING=<pending.db>] [HAINRICH2_KURSCODE=<datei>]
 *   [HAINRICH2_SCHLANGE=<verzeichnis>] [HAINRICH2_STIMMEN=1] [HAINRICH2_KOSTEN=<verzeichnis>] [HAINRICH2_KORPUS=<verzeichnis>]
 *   [HAINRICH2_PORT=8773] node server/web.mjs
 *
 * Den Korpus braucht er nur für die Liste der Zitate, die das Skript so nicht mehr hat. Vorgabe ist korpus/ neben app/, wohin
 * site/deploy-app.sh ihn legt.
 */
import fs from 'node:fs';
import http from 'node:http';
import { closedApi, createApi } from '../lib/api.js';
import { relinker } from '../lib/citations.js';
import { createFragen } from '../lib/fragen.js';
import { createHandler } from '../lib/mod.js';
import { openPending } from '../lib/pending.js';
import { createPublisher, publishAll } from '../lib/publish.js';
import { quoteUrl } from '../lib/segment.js';
import { openSpool } from '../lib/spool.js';
import { createVoting, FLUSH_MS } from '../lib/stimmen.js';
import { openStore } from '../lib/store.js';

const { HAINRICH2_DB: db, HAINRICH2_LIVE: live, HAINRICH2_PENDING: pendingFile, HAINRICH2_KURSCODE: code, HAINRICH2_SCHLANGE: schlange, HAINRICH2_STIMMEN: stimmen, HAINRICH2_KOSTEN: kosten, HAINRICH2_KORPUS: korpus = new URL('../../korpus', import.meta.url).pathname, HAINRICH2_PORT: port = '8773' } = process.env;
if (!db || !live) throw new Error('HAINRICH2_DB und HAINRICH2_LIVE fehlen');

const COLLECT_MS = 2000;
const SWEEP_MS = 3600_000;

const store = openStore(db);
if (store.empty()) throw new Error(`${db} ist leer, erst tools/import-public.mjs`);
const open = !!(pendingFile && code);
store.setSite('fragen', open);
store.setSite('entwurf', open && !!schlange);
store.setSite('stimmen', !!stimmen);
/** Vorschläge für die Kurztitel des Bestands (Plan D31), nur wo noch nichts steht. Öffentlich wird davon nichts, bis die Moderation speichert */
const titelFile = new URL('../seeds/kurztitel.json', import.meta.url);
if (fs.existsSync(titelFile)) store.suggestTitles(JSON.parse(fs.readFileSync(titelFile, 'utf8')));
const korpusFile = `${korpus}/corpus.json`;
const passages = fs.existsSync(korpusFile) ? JSON.parse(fs.readFileSync(korpusFile, 'utf8')).passages : null;
if (!passages) console.error(`${korpusFile} fehlt, die Moderation zeigt keine veralteten Zitate`);
/**
 * Ein neuer Korpus kommt mit site/deploy-app.sh und diesem Neustart. Zitate, deren Wortlaut noch im Skript steht, ziehen dann mit um
 * (Plan D36); die übrigen listet die Moderation als veraltet. Die Kennungen stehen im Journal, kein Text.
 */
const umgezogen = passages ? store.relinkCitations(relinker(passages, quoteUrl)) : [];
if (umgezogen.length) console.log(`Zitate umgezogen: ${umgezogen.join(', ')}`);
await publishAll(live, store);

const publish = createPublisher(live, store);
const base = store.site().base;
const safely = work => () => Promise.resolve().then(work).catch(error => console.error(error));
let api = closedApi;
let fragen = null;
if (open) {
  const pending = openPending(pendingFile);
  fragen = createFragen({ store, pending, spool: schlange ? openSpool(schlange) : null, publish });
  api = createApi({ fragen, pending, store, hash: fs.readFileSync(code, 'utf8').trim(), base });
  setInterval(safely(fragen.collect), COLLECT_MS);
  setInterval(safely(fragen.sweep), SWEEP_MS);
  fragen.sweep();
}
const voting = stimmen ? createVoting({ store, publish }) : null;
if (voting) setInterval(safely(voting.flush), FLUSH_MS);
const mod = createHandler({ store, live, base, publish, fragen, kosten, passages });
const routeOf = ({ url }) => {
  if (voting && url === `${base}api/stimme`) return voting.handle;
  return url.startsWith(`${base}api/`) ? api : mod;
};
http.createServer((req, res) => routeOf(req)(req, res)).listen(+port, '127.0.0.1', () => console.log(`127.0.0.1:${port}`));
