/**
 * Suche auf der Startseite: DOM hier, Modell und Rangfolge im Worker. Der startet erst beim ersten Fokus,
 * Crawler und reine Leser laden also nichts. Es wird nichts gesendet.
 */
const TIMEOUT_MS = 90_000;
const DEBOUNCE_MS = 200;

const bereich = document.getElementById('suche');
/** Auf einer Kapitelseite steht hier der Kapiteltitel, sonst nichts; `root` führt von der Seite zurück zur Wurzel des Forums */
const kapitel = bereich.dataset.kapitel || null;
const wurzel = bereich.dataset.root ?? '';
const feld = document.getElementById('suchfeld');
const status = document.getElementById('suchstatus');
const treffer = document.getElementById('treffer');
const listeFragen = document.getElementById('treffer-fragen');
const listeSkript = document.getElementById('treffer-skript');
const neueFrage = document.getElementById('neue-frage');

let worker = null;
let letzte = 0;
let warten = null;
let modellDa = false;
let stichworteDa = false;
let modellWeg = false;

/** `html` kommt fertig gesetzt vom Server, wie die Seiten selbst */
const zeile = (kopf, href, unten, html) => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = href;
  if (html) a.innerHTML = html;
  else a.textContent = kopf;
  const p = document.createElement('p');
  p.textContent = unten;
  li.append(a, p);
  return li;
};

/**
 * Das Angebot, die getippte Frage zu stellen. Es hängt an keinem Kosinus: Ein Schwellwert trennt Duplikate nicht (Plan §19), also entscheidet
 * der Klick. Nur wer wörtlich eine vorhandene Frage tippt, braucht es nicht.
 */
const gleich = text => text.toLowerCase().replace(/[^\p{L}\p{N}$]+/gu, ' ').trim();

function bieteAn(fragen = []) {
  if (!neueFrage) return;
  const anfrage = feld.value.trim();
  neueFrage.hidden = anfrage.length < +neueFrage.dataset.mindestens || fragen.some(f => gleich(f.text) === gleich(anfrage));
}

/** Der Zustand der Suche in einem Satz, solange keine Treffer dastehen */
function bereit() {
  if (modellDa) return 'Suche bereit. Sie läuft in Ihrem Browser.';
  if (modellWeg) return stichworteDa ? 'Das Sprachmodell ließ sich nicht laden. Die Stichwortsuche funktioniert weiter.' : 'Die Suche ließ sich nicht laden. Die Liste unten funktioniert weiter.';
  return stichworteDa ? 'Stichwortsuche bereit, das Sprachmodell lädt noch …' : 'Die Suche lädt …';
}

const zahl = (n, eins, viele) => `${n} ${n === 1 ? eins : viele}`;

/** Die Trefferliste ist keine Live-Region. Was gefunden ist, sagt deshalb die Statuszeile, auch einem Vorleseprogramm */
function melde(fragen, skript) {
  const gefunden = fragen.length || skript.length ? `${zahl(fragen.length, 'Frage', 'Fragen')} und ${zahl(skript.length, 'Stelle', 'Stellen')} im Skript gefunden.` : 'Nichts gefunden.';
  if (modellDa) status.textContent = gefunden;
  else status.textContent = `${gefunden} ${modellWeg ? 'Ohne Sprachmodell, nur über Stichworte.' : 'Das Sprachmodell lädt noch, dann werden die Treffer genauer.'}`;
}

function zeige({ fragen, skript }) {
  listeFragen.replaceChildren(...fragen.map(f => zeile(f.text, `${wurzel}f/${f.id}/`, f.kapitel, f.html)));
  listeSkript.replaceChildren(...skript.map(p => zeile([p.titel, ...p.pfad.slice(-1)].join(' › '), p.url, p.ausschnitt)));
  treffer.hidden = !fragen.length && !skript.length;
  melde(fragen, skript);
  bieteAn(fragen);
}

function suche() {
  const anfrage = feld.value.trim();
  letzte += 1;
  bieteAn();
  if (!anfrage) { treffer.hidden = true; status.textContent = bereit(); return; }
  if (stichworteDa) worker.postMessage({ act: 'suche', anfrage, nummer: letzte, kapitel });
}

function modellFehlt() {
  modellWeg = true;
  status.textContent = bereit();
}

function start() {
  status.textContent = bereit();
  worker = new Worker(`${wurzel}such-worker.js`, { type: 'module' });
  const frist = setTimeout(() => { if (!modellDa) modellFehlt(); }, TIMEOUT_MS);
  worker.onerror = () => { clearTimeout(frist); modellFehlt(); };
  worker.onmessage = ({ data }) => {
    switch (data.act) {
      case 'stichworte':
        stichworteDa = true;
        status.textContent = bereit();
        suche();
        break;
      case 'modell':
        clearTimeout(frist);
        modellDa = true;
        status.textContent = bereit();
        suche();
        break;
      case 'modellfehler':
      case 'fehler':
        clearTimeout(frist);
        console.error(data.nachricht);
        modellFehlt();
        break;
      case 'treffer':
        if (data.nummer === letzte) zeige(data);
        break;
    }
  };
}

/** nicht in die Adresse: Was hier steht, verlässt den Browser erst mit dem Absenden */
neueFrage?.querySelector('a').addEventListener('click', () => {
  try {
    sessionStorage.setItem('eidl:frage', feld.value.trim());
  } catch { /* dann bleibt das Feld dort leer */ }
});

bereich.hidden = false;
feld.addEventListener('focus', start, { once: true });
feld.addEventListener('input', () => {
  clearTimeout(warten);
  warten = setTimeout(suche, DEBOUNCE_MS);
});
