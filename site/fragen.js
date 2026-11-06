/**
 * Fragen stellen und „Meine Fragen“. Token, Geheimnisse und die Kopie der Fragen liegen nur in diesem Browser, unter `eidl:` (Plan §4). Der
 * Entwurf kommt fertig gerendert vom Server, wie jede Antwort. Während er läuft, fragt die Seite alle paar Sekunden nach.
 */
const API = '../../api/';
const TAKT_MS = 3000;
const FRIST_MS = 240_000;
const TOKEN = 'eidl:token';
const FRAGEN = 'eidl:fragen';

const formCode = document.getElementById('code');
const formFrage = document.getElementById('frage');
const text = document.getElementById('fragetext');
const zustimmung = document.getElementById('zustimmung');
const einwilligung = document.getElementById('einwilligung');
const bereich = document.getElementById('meine');
const liste = document.getElementById('meine-liste');

/** Ohne `localStorage` geht es für diese Sitzung trotzdem, die Liste ist dann beim nächsten Besuch weg */
const notfall = new Map();
const lies = (schluessel, vorgabe) => {
  try {
    return JSON.parse(localStorage.getItem(schluessel)) ?? vorgabe;
  } catch {
    return notfall.get(schluessel) ?? vorgabe;
  }
};
const schreib = (schluessel, wert) => {
  notfall.set(schluessel, wert);
  try {
    localStorage.setItem(schluessel, JSON.stringify(wert));
  } catch { /* siehe oben */ }
};

async function post(pfad, daten, token) {
  try {
    const antwort = await fetch(`${API}${pfad}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(daten),
    });
    return { status: antwort.status, daten: await antwort.json() };
  } catch {
    return { status: 0, daten: { fehler: 'Der Server antwortet gerade nicht. Bitte später noch einmal.' } };
  }
}

const fehler = (form, meldung = '') => {
  const feld = form.querySelector('.fehler');
  feld.textContent = meldung;
  feld.hidden = !meldung;
};

function zeigeFormular() {
  const da = !!lies(TOKEN, null);
  formCode.hidden = da;
  formFrage.hidden = !da;
}

const absatz = (klasse, inhalt) => {
  const p = document.createElement('p');
  p.className = klasse;
  p.textContent = inhalt;
  return p;
};

function knopf(beschriftung, tun) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'knopf';
  button.textContent = beschriftung;
  button.addEventListener('click', tun);
  return button;
}

function vergiss(id) {
  schreib(FRAGEN, lies(FRAGEN, []).filter(f => f.id !== id));
  aktualisiere();
}

async function loesche(eintrag) {
  if (!confirm('Diese Frage löschen? Das lässt sich nicht rückgängig machen.')) return;
  await post('loeschen', { id: eintrag.id, geheimnis: eintrag.geheimnis });
  vergiss(eintrag.id);
}

function stand(frage) {
  if (frage.zustand === 'entwurf') return 'Claude schreibt einen Entwurf, das dauert rund eine Minute.';
  if (frage.entwurf?.status === 'ok') return 'Wartet auf die Moderation. Bis dahin sehen nur Sie und die Moderation Frage und Entwurf.';
  if (frage.entwurf?.status === 'kein_beleg') return 'Dazu habe ich im Skript nichts gefunden. Ihre Frage wartet auf die Moderation.';
  if (frage.entwurf) return 'Einen Entwurf gab es diesmal nicht. Ihre Frage wartet auf die Moderation und bekommt danach eine Antwort.';
  if (frage.einwilligung) return 'Ihre Frage enthält womöglich persönliche Angaben und ging deshalb nicht an Claude. Sie wartet auf die Moderation.';
  return 'Wartet auf die Moderation, danach bekommt sie eine Antwort. Bis dahin sehen nur Sie und die Moderation die Frage.';
}

function zeile(eintrag, frage) {
  const li = document.createElement('li');
  li.className = 'meine-frage';
  const kopf = absatz('frage-text', frage.text ?? eintrag.text);
  /** fertig gesetzt vom Server, wie der Entwurf; ohne Antwort von dort bleibt die Kopie aus diesem Browser */
  if (frage.html) kopf.innerHTML = frage.html;
  li.append(kopf);
  if (frage.zustand === 'öffentlich') {
    const a = document.createElement('a');
    a.href = `../../${frage.url}`;
    a.textContent = 'Steht jetzt im Forum';
    li.append(a, knopf('Aus der Liste entfernen', () => vergiss(eintrag.id)));
  } else if (frage.zustand === 'abgelehnt') {
    li.append(absatz('meta', `Abgelehnt: ${frage.grund} Der Text ist auf dem Server gelöscht.`), knopf('Aus der Liste entfernen', () => vergiss(eintrag.id)));
  } else if (frage.zustand === 'weg') {
    li.append(absatz('meta', 'Diese Frage gibt es auf dem Server nicht mehr. Unbearbeitete Fragen werden nach vier Wochen gelöscht.'), knopf('Aus der Liste entfernen', () => vergiss(eintrag.id)));
  } else {
    li.append(absatz('meta', stand(frage)));
    if (frage.entwurf?.html) {
      const karte = document.createElement('div');
      karte.innerHTML = frage.entwurf.html;
      li.append(karte);
    }
    li.append(knopf('Frage löschen', () => loesche(eintrag)));
  }
  return li;
}

let takt = null;
let seit = 0;

async function aktualisiere() {
  clearTimeout(takt);
  const eintraege = lies(FRAGEN, []);
  bereich.hidden = !eintraege.length;
  if (!eintraege.length) { liste.replaceChildren(); return; }
  const { status, daten } = await post('meine', { fragen: eintraege.map(({ id, geheimnis }) => ({ id, geheimnis })) });
  if (status !== 200) { liste.replaceChildren(absatz('fehler', daten.fehler)); return; }
  liste.replaceChildren(...daten.fragen.map((frage, i) => zeile(eintraege[i], frage)));
  const laeuft = daten.fragen.some(f => f.zustand === 'entwurf');
  if (!laeuft) seit = 0;
  else if (!seit) seit = Date.now();
  if (laeuft && Date.now() - seit < FRIST_MS) takt = setTimeout(aktualisiere, TAKT_MS);
}

formCode.addEventListener('submit', async event => {
  event.preventDefault();
  fehler(formCode);
  const { status, daten } = await post('token', { kurscode: document.getElementById('kurscode').value });
  if (status !== 200) { fehler(formCode, daten.fehler); return; }
  schreib(TOKEN, daten.token);
  document.getElementById('kurscode').value = '';
  zeigeFormular();
});

formFrage.addEventListener('submit', async event => {
  event.preventDefault();
  fehler(formFrage);
  const frage = text.value.trim();
  const { status, daten } = await post('fragen', { frage, zustimmung: +formFrage.dataset.zustimmung, einwilligung: !!einwilligung?.checked }, lies(TOKEN, null));
  if (status === 401) {
    schreib(TOKEN, null);
    zeigeFormular();
    fehler(formCode, 'Bitte geben Sie den Kurscode noch einmal ein.');
    return;
  }
  if (status !== 201) {
    fehler(formFrage, daten.treffer ? `${daten.fehler} Gefunden: ${daten.treffer.join(', ')}.` : daten.fehler);
    return;
  }
  schreib(FRAGEN, [{ id: daten.id, geheimnis: daten.geheimnis, text: frage }, ...lies(FRAGEN, [])]);
  text.value = '';
  zustimmung.checked = false;
  if (einwilligung) einwilligung.checked = false;
  await aktualisiere();
  bereich.scrollIntoView();
});

/** aus der Suche mitgebracht; einmal abgeholt, liegt es nirgends mehr */
try {
  text.value = sessionStorage.getItem('eidl:frage') ?? '';
  sessionStorage.removeItem('eidl:frage');
} catch { /* dann eben leer */ }

zeigeFormular();
aktualisiere();
