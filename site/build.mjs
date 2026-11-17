/**
 * Baut die öffentliche Site: node site/build.mjs --modell <id> [--release] [--stimmen] [--fragen] [--ziel <verzeichnis>].
 * Allowlist statt Kopie des Repos (Playbook §3.10). Ohne --release trägt jede Seite ein Vorschau-Banner. --fragen nimmt die Rechtstexte
 * für den Fragepfad auf, --stimmen den Absatz zum Abstimmen. Text und Technik gehen am selben Tag live, also gehört jeder der beiden
 * Schalter zu seinem Gegenstück auf dem Server: Kurscode-Hash und `hainrich2_stimmen`.
 * --daten liefert die Antworten und den Korpus, aus dem sie zitieren, --korpus den Korpus für die Suche im Browser. Getrennt, weil der
 * erste mit den Antworten eingefroren ist und der zweite dem Skript folgt; auf dem Server kommen die Frageseiten ohnehin aus `live/`.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { promisify, parseArgs } from 'node:util';
import zlib from 'node:zlib';
import { createEmbedder, MODEL_DIR, MODEL_ID } from '../lib/embedder.js';
import { KAPITEL, UNTERFOREN } from '../lib/forum.js';
import { excerpt, foreignSource, forumPage, indexPage, kapitelPage, MODERATION, notFoundPage, OG_CARD, publicQuestion, questionPage, robotsTxt, searchEntry, sitemap, textPage } from '../lib/site.js';
import { quoteUrl } from '../lib/segment.js';

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.dirname(here);
const { values: args } = parseArgs({ options: {
  modell: { type: 'string' },
  release: { type: 'boolean', default: false },
  fragen: { type: 'boolean', default: false },
  stimmen: { type: 'boolean', default: false },
  ziel: { type: 'string', default: '/media/konrad/xtraspace/hainrich2/site' },
  daten: { type: 'string', default: '/media/konrad/xtraspace/hainrich2/work/phase1' },
  korpus: { type: 'string', default: '/media/konrad/xtraspace/hainrich2/work/korpus-aktuell' },
} });
if (!args.modell) throw new Error('--modell fehlt: Welche Antworten die Site zeigt, entscheidet der Blindvergleich.');

/** aus dem Messbericht, research/2026-11-04-browsermodell */
const MODEL_SHA = {
  'onnx/model_quantized.onnx': 'f37dfa6645b390114197d006274c4f330a71b12c973f55194f64a301aaef20d4',
  'tokenizer.json': 'a7b955b5cb8d67f95542125b44e791248280deab367f8f4fa7da6eb4866a68f4', // gitleaks:allow, eine Prüfsumme
};
const MODEL_FILES = ['config.json', 'tokenizer_config.json', 'special_tokens_map.json', ...Object.keys(MODEL_SHA)];
const ROUND = 4;

const env = Object.fromEntries(fs.readFileSync(path.join(here, 'site.env'), 'utf8').split('\n')
  .filter(l => /^[A-Z_]+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
if (!env.SITE_KONTAKT || !env.SITE_ANSCHRIFT) throw new Error('site.env: SITE_KONTAKT und SITE_ANSCHRIFT fehlen.');

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const seeds = readJson(path.join(repo, 'seeds/fragen.json'));
/** `phase1` ist eingefroren und kennt auch Fragen, die es nicht mehr gibt (s30, Konrad am 2026-11-17): Es zählen nur die Antworten zu den Seeds */
const known = new Set(seeds.map(seed => seed.id));
const rows = readJson(path.join(args.daten, 'antworten.json')).filter(r => r.model === args.modell && known.has(r.seed));
const { passages: cited, fetched } = readJson(path.join(args.daten, 'corpus.json'));
const { passages, fetched: korpusFetched } = readJson(path.join(args.korpus, 'corpus.json'));
const passageVectors = readJson(path.join(args.korpus, 'vectors.json'));
if (passageVectors.length !== passages.length) throw new Error('vectors.json passt nicht zu corpus.json');
if (rows.length !== seeds.length) throw new Error(`${args.modell}: ${rows.length} Antworten für ${seeds.length} Fragen`);

const day = fetched.slice(0, 10);
const questions = seeds.map(seed => publicQuestion(seed, rows.find(r => r.seed === seed.id), cited, day));

const staging = fs.mkdtempSync(`${args.ziel}.bau-`);
const base = path.join(staging, env.SITE_BASE);
const write = (name, content) => {
  const file = path.join(base, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const copy = (from, name) => {
  fs.mkdirSync(path.dirname(path.join(base, name)), { recursive: true });
  fs.copyFileSync(from, path.join(base, name));
};
const dep = (...p) => path.join(repo, 'node_modules', ...p);

for (const name of ['style.css', 'app.js', 'fragen.js', 'stimmen.js', 'zitate.js', 'such-worker.js']) copy(path.join(here, name), name);
for (const name of ['logo.svg', 'favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'muster.svg', MODERATION.bild, OG_CARD.file]) copy(path.join(here, 'brand', name), name);
/** Browser und Crawler fragen an der Wurzel des Hosts danach, egal was die Seite nennt */
fs.copyFileSync(path.join(here, 'brand/favicon.ico'), path.join(staging, 'favicon.ico'));
for (const name of ['search.js', 'rank.js', 'model.js']) copy(path.join(repo, 'lib', name), name);
copy(dep('@huggingface/transformers/dist/transformers.min.js'), 'transformers.min.js');
for (const name of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm']) copy(dep('onnxruntime-web/dist', name), `wasm/${name}`);
copy(dep('katex/dist/katex.min.css'), 'katex/katex.min.css');
copy(dep('@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'), 'schrift/bricolage-grotesque.woff2');
copy(dep('@fontsource-variable/bricolage-grotesque/LICENSE'), 'schrift/OFL.txt');
for (const font of fs.readdirSync(dep('katex/dist/fonts')).filter(f => f.endsWith('.woff2'))) copy(dep('katex/dist/fonts', font), `katex/fonts/${font}`);

for (const name of MODEL_FILES) {
  const from = path.join(MODEL_DIR, MODEL_ID, name);
  const sum = crypto.createHash('sha256').update(fs.readFileSync(from)).digest('hex');
  if (MODEL_SHA[name] && MODEL_SHA[name] !== sum) throw new Error(`${name}: SHA-256 weicht vom Messbericht ab`);
  copy(from, `models/${MODEL_ID}/${name}`);
}

const embedder = await createEmbedder();
const round = v => v.map(x => +x.toFixed(ROUND));
const questionVectors = [];
for (const q of questions) questionVectors.push(round(await embedder.query(q.text)));

/** Vektor am Eintrag: Zieht die Moderation eine Frage zurück, verrutscht nichts */
write('daten/fragen.json', JSON.stringify(questions.map((q, i) => searchEntry(q, questionVectors[i]))));
write('daten/passagen.json', JSON.stringify(passages.map(p => ({ titel: p.title, pfad: p.path, text: p.text, url: quoteUrl(p), ausschnitt: excerpt(p.text) }))));
write('daten/vektoren.json', JSON.stringify({ modell: MODEL_ID, passagen: passageVectors.map(round) }));

/** .br, .zst und .gz für Caddy `precompressed`; bei den großen Dateien reicht eine mittlere Stufe */
const COMPRESS = /\.(html|css|js|mjs|json|svg|xml|txt|wasm|onnx)$/;
const brotli = promisify(zlib.brotliCompress);
const zstd = promisify(zlib.zstdCompress);
const gzip = promisify(zlib.gzip);
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

async function precompress(file) {
  const data = fs.readFileSync(file);
  const quality = data.length > 2_000_000 ? 9 : 11;
  const [br, zst, gz] = await Promise.all([
    brotli(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: quality } }),
    zstd(data, { params: { [zlib.constants.ZSTD_c_compressionLevel]: 19 } }),
    gzip(data, { level: 9 }),
  ]);
  fs.writeFileSync(`${file}.br`, br);
  fs.writeFileSync(`${file}.zst`, zst);
  fs.writeFileSync(`${file}.gz`, gz);
  return br.length;
}

/** Die Größe im Suchtext ist gemessen, nicht getippt: alles, was der erste Klick lädt */
const assets = walk(base).filter(f => COMPRESS.test(f));
const sizes = await Promise.all(assets.map(async f => [path.relative(base, f), await precompress(f)]));
const firstClick = /^(such-worker|search|rank|model|transformers\.min)\.js$|^wasm\/|^models\/|^daten\//;
const loadBytes = sizes.filter(([name]) => firstClick.test(name)).reduce((a, [, n]) => a + n, 0);

const site = {
  origin: env.SITE_ORIGIN,
  base: env.SITE_BASE,
  skript: env.SITE_SKRIPT,
  vorschau: !args.release,
  fragen: args.fragen,
  ladegroesse: `rund ${Math.round(loadBytes / 1e6)} MB`,
};

/** Markdown macht aus __X__ Fettdruck, ein vergessener Platzhalter fiele hinter renderMarkdown also keinem Stolperdraht mehr auf */
const fill = text => {
  const filled = text
    .replaceAll('__KONTAKT__', env.SITE_KONTAKT)
    .replaceAll('__ANSCHRIFT__', `  \n${env.SITE_ANSCHRIFT.replaceAll('|', '  \n')}`);
  const open = filled.match(/__[A-Z][A-Z_]+__/g);
  if (open) throw new Error(`Rechtstexte: ${[...new Set(open)].join(', ')} fehlt, aus den Originaldokumenten eintragen (Plan §11.3)`);
  return filled;
};

write('index.html', indexPage(questions, site));
for (const forum of UNTERFOREN) write(`f/${forum.slug}/index.html`, forumPage(forum, questions, site));
/** Die Kennung trägt das Skript selbst; stimmt sie nicht zum Korpus, verweist der Link ins Leere */
for (const kapitel of KAPITEL) {
  const found = passages.find(p => p.page === kapitel.slug);
  if (found?.title !== kapitel.titel) throw new Error(`Kapitel ${kapitel.slug}: Korpus sagt ${found?.title ?? 'nichts'}, Forum ${kapitel.titel}`);
  write(`f/kapitel/${kapitel.slug}/index.html`, kapitelPage(kapitel, questions, site));
}
write('daten/meta.json', JSON.stringify({ ladegroesse: site.ladegroesse }));
for (const q of questions) write(`f/${q.id}/index.html`, questionPage(q, site));
const text = name => fs.readFileSync(path.join(here, 'texte', `${name}.md`), 'utf8');
if (!text('datenschutz').includes('## Eigene Beiträge')) throw new Error('datenschutz.md: Abschnitt „Eigene Beiträge“ nicht gefunden');
const voting = args.stimmen ? text('datenschutz').replace('## Eigene Beiträge', `${text('datenschutz-stimmen')}## Eigene Beiträge`) : text('datenschutz');
const privacy = args.fragen ? voting.replace(/## Eigene Beiträge[\s\S]*?(?=## Ihre Rechte)/, text('datenschutz-fragen')) : voting;
write('404.html', notFoundPage(site));
write('ueber/index.html', textPage('ueber', fill(text('ueber')), site, { robots: 'index,follow', description: 'Ein Forum zum Skript „Einführung in Deep Learning“: Ein Sprachmodell antwortet mit Zitat, eine Moderation prüft, alle können lesen. Ein Prototyp.' }));
write('impressum/index.html', textPage('impressum', fill(text('impressum')), site));
write('datenschutz/index.html', textPage('datenschutz', fill(privacy), site));
if (args.fragen) write('nutzungsbedingungen/index.html', textPage('nutzungsbedingungen', fill(text('nutzungsbedingungen')), site));
write('sitemap.xml', sitemap(questions, site));
fs.writeFileSync(path.join(staging, 'robots.txt'), robotsTxt(site));

/** Stolperdrähte auf dem fertigen Baum */
const built = walk(staging);
const pages = built.filter(f => f.endsWith('.html'));
const texts = built.filter(f => /\.(html|css|json|xml|txt)$/.test(f) || /(app|fragen|stimmen|zitate|such-worker|search|rank|model)\.js$/.test(f));
for (const file of built) if (/\.(md|adoc|db|env)$/.test(file)) throw new Error(`gehört nicht auf die Site: ${file}`);
for (const file of texts) {
  const text = fs.readFileSync(file, 'utf8');
  const hit = text.match(/__[A-Z][A-Z_]+__|sk-ant-[\w-]{8,}/);
  if (hit) throw new Error(`${path.relative(staging, file)}: ${hit[0].slice(0, 12)}`);
}
const card = fs.readFileSync(path.join(base, OG_CARD.file));
if (card.readUInt32BE(16) !== OG_CARD.width || card.readUInt32BE(20) !== OG_CARD.height) throw new Error(`${OG_CARD.file}: ${card.readUInt32BE(16)} x ${card.readUInt32BE(20)}, angekündigt sind ${OG_CARD.width} x ${OG_CARD.height}`);
for (const file of pages) {
  const foreign = foreignSource(fs.readFileSync(file, 'utf8'));
  if (foreign) throw new Error(`${path.relative(staging, file)}: fremde Quelle ${foreign}`);
}

await Promise.all(walk(staging).filter(f => COMPRESS.test(f) && !fs.existsSync(`${f}.br`)).map(precompress));

fs.rmSync(args.ziel, { recursive: true, force: true });
fs.renameSync(staging, args.ziel);
fs.chmodSync(args.ziel, 0o755);

console.log(`${pages.length} Seiten, ${questions.length} Fragen mit ${args.modell}, Suche über ${passages.length} Passagen vom ${korpusFetched.slice(0, 10)}, erster Klick ${(loadBytes / 1e6).toFixed(1)} MB Brotli, ${args.ziel}`);
