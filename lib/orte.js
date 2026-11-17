/**
 * Wo auf diesem Rechner liegt, was nicht ins Repo gehört: Modelle, Arbeitsdaten und die gebaute Site (CLAUDE.md, „Was beißt“ 11).
 * Der Ort kommt aus `HAINRICH2_DATEN`, sonst aus der gitignorten `.env.local` im Wurzelverzeichnis, sonst ist es `.daten/` im Repo
 * (ebenfalls gitignored). Jeder einzelne Ort lässt sich wie bisher mit seiner eigenen Variable oder seinem Schalter überschreiben;
 * auf dem Server setzen die Units sie alle, dort wird hier nichts gelesen, was es nicht gibt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function fromFile(name) {
  let text;
  try {
    text = fs.readFileSync(path.join(repo, '.env.local'), 'utf8');
  } catch {
    return null;
  }
  const line = text.split('\n').find(l => l.startsWith(`${name}=`));
  return line?.slice(name.length + 1).trim() || null;
}

export const DATEN = process.env.HAINRICH2_DATEN || fromFile('HAINRICH2_DATEN') || path.join(repo, '.daten');
export const ort = (...teile) => path.join(DATEN, ...teile);
