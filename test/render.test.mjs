import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, renderQuestion } from '../lib/render.js';

test('Inline- und Display-Mathematik werden zu KaTeX', () => {
  const html = renderMarkdown('Für $x^2$ gilt\n\n$$\ny = 1\n$$\n');
  assert.equal((html.match(/class="katex"/g) ?? []).length, 2);
  assert.match(html, /katex-display/);
});

test('rohes HTML bleibt Text', () => {
  const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=y>');
  assert.doesNotMatch(html, /<script|<img/);
  assert.match(html, /&lt;script&gt;/);
});

test('Dollarzeichen in Code bleiben Code', () => {
  const html = renderMarkdown('`$x$` und\n\n```bash\necho $HOME $USER\n```\n');
  assert.doesNotMatch(html, /katex/);
  assert.match(html, /\$HOME/);
});

test('Preise sind keine Mathematik', () => {
  assert.doesNotMatch(renderMarkdown('Das kostet 5$ oder 6$ pro Monat.'), /katex/);
});

test('kaputtes LaTeX wirft nicht', () => {
  assert.doesNotThrow(() => renderMarkdown('$\\frac{1}{$'));
});

test('Verweise bleiben aus Code und Mathematik heraus', () => {
  const html = renderMarkdown('Satz.[1] `a[1]` und $b[1]$', { marks: n => `<a>${n}</a>` });
  assert.equal((html.match(/<a>1<\/a>/g) ?? []).length, 1);
  assert.match(html, /<code>a\[1\]<\/code>/);
});

test('in Fragen werden Formeln gesetzt, sonst nichts', () => {
  assert.match(renderQuestion('Was bedeutet $x^2$ hier?'), /^Was bedeutet <span class="katex">.*<\/span> hier\?$/);
  assert.match(renderQuestion('Und $$\\sum_i x_i$$?'), /katex-display/);
  assert.equal(renderQuestion('Stern *hier* und _da_ und [Link](https://example.test)'), 'Stern *hier* und _da_ und [Link](https://example.test)');
  assert.ok(!renderQuestion('Eine Frage').includes('<p>'));
});

test('Fragetext bleibt Text: Markup wird nie durchgereicht, auch nicht um eine Formel herum', () => {
  assert.equal(renderQuestion('<script>alert(1)</script> & "so"'), '&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;so&quot;');
  const mixed = renderQuestion('<img src=x onerror=alert(1)> $a<b$');
  assert.ok(mixed.startsWith('&lt;img src=x onerror=alert(1)&gt; <span class="katex">'));
  assert.ok(!renderQuestion('$\\href{javascript:alert(1)}{x}$').includes('href="javascript'));
});

test('ein Dollar ist nicht immer eine Formel', () => {
  for (const text of ['Das kostet 5$ und 10$ im Monat.', 'Der Preis `$x$` steht im Code.', 'Ein einzelnes $ hier.']) assert.ok(!renderQuestion(text).includes('katex'), text);
});

test('D2: Mit einer Regel für Links bleibt nur stehen, was sie zulässt; vom Rest bleibt der Text', () => {
  const nurSkript = href => href.startsWith('https://skript.test/');
  const html = renderMarkdown('[a](https://boese.test/x) [b](https://skript.test/y) ![c](https://boese.test/c.png) <https://boese.test/auto> [d][1] [e](javascript:alert(1))\n\n[1]: https://boese.test/ref', { links: nurSkript });
  assert.doesNotMatch(html, /boese\.test\/(?:x|c\.png|ref)|<img/);
  assert.match(html, /<p>a <a href="https:\/\/skript\.test\/y">b<\/a> c https:\/\/boese\.test\/auto d /);
  assert.match(renderMarkdown('[a](https://boese.test/x)'), /<a href="https:\/\/boese\.test\/x">a<\/a>/, 'ohne Regel wie bisher');
});

test('D3: Eine Formel kann keine Fläche über die Seite legen', () => {
  const styles = html => (html.match(/style="[^"]*"/g) ?? []).join(' ');
  for (const html of [renderMarkdown('$\\rule{4000em}{4000em}$'), renderQuestion('$\\rule{4000em}{4000em}$ und $\\hspace{900em}x$'), renderMarkdown('$$a\\\\[4000em] b$$')]) {
    assert.doesNotMatch(styles(html), /(?<![\d.])\d{3,}(?:\.\d+)?em/);
  }
  assert.match(styles(renderMarkdown('$\\rule{4000em}{4000em}$')), /20em/);
});

test('eine Formel als MyST-Direktive in einem Zitat wird gesetzt und steht nicht als Code da', () => {
  const html = renderMarkdown('3. Also:\n\n   ```{math}\n   :enumerated: false\n   \\{f\\} \\approx \\{g\\}.\n   ```\n');
  assert.match(html, /katex-display/);
  assert.doesNotMatch(html, /\{math\}|enumerated|<pre>/);
});
