/**
 * Markdown und Mathematik zu HTML, auf dem Server. Rohes HTML im Eingabetext wird nie durchgereicht,
 * auch nicht aus Modellausgaben, und zum Lesen braucht niemand JavaScript.
 */
import MarkdownIt from 'markdown-it';
import katex from 'katex';

const md = new MarkdownIt({ html: false, linkify: false });
const CODE = /(```[\s\S]*?```|`[^`\n]+`)/;

/** [n] im Fließtext zu Verweisen; in Code bleibt es stehen, ebenso jede Nummer, die marks nicht kennt */
const linkMarks = (html, marks) => html.split(/(<code[\s\S]*?<\/code>)/)
  .map((part, i) => (i % 2 ? part : part.replace(/\[(\d+)\]/g, (all, n) => marks(+n) ?? all))).join('');

export function renderMarkdown(source, { marks = null } = {}) {
  const math = [];
  const hold = (tex, displayMode) => {
    math.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false, strict: false }));
    return `${math.length - 1}`;
  };
  const prepared = source.split(CODE).map((part, i) => (i % 2 ? part : part
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => hold(tex, true))
    .replace(/(?<![\\$\w])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\w$])/g, (_, tex) => hold(tex, false)))).join('');
  const html = md.render(prepared);
  return (marks ? linkMarks(html, marks) : html).replace(/(\d+)/g, (_, i) => math[+i]);
}
