/**
 * Die Unterforen, nach dem Inhaltsverzeichnis des Skripts. Eine Frage gehört über ihr Kapitel zu genau einem. Die Adressen liegen
 * unter f/, das bedient Caddy schon aus live/; eine Frage heißt s01, also gibt es keine Kollision. `Optimierer` steht im
 * Skript im Ausblick, gesucht wird er aber beim Training.
 */
export const UNTERFOREN = [
  {
    slug: 'grundlagen',
    titel: 'Grundlagen',
    beschreibung: 'Was Deep Learning ist, Neuron und Perzeptron, Tensoren und die Mathematik dahinter.',
    kapitel: ['Was ist Deep Learning?', 'Hintergrundwissen Lineare Algebra', 'Hintergrundwissen Analysis', 'Neuron und Perzeptron', 'Das Perzeptron trainieren', 'Vortrainierte Modelle verwenden', 'Tensoren'],
  },
  {
    slug: 'lernen',
    titel: 'Lernen und Training',
    beschreibung: 'Loss, Gradientenabstieg, Backpropagation, Aktivierungsfunktionen und Optimierer.',
    kapitel: ['Logistische Regression', 'Loss-Funktionen und Maximum Likelihood', 'Gradientenabstieg', 'Backpropagation', 'Autograd und Berechnungsgraph', 'Aktivierungsfunktionen', 'Netze von Hand bauen', 'Universelle Approximation', 'Optimierer: Momentum, Adam, Muon'],
  },
  {
    slug: 'architekturen',
    titel: 'Architekturen und Repräsentationen',
    beschreibung: 'Autoencoder, word2vec und latente Räume, CNNs, RNNs, Transformer und GANs.',
    kapitel: ['Autoencoder', 'Variational Autoencoder', 'Wortvektoren: word2vec', 'Latente Räume geometrisch', 'Representation Learning und Graphen', 'Recurrent Neural Networks', 'Transformer', 'Faltung und Convolutional Neural Networks', 'Generative Adversarial Networks'],
  },
  {
    slug: 'praxis',
    titel: 'Praxis und Anwendung',
    beschreibung: 'LLMs benutzen, Anwendungsbeispiele, Destillation und Angriffe auf Modelle.',
    kapitel: ['LLMs benutzen', 'Anwendungsbeispiele', 'Destillation', 'Adversarial Attacks und Polysemie'],
  },
];

/** Ein Kapitel ohne Unterforum ist ein Fehler: Die Frage wäre sonst über keine Liste erreichbar */
export function unterforumOf(kapitel) {
  const found = UNTERFOREN.find(u => u.kapitel.includes(kapitel));
  if (!found) throw new Error(`Kapitel ohne Unterforum: ${kapitel}`);
  return found;
}

export const threadsOf = (forum, questions) => questions.filter(q => forum.kapitel.includes(q.kapitel));

/**
 * Die Adresse eines Kapitels ist die Seitenkennung im Skript, ohne Nummer (`09-backpropagation` heißt dort `backpropagation`).
 * So kann das Skript auf `…/eidl/f/kapitel/backpropagation/` verweisen, ohne dass hier jemand etwas übersetzt. Der Bau prüft gegen
 * den Korpus, dass jede Kennung zu ihrem Titel gehört (site/build.mjs).
 */
export const KAPITEL_SLUG = {
  'Was ist Deep Learning?': 'was-ist-deep-learning',
  'Hintergrundwissen Lineare Algebra': 'hintergrundwissen-lineare-algebra',
  'Hintergrundwissen Analysis': 'hintergrundwissen-analysis',
  'Neuron und Perzeptron': 'neuron-perzeptron',
  'Das Perzeptron trainieren': 'perzeptron-trainieren',
  'Vortrainierte Modelle verwenden': 'vortrainierte-modelle',
  'Tensoren': 'tensoren',
  'Logistische Regression': 'logistische-regression',
  'Loss-Funktionen und Maximum Likelihood': 'loss-funktionen-maximum-likelihood',
  'Gradientenabstieg': 'gradientenabstieg',
  'Backpropagation': 'backpropagation',
  'Autograd und Berechnungsgraph': 'autograd-berechnungsgraph',
  'Aktivierungsfunktionen': 'aktivierungsfunktionen',
  'Netze von Hand bauen': 'netze-von-hand',
  'Universelle Approximation': 'universelle-approximation',
  'Optimierer: Momentum, Adam, Muon': 'optimierer',
  'Autoencoder': 'autoencoder',
  'Variational Autoencoder': 'variational-autoencoder',
  'Wortvektoren: word2vec': 'word2vec',
  'Latente Räume geometrisch': 'latente-raeume-geometrisch',
  'Representation Learning und Graphen': 'representation-learning-graphen',
  'Recurrent Neural Networks': 'rnn',
  'Transformer': 'transformer',
  'Faltung und Convolutional Neural Networks': 'faltung-cnn',
  'Generative Adversarial Networks': 'gans',
  'LLMs benutzen': 'llms-benutzen',
  'Anwendungsbeispiele': 'anwendungsbeispiele',
  'Destillation': 'destillation',
  'Adversarial Attacks und Polysemie': 'adversarial-attacks-polysemie',
};

/** Alle Kapitel in Skriptreihenfolge, mit Kennung und Unterforum */
export const KAPITEL = UNTERFOREN.flatMap(unterforum => unterforum.kapitel.map(titel => ({ titel, slug: KAPITEL_SLUG[titel], unterforum })));

/** Unbekannte Kennungen ergeben null, damit ein falsch getippter Link nichts kaputt macht */
export const kapitelBySlug = slug => KAPITEL.find(kapitel => kapitel.slug === slug) ?? null;
