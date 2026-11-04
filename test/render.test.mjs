import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../lib/render.js';

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
