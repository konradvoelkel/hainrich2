/**
 * `public.db` aus Plan §9, soweit die Moderation sie braucht. Nach dem Import ist sie die Quelle für alles Öffentliche (I2);
 * Fragen von außen kommen über `pending.db` (lib/pending.js). Jede Änderung hinterlässt eine Revision.
 */
import { DatabaseSync } from 'node:sqlite';

const CORPUS = 'eidl';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY, corpus TEXT NOT NULL, position INTEGER NOT NULL, text TEXT NOT NULL, kapitel TEXT NOT NULL,
  herkunft TEXT NOT NULL, tag TEXT NOT NULL, vektor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sichtbar', 'zurückgezogen')));
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY, corpus TEXT NOT NULL, question TEXT NOT NULL REFERENCES questions(id), art TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ungeprüft', 'geprüft', 'kein_beleg')), modell TEXT, text TEXT,
  bearbeitet INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS citations (
  answer INTEGER NOT NULL REFERENCES answers(id), position INTEGER NOT NULL, titel TEXT NOT NULL, pfad TEXT NOT NULL,
  text TEXT NOT NULL, url TEXT NOT NULL, PRIMARY KEY (answer, position));
CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY, question TEXT NOT NULL, feld TEXT NOT NULL, vorher TEXT, nachher TEXT, rolle TEXT NOT NULL,
  zeit TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS votes (
  question TEXT NOT NULL REFERENCES questions(id), kennung TEXT NOT NULL, wert INTEGER NOT NULL CHECK (wert IN (-1, 1)),
  PRIMARY KEY (question, kennung));
CREATE TABLE IF NOT EXISTS moderators (name TEXT PRIMARY KEY, rolle TEXT NOT NULL CHECK (rolle IN ('moderator', 'admin')), hash TEXT NOT NULL);
`;

export function openStore(file, { now = () => new Date().toISOString() } = {}) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);

  const transaction = work => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  const revise = (question, feld, vorher, nachher, rolle) => db.prepare(
    'INSERT INTO revisions (question, feld, vorher, nachher, rolle, zeit) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(question, feld, vorher, nachher, rolle, now());

  const answersOf = id => db.prepare('SELECT * FROM answers WHERE question = ? ORDER BY id').all(id).map(a => ({
    id: a.id,
    art: a.art,
    status: a.status,
    modell: a.modell,
    text: a.text,
    bearbeitet: !!a.bearbeitet,
    zitate: db.prepare('SELECT * FROM citations WHERE answer = ? ORDER BY position').all(a.id)
      .map(c => ({ titel: c.titel, pfad: JSON.parse(c.pfad), text: c.text, url: c.url })),
  }));
  const pointsOf = id => db.prepare('SELECT coalesce(sum(wert), 0) AS punkte FROM votes WHERE question = ?').get(id).punkte;
  const full = q => ({
    id: q.id, text: q.text, kapitel: q.kapitel, herkunft: q.herkunft, tag: q.tag, status: q.status, vektor: JSON.parse(q.vektor), antworten: answersOf(q.id), punkte: pointsOf(q.id),
  });
  const insertAnswer = (question, a) => {
    const { lastInsertRowid: answer } = db.prepare('INSERT INTO answers (corpus, question, art, status, modell, text, bearbeitet) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(CORPUS, question, a.art, a.status, a.modell, a.text, a.bearbeitet ? 1 : 0);
    a.zitate.forEach((z, i) => db.prepare('INSERT INTO citations VALUES (?, ?, ?, ?, ?, ?)')
      .run(answer, i + 1, z.titel, JSON.stringify(z.pfad), z.text, z.url));
  };
  const answerRow = id => {
    const row = db.prepare('SELECT * FROM answers WHERE id = ?').get(id);
    if (!row) throw new Error(`keine Antwort ${id}`);
    return row;
  };

  return {
    close: () => db.close(),
    empty: () => db.prepare('SELECT count(*) AS n FROM questions').get().n === 0,

    /** einmalig, aus dem Bestand von `site/build.mjs`; danach gilt nur noch diese Datenbank */
    importQuestions(questions, vectors, site) {
      transaction(() => {
        for (const [key, value] of Object.entries(site)) db.prepare('INSERT OR REPLACE INTO meta VALUES (?, ?)').run(key, JSON.stringify(value));
        questions.forEach((q, position) => {
          db.prepare('INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(q.id, CORPUS, position, q.text, q.kapitel, q.herkunft, q.tag, JSON.stringify(vectors[position]), 'sichtbar');
          for (const a of q.antworten) insertAnswer(q.id, a);
        });
      });
    },

    /**
     * Eine freigegebene Frage von außen. Ohne Vektor zählt sie vorerst nur für die Stichwortsuche, bis der Worker gerechnet hat: Nullen
     * statt nichts, sonst rechnet die Suche im Browser mit undefined. Eine Revision gibt es bewusst nicht (Plan §5).
     */
    addQuestion({ id, text, kapitel, tag, vektor, antwort }) {
      const { position, dimension } = db.prepare('SELECT coalesce(max(position), -1) + 1 AS position, max(json_array_length(vektor)) AS dimension FROM questions').get();
      transaction(() => {
        db.prepare('INSERT INTO questions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .run(id, CORPUS, position, text, kapitel, 'forum', tag, JSON.stringify(vektor ?? new Array(dimension ?? 0).fill(0)), 'sichtbar');
        if (antwort) insertAnswer(id, antwort);
      });
    },
    addAnswer: (id, antwort) => transaction(() => insertAnswer(id, antwort)),
    setVector: (id, vektor) => db.prepare('UPDATE questions SET vektor = ? WHERE id = ?').run(JSON.stringify(vektor), id),

    site: () => Object.fromEntries(db.prepare('SELECT * FROM meta').all().map(m => [m.key, JSON.parse(m.value)])),
    setSite: (key, value) => db.prepare('INSERT OR REPLACE INTO meta VALUES (?, ?)').run(key, JSON.stringify(value)),

    questions: () => db.prepare('SELECT * FROM questions ORDER BY position').all().map(full),
    visible: () => db.prepare("SELECT * FROM questions WHERE status = 'sichtbar' ORDER BY position").all().map(full),
    question(id) {
      const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
      return q ? full(q) : null;
    },
    /** Nachbarn in fester Reihenfolge: Wer blättert und prüft, verliert so nicht die Stelle */
    neighbours(id) {
      const ids = db.prepare('SELECT id FROM questions ORDER BY position').all().map(q => q.id);
      const index = ids.indexOf(id);
      return { prev: ids[index - 1] ?? null, next: ids[index + 1] ?? null, index, total: ids.length };
    },
    revisions: id => db.prepare('SELECT * FROM revisions WHERE question = ? ORDER BY id DESC').all(id),

    editQuestion(id, text, rolle) {
      const { text: vorher } = db.prepare('SELECT text FROM questions WHERE id = ?').get(id);
      if (vorher === text) return false;
      transaction(() => {
        db.prepare('UPDATE questions SET text = ? WHERE id = ?').run(text, id);
        revise(id, 'frage', vorher, text, rolle);
      });
      return true;
    },
    setQuestionStatus(id, status, rolle) {
      const { status: vorher } = db.prepare('SELECT status FROM questions WHERE id = ?').get(id);
      if (vorher === status) return false;
      transaction(() => {
        db.prepare('UPDATE questions SET status = ? WHERE id = ?').run(status, id);
        revise(id, 'status der frage', vorher, status, rolle);
      });
      return true;
    },
    editAnswer(answer, text, rolle) {
      const row = answerRow(answer);
      if (row.text === text) return false;
      transaction(() => {
        db.prepare('UPDATE answers SET text = ?, bearbeitet = 1 WHERE id = ?').run(text, answer);
        revise(row.question, 'antwort', row.text, text, rolle);
      });
      return true;
    },
    setAnswerStatus(answer, status, rolle) {
      const row = answerRow(answer);
      if (row.status === status) return false;
      transaction(() => {
        db.prepare('UPDATE answers SET status = ? WHERE id = ?').run(status, answer);
        revise(row.question, 'status der antwort', row.status, status, rolle);
      });
      return true;
    },

    /** eine Stimme je Kennung und Frage; 0 nimmt sie zurück. Liefert die neue Summe */
    vote(id, kennung, wert) {
      if (wert) db.prepare('INSERT INTO votes VALUES (?, ?, ?) ON CONFLICT (question, kennung) DO UPDATE SET wert = excluded.wert').run(id, kennung, wert);
      else db.prepare('DELETE FROM votes WHERE question = ? AND kennung = ?').run(id, kennung);
      return pointsOf(id);
    },

    moderator: name => db.prepare('SELECT * FROM moderators WHERE name = ?').get(name) ?? null,
    saveModerator: (name, rolle, hash) => db.prepare('INSERT OR REPLACE INTO moderators VALUES (?, ?, ?)').run(name, rolle, hash),
  };
}
