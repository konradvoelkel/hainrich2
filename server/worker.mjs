#!/usr/bin/env node
/**
 * Der Worker: eine Oneshot-Unit, die eine `.path`-Unit startet, sobald etwas in der Schlange liegt. Er hat als Einziger den API-Key und kommt
 * nicht an `data/` heran (I1, I5). Das Kostenbuch gilt je Monat, sein Deckel ist der aus Plan §7.4.
 *
 *   HAINRICH2_SCHLANGE=<verzeichnis> HAINRICH2_KORPUS=<verzeichnis> HAINRICH2_KOSTEN=<verzeichnis> HAINRICH2_MODELS=<verzeichnis> node server/worker.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { Ledger } from '../lib/budget.js';
import { openCorpus } from '../lib/corpus.js';
import { DOLLARS_PER_MONTH, runJobs } from '../lib/draft.js';
import { openSpool } from '../lib/spool.js';

const { HAINRICH2_SCHLANGE: schlange, HAINRICH2_KORPUS: korpus, HAINRICH2_KOSTEN: kosten, CREDENTIALS_DIRECTORY: credentials } = process.env;
if (!schlange || !korpus || !kosten || !credentials) throw new Error('HAINRICH2_SCHLANGE, HAINRICH2_KORPUS, HAINRICH2_KOSTEN oder der Key fehlen');

const spool = openSpool(schlange);
if (!spool.jobs().length) process.exit(0);

/**
 * Die Unit bricht den Lauf nach 15 Minuten ab (`TimeoutStartSec` im Server-Repo). Ein Auftrag braucht höchstens zwei Anläufe zu je zwei
 * Minuten und ein paar Pausen, also fängt der Worker nach acht Minuten keinen neuen mehr an.
 */
const RUN_MS = 8 * 60_000;
const started = Date.now();

/**
 * Zwei Minuten reichen für eine Antwort. Das SDK wiederholt nichts: Es würde auch nach einem Timeout noch einmal senden, und keine dieser
 * Anfragen stünde im Kostenbuch. Wiederholt wird in lib/draft.js, Anfrage für Anfrage gebucht.
 */
const client = new Anthropic({ apiKey: fs.readFileSync(path.join(credentials, 'anthropic'), 'utf8').trim(), timeout: 120_000, maxRetries: 0 });
const call = params => client.beta.messages.create({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
const day = new Date().toISOString().slice(0, 10);
const ledger = new Ledger(path.join(kosten, `kosten-${day.slice(0, 7)}.json`), DOLLARS_PER_MONTH);

await runJobs({ spool, corpus: await openCorpus(korpus), call, ledger, day, until: started + RUN_MS });
process.exit(0);
