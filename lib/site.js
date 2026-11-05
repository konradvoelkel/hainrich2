/**
 * Die öffentlichen Seiten als reine Funktionen. Seiten verweisen relativ, die Adresse steht nur in
 * Canonical und Sitemap. Mathematik wird hier gerendert, zum Lesen braucht niemand JavaScript.
 */
import { threadsOf, UNTERFOREN, unterforumOf } from './forum.js';
import { renderMarkdown } from './render.js';
import { quoteUrl } from './segment.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** muss zur Datei passen, das prüft der Bau; erzeugt von tools/render_brand.py */
export const OG_CARD = { file: 'og-card.png', width: 1200, height: 630, alt: 'Das Logo von hAInrich, ein fröhlicher Hai mit einem Toupet im Stil von Heinrich Heine. Daneben: Fragen und Antworten zum Skript „Einführung in Deep Learning“.' };
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
<meta name="robots" content="${site.vorschau ? 'noindex' : robots}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="hAInrich2">
<meta property="og:locale" content="de_DE">
<meta property="og:url" content="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(`${site.origin}${site.base}${OG_CARD.file}`)}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="${OG_CARD.width}">
<meta property="og:image:height" content="${OG_CARD.height}">
<meta property="og:image:alt" content="${esc(OG_CARD.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#6f59a6">
<link rel="icon" href="${root}favicon.ico" sizes="48x48">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="stylesheet" href="${root}katex/katex.min.css">
<link rel="stylesheet" href="${root}style.css">
${script ? `<script type="module" src="${root}app.js"></script>\n` : ''}</head>
<body>
${banner}<header class="kopf"><a class="marke" href="${root || './'}"><img src="${root}logo.svg" alt="" width="36" height="36">hAInrich2</a><span>Fragen und Antworten zum Skript „Einführung in Deep Learning“</span></header>
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

const dateOf = tag => tag.split('-').reverse().join('.');

function answerCard(answer, n, { root, tag }) {
  const person = `<aside class="autor"><img src="${root}logo.svg" alt="" width="56" height="56"><strong>hAInrich</strong><span class="bot">Bot</span></aside>`;
  const head = `<header><span class="meta">${dateOf(tag)}</span>${badge(answer.status)}<a class="nummer" href="#b${n}">#${n}</a></header>`;
  if (answer.status === 'kein_beleg') return `<article class="beitrag antwort" id="b${n}">${person}<div class="inhalt">${head}<p>${NICHTS_GEFUNDEN}</p></div></article>`;
  const marks = m => (m >= 1 && m <= answer.zitate.length ? `<a class="marke-zitat" href="#z${m}">[${m}]</a>` : null);
  return `<article class="beitrag antwort" id="b${n}">${person}<div class="inhalt">${head}
<div class="text">${renderMarkdown(answer.text, { marks })}</div>
<p class="hinweis">Diese Antwort hat ein Sprachmodell erzeugt (Claude von Anthropic)${answer.bearbeitet ? ', die Moderation hat sie bearbeitet' : ''}. Prüfen Sie das Zitat.</p>
<section class="zitate"><h2>Originaltext aus dem Skript</h2>
${answer.zitate.map((z, i) => quote(z, i + 1)).join('\n')}
</section></div></article>`;
}

const trail = (root, ...steps) => `<nav class="pfad" aria-label="Pfad"><a href="${root}">Forum</a>${steps.map(([href, text]) => ` <span aria-hidden="true">›</span> ${href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text)}`).join('')}</nav>`;

export function questionPage(question, site) {
  const root = '../../';
  const forum = unterforumOf(question.kapitel);
  const none = '<p class="hinweis">Zu dieser Frage gibt es noch keine Antwort.</p>';
  return shell({
    site,
    root,
    path: `f/${question.id}/`,
    title: `${question.text} | hAInrich2`,
    description: `Frage zum Kapitel ${question.kapitel}, beantwortet mit wörtlichem Zitat aus dem Skript.`,
    robots: reviewed(question) ? 'index,follow' : 'noindex',
    body: `${trail(root, [`../${forum.slug}/`, forum.titel], [null, question.kapitel])}
<article class="beitrag frage" id="b1"><aside class="autor"><span class="avatar" aria-hidden="true">?</span><strong>Frage</strong></aside><div class="inhalt"><header><span class="meta">${dateOf(question.tag)}</span>${question.herkunft === 'beispiel' ? '<span class="badge">Beispielfrage</span>' : ''}<a class="nummer" href="#b1">#1</a></header><h1>${esc(question.text)}</h1><p class="meta">${esc(question.kapitel)}</p></div></article>
${question.antworten.map((a, i) => answerCard(a, i + 2, { root, tag: question.tag })).join('\n') || none}`,
  });
}

const countReviewed = questions => questions.filter(reviewed).length;

export function indexPage(questions, site) {
  const rows = UNTERFOREN.map(forum => {
    const threads = threadsOf(forum, questions);
    return `<tr><th scope="row"><a href="f/${forum.slug}/">${esc(forum.titel)}</a><p>${esc(forum.beschreibung)}</p></th><td data-label="Themen">${threads.length}</td><td data-label="Geprüft">${countReviewed(threads)}</td></tr>`;
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
<section><h1>Forum</h1><p class="meta">Eigene Fragen lassen sich in dieser Fassung noch nicht stellen.</p>
<table class="liste foren">
<thead><tr><th scope="col">Unterforum</th><th scope="col">Themen</th><th scope="col">Geprüft</th></tr></thead>
<tbody>
${rows}
</tbody></table></section>`,
  });
}

export function forumPage(forum, questions, site) {
  const root = '../../';
  const threads = threadsOf(forum, questions);
  const rows = threads.map(q => `<tr><th scope="row"><a href="../${esc(q.id)}/">${esc(q.text)}</a><p>${esc(q.kapitel)}</p></th><td data-label="Antworten">${q.antworten.length}</td><td>${q.antworten[0] ? badge(q.antworten[0].status) : ''}</td></tr>`).join('\n');
  return shell({
    site,
    root,
    path: `f/${forum.slug}/`,
    title: `${forum.titel} | hAInrich2`,
    description: `${forum.beschreibung} Fragen zum Skript „Einführung in Deep Learning“.`,
    robots: threads.some(reviewed) ? 'index,follow' : 'noindex',
    body: `${trail(root, [null, forum.titel])}
<section><h1>${esc(forum.titel)}</h1><p class="meta">${esc(forum.beschreibung)}</p>
<table class="liste themen">
<thead><tr><th scope="col">Thema</th><th scope="col">Antworten</th><th scope="col">Status</th></tr></thead>
<tbody>
${rows}
</tbody></table></section>`,
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

/** Nur geprüfte Fragen (I9); solange es keine gibt oder die Site Vorschau ist, bleibt die Sitemap leer */
export function sitemap(questions, site) {
  const threads = site.vorschau ? [] : questions.filter(reviewed);
  const forums = UNTERFOREN.filter(forum => threadsOf(forum, threads).length).map(forum => forum.slug);
  const urls = [...forums, ...threads.map(q => q.id)].map(id => `<url><loc>${esc(`${site.origin}${site.base}f/${id}/`)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}

export function robotsTxt(site) {
  return `User-agent: *\nDisallow: ${site.base}models/\nDisallow: ${site.base}wasm/\nDisallow: ${site.base}daten/\nDisallow: ${site.base}mod/\nSitemap: ${site.origin}${site.base}sitemap.xml\n`;
}
