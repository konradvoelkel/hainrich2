// node latency.mjs: eigener Wegwerf-Server plus Headless-Chromium. Drosselung per CDP wirkt nur auf den Hauptthread,
// deshalb laufen Thread-Messungen ungedrosselt.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
/** HAINRICH1: das Repo des Vorgängers, HAINRICH2_DATEN: das Datenverzeichnis (.env.example) */
const H = process.env.HAINRICH1, W = `${process.env.HAINRICH2_DATEN}/work`, M = `${process.env.HAINRICH2_DATEN}/models`;
const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(H + '/tools/package.json')('@playwright/test');
const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' };
const map = p => p === '/bench.html' || p === '/bench.js' ? here + p : p === '/transformers.js' ? H + '/modules/transformers.js'
  : p === '/bench.json' ? W + p : p.startsWith('/wasm/') ? H + p
  : p.startsWith('/models/Xenova/all-MiniLM') ? H + p : p.startsWith('/models/e5s') ? M + '/trim' + p.slice(7) : p.startsWith('/models/Xenova/') ? M + p.slice(7) : null;
const server = http.createServer((q, r) => {
  const f = map(decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!f || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': type[path.extname(f)] ?? 'application/octet-stream', 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' });
  fs.createReadStream(f).pipe(r);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/bench.html`;
const runs = [
  ['Xenova/all-MiniLM-L6-v2', '', 1, 1], ['Xenova/all-MiniLM-L6-v2', '', 1, 4],
  ['e5s-16384', 'query: ', 1, 1], ['e5s-16384', 'query: ', 1, 4], ['e5s-16384', 'query: ', 1, 6],
  ['e5s-16384', 'query: ', 4, 1],
  ['Xenova/multilingual-e5-small', 'query: ', 1, 1], ['Xenova/multilingual-e5-small', 'query: ', 1, 4],
];
const browser = await chromium.launch({ headless: true });
console.log('Modell                         Threads Drossel  Laden  Median  p95  Passage  minCos');
for (const [model, prefix, threads, rate] of runs) {
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  const cdp = await page.context().newCDPSession(page);
  if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  await page.goto(`${base}?model=${encodeURIComponent(model)}&prefix=${encodeURIComponent(prefix)}&threads=${threads}`);
  try {
    await page.waitForFunction(() => window.__result, null, { timeout: 170000 });
    const r = await page.evaluate(() => window.__result);
    console.log(`${model.padEnd(30)} ${String(threads).padStart(7)} ${String(rate).padStart(6)}x ${String(r.load).padStart(6)} ${String(r.median).padStart(7)} ${String(r.p95).padStart(4)} ${String(r.long).padStart(8)}  ${r.minCos} ${r.isolated ? '' : 'nicht isoliert'}`);
  } catch (e) { console.log(model, threads, rate, 'FEHLER', errs.slice(0, 2).join(' | ') || e.message.slice(0, 120)); }
  await page.close();
}
await browser.close(); server.close();
