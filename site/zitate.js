/**
 * Lange Zitate sind eingeklappt (lib/site.js). Wer auf eine Marke [n] klickt oder mit einem Sprungziel ankommt, will das Zitat lesen:
 * Dann klappt es auf. Ohne JavaScript bleibt der Klick auf die Zeile, gelesen werden kann alles.
 */
const oeffne = marke => {
  const ziel = marke.length > 1 ? document.getElementById(decodeURIComponent(marke.slice(1))) : null;
  const zitat = ziel?.matches('figure') ? ziel.querySelector('details') : null;
  if (zitat) zitat.open = true;
};

/** auch Entwürfe unter „Meine Fragen“, die erst später in die Seite kommen */
document.addEventListener('click', event => {
  const marke = event.target.closest?.('a.marke-zitat');
  if (marke) oeffne(marke.hash);
});
addEventListener('hashchange', () => oeffne(location.hash));
oeffne(location.hash);
