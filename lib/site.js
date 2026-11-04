/**
 * Die öffentlichen Seiten als reine Funktionen. Seiten verweisen relativ, die Adresse steht nur in
 * Canonical und Sitemap. Mathematik wird hier gerendert, zum Lesen braucht niemand JavaScript.
 */
import { renderMarkdown } from './render.js';
import { quoteUrl } from './segment.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const NICHTS_GEFUNDEN = 'Dazu habe ich im Skript nichts gefunden.';
const BADGES = { ungeprüft: 'ungeprüft', geprüft: 'geprüft', kein_beleg: 'kein Beleg' };
const reviewed = question => question.antworten.some(a => a.status === 'geprüft');

/** Klartext für die Trefferliste: ohne Markdown, Formeln werden zu Auslassungen */
export function excerpt(text, length = 180) {
  const plain = text
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g, '…')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length).replace(/\s+\S*$/, '')} …` : plain;
}

/**
 * Was öffentlich wird. Allowlist statt Kopie: Prüfhinweise, Tokens und Versuche bleiben draußen. Zitate
 * kommen aus dem Korpus, nie aus der Antwort (I4); ein geänderter Skripttext bricht den Build.
 */
export function publicQuestion(seed, row, passages, day) {
  const byId = new Map(passages.map(p => [p.id, p]));
  const zitate = (row.cited ?? []).map(c => {
    const passage = byId.get(c.id);
    if (!passage || passage.hash !== c.hash) throw new Error(`${seed.id}: Zitat ${c.id} passt nicht zum Korpus`);
    return { titel: passage.title, pfad: passage.path, text: passage.text, url: quoteUrl(passage) };
  });
  const kapitel = passages.find(p => p.page === seed.kapitel)?.title ?? seed.kapitel;
  const antworten = row.status === 'ok' ? [{ art: 'bot', status: 'ungeprüft', modell: row.model, text: row.text, zitate }]
    : row.status === 'kein_beleg' ? [{ art: 'bot', status: 'kein_beleg', modell: row.model, text: null, zitate: [] }] : [];
  return { id: seed.id, text: seed.frage, kapitel, herkunft: 'beispiel', tag: day, antworten };
}

function shell({ site, root, path, title, description, robots = 'noindex', body, script = false }) {
  const url = `${site.origin}${site.base}${path}`;
  const banner = site.vorschau ? '<p class="vorschau">Vorschau, nicht veröffentlicht.</p>' : '';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="hAInrich2">
<meta property="og:locale" content="de_DE">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root}katex/katex.min.css">
<link rel="stylesheet" href="${root}style.css">
${script ? `<script type="module" src="${root}app.js"></script>\n` : ''}</head>
<body>
${banner}<header class="kopf"><a class="marke" href="${root || './'}">hAInrich2</a><span>Fragen und Antworten zum Skript „Einführung in Deep Learning“</span></header>
<main>
${body}
</main>
<footer class="fuss"><p>Ein privates Angebot, nicht der Heinrich-Heine-Universität. Antworten des Bots erzeugt ein Sprachmodell, sie können falsch sein.</p>
<nav><a href="${esc(site.skript)}">Zum Skript</a><a href="${root}impressum/">Impressum</a><a href="${root}datenschutz/">Datenschutz</a><a href="${root}impressum/#inhalte-melden">Inhalt melden</a></nav></footer>
</body>
</html>
`;
}

const badge = status => `<span class="badge ${status === 'geprüft' ? 'gut' : 'offen'}">${esc(BADGES[status])}</span>`;

function quote(zitat, n) {
  const where = [zitat.titel, ...zitat.pfad.slice(-1)].map(esc).join(' › ');
  return `<figure id="z${n}"><blockquote>${renderMarkdown(zitat.text)}</blockquote><figcaption>[${n}] <a href="${esc(zitat.url)}" rel="noopener">${where}</a></figcaption></figure>`;
}

function answerCard(answer) {
  const head = `<header><span class="bot">Bot</span><strong>hAInrich</strong>${badge(answer.status)}</header>`;
  if (answer.status === 'kein_beleg') return `<article class="antwort">${head}<p>${NICHTS_GEFUNDEN}</p></article>`;
  const marks = n => (n >= 1 && n <= answer.zitate.length ? `<a class="marke-zitat" href="#z${n}">[${n}]</a>` : null);
  return `<article class="antwort">${head}
<div class="text">${renderMarkdown(answer.text, { marks })}</div>
<p class="hinweis">Diese Antwort hat ein Sprachmodell erzeugt (Claude von Anthropic). Prüfen Sie das Zitat.</p>
<section class="zitate"><h2>Originaltext aus dem Skript</h2>
${answer.zitate.map((z, i) => quote(z, i + 1)).join('\n')}
</section></article>`;
}

export function questionPage(question, site) {
  const none = '<p class="hinweis">Zu dieser Frage gibt es noch keine Antwort.</p>';
  return shell({
    site,
    root: '../../',
    path: `f/${question.id}/`,
    title: `${question.text} | hAInrich2`,
    description: `Frage zum Kapitel ${question.kapitel}, beantwortet mit wörtlichem Zitat aus dem Skript.`,
    robots: reviewed(question) ? 'index,follow' : 'noindex',
    body: `<p class="pfad"><a href="../../">Alle Fragen</a></p>
<article class="frage"><p class="meta">${question.herkunft === 'beispiel' ? '<span class="badge">Beispielfrage</span>' : ''}${esc(question.kapitel)}</p><h1>${esc(question.text)}</h1></article>
${question.antworten.map(answerCard).join('\n') || none}`,
  });
}

export function indexPage(questions, site) {
  const rows = questions.map(q => {
    const status = q.antworten[0]?.status;
    return `<li><a href="f/${esc(q.id)}/">${esc(q.text)}</a><p class="meta">${esc(q.kapitel)}${status ? badge(status) : ''}</p></li>`;
  }).join('\n');
  return shell({
    site,
    root: '',
    path: '',
    title: 'hAInrich2: Fragen und Antworten zum Skript „Einführung in Deep Learning“',
    description: 'Fragen zum Skript „Einführung in Deep Learning“. Jede Antwort trägt das wörtliche Zitat aus dem Skript mit Link.',
    robots: questions.some(reviewed) ? 'index,follow' : 'noindex',
    script: true,
    body: `<section class="suche" id="suche" hidden>
<label for="suchfeld">Steht Ihre Frage schon hier?</label>
<input id="suchfeld" type="search" autocomplete="off" spellcheck="false" placeholder="Frage eintippen">
<p class="meta" id="suchstatus" role="status">Die Suche läuft in Ihrem Browser, was Sie tippen, verlässt ihn nicht. Beim ersten Klick lädt er dafür ${esc(site.ladegroesse)} von diesem Server.</p>
<div id="treffer" hidden><h2>Diese Fragen liegen am nächsten</h2><ol id="treffer-fragen"></ol><h2>Im Skript</h2><ol id="treffer-skript"></ol></div>
</section>
<section><h1>Alle Fragen</h1><p class="meta">Eigene Fragen lassen sich in dieser Fassung noch nicht stellen.</p>
<ul class="fragen">
${rows}
</ul></section>`,
  });
}

/** erste Quelle, die der Browser von fremdem Host laden würde; Links und Canonical zählen nicht */
export const foreignSource = html => html.match(/<(?:script|img|iframe|link(?![^>]*rel="canonical"))[^>]*(?:src|href)="(?:https?:)?\/\/[^"]*"/)?.[0] ?? null;

const slug = text => text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

/** Rechtstexte und Ähnliches aus Markdown; Überschriften zweiter Ebene sind Sprungziele */
export function textPage(name, source, site) {
  const title = source.match(/^# (.+)$/m)?.[1] ?? name;
  const html = renderMarkdown(source).replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`);
  return shell({ site, root: '../', path: `${name}/`, title: `${title} | hAInrich2`, description: `${title} von hAInrich2.`, body: `<article class="dokument">${html}</article>` });
}

/** Nur geprüfte Fragen (I9); solange es keine gibt, bleibt die Sitemap leer */
export function sitemap(questions, site) {
  const urls = questions.filter(reviewed).map(q => `<url><loc>${esc(`${site.origin}${site.base}f/${q.id}/`)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}

export function robotsTxt(site) {
  return `User-agent: *\nDisallow: ${site.base}models/\nDisallow: ${site.base}wasm/\nDisallow: ${site.base}daten/\nSitemap: ${site.origin}${site.base}sitemap.xml\n`;
}
