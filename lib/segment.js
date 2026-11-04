/**
 * Zerlegt die Datei llms-full.txt des Skripts in Passagen: ein bis drei Absätze, die Formeln, Listen,
 * Codeblöcke und Direktiven nicht zerschneiden. Reine Funktionen, das Netz gehört zu tools/build-corpus.mjs.
 */
import { createHash } from 'node:crypto';

const PAGE_HEADER = /^={20,}\nURL: (.+)\nQUELLE: (.+)\n={20,}\n/gm;
const SKIP_PAGES = new Set(['', 'readme']);                         // Startseite und Organisatorisches (D12)
const SKIP_SECTION = /^(Übung|Aufgabe|Literatur|Weiterführend)/i;   // D12; Literatur ist keine Antwortquelle
const SKIP_ADMONITION = /Lesetext|Aufgabe|Übung/i;
const PRF_LABELS = {
  definition: 'Definition', theorem: 'Satz', lemma: 'Lemma', proposition: 'Proposition', corollary: 'Korollar',
  proof: 'Beweis', remark: 'Bemerkung', example: 'Beispiel', algorithm: 'Algorithmus', conjecture: 'Vermutung',
};

export const MAX_CHARS = 1000;
export const MIN_CHARS = 250;
const HARD_MAX = 1600;

export function pageSlug(url) {
  return new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
}

/** die Seiten der Datei, ohne den Kopf mit dem Inhaltsverzeichnis */
export function parsePages(text) {
  const heads = [...text.matchAll(PAGE_HEADER)];
  return heads.map((m, i) => {
    const body = text.slice(m.index + m[0].length, heads[i + 1]?.index ?? text.length).trim();
    return { url: m[1].trim(), source: m[2].trim(), slug: pageSlug(m[1].trim()), body };
  });
}

/** Blöcke einer Seite: Überschriften und Inhalte, die zusammenbleiben müssen */
export function parseBlocks(body) {
  const lines = body.split('\n');
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'text', text: para.join('\n') });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { flush(); continue; }
    if (/^\([\w-]+\)=$/.test(line)) continue;                        // MyST-Sprungziel
    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() });
      continue;
    }
    if (line.startsWith('```')) {
      flush();
      const start = i++;
      while (i < lines.length && !lines[i].startsWith('```')) i++;
      blocks.push({ kind: 'code', text: lines.slice(start, i + 1).join('\n') });
      continue;
    }
    if (line.startsWith(':::')) {
      flush();
      const start = i;
      let depth = 1;
      while (depth > 0 && ++i < lines.length) {
        if (/^:::\{/.test(lines[i])) depth++;
        else if (/^:::\s*$/.test(lines[i])) depth--;
      }
      blocks.push({ kind: 'directive', text: lines.slice(start, i + 1).join('\n') });
      continue;
    }
    if (line.trim() === '$$' || (line.startsWith('$$') && !line.trim().slice(2).includes('$$'))) {
      flush();
      const start = i++;
      while (i < lines.length && !lines[i].includes('$$')) i++;
      blocks.push({ kind: 'math', text: lines.slice(start, i + 1).join('\n') });
      continue;
    }
    if (line.startsWith('$$')) {
      flush();
      blocks.push({ kind: 'math', text: line });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

/** eine Direktive als Lesetext, oder null, wenn sie nichts zum Zitieren enthält */
export function cleanDirective(text) {
  const lines = text.split('\n');
  const head = lines[0].match(/^:::\{([\w:-]+)\}\s*(.*)$/);
  if (!head) return null;
  const [, name, arg] = head;
  const inner = lines.slice(1, -1).filter(l => !/^:[\w-]+:/.test(l)).join('\n').trim();
  if (name === 'anywidget') return null;
  if (name === 'figure') return inner ? `Abbildung: ${inner}` : null;
  if (name.startsWith('prf:')) {
    const kind = PRF_LABELS[name.slice(4)] ?? name.slice(4);
    return `**${kind}${arg ? ` (${arg})` : ''}.** ${inner}`;
  }
  if (name === 'admonition') {
    if (SKIP_ADMONITION.test(arg)) return null;
    return `**${arg}.** ${inner}`;
  }
  return inner || null;
}

const isGlue = block => block.kind === 'math' || block.kind === 'code';
const continues = text => /^[a-zäöü]/.test(text);   // „wobei …“ nach einer Formel gehört noch dazu

function pack(parts) {
  const out = [];
  let current = [];
  let size = 0;
  for (const part of parts) {
    const glued = isGlue(part) || continues(part.text);
    const full = size + part.text.length > MAX_CHARS && size >= MIN_CHARS;
    if (current.length && full && !(glued && size + part.text.length <= HARD_MAX)) {
      out.push(current.join('\n\n'));
      current = [];
      size = 0;
    }
    current.push(part.text);
    size += part.text.length;
  }
  if (current.length) out.push(current.join('\n\n'));
  const last = out.length - 1;
  if (out.length > 1 && out[last].length < MIN_CHARS && out[last - 1].length + out[last].length <= HARD_MAX) {
    out[last - 1] += `\n\n${out.pop()}`;
  }
  return out;
}

/**
 * Link auf die Stelle: Überschriften-Anker plus Text-Fragment aus den ersten Wörtern. Gemessen 2026-11-04:
 * Der Browser springt zum Text und fällt ohne Treffer auf den Anker zurück. Bis zur ersten Formel, weil
 * gerendertes KaTeX nicht als Text passt.
 */
export function quoteUrl(passage) {
  const plain = passage.text
    .replace(/^Abbildung: /, '')
    .replace(/^\*\*[^*\n]+\.\*\*\s*/, '')
    .split(/\$|\n\n/)[0]
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '');
  const words = plain.split(/\s+/).filter(Boolean).slice(0, 8);
  if (words.length < 3) return passage.link;
  const text = encodeURIComponent(words.join(' ')).replace(/-/g, '%2D');
  return `${passage.link}${passage.link.includes('#') ? '' : '#'}:~:text=${text}`;
}

export function hashText(text) {
  return createHash('sha256').update(text).digest('hex');
}

/** die Passagen einer Seite, jede mit Überschriftenpfad und Hash */
export function pagePassages(page) {
  if (SKIP_PAGES.has(page.slug)) return [];
  const blocks = parseBlocks(page.body);
  const title = blocks.find(b => b.kind === 'heading' && b.level === 1)?.text ?? page.slug;
  const sections = [];
  let section = { path: [], parts: [] };
  const stack = [];
  let skipBelow = 0;
  for (const block of blocks) {
    if (block.kind === 'heading') {
      if (block.level === 1) continue;
      if (skipBelow && block.level > skipBelow) continue;
      skipBelow = SKIP_SECTION.test(block.text) ? block.level : 0;
      if (section.parts.length) sections.push(section);
      stack.length = Math.max(0, block.level - 2);
      stack[block.level - 2] = block.text;
      section = { path: stack.filter(Boolean), parts: [] };
      continue;
    }
    if (skipBelow) continue;
    const text = block.kind === 'directive' ? cleanDirective(block.text) : block.text;
    if (!text || text.startsWith('[Vorlesungsaufzeichnung')) continue;
    section.parts.push({ kind: block.kind, text });
  }
  if (section.parts.length) sections.push(section);
  return sections.flatMap(s => pack(s.parts).map(text => ({
    id: `${page.slug}-${hashText(text).slice(0, 10)}`,
    page: page.slug, url: page.url, title, path: s.path, text, hash: hashText(text),
  })));
}
