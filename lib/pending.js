/**
 * `pending.db` aus Plan §9: was noch keine Entscheidung hat. Kein Backup, keine IP-Adresse, kein Token. Gelöscht heißt gelöscht:
 * `secure_delete` überschreibt die Seiten, der Checkpoint leert das WAL. Fristen aus §11.2: Der Grund einer Ablehnung bleibt 7 Tage,
 * Unbearbeitetes 28; zugesagt sind 30.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { berlinerTag } from './tag.js';

const OPEN_DAYS = 28;
const REASON_DAYS = 7;
const DAY = 86_400_000;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS pending (
  id TEXT PRIMARY KEY, text TEXT, geheimnis TEXT NOT NULL, tag TEXT NOT NULL, zustimmung INTEGER NOT NULL, einwilligung INTEGER NOT NULL,
  treffer TEXT NOT NULL, zustand TEXT NOT NULL CHECK (zustand IN ('wartet', 'entwurf', 'abgelehnt')), entwurf TEXT, grund TEXT, kapitel TEXT);
`;

const digest = secret => createHash('sha256').update(secret).digest();
/** Berliner Tage wie der öffentliche Tag der Frage (lib/tag.js), auch für die Fristen von sieben Tagen */
const isoDay = ms => berlinerTag(ms);

const shape = row => (row ? {
  id: row.id,
  text: row.text,
  tag: row.tag,
  zustimmung: row.zustimmung,
  einwilligung: !!row.einwilligung,
  treffer: JSON.parse(row.treffer),
  zustand: row.zustand,
  entwurf: row.entwurf ? JSON.parse(row.entwurf) : null,
  grund: row.grund,
  kapitel: row.kapitel ?? null,
} : null);

export function openPending(file, { now = Date.now } = {}) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA secure_delete = ON;');
  db.exec(SCHEMA);
  /** `CREATE TABLE IF NOT EXISTS` ergänzt spalten nicht: Eine ältere `pending.db` bekommt die Spalte hier nachträglich */
  if (!db.prepare('PRAGMA table_info(pending)').all().some(column => column.name === 'kapitel')) db.exec('ALTER TABLE pending ADD COLUMN kapitel TEXT');
  const flush = () => db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  const row = id => db.prepare('SELECT * FROM pending WHERE id = ?').get(id);

  return {
    close: () => db.close(),

    /** das Geheimnis verlässt den Server genau einmal, gespeichert wird nur sein Hash */
    add({ text, zustimmung, einwilligung, treffer, zustand, kapitel = null }) {
      const id = randomBytes(6).toString('hex');
      const geheimnis = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO pending (id, text, geheimnis, tag, zustimmung, einwilligung, treffer, zustand, kapitel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, text, digest(geheimnis).toString('base64'), isoDay(now()), zustimmung, einwilligung ? 1 : 0, JSON.stringify(treffer), zustand, kapitel);
      return { id, geheimnis };
    },

    get: id => shape(row(id)),
    /** nur für die fragende Person; eine falsche Kennung und ein falsches Geheimnis sehen gleich aus */
    mine(id, geheimnis) {
      const found = row(String(id));
      if (!found) return null;
      return timingSafeEqual(digest(String(geheimnis)), Buffer.from(found.geheimnis, 'base64')) ? shape(found) : null;
    },
    open: () => db.prepare("SELECT * FROM pending WHERE zustand <> 'abgelehnt' ORDER BY tag, rowid").all().map(shape),
    count: () => db.prepare("SELECT count(*) AS n FROM pending WHERE zustand <> 'abgelehnt'").get().n,

    setDraft: (id, entwurf) => db.prepare("UPDATE pending SET entwurf = ?, zustand = 'wartet' WHERE id = ? AND zustand <> 'abgelehnt'").run(JSON.stringify(entwurf), id),

    /** Ablehnen löscht den Text sofort, nur der Grund bleibt für die fragende Person */
    reject(id, grund) {
      db.prepare("UPDATE pending SET text = NULL, entwurf = NULL, treffer = '[]', zustand = 'abgelehnt', grund = ?, tag = ? WHERE id = ?").run(grund, isoDay(now()), id);
      flush();
    },
    remove(id) {
      db.prepare('DELETE FROM pending WHERE id = ?').run(id);
      flush();
    },
    /** läuft täglich; liefert, wie viele Einträge weg sind */
    sweep() {
      const { changes } = db.prepare("DELETE FROM pending WHERE tag < CASE zustand WHEN 'abgelehnt' THEN ? ELSE ? END")
        .run(isoDay(now() - REASON_DAYS * DAY), isoDay(now() - OPEN_DAYS * DAY));
      if (changes) flush();
      return Number(changes);
    },
  };
}
