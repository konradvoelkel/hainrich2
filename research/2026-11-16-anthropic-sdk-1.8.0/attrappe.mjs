#!/usr/bin/env node
/**
 * Lässt den echten server/worker.mjs mit der installierten Fassung des SDK gegen einen Attrappen-Server laufen und hält fest, was
 * hinausgeht und was der Worker daraus macht: jede Anfrage mit Kopfzeilen und Rumpf, das Ergebnis in der Schlange, das Kostenbuch und
 * die Logzeilen. Danach dasselbe für die Aufrufwege der Werkzeuge über werkzeug.mjs. Zwei Läufe, einer je Fassung, vergleicht
 * vergleich.mjs. Der Lauf verlangt einen Netz-Namensraum ohne Außenverbindung, damit keine Anfrage die echte API erreichen kann
 * (CLAUDE.md, „Was beißt“ 6):
 *
 *   unshare -rn sh -c 'ip link set lo up && node research/2026-11-16-anthropic-sdk-1.8.0/attrappe.mjs <korpus> <ausgabe> [muster]'
 *
 * Mit einem Muster laufen nur die Szenarien, deren Name dazu passt, etwa `^werkzeug-` ohne die zwei Minuten des Timeouts.
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { openSpool } from '../../lib/spool.js';

const [korpus, ausgabe, muster = ''] = process.argv.slice(2);
if (!korpus || !ausgabe) throw new Error('Aufruf: attrappe.mjs <korpus> <ausgabe> [muster]');
if (fs.existsSync(ausgabe)) throw new Error(`${ausgabe} gibt es schon, jeder Lauf braucht ein eigenes Verzeichnis`);
if (Object.values(os.networkInterfaces()).flat().some(i => !i.internal)) throw new Error('Nur ohne Netz: mit unshare -rn starten, siehe Kopf der Datei');

const PORT = 8781;
const SCHLUESSEL = 'attrappe-kein-echter-schluessel';
const hier = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(hier, '../..');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const fassung = name => readJson(path.join(repo, 'node_modules', name, 'package.json')).version;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const FRAGE = readJson(path.join(repo, 'seeds/fragen.json'))[0].frage;
const umgebung = { sdk: fassung('@anthropic-ai/sdk'), transformers: fassung('@huggingface/transformers'), node: process.version };

const json = (status, body, kopf = {}) => res => {
  res.writeHead(status, { 'content-type': 'application/json', 'request-id': 'req_attrappe', ...kopf });
  res.end(JSON.stringify(body));
};
const absage = (status, type, extra = {}, kopf = {}) => json(status, { type: 'error', error: { type, message: 'Absage der Attrappe', ...extra }, request_id: 'req_attrappe' }, kopf);
const zitat = { type: 'content_block_location', cited_text: 'Text', document_index: 0, document_title: null, start_block_index: 0, end_block_index: 1 };
const text = (inhalt, citations = [zitat]) => ({ type: 'text', text: inhalt, citations });
const NACHRICHT = {
  id: 'msg_attrappe', type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [text('Eine Antwort aus der Attrappe.')],
  stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1000, output_tokens: 100 },
};
const nachricht = (extra = {}) => json(200, { ...NACHRICHT, ...extra });
const richter = urteil => nachricht({ model: 'claude-haiku-5-5', content: [text(JSON.stringify(urteil), null)] });
const ersatz = {
  model: 'claude-opus-5',
  content: [{ type: 'fallback', from: { model: 'claude-opus-5-5' }, to: { model: 'claude-opus-5' } }, text('Eine Antwort vom Ersatzmodell.')],
  usage: { input_tokens: 1000, output_tokens: 100, iterations: [{ type: 'message', model: 'claude-opus-5-5', input_tokens: 1000, output_tokens: 0 }, { type: 'fallback_message', model: 'claude-opus-5', input_tokens: 1000, output_tokens: 100 }] },
};

/** je Szenario die Antworten der Reihe nach, die letzte gilt für alle weiteren Anfragen */
const WORKER = {
  antwort: [nachricht()],
  'zweiter-anlauf': [nachricht({ content: [text('KEIN_BELEG', null)] }), nachricht()],
  fallback: [nachricht(ersatz)],
  verweigert: [nachricht({ content: [], stop_reason: 'refusal', stop_details: { type: 'refusal', category: null, explanation: null } })],
  abgeschnitten: [nachricht({ stop_reason: 'max_tokens' })],
  'status-400': [absage(400, 'invalid_request_error')],
  'status-401': [absage(401, 'authentication_error')],
  /** beide Kopfzeilen laden das SDK zum Wiederholen ein; mit `maxRetries: 0` darf es das nicht */
  'status-429': [absage(429, 'rate_limit_error', {}, { 'retry-after': '1', 'x-should-retry': 'true' })],
  /** ab 1.5.0 wählt ein Fehlercode eine eigene Klasse */
  'status-429-mit-code': [absage(429, 'rate_limit_error', { details: { error_code: 'ramp_limit_exceeded' } }, { 'retry-after': '1' })],
  'status-500': [absage(500, 'api_error')],
  'status-529': [absage(529, 'overloaded_error')],
  abbruch: [(res, req) => req.socket.destroy()],
  'halbe-antwort': [res => {
    res.writeHead(200, { 'content-type': 'application/json', 'content-length': '400' });
    res.write('{"id":"msg_attrappe","type":"message","content":[{"type":"text","text":"Eine halbe');
    setTimeout(() => res.socket?.destroy(), 200);
  }],
  /** antwortet nie: Der Worker gibt nach zwei Minuten auf */
  timeout: [() => {}],
};

const STROM = [
  { type: 'message_start', message: { ...NACHRICHT, content: [], stop_reason: null, usage: { input_tokens: 1000, output_tokens: 1 } } },
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'ping' },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '{"fragen":["Wie groß ist die Schrittweite?",' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '"Wofür steht η?"]}' } },
  { type: 'content_block_stop', index: 0 },
  { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 20 } },
  { type: 'message_stop' },
];
/** in Stücken zu 37 Bytes und einmal mitten im ersten Umlaut geteilt: Ab 1.5.0 dekodiert das SDK je Stück */
const strom = ereignisse => res => {
  const bytes = Buffer.from(ereignisse.map(e => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join(''));
  const schnitte = [...new Set([bytes.findIndex(b => b > 0x7f) + 1, ...Array.from({ length: Math.floor(bytes.length / 37) }, (_, i) => (i + 1) * 37)])].sort((a, b) => a - b);
  res.writeHead(200, { 'content-type': 'text/event-stream', 'request-id': 'req_attrappe' });
  res.socket.setNoDelay(true);
  let von = 0;
  const weiter = () => {
    const bis = schnitte.shift() ?? bytes.length;
    res.write(bytes.subarray(von, bis));
    von = bis;
    if (von < bytes.length) setTimeout(weiter, 3);
    else res.end();
  };
  weiter();
};

const stapel = fertig => (res, req) => json(200, {
  id: 'msgbatch_attrappe', type: 'message_batch', processing_status: fertig ? 'ended' : 'in_progress',
  request_counts: { processing: fertig ? 0 : 2, succeeded: fertig ? 1 : 0, errored: fertig ? 1 : 0, canceled: 0, expired: 0 },
  created_at: '2026-11-16T00:00:00Z', expires_at: '2026-11-17T00:00:00Z', ended_at: fertig ? '2026-11-16T00:01:00Z' : null, archived_at: null, cancel_initiated_at: null,
  results_url: fertig ? `http://${req.headers.host}/v1/messages/batches/msgbatch_attrappe/results` : null,
})(res);
const ERGEBNISSE = [
  { custom_id: 'probe-opus', result: { type: 'succeeded', message: NACHRICHT } },
  { custom_id: 'probe-haiku', result: { type: 'errored', error: { type: 'error', error: { type: 'invalid_request_error', message: 'Absage der Attrappe' } } } },
];

/** die Wege aus werkzeug.mjs; ein Batch fragt den Stand zweimal ab, einmal das Werkzeug und einmal das SDK vor den Ergebnissen */
const WERKZEUGE = {
  antwort: [nachricht()],
  richter: [richter({ nummer: 2 }), richter({ duplikat: true })],
  'schema-enum': [richter({ schwere: 'leicht' })],
  strom: [strom(STROM)],
  batch: [stapel(false), stapel(true), stapel(true), res => {
    res.writeHead(200, { 'content-type': 'application/x-jsonl', 'request-id': 'req_attrappe' });
    res.end(`${ERGEBNISSE.map(zeile => JSON.stringify(zeile)).join('\n')}\n`);
  }],
};

async function lauf(name, antworten, port, weg) {
  const ordner = Object.fromEntries(['schlange', 'kosten', 'schluessel', 'heim'].map(n => [n, path.join(ausgabe, 'arbeit', name, n)]));
  for (const o of Object.values(ordner)) fs.mkdirSync(o, { recursive: true });
  fs.writeFileSync(path.join(ordner.schluessel, 'anthropic'), `${SCHLUESSEL}\n`);
  const spool = openSpool(ordner.schlange);
  if (!weg) spool.submit({ id: 'probe', text: FRAGE });
  const ergebnisdatei = path.join(ausgabe, 'arbeit', name, 'ergebnis.json');

  const start = Date.now();
  const anfragen = [];
  const anfragenMs = [];
  const server = http.createServer((req, res) => {
    const teile = [];
    req.on('data', teil => teile.push(teil)).on('end', () => {
      const bytes = Buffer.concat(teile);
      let rumpf = bytes.toString('utf8');
      try { rumpf = JSON.parse(rumpf); } catch { /* dann steht der Rumpf als Text da */ }
      anfragenMs.push(Date.now() - start);
      const kopf = Object.fromEntries(Object.entries(req.headers).sort(([a], [b]) => (a < b ? -1 : 1)));
      anfragen.push({ methode: req.method, adresse: req.url, kopf, bytes: bytes.length, sha256: sha(bytes), rumpf });
      (antworten[anfragen.length - 1] ?? antworten.at(-1))(res, req);
    });
  });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));

  /** nur was der Prozess braucht: kein Key, kein Profil und kein Log-Schalter aus der Umgebung dieser Sitzung */
  const env = { PATH: process.env.PATH, HOME: ordner.heim, ANTHROPIC_BASE_URL: `http://127.0.0.1:${port}` };
  if (process.env.HAINRICH2_MODELS) env.HAINRICH2_MODELS = process.env.HAINRICH2_MODELS;
  if (weg) env.ANTHROPIC_API_KEY = SCHLUESSEL;
  else Object.assign(env, { HAINRICH2_SCHLANGE: ordner.schlange, HAINRICH2_KORPUS: korpus, HAINRICH2_KOSTEN: ordner.kosten, CREDENTIALS_DIRECTORY: ordner.schluessel });
  const befehl = weg ? [path.join(hier, 'werkzeug.mjs'), weg, ergebnisdatei] : [path.join(repo, 'server/worker.mjs')];
  const prozess = spawn(process.execPath, befehl, { cwd: repo, env });
  const log = { stdout: '', stderr: '' };
  for (const strang of ['stdout', 'stderr']) prozess[strang].on('data', teil => { log[strang] += teil; });
  const ende = await new Promise(resolve => prozess.on('close', (code, signal) => resolve(signal ?? code)));
  const dauerMs = Date.now() - start;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));

  /** der Tag steht als Etikett im Buch; für den Vergleich zweier Läufe zählt er nicht */
  const kostenbuch = fs.readdirSync(ordner.kosten).flatMap(datei => readJson(path.join(ordner.kosten, datei)))
    .map(e => ({ ...e, label: /^\d{4}-\d{2}-\d{2}$/.test(e.label) ? 'TAG' : e.label }));
  const fertig = fs.existsSync(ergebnisdatei) ? [readJson(ergebnisdatei)] : [];
  const zeilen = strang => log[strang].split('\n').filter(Boolean);
  const satz = { szenario: name, umgebung, zeiten: { anfragenMs, dauerMs }, anfragen, ende, stdout: zeilen('stdout'), stderr: zeilen('stderr'), ergebnis: weg ? fertig : spool.results().map(r => r.entry), wartend: spool.jobs().length, kostenbuch };
  fs.writeFileSync(path.join(ausgabe, `${name}.json`), JSON.stringify(satz, null, 1));
  return satz;
}

console.log(`SDK ${umgebung.sdk}, transformers.js ${umgebung.transformers}, Node ${umgebung.node}, Netz nur ${Object.keys(os.networkInterfaces()).join(', ') || 'keins'}`);
const alle = [...Object.entries(WORKER).map(([name, antworten]) => [name, antworten]), ...Object.entries(WERKZEUGE).map(([weg, antworten]) => [`werkzeug-${weg}`, antworten, weg])];
/** der Port hängt am Platz in der Liste, nicht am Muster: Er steht in der Kopfzeile `host` und damit im Vergleich */
const saetze = await Promise.all(alle.map(([name, antworten, weg], i) => (new RegExp(muster).test(name) ? lauf(name, antworten, PORT + i, weg) : null)).filter(Boolean));
for (const s of saetze) {
  const buch = `${s.kostenbuch.length} Buchungen, ${s.kostenbuch.reduce((sum, e) => sum + e.dollars, 0).toFixed(4)} $${s.kostenbuch.some(e => e.offen) ? ', offen' : ''}`;
  const wege = s.anfragen.map(a => `${a.methode} ${a.adresse}`).filter((w, i, a) => a.indexOf(w) === i).join(', ');
  console.log(`${s.szenario.padEnd(22)} Anfragen ${s.anfragen.length} (${wege}), Ende ${s.ende}, Ergebnis ${s.ergebnis.map(e => e.status ?? 'da').join(',') || 'keins'}, ${buch}, ${(s.zeiten.dauerMs / 1000).toFixed(1)} s${s.stderr.length ? `, Log: ${s.stderr.join(' | ').slice(0, 300)}` : ''}`);
}
