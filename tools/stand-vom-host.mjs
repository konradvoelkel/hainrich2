/**
 * Der öffentliche Stand der Beispielfragen, wie er in `public.db` steht: Antworten mit Prüfung, Kurztitel und Zitaten, als JSON auf die
 * Standardausgabe. Läuft auf dem Server im Verzeichnis der App, `site/stand-holen.sh` schickt die Datei dorthin; lokal liest sie
 * `site/build.mjs --stand`. Geändert wird nichts.
 *
 * Nur Beispielfragen: Was `site/deploy.sh` in den Docroot legt, überlebt dort ein Löschen in der Moderation (Plan D27). Fragen von
 * außen kommen deshalb nie in den statischen Bau, sie stehen nur unter `live/`. Stimmen, Vektoren und Vorschläge für Kurztitel bleiben
 * ebenfalls draußen.
 *
 *   node tools/stand-vom-host.mjs <public.db>          aus dem Wurzelverzeichnis des Repos oder der App
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** über die Standardeingabe gestartet, gibt es keinen Ort der Datei: Der Pfad zählt ab dem Arbeitsverzeichnis */
const { openStore } = await import(pathToFileURL(path.resolve('lib/store.js')).href);
const file = process.argv[2];
if (!file) throw new Error('Aufruf: node tools/stand-vom-host.mjs <public.db>');
const store = openStore(file);
const fragen = store.visible().filter(q => q.herkunft === 'beispiel').map(q => ({
  id: q.id, text: q.text, kapitel: q.kapitel, herkunft: q.herkunft, tag: q.tag, kurztitel: q.kurztitel, lizenz: q.lizenz,
  antworten: q.antworten.map(({ id, ...antwort }) => antwort),
}));
store.close();
process.stdout.write(`${JSON.stringify({ stand: new Date().toISOString(), fragen })}\n`);
