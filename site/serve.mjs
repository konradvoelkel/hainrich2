/**
 * Statischer Server für Vorschau und Smoke-Test: node site/serve.mjs [port] [verzeichnis]. Ahmt den
 * Caddy-Block nach, also Umleitung auf /eidl/ und dieselbe CSP. Das ist eine zweite Definition; die
 * gültige steht im Server-Repo, Rolle hainrich2. Mit HAINRICH2_MOD (Adresse des Web-Prozesses) und
 * HAINRICH2_LIVE (dessen Seiten) auch die Aufteilung zwischen beiden. Mit HAINRICH2_TLS_KEY und HAINRICH2_TLS_CERT (Dateien im
 * PEM-Format) über HTTPS wie am Host: WebKit nimmt das `Secure`-Cookie der Moderation über http://localhost nicht an
 * (research/2026-11-17-webkit-cookie/), `npm run smoke:mod` braucht es deshalb.
 */
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { ort } from '../lib/orte.js';

const PORT = Number(process.argv[2] ?? 8771);
const ROOT = path.resolve(process.argv[3] ?? process.env.HAINRICH2_SITE ?? ort('site'));
const { HAINRICH2_MOD: MOD, HAINRICH2_LIVE: LIVE, HAINRICH2_TLS_KEY: TLS_KEY, HAINRICH2_TLS_CERT: TLS_CERT } = process.env;
if (!TLS_KEY !== !TLS_CERT) throw new Error('HAINRICH2_TLS_KEY und HAINRICH2_TLS_CERT gehören zusammen');
const LIVE_PATHS = /^\/eidl\/(?:index\.html|f\/.*|sitemap\.xml|daten\/fragen\.json)?$/;
/**
 * wie im Caddy-Block für den ganzen Host; no-referrer ändert, was der Browser als Origin schickt. COOP und HSTS stehen seit dem 2026-11-21
 * auch hier, gemessen am Host (research/2026-11-21-modern-web-guidance, Abschnitt 5); über http://localhost übergeht der Browser HSTS.
 */
const HOST_HEADERS = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin', 'Strict-Transport-Security': 'max-age=31536000',
};
/**
 * Trusted Types seit dem 2026-11-23 (E19): HTML und Skript-Adressen nur über die Policies `hainrich` und `dompurify` (site/sicher.js).
 * Am Host erst nach dem Ausspielen der Skripte, die sie anlegen; vorher bräche die Suche in Chromium.
 */
const CSP = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; trusted-types hainrich dompurify";
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.wasm': 'application/wasm', '.onnx': 'application/octet-stream', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png', '.ico': 'image/x-icon',
};

function handle(req, res) {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname === '/' || pathname === '/eidl') { res.writeHead(301, { Location: '/eidl/' }); res.end(); return; }
  if (MOD && /^\/eidl\/(?:mod|api)(\/|$)/.test(pathname)) {
    req.pipe(http.request(`${MOD}${req.url}`, { method: req.method, headers: req.headers }, up => {
      res.writeHead(up.statusCode, { ...up.headers, ...HOST_HEADERS });
      up.pipe(res);
    }));
    return;
  }
  const root = LIVE && LIVE_PATHS.test(pathname) ? path.resolve(LIVE) : ROOT;
  let file = path.join(root, path.normalize(decodeURIComponent(pathname)));
  if (pathname.endsWith('/')) file = path.join(file, 'index.html');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // wie handle_errors im Caddy-Block: Die Seite liegt im Docroot, auch wenn die Anfrage nach live/ ging
    const page = path.join(ROOT, 'eidl/404.html');
    res.writeHead(404, { 'Content-Type': TYPES['.html'], 'Content-Security-Policy': CSP, ...HOST_HEADERS });
    res.end(fs.existsSync(page) ? fs.readFileSync(page) : 'nicht gefunden');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Content-Security-Policy': CSP, ...HOST_HEADERS });
  fs.createReadStream(file).pipe(res);
}

const server = TLS_KEY ? https.createServer({ key: fs.readFileSync(TLS_KEY), cert: fs.readFileSync(TLS_CERT) }, handle) : http.createServer(handle);
server.listen(PORT, () => console.log(`${TLS_KEY ? 'https' : 'http'}://localhost:${PORT}/eidl/ aus ${ROOT}`));
