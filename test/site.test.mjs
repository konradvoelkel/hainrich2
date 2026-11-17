import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { threadsOf, UNTERFOREN, unterforumOf } from '../lib/forum.js';
import { excerpt, foreignSource, forumPage, indexPage, MODERATION, notFoundPage, OG_CARD, publicQuestion, questionPage, robotsTxt, sitemap, textPage } from '../lib/site.js';

const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: false, ladegroesse: 'rund 25 MB' };
const passage = { id: 'p1', page: 'kapitel', title: 'Tensoren', path: ['Abschnitt'], text: 'Ein **Perzeptron** rechnet $w^T x$ aus, und zwar genau so und nicht anders.', hash: 'h1', link: 'https://skript.test/kapitel/#abschnitt' };
const seed = { id: 's01', frage: 'Was <b>rechnet</b> ein Perzeptron?', kapitel: 'kapitel' };
const row = { seed: 's01', model: 'm', status: 'ok', text: 'Es rechnet eine Summe.[1] Bei `x[1]` bleibt das, $a[1]$ auch, [2] gibt es nicht.', cited: [{ id: 'p1', hash: 'h1', text: 'vom Modell verändert' }], check: { hinweise: ['geheim'] }, input: 1 };
const question = (overrides = {}) => publicQuestion(seed, { ...row, ...overrides }, [passage], '2026-11-04');

test('nur erlaubte Felder werden öffentlich', () => {
  const json = JSON.stringify(question());
  assert.doesNotMatch(json, /geheim|"check"|"input"/);
});

test('das Zitat kommt aus dem Korpus, nicht aus der Antwort (I4)', () => {
  const [answer] = question().antworten;
  assert.equal(answer.zitate[0].text, passage.text);
  assert.doesNotMatch(questionPage(question(), site), /vom Modell verändert/);
});

test('ein geänderter Skripttext bricht den Build', () => {
  assert.throws(() => question({ cited: [{ id: 'p1', hash: 'anders' }] }), /passt nicht zum Korpus/);
  assert.throws(() => question({ cited: [{ id: 'weg', hash: 'h1' }] }), /passt nicht zum Korpus/);
});

test('der Bot ist erkennbar, das Zitat trägt seinen Link (I8)', () => {
  const html = questionPage(question(), site);
  assert.match(html, /class="bot">Bot</);
  assert.match(html, /Prüfen Sie das Zitat/);
  assert.match(html, /ungeprüft/);
  assert.match(html, /href="https:\/\/skript\.test\/kapitel\/#abschnitt:~:text=/);
});

test('Text der Frage wird nie zu HTML', () => {
  const html = questionPage(question(), site);
  assert.doesNotMatch(html, /<b>rechnet/);
  assert.match(html, /&lt;b&gt;rechnet/);
  assert.doesNotMatch(indexPage([question()], site), /<b>rechnet/);
});

test('Verweise nur im Fließtext und nur auf vorhandene Zitate', () => {
  const html = questionPage(question(), site);
  assert.equal((html.match(/class="marke-zitat"/g) ?? []).length, 1);
  assert.match(html, /<code>x\[1\]<\/code>/);
  assert.match(html, /\[2\] gibt es nicht/);
});

test('kein Beleg heißt nichts gefunden, nie steht nicht im Skript', () => {
  const html = questionPage(question({ status: 'kein_beleg', text: null, cited: [] }), site);
  assert.match(html, /Dazu habe ich im Skript nichts gefunden\./);
  assert.doesNotMatch(html, /steht nicht im Skript/);
});

test('eine verweigerte oder abgeschnittene Antwort erscheint nicht', () => {
  for (const status of ['verweigert', 'abgeschnitten', 'ohne_zitat']) {
    assert.deepEqual(question({ status }).antworten, []);
    assert.doesNotMatch(questionPage(question({ status }), site), /Es rechnet/);
  }
});

test('nur geprüft ist indexierbar und steht in der Sitemap (I9)', () => {
  const open = question();
  const done = { ...open, id: 's02', antworten: open.antworten.map(a => ({ ...a, status: 'geprüft' })) };
  assert.match(questionPage(open, site), /name="robots" content="noindex"/);
  assert.match(questionPage(done, site), /name="robots" content="index,follow"/);
  assert.match(indexPage([open], site), /name="robots" content="noindex"/);
  assert.match(sitemap([open, done], site), /\/f\/s02\//);
  assert.doesNotMatch(sitemap([open, done], site), /\/f\/s01\//);
});

test('Rechtstexte sind nie indexierbar, Überschriften sind Sprungziele', () => {
  const html = textPage('impressum', '# Impressum\n\n## Inhalte melden\n\nText', site);
  assert.match(html, /<title>Impressum/);
  assert.match(html, /<h2 id="inhalte-melden">/);
  assert.match(html, /name="robots" content="noindex"/);
});

test('jede Seite verweist relativ und nennt den Meldeweg', () => {
  for (const html of [questionPage(question(), site), indexPage([question()], site), textPage('impressum', '# I', site)]) {
    assert.match(html, /impressum\/#inhalte-melden/);
    assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/);
  }
});

test('jede Seite trägt die Vorschaukarte, mit eigener Adresse und Alternativtext', () => {
  const pages = [indexPage([], site), textPage('impressum', '# Impressum', site)];
  for (const html of pages) {
    const image = html.match(/property="og:image" content="([^"]+)"/)[1];
    assert.equal(image, 'https://example.test/eidl/og-card.png');
    assert.match(html, /property="og:image:width" content="1200"/);
    assert.match(html, /property="og:image:height" content="630"/);
    assert.match(html, /property="og:image:alt" content="[^"]{20,}"/);
    assert.match(html, /name="twitter:card" content="summary_large_image"/);
    assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)[1], html.match(/property="og:url" content="([^"]+)"/)[1]);
  }
});

test('die Vorschaukarte hat wirklich die angekündigte Größe', () => {
  const card = fs.readFileSync(new URL('../site/brand/og-card.png', import.meta.url));
  assert.deepEqual([card.readUInt32BE(16), card.readUInt32BE(20)], [OG_CARD.width, OG_CARD.height]);
});

test('jedes Kapitel gehört zu genau einem Unterforum, ein unbekanntes fällt auf', () => {
  const all = UNTERFOREN.flatMap(u => u.kapitel);
  assert.equal(new Set(all).size, all.length);
  assert.equal(unterforumOf('Backpropagation').slug, 'lernen');
  assert.throws(() => unterforumOf('Gibt es nicht'), /Kapitel ohne Unterforum/);
  assert.equal(new Set(UNTERFOREN.map(u => u.slug)).size, UNTERFOREN.length);
  for (const { slug } of UNTERFOREN) assert.doesNotMatch(slug, /^s\d/, 'Fragen heißen s01, ein Unterforum darf nicht so heißen');
});

test('die Startseite zählt je Unterforum Themen und Geprüftes', () => {
  const open = question();
  const done = { ...question(), id: 's02', antworten: [{ ...question().antworten[0], status: 'geprüft' }] };
  const html = indexPage([open, done], site);
  assert.match(html, /href="f\/grundlagen\/">Grundlagen<\/a>[\s\S]*?<td data-label="Themen">2<\/td><td data-label="Geprüft">1<\/td>/);
  assert.match(html, /href="f\/lernen\/">[\s\S]*?<td data-label="Themen">0<\/td><td data-label="Geprüft">0<\/td>/);
  assert.equal(html.match(/<tr><th scope="row">/g).length, UNTERFOREN.length);
  assert.equal(threadsOf(UNTERFOREN[0], [open, done]).length, 2);
});

test('das Unterforum listet seine Themen, Brotkrumen führen zurück', () => {
  const forum = UNTERFOREN[0];
  const html = forumPage(forum, [question()], site);
  assert.match(html, /href="\.\.\/s01\/"/);
  assert.doesNotMatch(html, /<b>rechnet/);
  assert.match(html, /name="robots" content="noindex"/);
  const thread = questionPage(question(), site);
  assert.match(thread, /<a href="\.\.\/\.\.\/">Forum<\/a>/);
  assert.match(thread, /<a href="\.\.\/grundlagen\/">Grundlagen<\/a>/);
  assert.match(thread, /id="b1"[\s\S]*id="b2"/);
  assert.match(thread, /src="\.\.\/\.\.\/logo\.svg"/);
  assert.match(forumPage(UNTERFOREN[1], [question()], site), /<tbody>\s*<\/tbody>/, 'leeres Unterforum bleibt gültig');
});

test('die Sitemap nennt nur Unterforen mit Geprüftem', () => {
  const done = { ...question(), antworten: [{ ...question().antworten[0], status: 'geprüft' }] };
  const map = sitemap([done], site);
  assert.match(map, /f\/grundlagen\//);
  assert.doesNotMatch(map, /f\/lernen\//);
  assert.match(map, /<loc>https:\/\/example\.test\/eidl\/<\/loc>/);
  assert.match(map, /<loc>https:\/\/example\.test\/eidl\/ueber\/<\/loc>/);
  assert.doesNotMatch(sitemap([question()], site), /<url>/);
  assert.doesNotMatch(sitemap([done], { ...site, vorschau: true }), /<url>/);
});

test('Bot, Nutzer und Moderation tragen ihre Namen, an einer Beispielfrage steht keiner', () => {
  const bot = questionPage(question(), site);
  assert.match(bot, /<a class="person" href="\.\.\/\.\.\/ueber\/"><img [^>]*><strong>hAInrich2<\/strong><\/a><span class="bot">Bot</);
  assert.match(bot, /<strong>Frage<\/strong>/);
  assert.doesNotMatch(bot, /Anonymer Nutzer/);
  const html = questionPage({ ...question(), herkunft: 'nutzer', antworten: [{ art: 'moderation', status: 'geprüft', text: 'Selbst geschrieben.', zitate: [] }] }, site);
  assert.match(html, /<strong>Anonymer Nutzer<\/strong>/);
  assert.match(html, /<a class="person" href="https:\/\/www\.konradvoelkel\.com" rel="noopener"><img class="gesicht" src="\.\.\/\.\.\/moderation-konrad\.jpg"[^>]*><strong>Konrad Völkel<\/strong><\/a>/);
  assert.ok(fs.existsSync(new URL(`../site/brand/${MODERATION.bild}`, import.meta.url)));
  assert.doesNotMatch(html, /class="bot"/);
});

const titleOf = html => html.match(/<title>(.*?)<\/title>/)[1];
const descriptionOf = html => html.match(/name="description" content="(.*?)"/)[1];

test('der Titel bleibt kurz und ohne Formel, die volle Frage steht in der H1', () => {
  const text = 'Ich bringe Parameter und Hyperparameter immer durcheinander. Ist $x$ jetzt ein Parameter, und woran erkenne ich das allgemein?';
  const html = questionPage({ ...question(), text }, site);
  assert.ok(titleOf(html).length <= 65, titleOf(html));
  assert.match(titleOf(html), /^Ich bringe .* … \| hAInrich2$/);
  assert.match(html, /<h1>Ich bringe[\s\S]*allgemein\?<\/h1>/);
  assert.equal(titleOf(questionPage({ ...question(), text: 'Was ist $x$?' }, site)), 'Was ist x? | hAInrich2');
  assert.equal(titleOf(questionPage({ ...question(), text: 'Was ist $\\frac{a}{b}$?' }, site)), 'Was ist …? | hAInrich2');
});

test('die Beschreibung ist der Anfang der Antwort, sonst das Kapitel', () => {
  const text = `Mit \`zero_grad()\` und **Gradienten**: $x$ bleibt, $\\frac{a}{b}$ nicht.[1] ${'Noch mehr Text. '.repeat(30)}`;
  const answer = { ...question().antworten[0], text };
  const description = descriptionOf(questionPage({ ...question(), antworten: [answer] }, site));
  assert.match(description, /^Mit zero_grad\(\) und Gradienten: x bleibt, … nicht\. Noch mehr/);
  assert.ok(description.length <= 155, description);
  const whole = { ...answer, text: `Der erste Satz ist lang genug, um für sich zu stehen. Dann folgt $\\frac{a}{b}$ und mehr.` };
  assert.equal(descriptionOf(questionPage({ ...question(), antworten: [whole] }, site)), 'Der erste Satz ist lang genug, um für sich zu stehen.');
  const none = descriptionOf(questionPage({ ...question({ status: 'kein_beleg' }), kapitel: 'Was ist Deep Learning?' }, site));
  assert.equal(none, 'Frage zum Kapitel „Was ist Deep Learning?“ im Skript „Einführung in Deep Learning“.');
});

test('die Startseite nennt das Skript in ihrer einzigen H1 und führt zur Idee', () => {
  const html = indexPage([question()], site);
  assert.equal(html.match(/<h1>/g).length, 1);
  assert.match(html, /<h1>Fragen und Antworten zum Skript <span class="textmarker">„Einführung in Deep Learning“<\/span><\/h1>/);
  assert.match(html, /<a href="ueber\/">Mehr über die Idee<\/a>/);
  assert.doesNotMatch(html, /<span>Fragen und Antworten/, 'die Kopfzeile wiederholt die H1 nicht');
  assert.match(forumPage(UNTERFOREN[0], [], site), /<span>Fragen und Antworten/);
  assert.ok(titleOf(html).length <= 65, titleOf(html));
});

test('die Seite „Über hAInrich2“ darf in den Index, die Rechtstexte nicht', () => {
  const source = '# Über hAInrich2\n\nText';
  const html = textPage('ueber', source, site, { robots: 'index,follow', description: 'Worum es geht.' });
  assert.equal(titleOf(html), 'Über hAInrich2');
  assert.equal(descriptionOf(html), 'Worum es geht.');
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(textPage('ueber', source, { ...site, vorschau: true }, { robots: 'index,follow' }), /name="robots" content="noindex"/);
  const legal = textPage('impressum', '# Impressum', site);
  assert.match(legal, /name="robots" content="noindex"/);
  assert.equal(titleOf(legal), 'Impressum | hAInrich2');
});

test('der Folienlink am Anfang eines Zitats fällt weg, der Text bleibt', () => {
  const page = text => questionPage({ ...question(), antworten: [{ ...question().antworten[0], zitate: [{ titel: 'T', pfad: [], url: 'https://skript.test/x', text }] }] }, site);
  const link = '[Folien VL 12, S. 2–8](https://skript.test/folien/vl12.pdf#page=2)';
  const html = page(`${link}\n\nIm Kapitel steht etwas.`);
  assert.ok(!html.includes('vl12.pdf'));
  assert.match(html, /<blockquote><p>Im Kapitel steht etwas\.<\/p>/);
  const alone = page(link);
  assert.ok(!alone.includes('vl12.pdf'));
  assert.match(alone, /<blockquote><p>Folien VL 12, S\. 2–8<\/p>/);
  assert.equal(question().antworten[0].zitate[0].text, passage.text, 'gespeichert bleibt der wörtliche Text');
});

test('die Seite für unbekannte Adressen verweist von der Wurzel aus und bleibt draußen', () => {
  const html = notFoundPage(site);
  assert.match(html, /<h1>Diese Seite gibt es nicht<\/h1>/);
  assert.match(html, /name="robots" content="noindex"/);
  assert.match(html, /<a href="\/eidl\/">Zum Forum<\/a>/);
  assert.doesNotMatch(html, /rel="canonical"|og:url/, 'die Seite steht für jede unbekannte Adresse, also nennt sie keine eigene');
  assert.doesNotMatch(html.replace(/<link rel="canonical"[^>]*>/, ''), /(?:src|href)="(?!\/eidl\/|https:|#)/);
});

const dataOf = html => JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);

test('Frage und Unterforum tragen den sichtbaren Pfad als strukturierte Daten', () => {
  const data = dataOf(questionPage(question(), site));
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'BreadcrumbList');
  assert.deepEqual(data.itemListElement.map(e => [e.position, e.name, e.item]), [[1, 'Forum', 'https://example.test/eidl/'], [2, 'Grundlagen', 'https://example.test/eidl/f/grundlagen/'], [3, 'Tensoren', 'https://example.test/eidl/f/kapitel/tensoren/']]);
  assert.deepEqual(dataOf(forumPage(UNTERFOREN[1], [], site)).itemListElement.map(e => e.name), ['Forum', 'Lernen und Training']);
});

test('die Startseite nennt Site und Betreiber, Rechtstexte tragen keine Daten', () => {
  const [website, person] = dataOf(indexPage([question()], site))['@graph'];
  assert.equal(website['@type'], 'WebSite');
  assert.equal(website.url, 'https://example.test/eidl/');
  assert.deepEqual(website.publisher, { '@id': 'https://example.test/eidl/#betreiber' });
  assert.deepEqual(person, { '@type': 'Person', '@id': 'https://example.test/eidl/#betreiber', name: 'Konrad Völkel', url: 'https://www.konradvoelkel.com' });
  assert.doesNotMatch(textPage('impressum', '# Impressum', site), /ld\+json/);
});

test('ein Text mit </script> beendet die strukturierten Daten nicht', () => {
  const titel = '</script><img src=x onerror=alert(1)>';
  const html = forumPage({ ...UNTERFOREN[0], titel }, [], site);
  assert.ok(!html.includes('</script><img'));
  assert.equal(dataOf(html).itemListElement[1].name, titel);
});

test('Vorschau-Banner nur in der Vorschau', () => {
  assert.match(indexPage([question()], { ...site, vorschau: true }), /class="vorschau"/);
  assert.doesNotMatch(indexPage([question()], site), /class="vorschau"/);
});

test('Ausschnitt ohne Markdown und Formeln', () => {
  assert.equal(excerpt('Ein **Wort** mit $x^2$ und [Link](http://a.test).'), 'Ein Wort mit x^2 und Link.');
  assert.equal(excerpt('Die Funktion $w \\cdot x + b$ liegt in $\\mathbb{R}$, nicht in $[0, 1]$.'), 'Die Funktion w · x + b liegt in ℝ, nicht in [0, 1].');
  assert.equal(excerpt('Ein Bruch $\\frac{a}{b}$ und eine Summe $\\sum_{i=1}^n x_i$ bleiben draußen.'), 'Ein Bruch … und eine Summe … bleiben draußen.');
  assert.equal(excerpt('- Erstens das.\n- Zweitens dies.\n1. Dann jenes.'), 'Erstens das. Zweitens dies. Dann jenes.', 'Listenzeichen gehören nicht in eine Beschreibung');
  assert.ok(excerpt('wort '.repeat(100), 50).length <= 52);
  assert.equal(excerpt('Ein _kursives_ Wort, zero_grad und a > b'), 'Ein kursives Wort, zero_grad und a > b');
  assert.equal(excerpt('Der Eintrag $w_j \\sigma\'((Ax)_j)$ und der Gradient $\\nabla_b E$, _betont_.'), 'Der Eintrag w_j σ\'((Ax)_j) und der Gradient ∇_b E, betont.',
    'der Index einer Formel ist kein Markdown, auch nicht hinter einer Klammer oder einem Zeichen');
});

test('robots.txt sperrt das Modell und nennt die Sitemap', () => {
  const text = robotsTxt(site);
  assert.match(text, /Disallow: \/eidl\/models\//);
  assert.match(text, /Sitemap: https:\/\/example\.test\/eidl\/sitemap\.xml/);
});

test('der Stolperdraht für fremde Quellen schlägt an, Links lässt er durch', () => {
  assert.equal(foreignSource(questionPage(question(), site)), null);
  assert.match(foreignSource('<script src="https://cdn.test/a.js"></script>'), /cdn\.test/);
  assert.match(foreignSource('<link rel="stylesheet" href="//fonts.test/a.css">'), /fonts\.test/);
  assert.match(foreignSource('<img alt="" src="http://a.test/b.png">'), /a\.test/);
  assert.equal(foreignSource('<a href="https://a.test/">x</a>'), null);
});

test('die Frageseite führt weiter: zum Kapitel und zum Unterforum, mit Datum und einem Namen für jeden Beitrag', () => {
  const html = questionPage(question(), site);
  assert.match(html, /<p class="meta"><a href="\.\.\/kapitel\/tensoren\/">Tensoren<\/a><span>Diese Frage ist gemeinfrei /);
  assert.match(html, /<nav class="pfad" aria-label="Pfad">.*<a href="\.\.\/kapitel\/tensoren\/">Tensoren<\/a><\/nav>/);
  assert.match(html, /<nav class="weiter" aria-label="Weitere Fragen"><a href="\.\.\/kapitel\/tensoren\/">Alle Fragen zu „Tensoren“<\/a><a href="\.\.\/grundlagen\/">Unterforum Grundlagen<\/a><\/nav>/);
  assert.equal(html.match(/<time datetime="2026-11-04">04\.11\.2026<\/time>/g).length, 2);
  assert.match(html, /<div class="faden">\s*<article class="beitrag frage" id="b1" aria-label="Frage">[\s\S]*<article class="beitrag antwort" id="b2" aria-label="Antwort des Bots">[\s\S]*<\/div>\s*<p class="lizenz">Die Antworten auf dieser Seite[^\n]*<\/p>\s*<nav class="weiter"/);
  assert.match(html, /<a class="marke-zitat" href="#z1" aria-label="Zitat 1">\[1\]<\/a>/);
  assert.match(html, /<section class="zitate" data-nosnippet>/, 'die Trefferbeschreibung soll aus der Antwort kommen, nicht aus dem Skript');
  assert.match(html, /<a class="sprung" href="#inhalt">Zum Inhalt<\/a>[\s\S]*<main id="inhalt">/);
});

test('ein langes Zitat ist eingeklappt und zeigt Anfang und Quelle, ein kurzes bleibt offen', () => {
  const page = text => questionPage({ ...question(), antworten: [{ ...question().antworten[0], zitate: [{ titel: 'T', pfad: ['A'], url: 'https://skript.test/x', text }] }] }, site);
  const lang = `Der erste Satz des Zitats steht für sich. ${'Dann folgt eine längere Herleitung mit $w \\cdot x + b$ und vielen Worten. '.repeat(6)}`;
  const html = page(lang);
  assert.match(html, /<figure id="z1"><details><summary><span class="anriss">Der erste Satz des Zitats steht für sich\. Dann folgt[^<]* …<\/span> <span class="mehr zu">ganzes Zitat<\/span><span class="mehr auf">einklappen<\/span><\/summary><blockquote><p>Der erste Satz/);
  assert.match(html, /<\/blockquote><\/details><figcaption>\[1\] <a href="https:\/\/skript\.test\/x" rel="noopener">T › A<\/a><\/figcaption><\/figure>/, 'die Quelle steht außerhalb, also immer sichtbar');
  assert.equal(html.match(/vielen Worten/g).length, 7, 'der volle Wortlaut steht im HTML, auch eingeklappt: sechsmal im Zitat, einmal im Anfang');
  assert.match(html, /<script type="module" src="\.\.\/\.\.\/zitate\.js"><\/script>/, 'eine Marke [1] klappt ihr Zitat auf');
  const kurz = page('Ein kurzes Zitat bleibt, wie es ist.');
  assert.match(kurz, /<figure id="z1"><blockquote><p>Ein kurzes Zitat bleibt, wie es ist\.<\/p>/);
  assert.doesNotMatch(kurz, /<details|zitate\.js/);
});

const allData = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
const robotsOf = html => html.match(/name="robots" content="([^"]+)"/)[1];
/** eine Frage, wie sie aus public.db kommt: geprüft, mit Datum */
const geprueft = (overrides = {}, answer = {}) => {
  const q = question();
  return { ...q, antworten: [{ ...q.antworten[0], status: 'geprüft', geprueftAm: '2026-11-06', ...answer }], ...overrides };
};
const zweite = { art: 'bot', status: 'ungeprüft', modell: 'm', text: 'Noch eine Antwort.', zitate: [] };

test('I9: Steht neben einer geprüften Antwort eine ungeprüfte, bleibt die Seite draußen', () => {
  assert.equal(robotsOf(questionPage(geprueft(), site)), 'index,follow');
  const gemischt = geprueft();
  gemischt.antworten.push(zweite);
  assert.equal(robotsOf(questionPage(gemischt, site)), 'noindex');
  assert.doesNotMatch(sitemap([gemischt], site), /<url>/);
  assert.equal(robotsOf(questionPage({ ...geprueft(), antworten: [] }, site)), 'noindex', 'ohne Antwort ist nichts geprüft');
  gemischt.antworten[1] = { ...zweite, status: 'geprüft' };
  assert.equal(robotsOf(questionPage(gemischt, site)), 'index,follow');
  assert.match(sitemap([gemischt], site), /f\/s01\//);
});

test('D29: Eine geprüfte Antwort sagt, wer geprüft hat und wann; das Datum der Frage steht nicht mehr neben „geprüft“', () => {
  const html = questionPage(geprueft(), site);
  assert.match(html, /<p class="pruefung">Geprüft am <time datetime="2026-11-06">06\.11\.2026<\/time> von <a href="\.\.\/\.\.\/ueber\/#wer-prüft">Konrad Völkel<\/a>, Autor des Skripts\.<\/p>/);
  const antwort = html.slice(html.indexOf('id="b2"'));
  assert.doesNotMatch(antwort.slice(0, antwort.indexOf('</header>')), /2026-11-04/);
  assert.doesNotMatch(questionPage(question(), site), /class="pruefung"/);
  const eigene = questionPage(geprueft({}, { art: 'moderation', modell: null, zitate: [] }), site);
  assert.doesNotMatch(eigene, /class="pruefung"/, 'an der eigenen Antwort steht der Name schon daneben');
  assert.match(eigene.slice(eigene.indexOf('id="b2"')), /<time datetime="2026-11-06">/);
});

test('A4: An der Frage und an jeder Antwort steht ein Link „Melden“, am Entwurf nicht', () => {
  const html = questionPage(geprueft(), site);
  assert.equal((html.match(/<a class="melden" href="\.\.\/\.\.\/impressum\/#inhalte-melden">Melden<\/a>/g) ?? []).length, 2);
});

test('Befund 17: Der Fuß nennt den Betreiber, das Zitat Autor und Lizenz', () => {
  const html = questionPage(question(), site);
  assert.match(html, /Ein privates Angebot von <a href="\.\.\/\.\.\/impressum\/">Konrad Völkel<\/a>, nicht der Heinrich-Heine-Universität/);
  assert.match(html, /<p class="lizenz">Aus dem Skript „Einführung in Deep Learning“ von Konrad Völkel, Lizenz <a href="https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/deed\.de" rel="noopener">CC BY-SA 4\.0<\/a>\.<\/p>/);
  assert.match(html, /Diese Frage ist gemeinfrei \(<a href="https:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/deed\.de" rel="noopener">CC0 1\.0<\/a>\)/, 'die Beispielfragen stammen vom Betreiber und sind gemeinfrei');
  assert.doesNotMatch(questionPage({ ...question(), lizenz: null }, site), /gemeinfrei/, 'ohne Erklärung kein Vermerk');
  assert.doesNotMatch(html, /rel="license/, 'drei Lizenzen auf einer Seite: Welche für was gilt, sagen Text und strukturierte Daten');
  assert.equal(foreignSource(html), null);
});

test('D2: Eine ungeprüfte Antwort des Bots verlinkt nur ins Skript, ein Bild wird Text; nach der Prüfung und bei der Moderation bleibt der Link', () => {
  const text = 'Siehe [Musterlösung](https://boese.test/x), [Kapitel](https://skript.test/kapitel/) und ![Bild](https://boese.test/b.png).[1]';
  const offen = questionPage(question({ text }), site);
  assert.doesNotMatch(offen, /boese\.test/);
  assert.match(offen, /Siehe Musterlösung, <a href="https:\/\/skript\.test\/kapitel\/">Kapitel<\/a> und Bild\./);
  assert.match(questionPage(geprueft({}, { text }), site), /<a href="https:\/\/boese\.test\/x">Musterlösung<\/a>/);
  assert.match(questionPage(geprueft({}, { text, art: 'moderation', zitate: [] }), site), /<a href="https:\/\/boese\.test\/x">/);
  const textOf = html => html.match(/<div class="text">(.*?)<\/div>/s)[1];
  assert.doesNotMatch(textOf(questionPage(question({ text }), { ...site, skript: undefined })), /<a href/, 'ohne Adresse des Skripts gar kein Link');
  assert.match(questionPage(question({ text }), site), /name="description" content="Siehe Musterlösung, Kapitel und Bild\."/, 'die Beschreibung trägt weder Link noch Bildzeichen');
});

test('D31: Der Kurztitel der Moderation steht im Titel, die volle Frage bleibt in der H1', () => {
  const html = questionPage(geprueft({ kurztitel: 'Perzeptron: Was rechnet es?' }), site);
  assert.match(html, /<title>Perzeptron: Was rechnet es\? \| hAInrich2<\/title>/);
  assert.match(html, /<h1>Was &lt;b&gt;rechnet&lt;\/b&gt; ein Perzeptron\?<\/h1>/);
  assert.match(questionPage(geprueft({ kurztitel: 'A <b> & B' }), site), /<title>A &lt;b&gt; &amp; B \| hAInrich2<\/title>/);
});

test('D32: Eine geprüfte Frage trägt QAPage, mit dem Bot als Bot und dem Zitat als Quelle; eine ungeprüfte trägt keins', () => {
  const html = questionPage(geprueft({}, { bearbeitet: true }), site);
  const blocks = allData(html);
  assert.deepEqual(blocks.map(b => b['@type'] ?? b['@graph'][0]['@type']), ['BreadcrumbList', 'QAPage']);
  const [page, person] = blocks[1]['@graph'];
  const frage = page.mainEntity;
  assert.equal(frage.text, 'Was <b>rechnet</b> ein Perzeptron?');
  assert.equal(frage.name, 'Was <b>rechnet</b> ein Perzeptron?');
  assert.deepEqual([frage.answerCount, frage.dateCreated, frage.author], [1, '2026-11-04', { '@id': person['@id'] }]);
  assert.deepEqual([frage.license, frage.acceptedAnswer.license], ['https://creativecommons.org/publicdomain/zero/1.0/', 'https://creativecommons.org/licenses/by-sa/4.0/']);
  const antwort = frage.acceptedAnswer;
  assert.equal(antwort.url, 'https://example.test/eidl/f/s01/#b2');
  assert.ok(html.includes('id="b2"'));
  assert.equal(antwort.text, 'Es rechnet eine Summe. Bei `x[1]` bleibt das, $a[1]$ auch, gibt es nicht.');
  assert.deepEqual(antwort.author, { '@type': 'Organization', name: 'hAInrich2-Bot (Claude von Anthropic), von der Moderation geprüft' });
  assert.deepEqual(antwort.citation, [{ '@type': 'CreativeWork', name: 'Tensoren › Abschnitt', url: 'https://skript.test/kapitel/#abschnitt' }]);
  assert.equal(antwort.dateModified, '2026-11-06');
  assert.ok(!JSON.stringify(blocks[1]).includes('upvoteCount'));
  assert.equal(person.name, 'Konrad Völkel');
  for (const url of JSON.stringify(blocks).match(/"https?:[^"]+"/g)) assert.match(url, /^"https:\/\//);

  assert.deepEqual(allData(questionPage(question(), site)).map(b => b['@type']), ['BreadcrumbList']);
  const gemischt = geprueft();
  gemischt.antworten.push(zweite);
  assert.equal(allData(questionPage(gemischt, site)).length, 1, 'nur was geprüft ist');
});

test('D32: Die Antwort der Moderation gilt, die des Bots daneben ist ein Vorschlag; an einer Frage von außen steht kein Autor', () => {
  const q = geprueft({ herkunft: 'forum' });
  q.antworten.push({ art: 'moderation', status: 'geprüft', geprueftAm: '2026-11-07', modell: null, text: 'So ist es.', zitate: [] });
  q.lizenz = null;
  const frage = allData(questionPage(q, site))[1]['@graph'][0].mainEntity;
  assert.equal(frage.author, undefined);
  assert.equal(frage.license, undefined, 'eine Frage ohne Erklärung trägt keine Lizenz');
  assert.deepEqual(frage.suggestedAnswer.map(a => a.license), ['https://creativecommons.org/licenses/by-sa/4.0/']);
  assert.deepEqual([frage.acceptedAnswer.url, frage.acceptedAnswer.author], ['https://example.test/eidl/f/s01/#b3', { '@id': 'https://example.test/eidl/#betreiber' }]);
  assert.equal(frage.acceptedAnswer.dateModified, undefined, 'unbearbeitet');
  assert.deepEqual(frage.suggestedAnswer.map(a => a.url), ['https://example.test/eidl/f/s01/#b2']);
});

test('D31: Die Vorschläge für den Bestand gehören zu Beispielfragen, passen in die Grenzen und am Checker vorbei', async () => {
  const { hardHits } = await import('../lib/checker.js');
  const { kurztitelOf } = await import('../lib/fragen.js');
  const seeds = JSON.parse(fs.readFileSync(new URL('../seeds/fragen.json', import.meta.url), 'utf8')).map(s => s.id);
  const vorschlaege = JSON.parse(fs.readFileSync(new URL('../seeds/kurztitel.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(vorschlaege), seeds);
  for (const [id, titel] of Object.entries(vorschlaege)) {
    assert.equal(kurztitelOf(titel), titel, id);
    assert.deepEqual(hardHits(titel), [], id);
  }
});

test('D30: Das Frageformular sagt neben dem Haken, was gemeinfrei heißt', async () => {
  const { askPage } = await import('../lib/site.js');
  const html = askPage({ ...site, fragen: true, entwurf: true });
  assert.match(html, /Ich gebe meine Frage gemeinfrei \(CC0 1\.0\)/);
  assert.match(html, /Gemeinfrei heißt: Sie verzichten auf alle Rechte an Ihrer Frage, und das lässt sich nicht zurücknehmen/);
  assert.match(html, /data-zustimmung="3"/);
});

test('der Fuß führt zur Anmeldung der Moderation, von jeder Tiefe aus und ohne Empfehlung an Suchmaschinen', () => {
  assert.match(questionPage(question(), site), /<a href="\.\.\/\.\.\/mod\/" rel="nofollow">Moderation<\/a><\/nav><\/footer>/);
  assert.match(indexPage([question()], site), /<a href="mod\/" rel="nofollow">Moderation<\/a>/);
  assert.match(notFoundPage(site), /<a href="\/eidl\/mod\/" rel="nofollow">Moderation<\/a>/);
  assert.match(robotsTxt(site), /Disallow: \/eidl\/mod\//);
});

test('D30: Die Antworten stehen unter CC BY-SA 4.0, das sagt die Seite einmal unter den Antworten; ohne Antworttext sagt sie nichts', () => {
  const zeile = /<p class="lizenz">Die Antworten auf dieser Seite stehen unter der Lizenz <a href="https:\/\/creativecommons\.org\/licenses\/by-sa\/4\.0\/deed\.de" rel="noopener">CC BY-SA 4\.0<\/a>, wie das Skript\.<\/p>/g;
  assert.equal((questionPage(geprueft(), site).match(zeile) ?? []).length, 1);
  assert.equal((questionPage(question(), site).match(zeile) ?? []).length, 1, 'auch ungeprüft');
  assert.doesNotMatch(questionPage(question({ status: 'kein_beleg' }), site), /Die Antworten auf dieser Seite/);
  assert.doesNotMatch(questionPage({ ...question(), antworten: [] }, site), /Die Antworten auf dieser Seite/);
});
