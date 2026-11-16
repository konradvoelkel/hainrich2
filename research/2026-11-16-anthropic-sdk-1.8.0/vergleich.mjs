#!/usr/bin/env node
/**
 * Vergleicht zwei Läufe von attrappe.mjs Szenario für Szenario. Drei Arten von Unterschied: die Fassung in den Kopfzeilen (erwartet),
 * die Logzeilen des Workers, und alles andere, also Anfragen, Ergebnis in der Schlange, Kostenbuch und Ende des Prozesses. Nur die
 * dritte Art beendet den Vergleich mit Fehler. Zeiten und Umgebung zählen nicht.
 *
 *   node research/2026-11-16-anthropic-sdk-1.8.0/vergleich.mjs <alt> <neu>
 */
import fs from 'node:fs';
import path from 'node:path';

const [alt, neu] = process.argv.slice(2);
if (!alt || !neu) throw new Error('Aufruf: vergleich.mjs <alt> <neu>');

const OHNE = new Set(['umgebung', 'zeiten']);
const FASSUNG = /^anfragen\.\d+\.kopf\.(user-agent|x-stainless-package-version)$/;
const LOG = /^(stdout|stderr)\./;
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const szenarien = dir => fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const istObjekt = x => x !== null && typeof x === 'object';

function unterschiede(a, b, pfad = '') {
  if (istObjekt(a) && istObjekt(b) && Array.isArray(a) === Array.isArray(b)) {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => pfad || !OHNE.has(k)).flatMap(k => unterschiede(a[k], b[k], pfad ? `${pfad}.${k}` : k));
  }
  return JSON.stringify(a) === JSON.stringify(b) ? [] : [{ pfad, alt: a, neu: b }];
}

if (szenarien(alt).join() !== szenarien(neu).join()) throw new Error('Die beiden Läufe haben nicht dieselben Szenarien');
const kurz = wert => (wert === undefined ? 'fehlt' : JSON.stringify(wert).slice(0, 160));
let sonst = 0;
for (const datei of szenarien(alt)) {
  const [a, b] = [readJson(path.join(alt, datei)), readJson(path.join(neu, datei))];
  const alle = unterschiede(a, b);
  const fassung = alle.filter(u => FASSUNG.test(u.pfad));
  const log = alle.filter(u => LOG.test(u.pfad));
  const rest = alle.filter(u => !fassung.includes(u) && !log.includes(u));
  sonst += rest.length;
  console.log(`${a.szenario.padEnd(20)} Anfragen ${a.anfragen.length}/${b.anfragen.length}, Fassung im Kopf ${fassung.length}, Log ${log.length}, sonst ${rest.length}`);
  for (const u of [...log, ...rest]) console.log(`  ${u.pfad}: ${kurz(u.alt)} → ${kurz(u.neu)}`);
}
console.log(`SDK ${readJson(path.join(alt, szenarien(alt)[0])).umgebung.sdk} → ${readJson(path.join(neu, szenarien(neu)[0])).umgebung.sdk}: ${sonst ? `${sonst} Unterschiede außerhalb von Fassung und Log` : 'Anfragen, Ergebnisse, Kostenbuch und Ende gleich'}`);
process.exitCode = sonst ? 1 : 0;
