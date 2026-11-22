/**
 * Fragen stellen und „Meine Fragen“. Token, Geheimnisse und die Kopie der Fragen liegen nur in diesem Browser, unter `eidl:` (Plan §4). Der
 * Entwurf kommt fertig gerendert vom Server, wie jede Antwort. Während er läuft, fragt die Seite alle paar Sekunden nach.
 */
import './zitate.js';

const API = '../../api/';
const TAKT_MS = 3000;
const FRIST_MS = 240_000;
const TOKEN = 'eidl:token';
const FRAGEN = 'eidl:fragen';

const formCode = document.getElementById('code');
const formFrage = document.getElementById('frage');
const kurscode = document.getElementById('kurscode');
const text = document.getElementById('fragetext');
const zustimmung = document.getElementById('zustimmung');
const einwilligung = document.getElementById('einwilligung');
const kapitelHinweis = document.getElementById('kapitel-hinweis');
const bereich = document.getElementById('meine');
const liste = document.getElementById('meine-liste');
const gesendet = document.getElementById('meine-status');

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

/**
 * Ungültig heißt ein Feld erst nach einer Eingabe oder einem Versuch (`:user-invalid`). Ohne `aria-invalid="false"` meldeten Firefox und
 * Safari leere Pflichtfelder schon beim Laden als ungültig (research/2026-11-21-modern-web-guidance, HTML b20).
 */
const nutzerUngueltig = feld => {
  try {
    return feld.matches(':user-invalid');
  } catch {
    return false;
  }
};
const markiere = feld => feld.setAttribute('aria-invalid', String(nutzerUngueltig(feld)));
for (const feld of [kurscode, text, zustimmung]) {
  const geaendert = () => { feld.removeAttribute('aria-describedby'); markiere(feld); };
  feld.addEventListener('input', geaendert);
  feld.addEventListener('change', geaendert);
  /** Solange eine Meldung vom Server am Feld hängt, bleibt es ungültig, bis jemand etwas ändert */
  feld.addEventListener('blur', () => { if (!feld.hasAttribute('aria-describedby')) markiere(feld); });
  feld.addEventListener('invalid', () => feld.setAttribute('aria-invalid', 'true'));
}

/**
 * Der Fehlerabsatz steht immer in der Seite und wechselt nur seinen Text: Eine Live-Region, die erst mit ihrem Text eingeblendet wird,
 * liest nicht jedes Vorleseprogramm vor (HTML b18). Betrifft die Meldung ein Feld, hängt sie daran, und die Tastatur geht dorthin (b19).
 */
function fehler(form, meldung = '', feld = null) {
  const absatz = form.querySelector('.fehler');
  absatz.textContent = meldung;
  for (const markiert of form.querySelectorAll(`[aria-describedby="${absatz.id}"]`)) {
    markiert.removeAttribute('aria-describedby');
    markiert.setAttribute('aria-invalid', 'false');
  }
  if (!feld) return;
  feld.setAttribute('aria-invalid', 'true');
  feld.setAttribute('aria-describedby', absatz.id);
  feld.focus();
}

/**
 * Ein zweiter Klick, solange die Antwort aussteht, schickt nichts: Sonst stand dieselbe Frage zweimal in der Moderation, mit Einwilligung
 * samt zwei Entwürfen (HTML b4). `aria-disabled` statt `disabled`: Ein gesperrter Knopf verlöre den Fokus, die Tastatur stünde am Seitenanfang.
 */
function beimAbsenden(form, tun) {
  let laeuft = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (laeuft) return;
    laeuft = true;
    const knopf = event.submitter ?? form.querySelector('button');
    knopf?.setAttribute('aria-disabled', 'true');
    try {
      await tun();
    } finally {
      laeuft = false;
      knopf?.removeAttribute('aria-disabled');
    }
  });
}

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

/** `rolle` findet den Knopf nach dem Neubau der Liste wieder, `frage` nennt ihn: Jede Zeile hat dieselben Knöpfe (HTML b11) */
function knopf(beschriftung, rolle, frage, tun) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'knopf';
  button.textContent = beschriftung;
  button.dataset.rolle = rolle;
  button.setAttribute('aria-describedby', frage);
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
  li.dataset.id = eintrag.id;
  const kopf = absatz('frage-text', frage.text ?? eintrag.text);
  kopf.id = `meine-${eintrag.id}`;
  /** fertig gesetzt vom Server, wie der Entwurf; ohne Antwort von dort bleibt die Kopie aus diesem Browser */
  if (frage.html) kopf.innerHTML = frage.html;
  li.append(kopf);
  const entfernen = () => knopf('Aus der Liste entfernen', 'entfernen', kopf.id, () => vergiss(eintrag.id));
  if (frage.zustand === 'öffentlich') {
    const a = document.createElement('a');
    a.href = `../../${frage.url}`;
    a.textContent = 'Steht jetzt im Forum';
    a.dataset.rolle = 'forum';
    li.append(a, entfernen());
  } else if (frage.zustand === 'abgelehnt') {
    li.append(absatz('meta', `Abgelehnt: ${frage.grund} Der Text ist auf dem Server gelöscht.`), entfernen());
  } else if (frage.zustand === 'weg') {
    li.append(absatz('meta', 'Diese Frage gibt es auf dem Server nicht mehr. Unbearbeitete Fragen werden nach vier Wochen gelöscht.'), entfernen());
  } else {
    li.append(absatz('meta', stand(frage)));
    if (frage.entwurf?.html) {
      const karte = document.createElement('div');
      karte.innerHTML = frage.entwurf.html;
      li.append(karte);
    }
    li.append(knopf('Frage löschen', 'loeschen', kopf.id, () => loesche(eintrag)));
  }
  return li;
}

/** Wo die Tastatur in der Liste stand: Zeile, Knopf und Platz, damit sie nach dem Neubau dort weitermacht */
function fokusInListe() {
  const aktiv = document.activeElement;
  const li = aktiv?.closest?.('#meine-liste > li');
  return li ? { id: li.dataset.id, rolle: aktiv.dataset.rolle ?? null, platz: [...liste.children].indexOf(li) } : null;
}

/**
 * Nach dem Neubau steht die Tastatur wieder am selben Knopf. Ist die Zeile weg (gelöscht, entfernt), geht sie zur Zeile, die jetzt an
 * ihrem Platz steht, ohne Zeile zur Überschrift, ohne Liste zum Frageformular. Vorher fiel sie an den Seitenanfang (HTML b3).
 */
function fokusZurueck(vorher) {
  if (!vorher) return;
  const zeilen = [...liste.children];
  const gleich = zeilen.find(li => li.dataset.id === vorher.id);
  const ziel = gleich?.querySelector(`[data-rolle="${vorher.rolle}"]`)
    ?? (zeilen[Math.min(vorher.platz, zeilen.length - 1)] ?? null)?.querySelector('[data-rolle]');
  if (ziel) { ziel.focus(); return; }
  if (!bereich.hidden) {
    const kopf = bereich.querySelector('h2');
    kopf.tabIndex = -1;
    kopf.focus();
    return;
  }
  (formFrage.hidden ? kurscode : text).focus();
}

let takt = null;
let seit = 0;
/** Was zuletzt in der Liste stand: Alle drei Sekunden neu gebaut, nähme die Liste jedem Vorleseprogramm und der Tastatur den Platz */
let zuletzt = null;

async function aktualisiere() {
  clearTimeout(takt);
  const eintraege = lies(FRAGEN, []);
  const vorher = fokusInListe();
  bereich.hidden = !eintraege.length;
  if (!eintraege.length) {
    liste.replaceChildren();
    zuletzt = null;
    fokusZurueck(vorher);
    return;
  }
  const { status, daten } = await post('meine', { fragen: eintraege.map(({ id, geheimnis }) => ({ id, geheimnis })) });
  if (status !== 200) { liste.replaceChildren(absatz('fehler', daten.fehler)); zuletzt = null; return; }
  const jetzt = JSON.stringify([eintraege.map(e => [e.id, e.text]), daten.fragen]);
  if (jetzt !== zuletzt) {
    zuletzt = jetzt;
    const fokus = fokusInListe() ?? vorher;
    liste.replaceChildren(...daten.fragen.map((frage, i) => zeile(eintraege[i], frage)));
    fokusZurueck(fokus);
  }
  const laeuft = daten.fragen.some(f => f.zustand === 'entwurf');
  if (!laeuft) seit = 0;
  else if (!seit) seit = Date.now();
  if (laeuft && Date.now() - seit < FRIST_MS) takt = setTimeout(aktualisiere, TAKT_MS);
}

beimAbsenden(formCode, async () => {
  fehler(formCode);
  const { status, daten } = await post('token', { kurscode: kurscode.value });
  if (status !== 200) { fehler(formCode, daten.fehler, status === 401 ? kurscode : null); return; }
  schreib(TOKEN, daten.token);
  kurscode.value = '';
  kurscode.setAttribute('aria-invalid', 'false');
  zeigeFormular();
  /** Das Formular, das den Fokus hielt, ist jetzt verborgen. Ohne diesen Schritt stünde die Tastatur am Seitenanfang */
  text.focus();
});

beimAbsenden(formFrage, async () => {
  fehler(formFrage);
  const frage = text.value.trim();
  const { status, daten } = await post('fragen', { frage, zustimmung: +formFrage.dataset.zustimmung, einwilligung: !!einwilligung?.checked, ...(kapitel ? { kapitel: kapitel.slug } : {}) }, lies(TOKEN, null));
  if (status === 401) {
    schreib(TOKEN, null);
    zeigeFormular();
    fehler(formCode, 'Bitte geben Sie den Kurscode noch einmal ein.');
    kurscode.focus();
    return;
  }
  if (status !== 201) {
    /** 422 betrifft den Text: zu kurz, zu lang oder vom Checker gesperrt */
    fehler(formFrage, daten.treffer ? `${daten.fehler} Gefunden: ${daten.treffer.join(', ')}.` : daten.fehler, status === 422 ? text : null);
    return;
  }
  schreib(FRAGEN, [{ id: daten.id, geheimnis: daten.geheimnis, text: frage }, ...lies(FRAGEN, [])]);
  text.value = '';
  zustimmung.checked = false;
  if (einwilligung) einwilligung.checked = false;
  /** leer, aber nicht falsch: Gefragt wurde ja schon */
  for (const feld of [text, zustimmung]) feld.setAttribute('aria-invalid', 'false');
  await aktualisiere();
  bereich.scrollIntoView();
  /** sagen, dass es geklappt hat, und die Tastatur dorthin stellen, wo die Frage jetzt steht */
  if (gesendet) gesendet.textContent = 'Ihre Frage ist angekommen und steht jetzt in dieser Liste.';
  const kopf = bereich.querySelector('h2');
  kopf.tabIndex = -1;
  kopf.focus();
});

/** Von einer Kapitelseite mitgebracht (`?kapitel=<kennung>`). Unbekannte Kennungen fallen weg, die Moderation ordnet ohnehin ein */
const kapitelListe = (() => {
  try {
    return JSON.parse(document.getElementById('kapitel-liste')?.textContent ?? '[]');
  } catch {
    return [];
  }
})();
const kapitel = kapitelListe.find(k => k.slug === new URLSearchParams(location.search).get('kapitel')) ?? null;
if (kapitel && kapitelHinweis) {
  kapitelHinweis.textContent = `Ihre Frage geht in das Unterforum „${kapitel.unterforum}“, Kapitel „${kapitel.titel}“. Die Moderation kann das noch ändern.`;
  kapitelHinweis.hidden = false;
}

/** aus der Suche mitgebracht; einmal abgeholt, liegt es nirgends mehr */
try {
  text.value = sessionStorage.getItem('eidl:frage') ?? '';
  sessionStorage.removeItem('eidl:frage');
} catch { /* dann eben leer */ }

zeigeFormular();
aktualisiere();
