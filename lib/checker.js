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

/** Weiche Regeln: Die Moderation soll hinsehen, und bis dahin geht die Frage auch mit Einwilligung nicht an Claude (Plan §8, §11.3) */
const SOFT = [
  ['Vorstellung', /\b(?:ich hei(?:ß|ss)e|mein name)\b/i],
  ['Anrede mit Name', /\b(?:Herrn?|Frau|Prof\.?|Professor(?:in)?|Dr\.)\s+\p{Lu}/u],
  ['Grußformel', /\b(?:mit freundlichen|viele|liebe|beste) grü(?:ß|ss)en?\b/i],
  ['Gesundheit', /\b(?:attest|krank|nachteilsausgleich|behinderung)/i],
];

const hits = (rules, text) => rules.filter(([, rule]) => rule.test(text)).map(([name]) => name);

/** Namen der Regeln, die im Text anschlagen */
export const hardHits = text => hits(HARD, text);
export const softHits = text => hits(SOFT, text);
