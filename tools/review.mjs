#!/usr/bin/env node
/**
 * Lokale Review-Seite für den Blindvergleich. Bewertungen landen in seeds/bewertung.json. Die Seite
 * läuft nur auf diesem Rechner; das Modell zeigt sie erst unter /auswertung.
 *
 *   node tools/review.mjs <antworten.json> [port]
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown } from '../lib/render.js';
import { blindView, summarize } from '../lib/compare.js';
import { quoteUrl } from '../lib/segment.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const answersFile = process.argv[2] ?? '/media/konrad/xtraspace/hainrich2/work/phase1/antworten.json';
const port = +(process.argv[3] ?? 8770);
const ratingsFile = path.join(root, 'seeds/bewertung.json');
const katexCss = path.join(root, 'node_modules/katex/dist/katex.min.css');
const katexFonts = path.join(root, 'node_modules/katex/dist/fonts');

const seeds = JSON.parse(fs.readFileSync(path.join(root, 'seeds/fragen.json'), 'utf8'));
const rows = JSON.parse(fs.readFileSync(answersFile, 'utf8'));
const readRatings = () => (fs.existsSync(ratingsFile) ? JSON.parse(fs.readFileSync(ratingsFile, 'utf8')) : {});
const keysBySeed = Object.fromEntries(seeds.map(s => [s.id, rows.filter(r => r.seed === s.id).map(r => r.key)]));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `:root{color-scheme:light dark;--bg:#fbfaf7;--card:#fff;--ink:#22252a;--soft:#5d6470;--line:#dcdde1;--accent:#2f6f73;--warn:#9a5b00;--bad:#a8322a}
@media(prefers-color-scheme:dark){:root{--bg:#17191c;--card:#202328;--ink:#e8e8e6;--soft:#a3a8b0;--line:#373b42;--accent:#6fb9bd;--warn:#e0a84f;--bad:#ee8a80}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 system-ui,sans-serif}
main{max-width:1500px;margin:0 auto;padding:16px}header{display:flex;flex-wrap:wrap;gap:12px;align-items:baseline;justify-content:space-between}
h1{font-size:1.25rem;line-height:1.35;margin:.3rem 0 1rem}nav a{margin-right:12px;color:var(--accent)}.meta{color:var(--soft);font-size:.9rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px}.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;min-width:0}
.card h2{font-size:1rem;margin:0 0 .4rem}.card.best{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}.body{overflow-wrap:anywhere}.body .katex-display{overflow-x:auto;overflow-y:hidden}
details{margin-top:.6rem;font-size:.92rem}summary{cursor:pointer;color:var(--accent)}blockquote{margin:.5rem 0;padding:.1rem .8rem;border-left:3px solid var(--line);color:var(--soft)}
.flag{color:var(--warn);font-size:.9rem;margin:.5rem 0 0}.none{color:var(--bad)}.bar{display:flex;flex-wrap:wrap;gap:6px;margin-top:.7rem}
button{font:inherit;padding:.3rem .65rem;border:1px solid var(--line);border-radius:6px;background:transparent;color:var(--ink);cursor:pointer}button.on{background:var(--accent);border-color:var(--accent);color:#fff}
textarea{width:100%;font:inherit;margin-top:.8rem;padding:.5rem;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)}
.foot{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-top:1rem}table{border-collapse:collapse;margin:1rem 0}td,th{padding:.35rem .8rem;border-bottom:1px solid var(--line);text-align:left}
ol.list{padding-left:1.4rem}ol.list a{color:var(--accent)}.done{color:var(--soft)}`;

const page = (title, body) => `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="/katex/katex.min.css"><style>${STYLE}</style><main>${body}</main></html>`;

function answerCard(a, rating) {
  const best = rating.beste === a.buchstabe;
  const verdict = rating.urteil?.[a.buchstabe];
  const quotes = a.cited.map((p, i) => `<details><summary>[${i + 1}] ${esc(p.title)}${p.path.length ? ` › ${esc(p.path.at(-1))}` : ''}</summary><blockquote>${renderMarkdown(p.text)}</blockquote><a href="${esc(quoteUrl(p))}" target="_blank" rel="noopener">Im Skript öffnen</a></details>`).join('');
  const hint = a.check && !a.check.gedeckt ? a.check.probleme.map(esc).join(' · ') : '';
  const flags = !hint ? '' : a.check.schwere === 'schwer' ? `<p class="flag">Prüfhinweis: ${hint}</p>` : `<details><summary>Leichter Prüfhinweis</summary><p>${hint}</p></details>`;
  const content = a.status === 'ok' ? `<div class="body">${renderMarkdown(a.text)}</div>${flags}${quotes}` : `<p class="none">Keine Antwort (${esc(a.status)})</p>`;
  const buttons = ['gut', 'ungenau', 'falsch'].map(v => `<button data-urteil="${v}" data-b="${a.buchstabe}" class="${verdict === v ? 'on' : ''}">${v}</button>`).join('');
  return `<section class="card ${best ? 'best' : ''}"><h2>Antwort ${a.buchstabe}</h2>${content}<div class="bar"><button data-beste="${a.buchstabe}" class="${best ? 'on' : ''}">beste</button>${buttons}</div></section>`;
}

function questionPage(index) {
  const seed = seeds[index];
  const ratings = readRatings();
  const rating = ratings[seed.id] ?? {};
  const view = blindView(seed, rows.filter(r => r.seed === seed.id));
  const done = Object.keys(ratings).length;
  const script = `const id=${JSON.stringify(seed.id)};const save=b=>fetch('/bewertung',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...b})}).then(()=>location.reload());
document.querySelectorAll('[data-beste]').forEach(x=>x.onclick=()=>save({beste:x.dataset.beste}));document.querySelectorAll('[data-urteil]').forEach(x=>x.onclick=()=>save({urteil:{[x.dataset.b]:x.dataset.urteil}}));
document.querySelector('#schlecht').onclick=()=>save({frageSchlecht:${!rating.frageSchlecht}});document.querySelector('#notiz').onchange=e=>fetch('/bewertung',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,notiz:e.target.value})});`;
  return page(`Frage ${index + 1}`, `<header><nav><a href="/">Übersicht</a><a href="/auswertung">Auswertung</a></nav><span class="meta">Frage ${index + 1} von ${seeds.length} · ${done} bewertet · ${esc(seed.kapitel)}${seed.hoersaal ? ' · aus dem Hörsaal' : ''}</span></header>
<h1>${esc(seed.frage)}</h1><div class="grid">${view.antworten.map(a => answerCard(a, rating)).join('')}</div>
<textarea id="notiz" rows="2" placeholder="Notiz zu dieser Frage">${esc(rating.notiz ?? '')}</textarea>
<div class="foot"><button id="schlecht" class="${rating.frageSchlecht ? 'on' : ''}">Frage taugt nicht</button><span>${index > 0 ? `<a href="/f/${index}">Zurück</a> · ` : ''}${index + 1 < seeds.length ? `<a href="/f/${index + 2}">Weiter</a>` : '<a href="/auswertung">Zur Auswertung</a>'}</span></div><script>${script}</script>`);
}

function overview() {
  const ratings = readRatings();
  const items = seeds.map((s, i) => `<li class="${ratings[s.id] ? 'done' : ''}"><a href="/f/${i + 1}">${esc(s.frage)}</a>${ratings[s.id] ? ' ✓' : ''}</li>`).join('');
  return page('Blindvergleich', `<h1>Blindvergleich der Antworten</h1><p>Je Frage drei Antworten, die Modelle bleiben verborgen. Wähle die beste, urteile über die anderen, oder markiere die Frage als untauglich. Rund zehn Fragen reichen für die Modellwahl, für die Freigabe zählen alle 30.</p><ol class="list">${items}</ol><p><a href="/auswertung">Auswertung</a></p>`);
}

function results() {
  const { rated, table } = summarize(readRatings(), keysBySeed);
  if (rated < 10) return page('Auswertung', `<h1>Noch nicht genug Bewertungen</h1><p>${rated} von mindestens 10 Fragen bewertet. Die Modelle bleiben bis dahin verborgen.</p><p><a href="/">Zurück</a></p>`);
  const body = Object.entries(table).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v.beste}</td><td>${v.gut}</td><td>${v.ungenau}</td><td>${v.falsch}</td></tr>`).join('');
  return page('Auswertung', `<h1>Auswertung nach ${rated} Fragen</h1><table><tr><th>Modell</th><th>beste</th><th>gut</th><th>ungenau</th><th>falsch</th></tr>${body}</table><p><a href="/">Zurück</a></p>`);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (body, type = 'text/html; charset=utf-8') => { res.writeHead(200, { 'Content-Type': type }); res.end(body); };
  if (req.method === 'POST' && url.pathname === '/bewertung') {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      const { id, urteil, ...rest } = JSON.parse(raw);
      const ratings = readRatings();
      const entry = (ratings[id] ??= {});
      Object.assign(entry, rest);
      if (urteil) entry.urteil = { ...entry.urteil, ...urteil };
      fs.writeFileSync(ratingsFile, `${JSON.stringify(ratings, null, 1)}\n`);
      send('ok', 'text/plain');
    });
    return;
  }
  if (url.pathname === '/katex/katex.min.css') return send(fs.readFileSync(katexCss), 'text/css');
  if (url.pathname.startsWith('/katex/fonts/') || url.pathname.startsWith('/fonts/')) {
    const file = path.join(katexFonts, path.basename(url.pathname));
    if (fs.existsSync(file)) return send(fs.readFileSync(file), 'font/woff2');
  }
  const question = url.pathname.match(/^\/f\/(\d+)$/);
  if (question && seeds[+question[1] - 1]) return send(questionPage(+question[1] - 1));
  if (url.pathname === '/auswertung') return send(results());
  if (url.pathname === '/') return send(overview());
  res.writeHead(404);
  res.end();
});
server.listen(port, '127.0.0.1', () => console.log(`Review: http://127.0.0.1:${port}/`));
