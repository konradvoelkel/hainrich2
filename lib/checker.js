/**
 * Harte Regeln aus Plan §8: Was hier anschlägt, wird nicht öffentlich. Ein reines Modul, damit später Browser und Server
 * dasselbe prüfen. Namen fängt keine Regel zuverlässig, dafür ist die Moderation da.
 */
const HARD = [
  ['E-Mail-Adresse', /[^\s@]+@[^\s@]+\.[^\s@]{2,}/],
  ['IBAN', /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]){11,30}\b/],
  ['Telefonnummer', /(?:\+|\b00)\d[\d /-]{7,}\d|\b0\d{2,5}[ /-]\d[\d /-]{3,}\d\b/],
  ['Matrikelnummer', /matrikel\w*\D{0,20}\d/i],
  ['Zahl mit 6 bis 12 Ziffern', /(?<![\d.,])\d{6,12}(?!\d)/],
];

/** Namen der Regeln, die im Text anschlagen */
export const hardHits = text => HARD.filter(([, rule]) => rule.test(text)).map(([name]) => name);
