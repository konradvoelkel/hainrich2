/**
 * Die Pfeile an den Fragen. Lesen sendet nichts: Erst der Klick würfelt eine Kennung und schickt die Stimme. Die Kennung gilt nur für diese
 * eine Frage, so lassen sich zwei Stimmen auf dem Server nicht verbinden (Plan I11). Alles liegt nur in diesem Browser, unter `eidl:`.
 */
const API = new URL('api/stimme', import.meta.url);
const STIMMEN = 'eidl:stimmen';

/** Ohne `localStorage` gilt die Stimme trotzdem, nur merkt sich die Seite sie nicht */
let notfall = {};
const lies = () => {
  try {
    return JSON.parse(localStorage.getItem(STIMMEN)) ?? {};
  } catch {
    return notfall;
  }
};
const schreib = stimmen => {
  notfall = stimmen;
  try {
    localStorage.setItem(STIMMEN, JSON.stringify(stimmen));
  } catch { /* siehe oben */ }
};

const wuerfle = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');

const meldung = document.createElement('p');
meldung.className = 'fehler';
meldung.setAttribute('role', 'alert');
meldung.hidden = true;
document.querySelector('main').prepend(meldung);

function zeige(box, wert) {
  for (const pfeil of box.querySelectorAll('.pfeil')) {
    const an = +pfeil.dataset.wert === wert;
    pfeil.classList.toggle('an', an);
    pfeil.setAttribute('aria-pressed', String(an));
  }
}

async function stimme(box, klick) {
  const { id } = box.dataset;
  const stimmen = lies();
  const eintrag = stimmen[id] ?? { kennung: wuerfle(), wert: 0 };
  const wert = eintrag.wert === klick ? 0 : klick;
  const punkte = box.querySelector('.punkte');
  const vorher = punkte.textContent;
  punkte.textContent = String(+vorher + wert - eintrag.wert);
  zeige(box, wert);
  meldung.hidden = true;
  let antwort = null;
  try {
    antwort = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, kennung: eintrag.kennung, wert }) });
    const daten = await antwort.json();
    if (!antwort.ok) throw new Error(daten.fehler);
    punkte.textContent = String(daten.punkte);
    schreib({ ...lies(), [id]: { kennung: eintrag.kennung, wert } });
  } catch (fehler) {
    punkte.textContent = vorher;
    zeige(box, eintrag.wert);
    meldung.textContent = antwort ? fehler.message : 'Der Server antwortet gerade nicht. Bitte später noch einmal.';
    meldung.hidden = false;
  }
}

const stimmen = lies();
for (const box of document.querySelectorAll('.stimme')) {
  zeige(box, stimmen[box.dataset.id]?.wert ?? 0);
  for (const pfeil of box.querySelectorAll('.pfeil')) {
    pfeil.hidden = false;
    pfeil.addEventListener('click', () => stimme(box, +pfeil.dataset.wert));
  }
}
