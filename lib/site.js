/**
 * Die öffentlichen Seiten als reine Funktionen. Seiten verweisen relativ, die Adresse steht nur in
 * Canonical und Sitemap. Mathematik wird hier gerendert, zum Lesen braucht niemand JavaScript.
 */
import { threadsOf, UNTERFOREN, unterforumOf } from './forum.js';
import { MAX_FRAGE, MIN_FRAGE, ZUSTIMMUNG } from './fragen.js';
import { esc, renderMarkdown, renderQuestion } from './render.js';
import { quoteUrl } from './segment.js';

export { esc };

/** muss zur Datei passen, das prüft der Bau; erzeugt von tools/render_brand.py */
export const OG_CARD = { file: 'og-card.png', width: 1200, height: 630, alt: 'Das Logo von hAInrich, ein fröhlicher Hai mit einem Toupet im Stil von Heinrich Heine. Daneben: Fragen und Antworten zum Skript „Einführung in Deep Learning“.' };
const NICHTS_GEFUNDEN = 'Dazu habe ich im Skript nichts gefunden.';
const BADGES = { ungeprüft: 'ungeprüft', geprüft: 'geprüft', kein_beleg: 'kein Beleg', entwurf: 'Entwurf' };
const reviewed = question => question.antworten.some(a => a.status === 'geprüft');
/** Wer für die Moderation unterschreibt. Solange es nur einen gibt, steht das hier und nicht am Konto (Plan D22) */
export const MODERATION = { name: 'Konrad Völkel', bild: 'moderation-konrad.jpg', url: 'https://www.konradvoelkel.com' };
/** Länge, ab der die Trefferliste abschneidet, grob */
const TITEL_LAENGE = 65;
const BESCHREIBUNG_LAENGE = 155;
const SUFFIX = ' | hAInrich2';
const CLAIM = 'Fragen und Antworten zum Skript „Einführung in Deep Learning“';

/** Eintrag für die Suche. `html` nur bei Formeln, der Text bleibt für die Stichworte */
export function searchEntry(question, vektor = question.vektor) {
  const html = renderQuestion(question.text);
  return { id: question.id, text: question.text, kapitel: question.kapitel, vektor, ...(html === esc(question.text) ? {} : { html }) };
}

/** Klartext für Trefferliste, Titel und Beschreibung: ohne Markdown. Einfache Formeln bleiben stehen, die anderen werden zu Auslassungen */
export function excerpt(text, length = 180) {
  const plain = text
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g, formula => {
      const tex = formula.replaceAll('$', '').trim();
      return /^[\p{L}\p{N} +\-=<>().,]+$/u.test(tex) ? tex : '…';
    })
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^[#>\s]+/gm, '')
    .replace(/[*`]|(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length).replace(/\s+\S*$/, '').replace(/[,;:]$/, '')} …` : plain;
}

/** Die volle Frage steht in der H1 */
const questionTitle = question => `${excerpt(question.text, TITEL_LAENGE - SUFFIX.length - 2)}${SUFFIX}`;

/** Der Anfang der Antwort sagt mehr als das Kapitel, am besten in ganzen Sätzen vor der ersten Auslassung. Die Marken [1] führen hier nirgends hin */
function questionDescription(question) {
  const answer = question.antworten.find(a => a.text);
  if (!answer) return `Frage zum Kapitel „${question.kapitel}“ im Skript „Einführung in Deep Learning“.`;
  const plain = excerpt(answer.text.replace(/\s*\[\d+\]/g, ''), BESCHREIBUNG_LAENGE - 2);
  const sentences = plain.match(/^[^…]*[.!?](?=\s)/)?.[0] ?? '';
  return sentences.length >= 50 ? sentences : plain;
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

function shell({ site, root, path, title, description, robots = 'noindex', body, script = null, claim = true }) {
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
${script ? `<script type="module" src="${root}${script}"></script>\n` : ''}</head>
<body>
${banner}<header class="kopf"><a class="marke" href="${root || './'}"><img src="${root}logo.svg" alt="" width="36" height="36">hAInrich2</a>${claim ? `<span>${CLAIM}</span>` : ''}</header>
<main>
${body}
</main>
<footer class="fuss"><p>Ein privates Angebot, nicht der Heinrich-Heine-Universität. Antworten des Bots erzeugt ein Sprachmodell, sie können falsch sein.</p>
<nav><a href="${root}ueber/">Über hAInrich2</a><a href="${esc(site.skript)}">Zum Skript</a><a href="${root}impressum/">Impressum</a><a href="${root}datenschutz/">Datenschutz</a>${site.fragen ? `<a href="${root}nutzungsbedingungen/">Nutzungsbedingungen</a>` : ''}<a href="${root}impressum/#inhalte-melden">Inhalt melden</a></nav></footer>
</body>
</html>
`;
}

const badge = status => `<span class="badge ${status === 'geprüft' ? 'gut' : 'offen'}">${esc(BADGES[status])}</span>`;

function quote(zitat, n, prefix) {
  const where = [zitat.titel, ...zitat.pfad.slice(-1)].map(esc).join(' › ');
  return `<figure id="${prefix}z${n}"><blockquote>${renderMarkdown(zitat.text)}</blockquote><figcaption>[${n}] <a href="${esc(zitat.url)}" rel="noopener">${where}</a></figcaption></figure>`;
}

const dateOf = tag => tag.split('-').reverse().join('.');

/** Die Summe steht fest in der Seite. Die Pfeile brauchen JavaScript, also blendet site/stimmen.js sie erst ein */
function voteBox(question, site) {
  if (!site.stimmen) return '';
  const arrow = (name, sign, label) => `<button type="button" class="pfeil ${name}" data-wert="${sign}" aria-label="${label}" aria-pressed="false" hidden>${sign > 0 ? '▲' : '▼'}</button>`;
  return `<div class="stimme" data-id="${esc(question.id)}">${arrow('hoch', 1, 'Gute Frage')}<span class="punkte" title="Punkte">${question.punkte ?? 0}</span>${arrow('runter', -1, 'Schlechte Frage')}</div>`;
}

/** beste zuerst; bei Gleichstand bleibt die Reihenfolge des Skripts */
const byPoints = threads => [...threads].sort((a, b) => (b.punkte ?? 0) - (a.punkte ?? 0));

const BOT_HINWEIS = 'Diese Antwort hat ein Sprachmodell erzeugt (Claude von Anthropic)';

function answerCard(answer, n, { root, tag, prefix = '', hinweis = `${BOT_HINWEIS}${answer.bearbeitet ? ', die Moderation hat sie bearbeitet' : ''}. Prüfen Sie das Zitat.` }) {
  const human = answer.art === 'moderation';
  const person = human ? `<aside class="autor"><a class="person" href="${MODERATION.url}" rel="noopener"><img class="gesicht" src="${root}${MODERATION.bild}" alt="" width="56" height="56"><strong>${MODERATION.name}</strong></a><span class="rolle">Moderation</span></aside>`
    : `<aside class="autor"><a class="person" href="${root}ueber/"><img src="${root}logo.svg" alt="" width="56" height="56"><strong>hAInrich2</strong></a><span class="bot">Bot</span></aside>`;
  const head = `<header><span class="meta">${dateOf(tag)}</span>${badge(answer.status)}<a class="nummer" href="#${prefix}b${n}">#${n}</a></header>`;
  if (answer.status === 'kein_beleg') return `<article class="beitrag antwort" id="b${n}">${person}<div class="inhalt">${head}<p>${NICHTS_GEFUNDEN}</p></div></article>`;
  const marks = m => (m >= 1 && m <= answer.zitate.length ? `<a class="marke-zitat" href="#${prefix}z${m}">[${m}]</a>` : null);
  return `<article class="beitrag antwort" id="${prefix}b${n}">${person}<div class="inhalt">${head}
<div class="text">${renderMarkdown(answer.text, { marks })}</div>
${human ? '' : `<p class="hinweis">${esc(hinweis)}</p>`}
${answer.zitate.length ? `<section class="zitate"><h2>Originaltext aus dem Skript</h2>
${answer.zitate.map((z, i) => quote(z, i + 1, prefix)).join('\n')}
</section>` : ''}</div></article>`;
}

/** Für „Meine Fragen“: dieselbe Karte, sie landet aber neben anderen auf einer Seite, also mit eigenen Sprungzielen. Bot bleibt erkennbar (I8) */
export const draftCard = row => answerCard({ status: 'entwurf', text: row.entwurf.text, zitate: row.entwurf.zitate }, 2, {
  root: '../../',
  tag: row.tag,
  prefix: `${row.id}-`,
  hinweis: 'Diesen Entwurf hat ein Sprachmodell erzeugt (Claude von Anthropic). Noch niemand hat ihn geprüft, und nur Sie sehen ihn. Prüfen Sie das Zitat.',
});

const trail = (root, ...steps) => `<nav class="pfad" aria-label="Pfad"><a href="${root}">Forum</a>${steps.map(([href, text]) => ` <span aria-hidden="true">›</span> ${href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text)}`).join('')}</nav>`;

export function questionPage(question, site) {
  const root = '../../';
  const forum = unterforumOf(question.kapitel);
  const none = '<p class="hinweis">Zu dieser Frage gibt es noch keine Antwort.</p>';
  return shell({
    site,
    root,
    path: `f/${question.id}/`,
    title: questionTitle(question),
    description: questionDescription(question),
    robots: reviewed(question) ? 'index,follow' : 'noindex',
    script: site.stimmen ? 'stimmen.js' : null,
    body: `${trail(root, [`../${forum.slug}/`, forum.titel], [null, question.kapitel])}
<article class="beitrag frage" id="b1"><aside class="autor"><span class="avatar" aria-hidden="true">?</span><strong>${question.herkunft === 'beispiel' ? 'Frage' : 'Anonymer Nutzer'}</strong>${voteBox(question, site)}</aside><div class="inhalt"><header><span class="meta">${dateOf(question.tag)}</span>${question.herkunft === 'beispiel' ? '<span class="badge">Beispielfrage</span>' : ''}<a class="nummer" href="#b1">#1</a></header><h1>${renderQuestion(question.text)}</h1><p class="meta">${esc(question.kapitel)}</p></div></article>
${question.antworten.map((a, i) => answerCard(a, i + 2, { root, tag: question.tag })).join('\n') || none}`,
  });
}

/** Überschrift einer Liste; solange man nicht fragen kann, ist es nur die Überschrift */
const listTitle = (site, root, title, tag = 'h1') => (site.fragen ? `<div class="titelzeile"><${tag}>${esc(title)}</${tag}><a class="knopf fragen" href="${root}f/neu/">Frage stellen</a></div>` : `<${tag}>${esc(title)}</${tag}>`);

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
    title: 'hAInrich2: Fragen zum Skript „Einführung in Deep Learning“',
    description: 'Fragen zum Skript „Einführung in Deep Learning“. Jede Antwort des Bots trägt das wörtliche Zitat aus dem Skript mit Link.',
    robots: questions.some(reviewed) ? 'index,follow' : 'noindex',
    script: 'app.js',
    claim: false,
    body: `<section class="einstieg"><h1>${CLAIM}</h1>
<p>Die meisten Antworten schreibt ein Sprachmodell, belegt mit wörtlichen Zitaten aus dem Skript, und die Moderation prüft sie. <a href="ueber/">Mehr über die Idee</a></p></section>
<section class="suche" id="suche" hidden>
<label for="suchfeld">Steht Ihre Frage schon hier?</label>
<input id="suchfeld" type="search" autocomplete="off" spellcheck="false" placeholder="Frage eintippen">
<p class="meta" id="suchstatus" role="status">Die Suche läuft in Ihrem Browser, was Sie tippen, verlässt ihn nicht. Beim ersten Klick lädt er dafür ${esc(site.ladegroesse)} von diesem Server.</p>
<div id="treffer" hidden><h2>Diese Fragen liegen am nächsten</h2><ol id="treffer-fragen"></ol><h2>Im Skript</h2><ol id="treffer-skript"></ol></div>
${site.fragen ? `<p class="hinweis" id="neue-frage" data-mindestens="${MIN_FRAGE}" hidden>Nichts Passendes dabei? <a class="knopf fragen" href="f/neu/">Diese Frage stellen</a></p>\n` : ''}</section>
<section>${listTitle(site, '', 'Forum', 'h2')}${site.fragen ? '' : '<p class="meta">Eigene Fragen lassen sich in dieser Fassung noch nicht stellen.</p>'}
<table class="liste foren">
<thead><tr><th scope="col">Unterforum</th><th scope="col">Themen</th><th scope="col">Geprüft</th></tr></thead>
<tbody>
${rows}
</tbody></table></section>`,
  });
}

export function forumPage(forum, questions, site) {
  const root = '../../';
  const threads = byPoints(threadsOf(forum, questions));
  const rows = threads.map(q => `<tr><th scope="row"><div class="thema">${voteBox(q, site)}<div><a href="../${esc(q.id)}/">${renderQuestion(q.text)}</a><p>${esc(q.kapitel)}</p></div></div></th><td data-label="Antworten">${q.antworten.length}</td><td>${q.antworten[0] ? badge(q.antworten[0].status) : ''}</td></tr>`).join('\n');
  return shell({
    site,
    root,
    path: `f/${forum.slug}/`,
    title: `${forum.titel} | hAInrich2`,
    description: `${forum.beschreibung} Fragen zum Skript „Einführung in Deep Learning“.`,
    robots: threads.some(reviewed) ? 'index,follow' : 'noindex',
    script: site.stimmen ? 'stimmen.js' : null,
    body: `${trail(root, [null, forum.titel])}
<section>${listTitle(site, root, forum.titel)}<p class="meta">${esc(forum.beschreibung)}</p>
<table class="liste themen">
<thead><tr><th scope="col">Thema</th><th scope="col">Antworten</th><th scope="col">Status</th></tr></thead>
<tbody>
${rows}
</tbody></table></section>`,
  });
}

/** Formulare und „Meine Fragen“ baut site/fragen.js; ohne JavaScript bleibt nur der Hinweis */
export function askPage(site) {
  const root = '../../';
  const hook = (id, text) => `<label class="haken"><input type="checkbox" id="${id}"${id === 'zustimmung' ? ' required' : ''}><span>${esc(text)}</span></label>`;
  return shell({
    site,
    root,
    path: 'f/neu/',
    title: 'Frage stellen | hAInrich2',
    description: 'Eine Frage zum Skript „Einführung in Deep Learning“ stellen.',
    script: 'fragen.js',
    body: `${trail(root, [null, 'Frage stellen'])}
<section><h1>Frage stellen</h1>
<p class="hinweis">Steht Ihre Frage vielleicht schon im Forum? Die <a href="${root}">Suche auf der Startseite</a> läuft in Ihrem Browser. Das Forum behandelt nur Inhalte des Skripts.</p>
<noscript><p class="fehler">Zum Fragen braucht diese Seite JavaScript, zum Lesen nicht.</p></noscript>
<form id="code" class="formular" hidden>
<label for="kurscode">Kurscode aus ILIAS</label>
<input id="kurscode" autocomplete="off" spellcheck="false" required>
<p class="fehler" role="alert" hidden></p>
<button class="haupt">Weiter</button>
</form>
<form id="frage" class="formular" data-zustimmung="${ZUSTIMMUNG.version}" hidden>
<label for="fragetext">Ihre Frage</label>
<textarea id="fragetext" rows="5" minlength="${MIN_FRAGE}" maxlength="${MAX_FRAGE}" required></textarea>
${hook('zustimmung', ZUSTIMMUNG.oeffentlich)}
${site.entwurf ? hook('einwilligung', ZUSTIMMUNG.entwurf) : ''}
<p class="hinweis">Mehr dazu unter <a href="${root}datenschutz/">Datenschutz</a> und <a href="${root}nutzungsbedingungen/">Nutzungsbedingungen</a>. Die Nutzung ist freiwillig und hat keinen Einfluss auf Ihre Bewertung.</p>
<p class="fehler" role="alert" hidden></p>
<button class="haupt">Frage absenden</button>
</form>
</section>
<section id="meine" hidden><h2>Meine Fragen</h2><p class="meta">Diese Liste liegt nur in diesem Browser.</p><ol class="meine" id="meine-liste"></ol></section>`,
  });
}

/** erste Quelle, die der Browser von fremdem Host laden würde; Links und Canonical zählen nicht */
export const foreignSource = html => html.match(/<(?:script|img|iframe|link(?![^>]*rel="canonical"))[^>]*(?:src|href)="(?:https?:)?\/\/[^"]*"/)?.[0] ?? null;

const slug = text => text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');

/** Rechtstexte und Ähnliches aus Markdown; Überschriften zweiter Ebene sind Sprungziele */
export function textPage(name, source, site, { description, robots } = {}) {
  const title = source.match(/^# (.+)$/m)?.[1] ?? name;
  const html = renderMarkdown(source).replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`);
  return shell({ site, root: '../', path: `${name}/`, title: title.includes('hAInrich2') ? title : `${title}${SUFFIX}`, description: description ?? `${title} von hAInrich2.`, robots, body: `<article class="dokument">${html}</article>` });
}

/** Nur geprüfte Fragen (I9) und was zu ihnen führt; solange es keine gibt oder die Site Vorschau ist, bleibt die Sitemap leer */
export function sitemap(questions, site) {
  const threads = site.vorschau ? [] : questions.filter(reviewed);
  const forums = UNTERFOREN.filter(forum => threadsOf(forum, threads).length).map(forum => forum.slug);
  const pages = threads.length ? ['', 'ueber/'] : [];
  const urls = [...pages, ...[...forums, ...threads.map(q => q.id)].map(id => `f/${id}/`)].map(page => `<url><loc>${esc(`${site.origin}${site.base}${page}`)}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}

export function robotsTxt(site) {
  return `User-agent: *\nDisallow: ${site.base}models/\nDisallow: ${site.base}wasm/\nDisallow: ${site.base}daten/\nDisallow: ${site.base}mod/\nDisallow: ${site.base}api/\nSitemap: ${site.origin}${site.base}sitemap.xml\n`;
}
