/**
 * Die öffentlichen Seiten als reine Funktionen. Seiten verweisen relativ, die Adresse steht nur in
 * Canonical und Sitemap. Mathematik wird hier gerendert, zum Lesen braucht niemand JavaScript.
 */
import { KAPITEL, threadsOf, UNTERFOREN, unterforumOf } from './forum.js';
import { CC0, MAX_FRAGE, MIN_FRAGE, ZUSTIMMUNG } from './fragen.js';
import { esc, renderMarkdown, renderQuestion } from './render.js';
import { mathFences, quoteUrl } from './segment.js';

export { esc };

/** muss zur Datei passen, das prüft der Bau; erzeugt von tools/render_brand.py */
export const OG_CARD = { file: 'og-card.png', width: 1200, height: 630, alt: 'Das Logo von hAInrich2, ein fröhlicher Hai mit einem Toupet im Stil von Heinrich Heine. Daneben: Fragen und Antworten zum Skript „Einführung in Deep Learning“.' };
const NICHTS_GEFUNDEN = 'Dazu habe ich im Skript nichts gefunden.';
const BADGES = { ungeprüft: 'ungeprüft', geprüft: 'geprüft', kein_beleg: 'kein Beleg', entwurf: 'Entwurf' };
/**
 * Geprüft ist eine Frage erst, wenn jede sichtbare Antwort geprüft ist: Steht neben einer geprüften eine ungeprüfte, bleibt die Seite
 * draußen (I9, research/2026-11-16-seo-audit, Befund 15). Ohne Antwort gibt es nichts Geprüftes.
 */
const reviewed = question => question.antworten.length > 0 && question.antworten.every(a => a.status === 'geprüft');
const BETREIBER = { name: 'Konrad Völkel', url: 'https://www.konradvoelkel.com' };
/** Wer für die Moderation unterschreibt und prüft. Solange es nur einen gibt, steht das hier und nicht am Konto (Plan D22, D29) */
export const MODERATION = { ...BETREIBER, bild: 'moderation-konrad.jpg', rolle: 'Autor des Skripts' };
/** Lizenz des Skripts und der Zitate daraus, und seit dem 2026-11-17 auch der Antworten im Forum, des Bots wie der Moderation (Plan D30) */
const SKRIPT_LIZENZ = { name: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.de', kanonisch: 'https://creativecommons.org/licenses/by-sa/4.0/' };
/** Länge, ab der die Trefferliste abschneidet, grob */
const TITEL_LAENGE = 65;
const BESCHREIBUNG_LAENGE = 155;
const SUFFIX = ' | hAInrich2';
const SKRIPT = '„Einführung in Deep Learning“';
const CLAIM = `Fragen und Antworten zum Skript ${SKRIPT}`;
/**
 * Eine Kapitelseite mit ein oder zwei Fragen ist eine dünne Liste. In den Index und in die Sitemap kommt sie erst ab dieser Zahl
 * geprüfter Fragen (research/2026-11-16-seo-audit, Befund 3); darunter bleibt sie Navigation.
 */
const KAPITEL_INDEX_AB = 3;
const chapterIndexable = threads => threads.filter(reviewed).length >= KAPITEL_INDEX_AB;

/** Eintrag für die Suche. `html` nur bei Formeln, der Text bleibt für die Stichworte */
export function searchEntry(question, vektor = question.vektor) {
  const html = renderQuestion(question.text);
  return { id: question.id, text: question.text, kapitel: question.kapitel, vektor, ...(html === esc(question.text) ? {} : { html }) };
}

const TEX_ZEICHEN = {
  cdot: '·', times: '×', in: '∈', to: '→', rightarrow: '→', mapsto: '↦', le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠', approx: '≈', infty: '∞', pm: '±',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', eta: 'η', theta: 'θ', lambda: 'λ', mu: 'μ', sigma: 'σ', tau: 'τ', phi: 'φ',
  varphi: 'φ', omega: 'ω', nabla: '∇', partial: '∂', log: 'log', exp: 'exp', max: 'max', min: 'min', tanh: 'tanh',
  colon: ':', circ: '∘', top: '⊤', lfloor: '⌊', rfloor: '⌋', lceil: '⌈', rceil: '⌉',
};
/** Zähler, Nenner, Hoch- und Tiefgestelltes: ein einzelnes Wort bleibt nackt, alles andere bekommt Klammern */
const texGroup = inner => (/^[\p{L}\p{N}]+$/u.test(inner.trim()) ? inner.trim() : `(${inner.trim()})`);
const TEX_MENGEN = { R: 'ℝ', N: 'ℕ', Z: 'ℤ', Q: 'ℚ', C: 'ℂ' };
/** Steht im Ausschnitt für den Unterstrich einer Formel, bis die Markdown-Zeichen weg sind: sonst verlören `(Ax)_j` und `∇_b` ihren Index */
const INDEX = '\uE000';

/**
 * Eine Formel als Text, wenn sie sich in einer Zeile lesen lässt: `w \cdot x + b` wird „w · x + b“, ein einfacher Bruch „a/b“,
 * `\lfloor x \rfloor` wird „⌊x⌋“. Summen und alles Geschachtelte bleiben eine Auslassung, sonst stünde TeX in Titel und Beschreibung.
 */
function formulaText(formula) {
  const text = formula.replaceAll('$', '')
    .replace(/\\mathbb\{([RNZQC])\}/g, (_, menge) => TEX_MENGEN[menge])
    .replace(/\\(?:mathbf|mathrm|mathit|text|operatorname)\{([^{}]*)\}/g, '$1')
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|big|Big)(?![a-zA-Z])/g, '')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, oben, unten) => `${texGroup(oben)}/${texGroup(unten)}`)
    .replace(/\^\\top(?![a-zA-Z])/g, 'ᵀ')
    .replace(/\\([a-zA-Z]+)/g, (all, name) => TEX_ZEICHEN[name] ?? all)
    .replace(/\\[,;! ]/g, ' ')
    .replace(/([\^_])\{([^{}]*)\}/g, (_, mark, inner) => `${mark}${texGroup(inner).replace(/\s*×\s*/g, '×')}`)
    .replace(/⌊\s+|\s+⌋|⌈\s+|\s+⌉/g, m => m.trim())
    .replace(/\s+/g, ' ')
    .trim();
  return /^[\p{L}\p{N} +\-=<>().,·×∈→↦≤≥≠≈∞±∇∂ℝℕℤℚℂ∘⊤⌊⌋⌈⌉[\]|/:^_']+$/u.test(text) ? text.replaceAll('_', INDEX) : '…';
}

/** Klartext für Trefferliste, Titel und Beschreibung: ohne Markdown und Listenzeichen. Lesbare Formeln bleiben stehen, die anderen werden zu Auslassungen */
export function excerpt(text, length = 180) {
  const plain = mathFences(text)
    .replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g, formulaText)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, '')
    .replace(/^[#>\s]+/gm, '')
    .replace(/[*`]|(?<![\p{L}\p{N}])_|_(?![\p{L}\p{N}])/gu, '')
    .replaceAll(INDEX, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? `${plain.slice(0, length).replace(/\s+\S*$/, '').replace(/[,;:]$/, '')} …` : plain;
}

/** Der Kurztitel der Moderation, sonst der Anfang der Frage (Plan D31). Die volle Frage steht in der H1 */
const questionTitle = question => `${question.kurztitel || excerpt(question.text, TITEL_LAENGE - SUFFIX.length - 2)}${SUFFIX}`;

/** Die Zitatmarken [1] führen außerhalb der Seite nirgends hin. In Code und Formeln ist `x[1]` keine Marke und bleibt stehen */
const withoutMarks = text => text.split(/(```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]*?\$\$|\$[^$\n]*\$)/).map((part, i) => (i % 2 ? part : part.replace(/\s*\[\d+\]/g, ''))).join('');

/** Nach diesen Kürzeln endet kein Satz */
const KEIN_SATZENDE = /(?:\b(?:z\. ?B|d\. ?h|u\. ?a|o\. ?ä|bzw|ca|vgl|ggf|evtl|sog|inkl|usw|etc|Nr|Abb|Kap|S)\.|\b\d+\.)$/u;
const BESCHREIBUNG_MINDESTENS = 70;

/** Der Text in Sätzen. Ein Punkt hinter „z. B.“ oder einer Zahl trennt nicht */
function sentencesOf(plain) {
  const sentences = [];
  for (const part of plain.split(/(?<=[.!?])\s+/)) {
    if (sentences.length && KEIN_SATZENDE.test(sentences.at(-1))) sentences[sentences.length - 1] += ` ${part}`;
    else sentences.push(part);
  }
  return sentences;
}

/**
 * Die Beschreibung ist der Anfang der Antwort, in ganzen Sätzen, solange sie passen. Eine Formel, die sich nicht als Text lesen lässt,
 * wird zur Auslassung, und mit einer Auslassung mittendrin taugt ein Satz nicht als Treffertext: Davor ist Schluss. Bleibt es so unter
 * 70 Zeichen, kommt der Anfang des nächsten Satzes dazu, gekürzt am Wortende (research/2026-11-17-seo-audit, Befund 5: sieben waren zu
 * kurz, vier trugen „…“ an der Stelle einer Formel). Nur wenn schon der erste Satz eine solche Formel trägt, bleibt die Auslassung.
 */
export function questionDescription(question) {
  const answer = question.antworten.find(a => a.text);
  if (!answer) return `Frage zum Kapitel „${question.kapitel}“ im Skript „Einführung in Deep Learning“.`;
  const limit = BESCHREIBUNG_LAENGE - 2;
  const plain = excerpt(withoutMarks(answer.text).replace(/\s*\[(?:\.\.\.|…)\]/g, ''), Infinity);
  const sentences = sentencesOf(plain);
  let text = '';
  let next = 0;
  while (next < sentences.length && !sentences[next].includes('…') && `${text} ${sentences[next]}`.trim().length <= limit) {
    text = `${text} ${sentences[next]}`.trim();
    next += 1;
  }
  if (text.length >= BESCHREIBUNG_MINDESTENS || next === sentences.length) return text || excerpt(plain, limit);
  /** der nächste Satz passt nicht ganz: sein Anfang bis vor die Auslassung oder bis zur Länge, mit „…“ am Ende */
  const rest = sentences[next].split('…')[0].trim();
  const room = limit - text.length - 3;
  const cut = rest.length > room ? rest.slice(0, room).replace(/\s+\S*$/, '') : rest;
  const more = cut.replace(/[\s,;:(]+$/, '');
  if (more.split(/\s+/).length >= 3) return `${text} ${more} …`.trim();
  return text.length >= 40 ? text : excerpt(plain, limit);
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
  /** Die Beispielfragen stammen vom Betreiber und sind gemeinfrei (Plan D30) */
  return { id: seed.id, text: seed.frage, kapitel, herkunft: 'beispiel', tag: day, antworten, lizenz: CC0.kennung };
}

/** Für die Suche. `<` ist maskiert, sonst beendet ein `</script>` im Text den Block. Ausgeführt wird nichts, die CSP lässt das durch */
const jsonLd = data => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replaceAll('<', '\\u003c')}</script>\n`;

/** Der sichtbare Pfad. Ein Schritt ohne Adresse ist die Seite selbst; auf einer Frageseite endet der Pfad beim Kapitel, und das hat eine */
const crumbs = (site, ...steps) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['', 'Forum'], ...steps].map(([href, name], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(href === null ? {} : { item: `${site.origin}${site.base}${href}` }) })),
});

const betreiberId = site => `${site.origin}${site.base}#betreiber`;
const betreiber = site => ({ '@type': 'Person', '@id': betreiberId(site), ...BETREIBER });

/**
 * `QAPage` für eine geprüfte Frage (Plan D32, research/2026-11-16-seo-audit, findings/strukturierte-daten.md). Nur was sichtbar und
 * geprüft ist. Der Bot steht als Bot da, nie die Moderation als Autorin seines Textes. Keine Stimmen, die stehen nicht fest in der Seite,
 * und kein erfundenes Datum: Von einer Antwort kennt die Datenbank nur den Tag der Prüfung. Formeln bleiben LaTeX.
 */
/** Die Stellen des Skripts, auf die sich eine Antwort stützt. Mehrere Zitate aus einem Abschnitt führen ohne Textfragment auf dieselbe Adresse: Sie steht einmal da */
function sources(zitate) {
  const stellen = new Map();
  for (const z of zitate) {
    const url = z.url.replace(/:~:.*$/, '').replace(/#$/, '');
    if (!stellen.has(url)) stellen.set(url, [z.titel, ...z.pfad.slice(-1)].join(' › '));
  }
  return [...stellen].map(([url, name]) => ({ '@type': 'CreativeWork', name, url }));
}

function qaPage(question, site) {
  if (!reviewed(question)) return null;
  const url = `${site.origin}${site.base}f/${question.id}/`;
  const answers = question.antworten.map((a, i) => ({
    human: a.art === 'moderation',
    data: {
      '@type': 'Answer',
      url: `${url}#b${i + 2}`,
      text: withoutMarks(a.text).trim(),
      license: SKRIPT_LIZENZ.kanonisch,
      ...(a.bearbeitet && a.geprueftAm ? { dateModified: a.geprueftAm } : {}),
      author: a.art === 'moderation' ? { '@id': betreiberId(site) } : { '@type': 'Organization', name: 'hAInrich2-Bot (Claude von Anthropic), von der Moderation geprüft' },
      ...(a.zitate.length ? { citation: sources(a.zitate) } : {}),
    },
  }));
  /** die Antwort der Moderation gilt, die des Bots daneben ist ein Vorschlag; gibt es nur die des Bots, hat die Moderation sie geprüft */
  const accepted = answers.find(a => a.human) ?? answers[0];
  const others = answers.filter(a => a !== accepted).map(a => a.data);
  /**
   * Der Prüfvermerk in maschinenlesbarer Form (Konrad, 2026-11-17, Audit vom selben Tag, Befund 9b): wer die Seite geprüft hat und wann
   * zuletzt. Hierher kommt nur eine Frage, an der jede Antwort geprüft ist; ein Datum steht nur da, wenn die Datenbank eins kennt.
   */
  const geprueft = question.antworten.map(a => a.geprueftAm).filter(Boolean).sort().at(-1);
  return {
    '@graph': [{
      '@type': 'QAPage',
      '@id': url,
      inLanguage: 'de',
      reviewedBy: { '@id': betreiberId(site) },
      ...(geprueft ? { lastReviewed: geprueft } : {}),
      mainEntity: {
        '@type': 'Question',
        name: excerpt(question.text, 300),
        text: question.text,
        answerCount: answers.length,
        dateCreated: question.tag,
        ...(question.lizenz === CC0.kennung ? { license: CC0.kanonisch } : {}),
        ...(question.herkunft === 'beispiel' ? { author: { '@id': betreiberId(site) } } : {}),
        acceptedAnswer: accepted.data,
        ...(others.length ? { suggestedAnswer: others } : {}),
      },
    }, betreiber(site)],
  };
}

/**
 * Der Fuß führt auch zur Anmeldung der Moderation (Konrad, 2026-11-17). Die Seite dahinter steht in `robots.txt` und trägt selbst
 * `noindex,nofollow`; `rel="nofollow"` sagt es schon am Link. Im lokalen Bau ohne Web-Prozess führt er ins Leere.
 */
function shell({ site, root, path, title, description, robots = 'noindex', body, script = null, claim = true, daten = null, canonical = true }) {
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
${canonical ? `<link rel="canonical" href="${esc(url)}">\n` : ''}<meta property="og:type" content="website">
<meta property="og:site_name" content="hAInrich2">
<meta property="og:locale" content="de_DE">
${canonical ? `<meta property="og:url" content="${esc(url)}">\n` : ''}<meta property="og:title" content="${esc(title)}">
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
<link rel="preload" href="${root}schrift/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}katex/katex.min.css">
<link rel="stylesheet" href="${root}style.css">
${[script].flat().filter(Boolean).map(name => `<script type="module" src="${root}${name}"></script>\n`).join('')}${[daten].flat().filter(Boolean).map(jsonLd).join('')}</head>
<body>
<a class="sprung" href="#inhalt">Zum Inhalt</a>
${banner}<header class="kopf"><a class="marke" href="${root || './'}"><img src="${root}logo.svg" alt="" width="36" height="36">hAInrich2</a>${claim ? `<span>${CLAIM}</span>` : ''}</header>
<main id="inhalt">
${body}
</main>
<footer class="fuss"><p>Ein privates Angebot von <a href="${root}impressum/">${BETREIBER.name}</a>, nicht der Heinrich-Heine-Universität. Antworten des Bots erzeugt ein Sprachmodell, sie können falsch sein.</p>
<nav><a href="${root}ueber/">Über hAInrich2</a><a href="${esc(site.skript)}">Zum Skript</a><a href="${root}impressum/">Impressum</a><a href="${root}datenschutz/">Datenschutz</a>${site.fragen ? `<a href="${root}nutzungsbedingungen/">Nutzungsbedingungen</a>` : ''}<a href="${root}impressum/#inhalte-melden">Inhalt melden</a><a href="${root}mod/" rel="nofollow">Moderation</a></nav></footer>
</body>
</html>
`;
}

const badge = status => `<span class="badge ${status === 'geprüft' ? 'gut' : 'offen'}">${esc(BADGES[status])}</span>`;

/** Der Folienlink am Kapitelanfang ist Navigation, kein Inhalt, und zeigt oft auf ein Deck, das noch nicht freigegeben ist */
const withoutSlides = text => text.replace(/^\[(Folien VL[^\]]*)\]\([^)]*\)\s*/, (link, label) => (link.length < text.length ? '' : label));

/**
 * Ein langes Zitat ist eingeklappt und zeigt seinen Anfang: Auf dem Telefon nahmen die Zitate zwei Drittel einer Frageseite ein
 * (research/2026-11-16-seo-audit, Befund 10). Die Quelle bleibt immer sichtbar, der Wortlaut ist einen Klick entfernt und steht
 * vollständig im HTML. Ein kurzes Zitat bleibt offen, da lohnt der Klick nicht.
 */
const ZITAT_OFFEN_BIS = 220;
const ZITAT_ANRISS = 120;
const longQuote = zitat => excerpt(withoutSlides(zitat.text), ZITAT_OFFEN_BIS).endsWith(' …');

function quote(zitat, n, prefix) {
  const where = [zitat.titel, ...zitat.pfad.slice(-1)].map(esc).join(' › ');
  const text = withoutSlides(zitat.text);
  const voll = `<blockquote>${renderMarkdown(text)}</blockquote>`;
  const inhalt = longQuote(zitat) ? `<details><summary><span class="anriss">${esc(excerpt(text, ZITAT_ANRISS))}</span> <span class="mehr zu">ganzes Zitat</span> <span class="mehr auf">einklappen</span></summary>${voll}</details>` : voll;
  return `<figure id="${prefix}z${n}">${inhalt}<figcaption>[${n}] <a href="${esc(zitat.url)}" rel="noopener">${where}</a></figcaption></figure>`;
}

const dateOf = tag => tag.split('-').reverse().join('.');
const zeit = tag => `<time datetime="${esc(tag)}">${dateOf(tag)}</time>`;

/** Die Summe steht fest in der Seite. Die Pfeile brauchen JavaScript, also blendet site/stimmen.js sie erst ein */
function voteBox(question, site) {
  if (!site.stimmen) return '';
  const arrow = (name, sign, label) => `<button type="button" class="pfeil ${name}" data-wert="${sign}" aria-label="${label}" aria-pressed="false" hidden>${sign > 0 ? '▲' : '▼'}</button>`;
  return `<div class="stimme" data-id="${esc(question.id)}">${arrow('hoch', 1, 'Gute Frage')}<span class="punkte" title="Punkte">${question.punkte ?? 0}</span><span class="nur-vorlesen"> Punkte</span>${arrow('runter', -1, 'Schlechte Frage')}</div>`;
}

/** beste zuerst; bei Gleichstand bleibt die Reihenfolge des Skripts */
const byPoints = threads => [...threads].sort((a, b) => (b.punkte ?? 0) - (a.punkte ?? 0));

const BOT_HINWEIS = 'Diese Antwort hat ein Sprachmodell erzeugt (Claude von Anthropic)';

/** Stufe 1 aus research/2026-11-11-threat-model, A4: ein Link an jedem Beitrag, ohne neuen Schreibweg. Gemeldet wird per Mail. Der Name nennt den Beitrag, sonst hört ein Vorleseprogramm mehrmals nur „Melden“ */
/** Aus der Schreibweise der Impressen („mail [at] host [punkt] de“ in `site/site.env`) die Adresse. Was keine ergibt, ist null */
export function mailOf(kontakt) {
  const mail = String(kontakt ?? '').replaceAll(' [at] ', '@').replaceAll(' [punkt] ', '.').trim();
  return /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(mail) ? mail : null;
}

/**
 * „Melden“ öffnet eine vorbereitete E-Mail (Konrad, 2026-11-17: „nur mit vorformulierter mailto, wie es auch assess löst“; Plan D42,
 * research/2026-11-11-threat-model A4). Die Seite sendet dabei nichts und braucht kein Skript: Erst wer die E-Mail abschickt, sendet
 * etwas. Die Nachricht nennt den Beitrag und zählt die Gründe auf, die das Impressum unter „Inhalte melden“ nennt. Kennt die Seite
 * keine Adresse (`site.melden`), führt der Link wie bisher dorthin.
 */
const MELDUNG = `Guten Tag,

ich melde diesen Beitrag:
__ADRESSE__

Grund (bitte stehen lassen, was zutrifft):
- Die Antwort ist fachlich falsch.
- Das Zitat passt nicht zur Antwort.
- Der Beitrag enthält etwas über mich oder über jemand anderen.
- Der Inhalt ist rechtswidrig.
- Etwas anderes.

Was genau:

`;
function melden(root, n, meldung = null) {
  const name = `aria-label="Beitrag ${n} melden"`;
  if (!meldung?.an) return `<a class="melden" href="${root}impressum/#inhalte-melden" ${name}>Melden</a>`;
  /** RFC 6068: Zeilenenden als CRLF, Leerzeichen als %20 */
  const query = `subject=${encodeURIComponent(`hAInrich2: Meldung zu ${meldung.pfad}#b${n}`)}&body=${encodeURIComponent(MELDUNG.replace('__ADRESSE__', `${meldung.seite}#b${n}`).replaceAll('\n', '\r\n'))}`;
  return `<a class="melden" href="${esc(`mailto:${meldung.an}?${query}`)}" ${name} title="Öffnet eine vorbereitete E-Mail">Melden</a>`;
}

/**
 * Wer geprüft hat und wann (Plan D29). An der eigenen Antwort der Moderation steht ihr Name schon daneben. Das Datum ist Text und kein
 * `<time>`: trafilatura streicht das Element, im extrahierten Text stand „Geprüft am von …“ (gemessen am 2026-11-17). Maschinenlesbar
 * steht der Tag als `lastReviewed` im `QAPage`.
 */
function reviewNote(answer, root) {
  if (answer.status !== 'geprüft' || answer.art === 'moderation') return '';
  return `<p class="pruefung">Geprüft${answer.geprueftAm ? ` am ${dateOf(answer.geprueftAm)}` : ''} von <a href="${root}ueber/#wer-prüft">${MODERATION.name}</a>, ${MODERATION.rolle}.</p>`;
}

/**
 * Was ein Sprachmodell schreibt und noch niemand geprüft hat, darf nur ins Skript verlinken (research/2026-11-11-threat-model, D2).
 * Mit der Prüfung verantwortet die Moderation den Text, auch seine Links.
 */
const botLinks = (answer, skript) => (answer.art === 'moderation' || answer.status === 'geprüft' ? null : href => !!skript && href.startsWith(skript));

function answerCard(answer, n, { root, tag, skript, meldung = null, prefix = '', hinweis = `${BOT_HINWEIS}${answer.bearbeitet ? ', die Moderation hat sie bearbeitet' : ''}. Prüfen Sie das Zitat.` }) {
  const human = answer.art === 'moderation';
  const person = human ? `<aside class="autor"><a class="person" href="${MODERATION.url}" rel="noopener"><img class="gesicht" src="${root}${MODERATION.bild}" alt="" width="56" height="56"><strong>${MODERATION.name}</strong></a><span class="rolle">Moderation</span></aside>`
    : `<aside class="autor"><a class="person" href="${root}ueber/"><img src="${root}logo.svg" alt="" width="56" height="56"><strong>hAInrich2</strong></a><span class="bot">Bot</span></aside>`;
  /** Das Datum einer geprüften Antwort des Bots steht im Prüfvermerk: Der Tag der Frage neben „geprüft“ las sich wie der Tag der Prüfung */
  const datum = answer.status !== 'geprüft' ? zeit(tag) : human ? zeit(answer.geprueftAm ?? tag) : '';
  const head = `<header>${datum ? `<span class="meta">${datum}</span>` : ''}${badge(answer.status)}${answer.status === 'entwurf' ? '' : melden(root, n, meldung)}<a class="nummer" href="#${prefix}b${n}" aria-label="Beitrag ${n}">#${n}</a></header>`;
  const name = `aria-label="${human ? 'Antwort der Moderation' : 'Antwort des Bots'}"`;
  if (answer.status === 'kein_beleg') return `<article class="beitrag antwort" id="b${n}" ${name}>${person}<div class="inhalt">${head}<p>${NICHTS_GEFUNDEN}</p></div></article>`;
  /**
   * Die Zitate stehen in einem `<aside>` in ihrem Abschnitt. trafilatura misst seinen Auszug am Text der ganzen Seite und zählt dabei
   * die Zitate mit, die es selbst nie übernimmt; unter einem Fünftel wechselt es das Verfahren, und das neue wirft die Frage weg (s09,
   * s11, s15 am 2026-11-17, bei s15 fehlten zwei Zeichen). Ein `<aside>` zählt in beiden Maßen nicht. Überschrift und Lizenzzeile
   * bleiben draußen, sie gehören in den Auszug.
   */
  const marks = m => (m >= 1 && m <= answer.zitate.length ? `<a class="marke-zitat" href="#${prefix}z${m}" aria-label="Zitat ${m}">[${m}]</a>` : null);
  return `<article class="beitrag antwort" id="${prefix}b${n}" ${name}>${person}<div class="inhalt">${head}
${reviewNote(answer, root)}<div class="text">${renderMarkdown(answer.text, { marks, links: botLinks(answer, skript) })}</div>
${human ? '' : `<p class="hinweis">${esc(hinweis)}</p>`}
${answer.zitate.length ? `<section class="zitate" data-nosnippet><h2>Originaltext aus dem Skript</h2>
<p class="lizenz">Aus dem Skript ${SKRIPT} von ${BETREIBER.name}, Lizenz <a href="${SKRIPT_LIZENZ.url}" rel="noopener">${SKRIPT_LIZENZ.name}</a>.</p>
<aside>${answer.zitate.map((z, i) => quote(z, i + 1, prefix)).join('\n')}</aside>
</section>` : ''}</div></article>`;
}

/** Für „Meine Fragen“: dieselbe Karte, sie landet aber neben anderen auf einer Seite, also mit eigenen Sprungzielen. Bot bleibt erkennbar (I8) */
export const draftCard = (row, site) => answerCard({ status: 'entwurf', text: row.entwurf.text, zitate: row.entwurf.zitate }, 2, {
  root: '../../',
  skript: site.skript,
  tag: row.tag,
  prefix: `${row.id}-`,
  hinweis: 'Diesen Entwurf hat ein Sprachmodell erzeugt (Claude von Anthropic). Geprüft ist er noch nicht, und außer Ihnen sieht ihn nur die Moderation. Prüfen Sie das Zitat.',
});

const trail = (root, ...steps) => `<nav class="pfad" aria-label="Pfad"><a href="${root}">Forum</a>${steps.map(([href, text]) => ` <span aria-hidden="true">›</span> ${href ? `<a href="${esc(href)}">${esc(text)}</a>` : esc(text)}`).join('')}</nav>`;

export function questionPage(question, site) {
  const root = '../../';
  const forum = unterforumOf(question.kapitel);
  const none = '<p class="hinweis">Zu dieser Frage gibt es noch keine Antwort.</p>';
  const kapitel = KAPITEL.find(k => k.titel === question.kapitel);
  const zumKapitel = kapitel ? `../kapitel/${kapitel.slug}/` : null;
  /**
   * Die Lizenzen stehen zusammen am Ende: Die Zeile zur Frage stand unter der H1 und schob die Antwort auf dem Telefon nach unten
   * (research/2026-11-17-seo-audit, Befund 12). Eine Frage ohne Erklärung trägt keinen Vermerk (Plan D30).
   */
  const lizenzen = [
    question.lizenz === CC0.kennung ? `Diese Frage ist gemeinfrei (<a href="${CC0.url}" rel="noopener">${CC0.name}</a>).` : '',
    question.antworten.some(a => a.text) ? `Die Antworten auf dieser Seite stehen unter der Lizenz <a href="${SKRIPT_LIZENZ.url}" rel="noopener">${SKRIPT_LIZENZ.name}</a>, wie das Skript.` : '',
  ].filter(Boolean).join(' ');
  /**
   * Wohin von hier. Das Kapitel steht im Pfad oben; „Alle Fragen zu …“ führte bei 25 von 31 Fragen auf eine Liste mit nur dieser Frage
   * (Befund 4). Einzelne Nachbarfragen nennt die Seite nicht, und auch keine Zahlen: Beides stünde nach jeder Änderung auf den anderen
   * Seiten falsch, und eine Stimme schreibt nur ihre eigene Seite neu.
   */
  const meldung = site.melden ? { an: site.melden, pfad: `f/${question.id}/`, seite: `${site.origin}${site.base}f/${question.id}/` } : null;
  const weiter = `<a href="../${forum.slug}/">Mehr Fragen im Unterforum ${esc(forum.titel)}</a>${kapitel ? `<a href="${esc(site.skript)}${kapitel.slug}/" rel="noopener">Kapitel „${esc(question.kapitel)}“ im Skript lesen</a>` : ''}`;
  /**
   * Der Faden ist ein `<article>`, und die H1 steht als Erstes in der Fragekarte, vor Absender und Kopfzeile. In der Reihenfolge davor
   * nahm ein Textextraktor die Frage nur auf einer von 31 Seiten mit (Befund 2, gemessen mit research/2026-11-17-seo-audit/auszug.py);
   * wie es aussieht, ordnet das Stylesheet. An einer Beispielfrage steht, von wem sie ist: Das Markup nannte den Betreiber als Autor,
   * zu sehen war nur „Frage“ (Befund 9c). Der Name steht beim Absender und nicht im Abzeichen der Kopfzeile: Dort brach die Zeile bei
   * 375 px um und schob die Antwort eine Zeile tiefer (gemessen, 385 px Inhalt auf 307 px).
   */
  const frage = `<article class="beitrag frage" id="b1" aria-label="Frage"><h1>${renderQuestion(question.text)}</h1><aside class="autor"><span class="avatar" aria-hidden="true">?</span><strong>${question.herkunft === 'beispiel' ? 'Frage' : 'Anonymer Nutzer'}</strong>${question.herkunft === 'beispiel' ? `<span class="von">von ${BETREIBER.name}</span>` : ''}${voteBox(question, site)}</aside><header><span class="meta">${zeit(question.tag)}</span>${question.herkunft === 'beispiel' ? '<span class="badge">Beispielfrage</span>' : ''}${melden(root, 1, meldung)}<a class="nummer" href="#b1" aria-label="Beitrag 1">#1</a></header></article>`;
  return shell({
    site,
    root,
    path: `f/${question.id}/`,
    title: questionTitle(question),
    description: questionDescription(question),
    robots: reviewed(question) ? 'index,follow' : 'noindex',
    script: [question.antworten.some(a => a.zitate?.some(longQuote)) ? 'zitate.js' : null, site.stimmen ? 'stimmen.js' : null],
    daten: [crumbs(site, [`f/${forum.slug}/`, forum.titel], [kapitel ? `f/kapitel/${kapitel.slug}/` : null, question.kapitel]), qaPage(question, site)],
    body: `${trail(root, [`../${forum.slug}/`, forum.titel], [zumKapitel, question.kapitel])}
<article class="faden">
${frage}
${question.antworten.map((a, i) => answerCard(a, i + 2, { root, tag: question.tag, skript: site.skript, meldung })).join('\n') || none}
</article>
${lizenzen ? `<p class="lizenz">${lizenzen}</p>` : ''}
<nav class="weiter" aria-label="Weiter">${weiter}</nav>`,
  });
}

/** Überschrift einer Liste; solange man nicht fragen kann, ist es nur die Überschrift */
const listTitle = (site, root, title, tag = 'h1') => (site.fragen ? `<div class="titelzeile"><${tag}>${esc(title)}</${tag}><a class="knopf fragen" href="${root}f/neu/">Frage stellen</a></div>` : `<${tag}>${esc(title)}</${tag}>`);

const countReviewed = questions => questions.filter(reviewed).length;

/**
 * Das Suchfeld der Startseite und der Kapitelseiten. `kapitel` ({titel, slug}) lenkt die Rangfolge: Der Worker bekommt den Titel,
 * `neuHref` führt beim leeren Treffer in das Formular, auf der Kapitelseite mit dem Kapitel im Link.
 */
function suchBereich(site, { root = '', kapitel = null, neuHref = 'f/neu/' } = {}) {
  const attribut = kapitel ? ` data-kapitel="${esc(kapitel.titel)}"` : '';
  const frage = kapitel ? 'Steht Ihre Frage zu diesem Kapitel schon hier?' : 'Steht Ihre Frage schon hier?';
  return `<section class="suche" id="suche" role="search" aria-label="Suche im Forum" hidden data-root="${esc(root)}"${attribut}>
<label for="suchfeld">${frage}</label>
<input id="suchfeld" type="search" autocomplete="off" spellcheck="false" placeholder="Frage eintippen">
<p class="meta" id="suchstatus" role="status">Die Suche läuft in Ihrem Browser, was Sie tippen, verlässt ihn nicht. Beim ersten Klick lädt er dafür ${esc(site.ladegroesse)} von diesem Server.</p>
<div id="treffer" hidden><h2>Diese Fragen liegen am nächsten</h2><ol id="treffer-fragen"></ol><h2>Im Skript</h2><ol id="treffer-skript"></ol></div>
${site.fragen ? `<p class="hinweis" id="neue-frage" data-mindestens="${MIN_FRAGE}" hidden>Nichts Passendes dabei? <a class="knopf fragen" href="${esc(neuHref)}"${kapitel ? ' rel="nofollow"' : ''}>Diese Frage stellen</a></p>\n` : ''}</section>`;
}

export function indexPage(questions, site) {
  const rows = UNTERFOREN.map(forum => {
    const threads = threadsOf(forum, questions);
    return `<tr><th scope="row"><a href="f/${forum.slug}/">${esc(forum.titel)}</a><p>${esc(forum.beschreibung)}</p></th><td data-label="Themen">${threads.length}</td><td data-label="Geprüft">${countReviewed(threads)}</td></tr>`;
  }).join('\n');
  const description = 'Fragen zum Skript „Einführung in Deep Learning“. Antworten des Bots tragen das wörtliche Zitat aus dem Skript mit Link, die Moderation prüft sie.';
  return shell({
    site,
    root: '',
    path: '',
    title: 'hAInrich2: Fragen zum Skript „Einführung in Deep Learning“',
    description,
    robots: questions.some(reviewed) ? 'index,follow' : 'noindex',
    script: 'app.js',
    claim: false,
    daten: { '@graph': [{ '@type': 'WebSite', '@id': `${site.origin}${site.base}#website`, name: 'hAInrich2', url: `${site.origin}${site.base}`, inLanguage: 'de', description, publisher: { '@id': betreiberId(site) } }, betreiber(site)] },
    body: `<section class="einstieg"><h1>Fragen und Antworten zum Skript <span class="textmarker">${SKRIPT}</span></h1>
<p>Die meisten Antworten schreibt ein Sprachmodell, belegt mit wörtlichen Zitaten aus dem Skript, und die Moderation prüft sie. <a href="ueber/">Mehr über die Idee</a></p></section>
${suchBereich(site)}
<section>${listTitle(site, '', 'Forum', 'h2')}${site.fragen ? '' : '<p class="meta">Eigene Fragen lassen sich in dieser Fassung noch nicht stellen.</p>'}
<table class="liste foren">
<thead><tr><th scope="col">Unterforum</th><th scope="col">Themen</th><th scope="col">Geprüft</th></tr></thead>
<tbody>
${rows}
</tbody></table></section>`,
  });
}

/** Zeilen einer Fragenliste; `hoch` führt von der Seite zurück zur Frageseite, also `../` im Unterforum und `../../` im Kapitel */
const threadRows = (threads, site, hoch) => threads.map(q => `<tr><th scope="row"><div class="thema">${voteBox(q, site)}<div><a href="${hoch}${esc(q.id)}/">${renderQuestion(q.text)}</a><p>${esc(q.kapitel)}</p></div></div></th><td data-label="Antworten">${q.antworten.length}</td><td>${q.antworten[0] ? badge(q.antworten[0].status) : ''}</td></tr>`).join('\n');

export function forumPage(forum, questions, site) {
  const root = '../../';
  const threads = byPoints(threadsOf(forum, questions));
  const rows = threadRows(threads, site, '../');
  const kapitel = KAPITEL.filter(k => k.unterforum.slug === forum.slug);
  return shell({
    site,
    root,
    path: `f/${forum.slug}/`,
    title: `Deep Learning: ${forum.titel}${SUFFIX}`,
    description: `${forum.beschreibung} Fragen zum Skript „Einführung in Deep Learning“.`,
    robots: threads.some(reviewed) ? 'index,follow' : 'noindex',
    script: site.stimmen ? 'stimmen.js' : null,
    daten: crumbs(site, [null, forum.titel]),
    body: `${trail(root, [null, forum.titel])}
<section>${listTitle(site, root, forum.titel)}<p class="meta">${esc(forum.beschreibung)}</p>
<table class="liste themen">
<thead><tr><th scope="col">Thema</th><th scope="col">Antworten</th><th scope="col">Status</th></tr></thead>
<tbody>
${rows}
</tbody></table></section>
<section><h2>Kapitel</h2><p class="meta">Jedes Kapitel hat eine eigene Seite mit seinen Fragen.</p><ul class="kapitel">
${kapitel.map(k => `<li><a href="../kapitel/${esc(k.slug)}/">${esc(k.titel)}</a></li>`).join('\n')}
</ul></section>`,
  });
}

/**
 * Eine Seite je Kapitel des Skripts, unter der Kennung, die das Skript selbst trägt (`f/kapitel/backpropagation/`). Sie zeigt die
 * Fragen dieses Kapitels, eine Suche mit Kapitelbezug und führt mit „Frage stellen“ in das Formular für dieses Unterforum.
 */
export function kapitelPage(kapitel, questions, site) {
  const root = '../../../';
  const { titel, slug, unterforum: forum } = kapitel;
  const threads = byPoints(questions.filter(q => q.kapitel === titel));
  const neu = `../../neu/?kapitel=${slug}`;
  const knopf = site.fragen ? `<a class="knopf fragen" href="${neu}" rel="nofollow">Frage stellen</a>` : '';
  const liste = threads.length ? `<table class="liste themen">
<thead><tr><th scope="col">Thema</th><th scope="col">Antworten</th><th scope="col">Status</th></tr></thead>
<tbody>
${threadRows(threads, site, '../../')}
</tbody></table>` : `<p class="meta">Zu diesem Kapitel gibt es noch keine Frage.${site.fragen ? ' Stellen Sie die erste.' : ''}</p>`;
  return shell({
    site,
    root,
    path: `f/kapitel/${slug}/`,
    title: `Fragen zu „${titel}“ | hAInrich2`,
    description: `Fragen und Antworten zum Kapitel „${titel}“ im Skript „Einführung in Deep Learning“.`,
    robots: chapterIndexable(threads) ? 'index,follow' : 'noindex',
    script: 'app.js',
    daten: crumbs(site, [`f/${forum.slug}/`, forum.titel], [null, titel]),
    body: `${trail(root, [`../../${forum.slug}/`, forum.titel], [null, titel])}
<section><div class="titelzeile"><h1>Fragen zu „${esc(titel)}“</h1>${knopf}</div><p class="meta">Unterforum <a href="../../${forum.slug}/">${esc(forum.titel)}</a> · <a href="${esc(site.skript)}${slug}/">Kapitel im Skript</a></p></section>
${suchBereich(site, { root, kapitel: { titel, slug }, neuHref: neu })}
<section><h2>Fragen zu diesem Kapitel</h2>${liste}</section>`,
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
<p class="hinweis">Fragen stellen kann nur, wer den Kurscode hat, und den gibt es im Kurs in ILIAS. Lesen können alle. Was mit einer Frage geschieht, steht unter <a href="${root}datenschutz/">Datenschutz</a>.</p>
<noscript><p class="fehler">Zum Fragen braucht diese Seite JavaScript, zum Lesen nicht.</p></noscript>
<p class="hinweis" id="kapitel-hinweis" hidden></p>
<script type="application/json" id="kapitel-liste">${JSON.stringify(KAPITEL.map(k => ({ slug: k.slug, titel: k.titel, unterforum: k.unterforum.titel }))).replaceAll('<', '\\u003c')}</script>
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
<p class="hinweis">Gemeinfrei heißt: Sie verzichten auf alle Rechte an Ihrer Frage, und das lässt sich nicht zurücknehmen. Löschen lassen können Sie die Frage hier trotzdem. Mehr dazu unter <a href="${root}datenschutz/">Datenschutz</a> und <a href="${root}nutzungsbedingungen/#rechte-an-ihrem-text">Nutzungsbedingungen</a>. Die Nutzung ist freiwillig und hat keinen Einfluss auf Ihre Bewertung. Der Verarbeitung Ihrer Frage können Sie widersprechen, siehe <a href="${root}datenschutz/#widerspruchsrecht">Widerspruchsrecht</a>.</p>
<p class="fehler" role="alert" hidden></p>
<button class="haupt">Frage absenden</button>
</form>
</section>
<section id="meine" hidden><h2>Meine Fragen</h2><p class="meta" id="meine-status" role="status"></p><p class="meta">Diese Liste liegt nur in diesem Browser.</p><ol class="meine" id="meine-liste"></ol></section>`,
  });
}

/** Caddy liefert sie für jede unbekannte Adresse, in jeder Tiefe. Deshalb verweist sie als einzige von der Wurzel aus und nennt keine eigene Adresse */
export function notFoundPage(site) {
  const root = site.base;
  return shell({
    site,
    root,
    path: '404.html',
    title: `Seite nicht gefunden${SUFFIX}`,
    description: 'Diese Seite gibt es nicht.',
    canonical: false,
    body: `<article class="dokument"><h1>Diese Seite gibt es nicht</h1>
<p>Vielleicht hat sich die Adresse geändert, oder die Moderation hat die Frage zurückgezogen.</p>
<p><a href="${root}">Zum Forum</a></p>
<ul>${UNTERFOREN.map(forum => `<li><a href="${root}f/${forum.slug}/">${esc(forum.titel)}</a></li>`).join('')}</ul></article>`,
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
  /** Der Tag der letzten Prüfung ist das einzige Datum, das die Datenbank von einer Antwort kennt; eine Liste trägt das jüngste ihrer Fragen */
  const pruefung = list => list.flatMap(q => q.antworten.map(a => a.geprueftAm)).filter(Boolean).sort().at(-1) ?? null;
  const forums = UNTERFOREN.map(forum => [forum, threadsOf(forum, threads)]).filter(([, list]) => list.length).map(([forum, list]) => [`f/${forum.slug}/`, pruefung(list)]);
  const pages = threads.length ? [['', pruefung(threads)], ['ueber/', null]] : [];
  const chapters = KAPITEL.map(k => [k, threads.filter(q => q.kapitel === k.titel)]).filter(([, list]) => chapterIndexable(list)).map(([k, list]) => [`f/kapitel/${k.slug}/`, pruefung(list)]);
  const urls = [...pages, ...chapters, ...forums, ...threads.map(q => [`f/${q.id}/`, pruefung([q])])]
    .map(([page, tag]) => `<url><loc>${esc(`${site.origin}${site.base}${page}`)}</loc>${tag ? `<lastmod>${esc(tag)}</lastmod>` : ''}</url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`;
}

export function robotsTxt(site) {
  return `User-agent: *\nDisallow: ${site.base}models/\nDisallow: ${site.base}wasm/\nDisallow: ${site.base}daten/\nDisallow: ${site.base}mod/\nDisallow: ${site.base}api/\nSitemap: ${site.origin}${site.base}sitemap.xml\n`;
}
