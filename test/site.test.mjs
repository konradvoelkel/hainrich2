import test from 'node:test';
import assert from 'node:assert/strict';
import { excerpt, foreignSource, indexPage, publicQuestion, questionPage, robotsTxt, sitemap, textPage } from '../lib/site.js';

const site = { origin: 'https://example.test', base: '/eidl/', skript: 'https://skript.test/', vorschau: false, ladegroesse: 'rund 25 MB' };
const passage = { id: 'p1', page: 'kapitel', title: 'Kapitel', path: ['Abschnitt'], text: 'Ein **Perzeptron** rechnet $w^T x$ aus, und zwar genau so und nicht anders.', hash: 'h1', link: 'https://skript.test/kapitel/#abschnitt' };
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

test('Vorschau-Banner nur in der Vorschau', () => {
  assert.match(indexPage([question()], { ...site, vorschau: true }), /class="vorschau"/);
  assert.doesNotMatch(indexPage([question()], site), /class="vorschau"/);
});

test('Ausschnitt ohne Markdown und Formeln', () => {
  const text = excerpt('Ein **Wort** mit $x^2$ und [Link](http://a.test).');
  assert.equal(text, 'Ein Wort mit … und Link.');
  assert.ok(excerpt('wort '.repeat(100), 50).length <= 52);
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
