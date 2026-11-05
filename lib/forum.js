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
