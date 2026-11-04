#!/usr/bin/env node
/**
 * Startet den Web-Prozess: nur auf 127.0.0.1, davor steht Caddy. Beim Start schreibt er alle Seiten neu, damit `live/` nach
 * einem Update zum Code passt.
 *
 *   HAINRICH2_DB=<public.db> HAINRICH2_LIVE=<verzeichnis> [HAINRICH2_PORT=8773] node server/web.mjs
 */
import http from 'node:http';
import { createHandler } from '../lib/mod.js';
import { publishAll } from '../lib/publish.js';
import { openStore } from '../lib/store.js';

const { HAINRICH2_DB: db, HAINRICH2_LIVE: live, HAINRICH2_PORT: port = '8773' } = process.env;
if (!db || !live) throw new Error('HAINRICH2_DB und HAINRICH2_LIVE fehlen');

const store = openStore(db);
if (store.empty()) throw new Error(`${db} ist leer, erst tools/import-public.mjs`);
await publishAll(live, store);
http.createServer(createHandler({ store, live, base: store.site().base })).listen(+port, '127.0.0.1', () => console.log(`127.0.0.1:${port}`));
