/**
 * Der Kalendertag in Berlin, als `JJJJ-MM-TT` (Konrad, 2026-11-23). Eine Frage um 0:30 Uhr trägt diesen Tag und nicht wie in UTC den
 * Vortag, ebenso der Prüftag. Zahlen und Deckel zählen weiter in UTC-Tagen, die Moderation sagt das dazu (lib/mod-pages.js, Zahlen).
 *
 * `formatToParts` statt eines Gebietsschemas, das zufällig `JJJJ-MM-TT` schreibt: Solche Formate hat ICU schon geändert.
 */
const FORMAT = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

export function berlinerTag(ms) {
  const teil = Object.fromEntries(FORMAT.formatToParts(ms).map(p => [p.type, p.value]));
  return `${teil.year}-${teil.month}-${teil.day}`;
}
