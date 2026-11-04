/**
 * Statischer Server für Vorschau und Smoke-Test: node site/serve.mjs [port] [verzeichnis]. Ahmt den
 * Caddy-Block nach, also Umleitung auf /eidl/ und dieselbe CSP. Das ist eine zweite Definition; die
 * gültige steht im Server-Repo, Rolle hainrich2.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.argv[2] ?? 8771);
const ROOT = path.resolve(process.argv[3] ?? process.env.HAINRICH2_SITE ?? '/media/konrad/xtraspace/hainrich2/site');
const CSP = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
};

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname === '/' || pathname === '/eidl') { res.writeHead(301, { Location: '/eidl/' }); res.end(); return; }
  let file = path.join(ROOT, path.normalize(decodeURIComponent(pathname)));
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end('nicht gefunden'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}/eidl/ aus ${ROOT}`));
