#!/usr/bin/env node
/**
 * Auswertung der Messung aus tools/messung-v2.mjs: die Zahlen für den Bericht, dazu zum Lesen für Konrad die Antworten mit Treffern der
 * Suche nach verbotenen Wendungen und die Paare aus Stufe 2 ohne Kennzeichnung, welche Fassung welche ist.
 *
 *   node research/2026-11-23-antworten-v2/auswertung.mjs <arbeitsverzeichnis> <ausgabeverzeichnis>
 *
 * Zum Vergleich die Antworten von Opus 5.5 aus Phase 1, mit Prompt-Version 1 (`work/phase1/antworten.json`), mit derselben Suche. Die
 * Lesedateien gehören nicht ins Repo: Das Ausgabeverzeichnis ist lokal, die Zuordnung der Paare steht getrennt davon.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { wendungen } from '../../tools/messbatch.mjs';

const [dir, aus] = process.argv.slice(2);
const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const lies = name => JSON.parse(fs.readFileSync(name, 'utf8'));
const { zeilen, titel, promptVersion, modell, korpus } = lies(path.join(dir, 'stufe1.json'));
const s2 = fs.existsSync(path.join(dir, 'stufe2.json')) ? lies(path.join(dir, 'stufe2.json')) : { paare: [], titel: [] };
const stufe2 = s2.paare;
const ledger = lies(path.join(dir, 'ledger.json'));
const vorhanden = lies(path.join(repo, 'seeds/kurztitel.json'));
const end = z => z.zweiter ?? z.erster;
const zaehle = (liste, f) => liste.reduce((acc, x) => ({ ...acc, [f(x)]: (acc[f(x)] ?? 0) + 1 }), {});
const art = z => (z.status === 'ok' ? (z.teilantwort ? 'teilantwort' : 'antwort') : z.status);
const out = [];
const say = (...s) => out.push(s.join(' '));

say(`# Messung Prompt-Version ${promptVersion}, ${modell}, Korpus ${korpus}`);
say(`Kosten: ${ledger.reduce((s, e) => s + e.dollars, 0).toFixed(3)} $ in ${ledger.length} Buchungen, offen ${ledger.filter(e => e.offen).length}`);

const beispiele = zeilen.filter(z => z.erster.art === 'beispiel');
const grenz = zeilen.filter(z => z.erster.art === 'grenzfall');
say('\n## Beispielfragen', beispiele.length);
say('Ergebnis nach dem Worker (mit zweitem Anlauf bei kein Beleg):', JSON.stringify(zaehle(beispiele, z => art(end(z)))));
say('zweiter Anlauf nötig:', beispiele.filter(z => z.zweiter).map(z => `${z.erster.id} → ${art(z.zweiter)}`).join(', ') || 'keiner');
say('Teilantworten:', beispiele.filter(z => end(z).teilantwort).map(z => z.erster.id).join(', ') || 'keine');
say('Steuerwort nicht in der letzten Zeile:', zeilen.filter(z => end(z).teilantwortAmEnde === false).map(z => z.erster.id).join(', ') || 'nie');
say('Soll-Kapitel zitiert:', beispiele.filter(z => end(z).sollZitiert).length, 'von', beispiele.filter(z => end(z).status === 'ok').length, 'Antworten; nicht bei', beispiele.filter(z => end(z).status === 'ok' && !end(z).sollZitiert).map(z => z.erster.id).join(', ') || 'keiner');
say('Treffer der Suche nach Wendungen:', zeilen.filter(z => end(z).wendungen?.length).map(z => `${z.erster.id} (${end(z).wendungen.join(', ')})`).join('; ') || 'keine');
say('Zeichen im Median:', (() => { const l = beispiele.map(z => end(z).text?.length ?? 0).filter(Boolean).sort((a, b) => a - b); return l[Math.floor(l.length / 2)]; })());

say('\n## Grenzfälle');
for (const z of grenz) say(`- ${z.erster.id}: erwartet ${z.erster.erwartet}, bekommen ${art(end(z))}${z.zweiter ? ' (nach zweitem Anlauf)' : ''}${end(z).wendungen?.length ? `, Wendungen: ${end(z).wendungen.join(', ')}` : ''}`);

const phase1 = path.join(path.dirname(dir), 'phase1', 'antworten.json');
if (fs.existsSync(phase1)) {
  const alt = lies(phase1).filter(r => r.key === 'opus' && beispiele.some(z => z.erster.id === r.seed));
  const treffer = alt.filter(r => wendungen(r.text ?? '').length);
  say('\n## Zum Vergleich: Opus 5.5 mit Prompt-Version 1 (Phase 1), dieselben Fragen');
  say(`Treffer der Suche nach Wendungen: ${treffer.length} von ${alt.length}:`, treffer.map(r => `${r.seed} (${wendungen(r.text).join(', ')})`).join('; '));
}

say('\n## Kurztitel');
say('verworfen (zu lang oder leer):', titel.filter(t => !t.titel).map(t => `${t.id} (${t.zeichen} Zeichen)`).join(', ') || 'keiner', `von ${titel.length}`);
const laengen = titel.filter(t => t.titel).map(t => t.titel.length).sort((a, b) => a - b);
say('Länge:', laengen[0], 'bis', laengen.at(-1), 'Zeichen, Median', laengen[Math.floor(laengen.length / 2)]);
for (const t of titel) say(`- ${t.id}: ${t.titel ?? `(verworfen: ${t.roh})`}  |  heute: ${vorhanden[t.id] ?? '–'}`);

if (s2.titel?.length) {
  const ok = s2.titel.filter(t => t.titel);
  const l = ok.map(t => t.titel.length).sort((a, b) => a - b);
  const o = s2.titel.map(t => t.output).filter(x => x !== null).sort((a, b) => a - b);
  say(`\n## Kurztitel mit max_tokens ${s2.titelRaum}`);
  say('Ergebnis:', ok.length, 'von', s2.titel.length, 'mit Titel; Abbruch:', JSON.stringify(zaehle(s2.titel, t => t.stop)), '; verworfen:', s2.titel.filter(t => !t.titel).map(t => `${t.id} (${t.roh})`).join(', ') || 'keiner');
  say('Länge:', l[0], 'bis', l.at(-1), 'Zeichen; Ausgabe-Tokens', o[0], 'bis', o.at(-1), ', Median', o[Math.floor(o.length / 2)]);
  for (const t of s2.titel) say(`- ${t.id}: ${t.titel ?? `(verworfen: ${t.roh})`}  |  heute: ${vorhanden[t.id] ?? '–'}`);
}

say('\n## Stufe 2: zweiter Anlauf mit ganzen Kapiteln');
for (const { erster, zweiter } of stufe2) {
  say(`- ${erster.id}: erst ${art(erster)}${erster.sollZitiert === false ? ', Soll-Kapitel fehlt' : ''}; dann ${art(zweiter)}${zweiter.sollZitiert === false ? ', Soll-Kapitel fehlt' : ''}${zweiter.wendungen?.length ? `, Wendungen: ${zweiter.wendungen.join(', ')}` : ''}; ${erster.text?.length ?? 0} → ${zweiter.text?.length ?? 0} Zeichen, ${erster.zitate?.length ?? 0} → ${zweiter.zitate?.length ?? 0} Zitate`);
}
if (stufe2.length) {
  say('vollständig im zweiten Anlauf:', stufe2.filter(p => art(p.zweiter) === 'antwort').length, 'von', stufe2.length);
  say('Soll-Kapitel zitiert, erst / dann:', stufe2.filter(p => p.erster.sollZitiert).length, '/', stufe2.filter(p => p.zweiter.sollZitiert).length);
}
console.log(out.join('\n'));

if (aus) {
  fs.mkdirSync(aus, { recursive: true });
  const antwort = z => `**${art(z)}**${z.wendungen?.length ? ` · Wendungen: ${z.wendungen.join(', ')}` : ''}\n\n${z.text || '(kein Text)'}\n\nZitate: ${(z.zitate ?? []).map((q, i) => `[${i + 1}] ${q.titel}`).join('; ') || 'keine'}`;
  const lesen = zeilen.filter(z => end(z).wendungen?.length || z.erster.art === 'grenzfall');
  fs.writeFileSync(path.join(aus, 'lesen.md'), `# Zum Lesen: Treffer der Suche und alle Grenzfälle\n\nEin Treffer ist ein Hinweis, kein Urteil. Die Frage: Sagt die Antwort etwas darüber, was im Skript steht oder fehlt, oder verweist sie auf Vorlesung, Sprechstunde oder Literatur?\n\n${lesen.map(z => `## ${z.erster.id}: ${z.erster.frage}\n\n${z.erster.erwartet ? `Erwartet: ${z.erster.erwartet}\n\n` : ''}${antwort(end(z))}`).join('\n\n---\n\n')}\n`);
  /** ohne Kennzeichnung: Welche Fassung A ist, entscheidet der Zufall, die Zuordnung steht in einer eigenen Datei */
  const brauchbar = stufe2.filter(p => p.erster.status === 'ok' && p.zweiter.status === 'ok');
  const schluessel = {};
  const paare = brauchbar.map(({ erster, zweiter }) => {
    const tausch = crypto.randomInt(2) === 1;
    schluessel[erster.id] = tausch ? { A: 'zweiter', B: 'erster' } : { A: 'erster', B: 'zweiter' };
    const [a, b] = tausch ? [zweiter, erster] : [erster, zweiter];
    return `## ${erster.id}: ${erster.frage}\n\n### Fassung A\n\n${a.text}\n\nZitate: ${a.zitate.map((q, i) => `[${i + 1}] ${q.titel}`).join('; ')}\n\n### Fassung B\n\n${b.text}\n\nZitate: ${b.zitate.map((q, i) => `[${i + 1}] ${q.titel}`).join('; ')}\n\nBesser: A / B / gleich`;
  });
  if (paare.length) {
    fs.writeFileSync(path.join(aus, 'paare.md'), `# Paare zum Lesen, ohne Kennzeichnung\n\nJe Frage zwei Antworten desselben Modells. Bitte je Paar notieren: A, B oder gleich, und warum, wenn es einen Satz wert ist.\n\n${paare.join('\n\n---\n\n')}\n`);
    fs.writeFileSync(path.join(dir, 'paare-schluessel.json'), `${JSON.stringify(schluessel, null, 1)}\n`);
  }
}
