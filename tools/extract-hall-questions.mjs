#!/usr/bin/env node
/**
 * Fragerunden aus den Aufzeichnungen, lokal über Ollama: Die Transkripte bleiben auf diesem Rechner,
 * erst die sinngemäßen Fragen gehen weiter. Hörbar ist nur der Dozent, die Fragen sind also erschlossen.
 *
 *   node tools/extract-hall-questions.mjs <ausgabe.json> <transcript.txt>...
 */
import fs from 'node:fs';

const [out, ...files] = process.argv.slice(2);
const SYSTEM = `Du bekommst einen Ausschnitt aus dem Transkript einer Vorlesung über Deep Learning. Hörbar ist nur der Dozent, Wortmeldungen aus dem Hörsaal fehlen.
Finde Stellen, an denen der Dozent erkennbar auf eine inhaltliche Frage reagiert, zum Beispiel „gute Frage“, „die Frage war“, Wiederholung einer Frage oder eine plötzliche Antwort auf etwas Ungesagtes.
Formuliere zu jeder Stelle die vermutliche Frage in eigenen Worten, so wie jemand sie in einem Forum stellen würde.
Lass Fragen zu Organisatorischem, Klausuren, Übungsblättern und Terminen weg. Nenne keine Namen.
Antworte nur als JSON: {"fragen": ["..."]}. Gibt es keine, antworte {"fragen": []}.`;

function chunks(text, size = 20000, overlap = 1000) {
  const parts = [];
  for (let i = 0; i < text.length; i += size - overlap) parts.push(text.slice(i, i + size));
  return parts;
}

async function ask(part) {
  const res = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3.6:27b', stream: false, think: false, format: 'json',
      options: { temperature: 0.2, num_ctx: 12288, num_predict: 700 },
      messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: part }],
    }),
  });
  const data = await res.json();
  return JSON.parse(data.message.content).fragen ?? [];
}

const found = [];
for (const file of files) {
  const lecture = file.match(/vl\d+/)?.[0] ?? file;
  for (const [i, part] of chunks(fs.readFileSync(file, 'utf8')).entries()) {
    try {
      for (const frage of await ask(part)) found.push({ frage, lecture, chunk: i });
    } catch (e) {
      console.error(lecture, i, e.message);
    }
    fs.writeFileSync(out, JSON.stringify(found, null, 1));
    console.log(lecture, i, 'gesamt', found.length);
  }
}
