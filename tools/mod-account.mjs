#!/usr/bin/env node
/**
 * Legt ein Moderationskonto an oder setzt dessen Passphrase neu (Plan §9). Die Passphrase kommt nie als Argument, sonst
 * stünde sie in der Shell-Historie: am Terminal verdeckt und doppelt, sonst eine Zeile von stdin.
 *
 *   node tools/mod-account.mjs <public.db> <name> <moderator|admin>
 */
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { hashPassphrase, MIN_PASSPHRASE } from '../lib/auth.js';
import { openStore } from '../lib/store.js';

const [dbFile, name, rolle] = process.argv.slice(2);
if (!name || !['moderator', 'admin'].includes(rolle)) throw new Error('Aufruf: <public.db> <name> <moderator|admin>');

const terminal = !!process.stdin.isTTY;
const quiet = new Writable({ write: (_, __, done) => done() });
const reader = readline.createInterface({ input: process.stdin, output: quiet, terminal });
const lines = reader[Symbol.asyncIterator]();
async function ask(prompt) {
  if (terminal) process.stderr.write(prompt);
  const { value = '' } = await lines.next();
  if (terminal) process.stderr.write('\n');
  return value;
}

const passphrase = await ask('Passphrase: ');
if (terminal && passphrase !== await ask('Noch einmal: ')) throw new Error('Die Passphrasen stimmen nicht überein.');
if (passphrase.length < MIN_PASSPHRASE) throw new Error(`Mindestens ${MIN_PASSPHRASE} Zeichen.`);
reader.close();

const store = openStore(dbFile);
store.saveModerator(name, rolle, await hashPassphrase(passphrase));
store.close();
console.log(`${name} (${rolle}) gespeichert`);
