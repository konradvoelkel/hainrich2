/**
 * Besitzt Modell und Rangfolge. Die Stichwortsuche steht sofort, das Modell kommt dazu; scheitert es,
 * bleibt sie als Rückfall. Embeddings liefern Kandidaten, einen Schwellwert gibt es nicht (Plan §6.3).
 */
import * as transformers from './transformers.min.js';
import { buildBm25, dot, FUSE_K, fuse } from './search.js';
import { biasKeywords, centerPassages, KAPITEL_BONUS, profile, rankQuestions } from './rank.js';
import { createEmbedder } from './model.js';

const TOP_FRAGEN = 5;
const TOP_SKRIPT = 3;

let fragen = [];
let passagen = [];
let stichwortFragen = null;
let stichwortPassagen = null;
let semantik = null;

async function json(datei) {
  const antwort = await fetch(datei);
  if (!antwort.ok) throw new Error(`${datei}: ${antwort.status}`);
  return antwort.json();
}

const melde = (act, fehler) => postMessage({ act, nachricht: fehler instanceof Error ? `${fehler.name}: ${fehler.message}` : String(fehler) });

async function stichworte() {
  [fragen, passagen] = await Promise.all([json('daten/fragen.json'), json('daten/passagen.json')]);
  stichwortFragen = buildBm25(fragen.map(f => f.text));
  stichwortPassagen = buildBm25(passagen.map(p => [p.titel, ...p.pfad, p.text].join(' ')));
}

async function modell() {
  const [vektoren, embedder] = await Promise.all([
    json('daten/vektoren.json'),
    createEmbedder(transformers, { modelPath: './models/', wasmPath: './wasm/' }),
  ]);
  const centered = centerPassages(vektoren.passagen);
  const frageVektoren = fragen.map(f => f.vektor);
  semantik = { embedder, centered, passagen: vektoren.passagen, fragen: frageVektoren, profile: frageVektoren.map(v => profile(centered, v)) };
}

/** nur Dokumente, die ein Wort der Anfrage enthalten */
const nachStichwort = scores => scores.map((s, i) => [s, i]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).map(([, i]) => i);

/** `kapitel` ist der Titel des Kapitels, auf dem man steht; die Fragen und Passagen tragen denselben Titel (Plan §6.3) */
async function suche(anfrage, kapitel) {
  const lexikalisch = stichwortPassagen(anfrage);
  const inKapitelFrage = kapitel ? fragen.map(f => f.kapitel === kapitel) : null;
  const inKapitelPassage = kapitel ? passagen.map(p => p.titel === kapitel) : null;
  if (!semantik) {
    return { fragen: nachStichwort(biasKeywords(stichwortFragen(anfrage), inKapitelFrage)), skript: nachStichwort(biasKeywords(lexikalisch, inKapitelPassage)) };
  }
  const v = await semantik.embedder.query(anfrage);
  return {
    fragen: rankQuestions(v, semantik.fragen, semantik.profile, semantik.centered, { bonus: inKapitelFrage?.map(x => (x ? KAPITEL_BONUS : 0)) ?? null }),
    /** ein Platz 1 in einer der beiden Listen */
    skript: fuse(semantik.passagen.map(p => dot(p, v)), lexikalisch, { bonus: inKapitelPassage?.map(x => (x ? 1 / (FUSE_K + 1) : 0)) ?? null }),
  };
}

self.onmessage = async ({ data }) => {
  try {
    const { fragen: f, skript: s } = await suche(data.anfrage, data.kapitel ?? null);
    postMessage({
      act: 'treffer',
      nummer: data.nummer,
      fragen: f.slice(0, TOP_FRAGEN).map(i => ({ id: fragen[i].id, text: fragen[i].text, html: fragen[i].html, kapitel: fragen[i].kapitel })),
      skript: s.slice(0, TOP_SKRIPT).map(i => passagen[i]),
    });
  } catch (fehler) {
    melde('fehler', fehler);
  }
};

try {
  await stichworte();
  postMessage({ act: 'stichworte' });
  try {
    await modell();
    postMessage({ act: 'modell' });
  } catch (fehler) {
    melde('modellfehler', fehler);
  }
} catch (fehler) {
  melde('fehler', fehler);
}
