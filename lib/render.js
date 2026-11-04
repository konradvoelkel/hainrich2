/**
 * Markdown und Mathematik zu HTML, auf dem Server. Rohes HTML im Eingabetext wird nie durchgereicht,
 * auch nicht aus Modellausgaben, und zum Lesen braucht niemand JavaScript.
 */
import MarkdownIt from 'markdown-it';
import katex from 'katex';

const md = new MarkdownIt({ html: false, linkify: false });
const CODE = /(```[\s\S]*?```|`[^`\n]+`)/;

export function renderMarkdown(source) {
  const math = [];
  const hold = (tex, displayMode) => {
    math.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false, strict: false }));
    return `${math.length - 1}`;
  };
  const prepared = source.split(CODE).map((part, i) => (i % 2 ? part : part
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => hold(tex, true))
    .replace(/(?<![\\$\w])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\w$])/g, (_, tex) => hold(tex, false)))).join('');
  return md.render(prepared).replace(/(\d+)/g, (_, i) => math[+i]);
}
