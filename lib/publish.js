/**
 * Schreibt, was sich mit der Moderation ändert, in ein eigenes Verzeichnis: Startseite, Unterforen, Frageseiten, Sitemap und die Fragen
 * für die Suche. Alles andere liefert `site/deploy.sh`, und dessen `--delete` trifft dieses Verzeichnis nie. Jede Datei
 * kommt samt `.br`, `.zst` und `.gz`, sonst liefert Caddy weiter den alten Text aus (Playbook §3.10).
 */
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import zlib from 'node:zlib';
import { KAPITEL, UNTERFOREN } from './forum.js';
import { askPage, forumPage, indexPage, kapitelPage, questionPage, searchEntry, sitemap } from './site.js';

const brotli = promisify(zlib.brotliCompress);
const zstd = promisify(zlib.zstdCompress);
const gzip = promisify(zlib.gzip);

/** erst daneben schreiben, dann umbenennen: Caddy sieht nie eine halbe Datei */
function replace(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.neu`;
  fs.writeFileSync(temp, data);
  fs.renameSync(temp, file);
}

async function write(file, text) {
  const data = Buffer.from(text);
  const [br, zst, gz] = await Promise.all([
    brotli(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } }),
    zstd(data, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } }),
    gzip(data, { level: 9 }),
  ]);
  replace(`${file}.br`, br);
  replace(`${file}.zst`, zst);
  replace(`${file}.gz`, gz);
  replace(file, data);
}

const pageFile = (dir, base, id) => path.join(dir, base, 'f', id, 'index.html');

/** Startseite und alles, was alle Fragen kennt; die Kapitelseiten listen Fragen, also gehören sie hierher */
async function writeShared(dir, questions, site) {
  const base = path.join(dir, site.base);
  await write(path.join(base, 'index.html'), indexPage(questions, site));
  for (const forum of UNTERFOREN) await write(path.join(base, 'f', forum.slug, 'index.html'), forumPage(forum, questions, site));
  for (const kapitel of KAPITEL) await write(path.join(base, 'f', 'kapitel', kapitel.slug, 'index.html'), kapitelPage(kapitel, questions, site));
  await write(path.join(base, 'sitemap.xml'), sitemap(questions, site));
  await write(path.join(base, 'daten/fragen.json'), JSON.stringify(questions.map(q => searchEntry(q))));
}

/** alles neu, beim ersten Start */
export async function publishAll(dir, store) {
  const site = store.site();
  const questions = store.visible();
  for (const q of questions) await write(pageFile(dir, site.base, q.id), questionPage(q, site));
  await writeShared(dir, questions, site);
  if (site.fragen) await write(pageFile(dir, site.base, 'neu'), askPage(site));
  else fs.rmSync(path.dirname(pageFile(dir, site.base, 'neu')), { recursive: true, force: true });
}

/** nach einer Änderung: die Fragen und was sie berühren */
export async function publishQuestions(dir, store, ids) {
  const site = store.site();
  for (const id of ids) {
    const question = store.question(id);
    if (question?.status === 'sichtbar') await write(pageFile(dir, site.base, id), questionPage(question, site));
    else fs.rmSync(path.dirname(pageFile(dir, site.base, id)), { recursive: true, force: true });
  }
  await writeShared(dir, store.visible(), site);
}

/** nacheinander, zwei Änderungen schreiben nie gleichzeitig dieselben Dateien */
export function createPublisher(dir, store) {
  let queue = Promise.resolve();
  const run = work => (queue = queue.then(work, work));
  /** `all` für das, was jede Seite trifft: der Schalter der Vorschau. Er steht in derselben Reihe, sonst schriebe ein älterer Auftrag danach noch mit dem alten Wert */
  return Object.assign((...ids) => run(() => publishQuestions(dir, store, ids)), { all: () => run(() => publishAll(dir, store)) });
}
