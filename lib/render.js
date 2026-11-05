/**
 * Markdown und Mathematik zu HTML, auf dem Server. Rohes HTML im Eingabetext wird nie durchgereicht,
 * auch nicht aus Modellausgaben, und zum Lesen braucht niemand JavaScript.
 */
import MarkdownIt from 'markdown-it';
import katex from 'katex';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const md = new MarkdownIt({ html: false, linkify: false });
const CODE = /(```[\s\S]*?```|`[^`\n]+`)/;

/** [n] im Fließtext zu Verweisen; in Code bleibt es stehen, ebenso jede Nummer, die marks nicht kennt */
const linkMarks = (html, marks) => html.split(/(<code[\s\S]*?<\/code>)/)
  .map((part, i) => (i % 2 ? part : part.replace(/\[(\d+)\]/g, (all, n) => marks(+n) ?? all))).join('');

/** setzt Formeln vorab und lässt Platzhalter stehen, damit weder Markdown noch Escaping sie anfassen; in Code bleibt ein Dollar ein Dollar */
function holdMath(source) {
  const math = [];
  const hold = (tex, displayMode) => {
    math.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false, strict: false }));
    return `${math.length - 1}`;
  };
  const text = source.split(CODE).map((part, i) => (i % 2 ? part : part
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => hold(tex, true))
    .replace(/(?<![\\$\w])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\w$])/g, (_, tex) => hold(tex, false)))).join('');
  return { text, restore: html => html.replace(/(\d+)/g, (_, i) => math[+i]) };
}

export function renderMarkdown(source, { marks = null } = {}) {
  const { text, restore } = holdMath(source);
  const html = md.render(text);
  return restore(marks ? linkMarks(html, marks) : html);
}

/** Fragen sind Klartext, gesetzt werden nur Formeln: `*` und `_` bleiben, was sie sind, und ein Link aus einer Frage wird keiner */
export function renderQuestion(source) {
  const { text, restore } = holdMath(source);
  return restore(esc(text));
}
