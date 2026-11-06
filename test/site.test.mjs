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
  assert.doesNotMatch(html.replace(/<link rel="canonical"[^>]*>/, ''), /(?:src|href)="(?!\/eidl\/|https:|#)/);
});

const dataOf = html => JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);

test('Frage und Unterforum tragen den sichtbaren Pfad als strukturierte Daten', () => {
  const data = dataOf(questionPage(question(), site));
  assert.equal(data['@context'], 'https://schema.org');
  assert.equal(data['@type'], 'BreadcrumbList');
  assert.deepEqual(data.itemListElement.map(e => [e.position, e.name, e.item]), [[1, 'Forum', 'https://example.test/eidl/'], [2, 'Grundlagen', 'https://example.test/eidl/f/grundlagen/'], [3, 'Tensoren', undefined]]);
  assert.deepEqual(dataOf(forumPage(UNTERFOREN[1], [], site)).itemListElement.map(e => e.name), ['Forum', 'Lernen und Training']);
});

test('die Startseite nennt Site und Betreiber, Rechtstexte tragen keine Daten', () => {
  const data = dataOf(indexPage([question()], site));
  assert.equal(data['@type'], 'WebSite');
  assert.equal(data.url, 'https://example.test/eidl/');
  assert.deepEqual(data.publisher, { '@type': 'Person', name: 'Konrad Völkel', url: 'https://www.konradvoelkel.com' });
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
  const text = excerpt('Ein **Wort** mit $x^2$ und [Link](http://a.test).');
  assert.equal(text, 'Ein Wort mit … und Link.');
  assert.ok(excerpt('wort '.repeat(100), 50).length <= 52);
  assert.equal(excerpt('Ein _kursives_ Wort, zero_grad und a > b'), 'Ein kursives Wort, zero_grad und a > b');
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
