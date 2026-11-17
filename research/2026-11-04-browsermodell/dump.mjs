// node dump.mjs <out.json>: wie latency.mjs, aber holt alle Vektoren aus dem Browser.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
/** HAINRICH1: das Repo des Vorgängers, HAINRICH2_DATEN: das Datenverzeichnis (.env.example) */
const H = process.env.HAINRICH1, W = `${process.env.HAINRICH2_DATEN}/work`, M = `${process.env.HAINRICH2_DATEN}/models`;
const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(H + '/tools/package.json')('@playwright/test');
const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' };
const map = p => p === '/bench.html' || p === '/bench.js' ? here + p : p === '/transformers.js' ? H + '/modules/transformers.js'
  : p === '/bench.json' || p === '/all.json' ? W + p : p.startsWith('/wasm/') ? H + p : p.startsWith('/models/e5s') ? M + '/trim' + p.slice(7) : null;
const server = http.createServer((q, r) => {
  const f = map(decodeURIComponent(new URL(q.url, 'http://x').pathname));
  if (!f || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': type[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const browser = await chromium.launch({ headless: true }); const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${server.address().port}/bench.html?model=e5s-16384&prefix=${encodeURIComponent('query: ')}&dump=1`);
await page.waitForFunction(() => window.__vectors, null, { timeout: 280000, polling: 2000 });
fs.writeFileSync(process.argv[2], JSON.stringify(await page.evaluate(() => window.__vectors)));
await browser.close(); server.close(); console.log('dumped');
