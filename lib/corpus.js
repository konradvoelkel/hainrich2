/** Der fertige Korpus aus tools/build-corpus.mjs, mit Suche. */
import fs from 'node:fs';
import path from 'node:path';
import { buildBm25, dot, fuse, withNeighbours } from './search.js';
import { createEmbedder } from './embedder.js';

export async function openCorpus(dir) {
  const { passages, toc } = JSON.parse(fs.readFileSync(path.join(dir, 'corpus.json'), 'utf8'));
  const vectors = JSON.parse(fs.readFileSync(path.join(dir, 'vectors.json'), 'utf8'));
  const lexical = buildBm25(passages.map(p => [p.title, ...p.path, p.text].join(' ')));
  const embedder = await createEmbedder();
  const rank = async question => {
    const v = await embedder.query(question);
    return fuse(vectors.map(x => dot(x, v)), lexical(question));
  };
  return {
    passages,
    toc,
    embedder,
    /** Treffer samt Nachbarn, rund 10k Tokens */
    async select(question, options) {
      return withNeighbours(await rank(question), passages, options).map(i => passages[i]);
    },
    /** zweiter Anlauf: die ganzen Kapitel der besten Treffer */
    async chapters(question, count = 2) {
      const pages = [...new Set((await rank(question)).slice(0, 20).map(i => passages[i].page))].slice(0, count);
      return passages.filter(p => pages.includes(p.page));
    },
  };
}
