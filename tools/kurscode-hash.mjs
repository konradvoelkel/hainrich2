#!/usr/bin/env node
/**
 * Macht aus dem Kurscode den Hash für den Vault (I7). Der Code kommt nie als Argument, sonst stünde er in der Shell-Historie: am Terminal
 * verdeckt und doppelt, sonst eine Zeile von stdin. Ausgegeben wird nur der Hash.
 *
 *   node tools/kurscode-hash.mjs
 */
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { hashPassphrase } from '../lib/auth.js';

const terminal = !!process.stdin.isTTY;
const reader = readline.createInterface({ input: process.stdin, output: new Writable({ write: (_, __, done) => done() }), terminal });
const lines = reader[Symbol.asyncIterator]();
async function ask(prompt) {
  if (terminal) process.stderr.write(prompt);
  const { value = '' } = await lines.next();
  if (terminal) process.stderr.write('\n');
  return value.trim();
}

const code = await ask('Kurscode: ');
if (terminal && code !== await ask('Noch einmal: ')) {
  console.error('Die beiden Eingaben stimmen nicht überein.');
  process.exit(1);
}
reader.close();
if (!code) {
  console.error('Kein Code eingegeben.');
  process.exit(1);
}
console.log(await hashPassphrase(code));
