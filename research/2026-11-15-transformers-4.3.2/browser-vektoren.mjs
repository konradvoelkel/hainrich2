#!/usr/bin/env node
/**
 * Dasselbe im Browser, mit genau den Dateien, die ausgeliefert werden, und hinter derselben CSP (site/serve.mjs): die Vektoren der
 * Seed-Fragen über transformers.min.js, model.js und die WASM-Runtime aus dem gebauten Baum, dazu die Trefferlisten, die der echte
 * such-worker.js für dieselben Fragen liefert. Zwei Läufe mit zwei gebauten Bäumen ergeben den Vergleich (Playbook §3.6). Ohne Netz.
 *
 *   node research/2026-11-15-transformers-4.3.2/browser-vektoren.mjs <gebaute-site> <ausgabe> [chromium|firefox|webkit]
 */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as playwright from '@playwright/test';

const [site, ausgabe, name = 'chromium'] = process.argv.slice(2);
if (!site || !ausgabe) throw new Error('Aufruf: browser-vektoren.mjs <gebaute-site> <ausgabe> [browser]');

const PORT = 8779;
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
const fragen = JSON.parse(fs.readFileSync(path.join(repo, 'seeds/fragen.json'), 'utf8')).map(s => s.frage);

const server = spawn('node', [path.join(repo, 'site/serve.mjs'), String(PORT), site], { stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.once('exit', code => reject(new Error(`serve.mjs endet mit ${code}`))); });

const browser = await playwright[name].launch();
try {
  const page = await browser.newPage();
  const probleme = [];
  const fremd = [];
  page.on('console', m => { if (m.type() === 'error') probleme.push(m.text()); });
  page.on('pageerror', e => probleme.push(e.message));
  page.on('request', r => { if (new URL(r.url()).origin !== `http://localhost:${PORT}`) fremd.push(r.url()); });
  await page.goto(`http://localhost:${PORT}/eidl/`);

  const vektoren = await page.evaluate(async texte => {
    /** dieselben relativen Pfade wie in such-worker.js; mit einer absoluten Adresse als modelPath lädt die Bibliothek keinen Tokenizer */
    const transformers = await import('/eidl/transformers.min.js');
    const { createEmbedder } = await import('/eidl/model.js');
    const embedder = await createEmbedder(transformers, { modelPath: './models/', wasmPath: './wasm/' });
    const out = [];
    for (const text of texte) out.push(await embedder.query(text));
    return out;
  }, fragen);

  const treffer = await page.evaluate(texte => new Promise((resolve, reject) => {
    const worker = new Worker(new URL('such-worker.js', location.href), { type: 'module' });
    const out = [];
    const frage = () => worker.postMessage({ anfrage: texte[out.length], nummer: out.length });
    worker.onerror = e => reject(new Error(e.message ?? 'Worker lädt nicht'));
    worker.onmessage = ({ data }) => {
      if (data.act === 'stichworte') return;
      if (data.act === 'modell') return frage();
      if (data.act !== 'treffer') return reject(new Error(`${data.act}: ${data.nachricht}`));
      out.push({ fragen: data.fragen.map(f => f.id), skript: data.skript.map(p => p.url) });
      if (out.length < texte.length) frage(); else resolve(out);
    };
  }), fragen);

  fs.mkdirSync(ausgabe, { recursive: true });
  const dateien = { [`browser-${name}-fragen.json`]: JSON.stringify(vektoren), [`browser-${name}-treffer.json`]: JSON.stringify(treffer) };
  for (const [datei, text] of Object.entries(dateien)) fs.writeFileSync(path.join(ausgabe, datei), text);
  console.log(`${name} ${browser.version()}, transformers.min.js ${sha(fs.readFileSync(path.join(site, 'eidl/transformers.min.js'))).slice(0, 16)}`);
  console.log(`Fragen ${vektoren.length}, Dimension ${vektoren[0].length}, Trefferlisten ${treffer.length}`);
  for (const [datei, text] of Object.entries(dateien)) console.log(`${sha(text)}  ${datei}`);
  console.log(`Konsolenfehler ${probleme.length}, fremde Anfragen ${fremd.length}`);
  for (const p of [...probleme, ...fremd]) console.log(`  ${p}`);
  process.exitCode = probleme.length || fremd.length ? 1 : 0;
} finally {
  await browser.close();
  server.kill();
}
