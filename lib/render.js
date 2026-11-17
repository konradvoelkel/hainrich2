/**
 * Markdown und Mathematik zu HTML, auf dem Server. Rohes HTML im Eingabetext wird nie durchgereicht,
 * auch nicht aus Modellausgaben, und zum Lesen braucht niemand JavaScript.
 */
import MarkdownIt from 'markdown-it';
import katex from 'katex';
import { mathFences } from './segment.js';

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const md = new MarkdownIt({ html: false, linkify: false });
const CODE = /(```[\s\S]*?```|`[^`\n]+`)/;
/** Obergrenze für Längen in Formeln, in em: `\rule{4000em}{4000em}` wäre sonst eine Fläche über die ganze Seite (research/2026-11-11-threat-model, D3) */
const FORMEL_MAX_EM = 20;

/**
 * Mit `links` in der Umgebung bleibt nur ein Link stehen, dessen Ziel die Funktion zulässt; von jedem anderen bleibt der Text, von
 * einem Bild der Ersatztext. So kann eine Frage den Bot nicht zu einem Link überreden, der dann ungeprüft öffentlich steht (D2).
 */
md.core.ruler.push('nur_erlaubte_links', state => {
  const allowed = state.env.links;
  if (!allowed) return;
  for (const token of state.tokens) {
    if (token.type !== 'inline') continue;
    const open = [];
    token.children = token.children.flatMap(child => {
      if (child.type === 'link_open') {
        open.push(allowed(child.attrGet('href') ?? ''));
        return open.at(-1) ? [child] : [];
      }
      if (child.type === 'link_close') return open.pop() ? [child] : [];
      if (child.type !== 'image') return [child];
      const text = new state.Token('text', '', 0);
      text.content = child.content;
      return [text];
    });
  }
});

/** [n] im Fließtext zu Verweisen; in Code bleibt es stehen, ebenso jede Nummer, die marks nicht kennt */
const linkMarks = (html, marks) => html.split(/(<code[\s\S]*?<\/code>)/)
  .map((part, i) => (i % 2 ? part : part.replace(/\[(\d+)\]/g, (all, n) => marks(+n) ?? all))).join('');

/** setzt Formeln vorab und lässt Platzhalter stehen, damit weder Markdown noch Escaping sie anfassen; in Code bleibt ein Dollar ein Dollar */
function holdMath(source) {
  const math = [];
  const hold = (tex, displayMode) => {
    math.push(katex.renderToString(tex.trim(), { displayMode, throwOnError: false, strict: false, maxSize: FORMEL_MAX_EM }));
    return `${math.length - 1}`;
  };
  const text = source.split(CODE).map((part, i) => (i % 2 ? part : part
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => hold(tex, true))
    .replace(/(?<![\\$\w])\$(?!\s)([^$\n]+?)(?<![\s\\])\$(?![\w$])/g, (_, tex) => hold(tex, false)))).join('');
  return { text, restore: html => html.replace(/(\d+)/g, (_, i) => math[+i]) };
}

/** `links`: null lässt jeden Link stehen, sonst entscheidet die Funktion über das Ziel */
export function renderMarkdown(source, { marks = null, links = null } = {}) {
  const { text, restore } = holdMath(mathFences(source));
  const html = md.render(text, { links });
  return restore(marks ? linkMarks(html, marks) : html);
}

/** Fragen sind Klartext, gesetzt werden nur Formeln: `*` und `_` bleiben, was sie sind, und ein Link aus einer Frage wird keiner */
export function renderQuestion(source) {
  const { text, restore } = holdMath(source);
  return restore(esc(text));
}
