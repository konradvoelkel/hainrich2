import test from 'node:test';
import assert from 'node:assert/strict';
import { mathFences, parsePages, parseBlocks, cleanDirective, pagePassages, quoteUrl } from '../lib/segment.js';

test('quoteUrl hängt die ersten Wörter als Text-Fragment an den Anker', () => {
  const url = quoteUrl({ link: 'https://x.de/k/#a', text: 'Das *ist* ein [Satz](https://y) mit vielen weiteren schönen Wörtern am Ende' });
  assert.equal(url, 'https://x.de/k/#a:~:text=Das%20ist%20ein%20Satz%20mit%20vielen%20weiteren%20sch%C3%B6nen');
});

test('quoteUrl ohne Anker bekommt selbst ein Doppelkreuz, Bindestriche werden kodiert', () => {
  assert.match(quoteUrl({ link: 'https://x.de/k/', text: 'Die Cross-Entropy ist wichtig' }), /k\/#:~:text=Die%20Cross%2DEntropy%20ist%20wichtig$/);
});

test('quoteUrl stoppt an der Formel und lässt eigene Vorsätze weg', () => {
  assert.match(quoteUrl({ link: 'u', text: '**Satz (Haupt).** Für alle Punkte gilt $x$ und mehr' }), /text=F%C3%BCr%20alle%20Punkte%20gilt$/);
});

test('zu wenig Text bleibt beim Anker', () => {
  assert.equal(quoteUrl({ link: 'u#a', text: '$$\nx\n$$' }), 'u#a');
});

const page = body => ({ url: 'https://x.de/kapitel/', slug: 'kapitel', body });

test('parsePages liest URL und Inhalt und lässt den Kopf weg', () => {
  const sep = '='.repeat(80);
  const text = `# Kopf\n\n${sep}\nURL: https://x.de/a/\nQUELLE: https://x.de/a/index.md\n${sep}\n\n# A\n\nText\n\n${sep}\nURL: https://x.de/\nQUELLE: https://x.de/index.md\n${sep}\n\n# B\n`;
  const pages = parsePages(text);
  assert.deepEqual(pages.map(p => p.slug), ['a', '']);
  assert.match(pages[0].body, /^# A/);
});

test('Formeln, Code und Direktiven bleiben ganz, auch mit Leerzeilen', () => {
  const blocks = parseBlocks('Text\n\n$$\na\n\nb\n$$\n\n```python\nx = 1\n\ny = 2\n```\n\n:::{prf:definition} D\neins\n\n$$\nc\n$$\n:::\n');
  assert.deepEqual(blocks.map(b => b.kind), ['text', 'math', 'code', 'directive']);
  assert.match(blocks[1].text, /a\n\nb/);
  assert.match(blocks[3].text, /\$\$\nc\n\$\$/);
});

test('eine geschachtelte Direktive schließt erst am äußeren Ende', () => {
  const blocks = parseBlocks(':::{admonition} A\ntext\n:::{figure} b.png\nBild\n:::\nmehr\n:::\n\nDanach\n');
  assert.equal(blocks.length, 2);
  assert.match(blocks[0].text, /mehr/);
});

test('Direktiven werden zu Lesetext', () => {
  assert.equal(cleanDirective(':::{figure} a.png\n:width: 90%\n\nBildunterschrift\n:::'), 'Abbildung: Bildunterschrift');
  assert.equal(cleanDirective(':::{figure} a.png\n:width: 90%\n:::'), null);
  assert.equal(cleanDirective(":::{anywidget} a.mjs\n{url: 'x'}\n:::"), null);
  assert.equal(cleanDirective(':::{prf:theorem} Haupt\n:label: t\nInhalt\n:::'), '**Satz (Haupt).** Inhalt');
  assert.equal(cleanDirective(':::{admonition} Merke\n:class: tip\nInhalt\n:::'), '**Merke.** Inhalt');
  assert.equal(cleanDirective(':::{admonition} Lesetext zum Einstieg\nInhalt\n:::'), null);
});

test('Übungen und Literatur fallen weg, samt Unterabschnitten', () => {
  const texts = pagePassages(page('# K\n\n## Inhalt\n\nBehalten.\n\n## Übung\n\nWeg.\n\n### Aufgabe 1\n\nAuch weg.\n\n## Literatur\n\nWeg.\n\n## Weiter\n\nWieder da.\n')).map(p => p.text);
  assert.deepEqual(texts, ['Behalten.', 'Wieder da.']);
});

test('Startseite und Organisatorisches liefern nichts', () => {
  assert.deepEqual(pagePassages({ url: 'https://x.de/readme/', slug: 'readme', body: '# R\n\nText\n' }), []);
});

test('eine Formel als Direktive mit Backticks wird eine Formel, auch eingerückt in einer Liste und mit Optionen', () => {
  const liste = '3. Jede einfache Funktion ist approximierbar. Also:\n\n   ```{math}\n   :enumerated: false\n   \\{f\\} \\approx \\{g\\}.\n   ```\n\nDanach geht es weiter.\n';
  assert.equal(mathFences(liste), '3. Jede einfache Funktion ist approximierbar. Also:\n\n   $$\n   \\{f\\} \\approx \\{g\\}.\n   $$\n\nDanach geht es weiter.\n');
  assert.deepEqual(parseBlocks(liste).map(b => b.kind), ['text', 'math', 'text']);
  assert.deepEqual(parseBlocks('```{math}\n:label: eins\na = b\n```\n').map(b => [b.kind, b.text]), [['math', '$$\na = b\n$$']]);
  const [passage] = pagePassages(page(`# K\n\n## A\n\n${'x'.repeat(300)}\n\n${liste}`));
  assert.match(passage.text, /Also:\n\n {3}\$\$\n {3}\\\{f\\\} \\approx/);
  assert.doesNotMatch(passage.text, /\{math\}|enumerated|```/);
  assert.equal(mathFences('```python\nx = 1\n```\n'), '```python\nx = 1\n```\n', 'Code bleibt Code');
});

test('eine Formel bleibt beim Satz davor, auch über der Zielgröße', () => {
  const long = 'x'.repeat(950);
  const [first] = pagePassages(page(`# K\n\n## A\n\n${long}\n\n$$\nf(x)\n$$\n\nwobei $x$ klein ist.\n`));
  assert.match(first.text, /f\(x\)/);
  assert.match(first.text, /wobei/);
});

test('lange Abschnitte werden geteilt, kurze Reste angehängt', () => {
  const para = n => `${n} ${'wort '.repeat(120)}`.trim();
  const out = pagePassages(page(`# K\n\n## A\n\n${para('Eins')}\n\n${para('Zwei')}\n\n${para('Drei')}\n\nKurz.\n`));
  assert.equal(out.length, 3);
  assert.match(out[2].text, /^Drei.*Kurz\.$/s);
});

test('Passagen tragen Pfad, Titel und stabile IDs', () => {
  const body = '# Titel\n\n## A\n\n### B\n\nInhalt.\n';
  const [a] = pagePassages(page(body));
  const [b] = pagePassages(page(body));
  assert.deepEqual(a.path, ['A', 'B']);
  assert.equal(a.title, 'Titel');
  assert.equal(a.id, b.id);
});

test('der Fuß einer Kapitelseite ist kein Stoff: Forumszeile, Herkunftszeile und Glossar-Hinweis fallen weg, auch in einer Direktive', () => {
  const fuss = [
    ':::{admonition} Zum Weiterlesen',
    'Ein Satz, der bleibt.',
    '',
    'Die Begriffe dieses Kapitels in je ein bis drei Sätzen: [Glossar zur Klausurvorbereitung](https://skript.test/glossar/).',
    ':::',
    '',
    '*Frage zu diesem Kapitel? Im [Forum zum Skript](https://forum.test/eidl/f/kapitel/k/); fragen kann, wer den Kurscode aus ILIAS hat, mitlesen können alle.*',
    '',
    '*Dieses Kapitel gehört zu [Einführung in Deep Learning](https://skript.test/), dem Vorlesungsskript zur gleichnamigen Vorlesung.*',
  ].join('\n');
  const out = pagePassages(page(`# K\n\n## A\n\nDer Stoff des Abschnitts. ${'x'.repeat(200)}\n\n${fuss}\n`));
  const text = out.map(p => p.text).join('\n');
  assert.match(text, /Der Stoff des Abschnitts/);
  assert.match(text, /Ein Satz, der bleibt\./, 'die Direktive selbst bleibt, nur die Zeile fällt weg');
  assert.doesNotMatch(text, /Frage zu diesem Kapitel|Forum zum Skript|Dieses Kapitel gehört zu|Glossar zur Klausurvorbereitung|forum\.test/);
  assert.match(pagePassages(page('# K\n\n## A\n\nWer eine Frage zu diesem Kapitel hat, liest weiter. Das Glossar steht hinten.\n'))[0].text, /Frage zu diesem Kapitel hat/, 'im Fließtext bleibt der Wortlaut');
});

test('Sprungziele und der Link zur Aufzeichnung verschwinden', () => {
  const out = pagePassages(page('# K\n\n[Vorlesungsaufzeichnung VL 1](https://m)\n\n(ziel)=\n## A\n\nText.\n'));
  assert.deepEqual(out.map(p => p.text), ['Text.']);
});
