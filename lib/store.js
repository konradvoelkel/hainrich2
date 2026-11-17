/**
 * `public.db` aus Plan §9, soweit die Moderation sie braucht. Nach dem Import ist sie die Quelle für alles Öffentliche (I2);
 * Fragen von außen kommen über `pending.db` (lib/pending.js). Jede Änderung hinterlässt eine Revision. Gelöscht heißt auch hier
 * gelöscht: `secure_delete` überschreibt die Seiten, der Checkpoint leert das WAL (Plan D27). In den Sicherungen bleibt es trotzdem.
 */
import { DatabaseSync } from 'node:sqlite';
import { CC0 } from './fragen.js';

const CORPUS = 'eidl';

/**
 * `CREATE TABLE IF NOT EXISTS` ergänzt keine Spalten: Eine ältere `public.db` bekommt sie hier. Das Prüfdatum gab es vor dem 17.11.2026
 * nicht; für schon geprüfte Antworten steht der Tag der letzten Änderung an Antwort oder Status aus dem Verlauf, sonst der Tag der Frage.
 * Ein Eingriff von der Konsole zählt nicht: Am 17.11.2026 wurde so ein Tippfehler in s21 behoben, geprüft hat an dem Tag niemand.
 */
function migrate(db) {
  const has = (table, column) => db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
  for (const column of ['kurztitel', 'titelvorschlag', 'lizenz']) if (!has('questions', column)) db.exec(`ALTER TABLE questions ADD COLUMN ${column} TEXT`);
  /** Die Beispielfragen stammen vom Betreiber und sind gemeinfrei (Konrad, 2026-11-17, Plan D30) */
  db.prepare("UPDATE questions SET lizenz = ? WHERE herkunft = 'beispiel' AND lizenz IS NULL").run(CC0.kennung);
  /** Wessen Text je bearbeitet wurde, hat womöglich noch den Vektor des alten Wortlauts (Plan D35): einmal alle neu rechnen lassen */
  if (!has('questions', 'vektor_alt')) {
    db.exec(`ALTER TABLE questions ADD COLUMN vektor_alt INTEGER NOT NULL DEFAULT 0;
UPDATE questions SET vektor_alt = 1 WHERE id IN (SELECT question FROM revisions WHERE feld = 'frage');`);
  }
  if (has('answers', 'geprueft_am')) return;
  db.exec(`ALTER TABLE answers ADD COLUMN geprueft_am TEXT;
UPDATE answers SET geprueft_am = coalesce(
  (SELECT substr(max(zeit), 1, 10) FROM revisions WHERE revisions.question = answers.question AND feld IN ('status der antwort', 'antwort') AND rolle <> 'konsole'),
  (SELECT tag FROM questions WHERE questions.id = answers.question))
WHERE status = 'geprüft';`);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY, corpus TEXT NOT NULL, position INTEGER NOT NULL, text TEXT NOT NULL, kapitel TEXT NOT NULL,
  herkunft TEXT NOT NULL, tag TEXT NOT NULL, vektor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sichtbar', 'zurückgezogen')), kurztitel TEXT, titelvorschlag TEXT, lizenz TEXT,
  vektor_alt INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY, corpus TEXT NOT NULL, question TEXT NOT NULL REFERENCES questions(id), art TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ungeprüft', 'geprüft', 'kein_beleg')), modell TEXT, text TEXT,
  bearbeitet INTEGER NOT NULL DEFAULT 0, geprueft_am TEXT);
CREATE TABLE IF NOT EXISTS citations (
  answer INTEGER NOT NULL REFERENCES answers(id), position INTEGER NOT NULL, titel TEXT NOT NULL, pfad TEXT NOT NULL,
  text TEXT NOT NULL, url TEXT NOT NULL, PRIMARY KEY (answer, position));
CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY, question TEXT NOT NULL, feld TEXT NOT NULL, vorher TEXT, nachher TEXT, rolle TEXT NOT NULL,
  zeit TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS votes (
  question TEXT NOT NULL REFERENCES questions(id), kennung TEXT NOT NULL, wert INTEGER NOT NULL CHECK (wert IN (-1, 1)),
  PRIMARY KEY (question, kennung));
CREATE TABLE IF NOT EXISTS zaehler (tag TEXT NOT NULL, art TEXT NOT NULL, anzahl INTEGER NOT NULL, PRIMARY KEY (tag, art));
CREATE TABLE IF NOT EXISTS vorschlaege (
  question TEXT PRIMARY KEY REFERENCES questions(id), zustand TEXT NOT NULL CHECK (zustand IN ('läuft', 'fertig')), entwurf TEXT);
CREATE TABLE IF NOT EXISTS moderators (name TEXT PRIMARY KEY, rolle TEXT NOT NULL CHECK (rolle IN ('moderator', 'admin')), hash TEXT NOT NULL);
`;

export function openStore(file, { now = () => new Date().toISOString() } = {}) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON;');
  db.exec(SCHEMA);
  migrate(db);
  const today = () => now().slice(0, 10);
  /** `VACUUM` baut die Datei neu: Diese Datenbank lief bis 2026-11-11 ohne `secure_delete`, in freien Seiten kann also noch Älteres liegen */
  const flush = () => db.exec('VACUUM; PRAGMA wal_checkpoint(TRUNCATE)');

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
    geprueftAm: a.geprueft_am,
    zitate: db.prepare('SELECT * FROM citations WHERE answer = ? ORDER BY position').all(a.id)
      .map(c => ({ titel: c.titel, pfad: JSON.parse(c.pfad), text: c.text, url: c.url })),
  }));
  const pointsOf = id => db.prepare('SELECT coalesce(sum(wert), 0) AS punkte FROM votes WHERE question = ?').get(id).punkte;
  const full = q => ({
    id: q.id, text: q.text, kapitel: q.kapitel, herkunft: q.herkunft, tag: q.tag, status: q.status, vektor: JSON.parse(q.vektor), antworten: answersOf(q.id), punkte: pointsOf(q.id),
    kurztitel: q.kurztitel, titelvorschlag: q.titelvorschlag, lizenz: q.lizenz,
  });
  /** geprüft trägt das Datum der Prüfung (Plan D29), alles andere keins */
  const reviewedOn = status => (status === 'geprüft' ? today() : null);
  const insertQuestion = db.prepare('INSERT INTO questions (id, corpus, position, text, kapitel, herkunft, tag, vektor, status, kurztitel, lizenz) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertCitations = (answer, zitate) => zitate.forEach((z, i) => db.prepare('INSERT INTO citations VALUES (?, ?, ?, ?, ?, ?)')
    .run(answer, i + 1, z.titel, JSON.stringify(z.pfad), z.text, z.url));
  const insertAnswer = (question, a) => {
    const { lastInsertRowid: answer } = db.prepare('INSERT INTO answers (corpus, question, art, status, modell, text, bearbeitet, geprueft_am) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(CORPUS, question, a.art, a.status, a.modell, a.text, a.bearbeitet ? 1 : 0, a.status === 'geprüft' ? a.geprueftAm ?? today() : null);
    insertCitations(answer, a.zitate);
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
          insertQuestion.run(q.id, CORPUS, position, q.text, q.kapitel, q.herkunft, q.tag, JSON.stringify(vectors[position]), 'sichtbar', q.kurztitel ?? null, q.lizenz ?? (q.herkunft === 'beispiel' ? CC0.kennung : null));
          for (const a of q.antworten) insertAnswer(q.id, a);
        });
      });
    },

    /**
     * Eine freigegebene Frage von außen. Ohne Vektor zählt sie vorerst nur für die Stichwortsuche, bis der Worker gerechnet hat: Nullen
     * statt nichts, sonst rechnet die Suche im Browser mit undefined. Eine Revision gibt es bewusst nicht (Plan §5).
     */
    addQuestion({ id, text, kapitel, tag, vektor, antwort, kurztitel = null, lizenz = null }) {
      const { position, dimension } = db.prepare('SELECT coalesce(max(position), -1) + 1 AS position, max(json_array_length(vektor)) AS dimension FROM questions').get();
      transaction(() => {
        insertQuestion.run(id, CORPUS, position, text, kapitel, 'forum', tag, JSON.stringify(vektor ?? new Array(dimension ?? 0).fill(0)), 'sichtbar', kurztitel, lizenz);
        if (antwort) insertAnswer(id, antwort);
      });
    },
    addAnswer: (id, antwort) => transaction(() => insertAnswer(id, antwort)),
    setVector: (id, vektor) => db.prepare('UPDATE questions SET vektor = ? WHERE id = ?').run(JSON.stringify(vektor), id),
    /** Sichtbare Fragen, deren Vektor noch zum alten Wortlaut gehört (Plan D35) */
    staleVectors: () => db.prepare("SELECT id, text FROM questions WHERE vektor_alt = 1 AND status = 'sichtbar' ORDER BY position").all().map(q => ({ id: q.id, text: q.text })),
    /** Der Vektor ist für den Wortlaut gerechnet, der jetzt dasteht */
    freshVector: (id, vektor) => db.prepare('UPDATE questions SET vektor = ?, vektor_alt = 0 WHERE id = ?').run(JSON.stringify(vektor), id),

    /** Der Kurztitel, den die Moderation setzt (Plan D31); null nimmt ihn zurück, dann gilt wieder der Anfang der Frage */
    setTitle(id, titel, rolle) {
      const { kurztitel: vorher } = db.prepare('SELECT kurztitel FROM questions WHERE id = ?').get(id);
      if (vorher === titel) return false;
      transaction(() => {
        db.prepare('UPDATE questions SET kurztitel = ? WHERE id = ?').run(titel, id);
        revise(id, 'kurztitel', vorher, titel, rolle);
      });
      return true;
    },
    /** Ein Vorschlag von Claude. Öffentlich wird er erst, wenn die Moderation ihn als Kurztitel speichert, deshalb ohne Revision */
    suggestTitle: (id, vorschlag) => db.prepare('UPDATE questions SET titelvorschlag = ? WHERE id = ?').run(vorschlag, id),
    /** Vorschläge für den Bestand, aus `seeds/kurztitel.json`: nur wo weder Titel noch Vorschlag steht. Liefert, wie viele dazukamen */
    suggestTitles: vorschlaege => transaction(() => Object.entries(vorschlaege).reduce((n, [id, vorschlag]) => n + Number(db.prepare(
      'UPDATE questions SET titelvorschlag = ? WHERE id = ? AND kurztitel IS NULL AND titelvorschlag IS NULL',
    ).run(vorschlag, id).changes), 0)),

    site: () => Object.fromEntries(db.prepare('SELECT * FROM meta').all().map(m => [m.key, JSON.parse(m.value)])),
    setSite: (key, value) => db.prepare('INSERT OR REPLACE INTO meta VALUES (?, ?)').run(key, JSON.stringify(value)),

    questions: () => db.prepare('SELECT * FROM questions ORDER BY position').all().map(full),
    visible: () => db.prepare("SELECT * FROM questions WHERE status = 'sichtbar' ORDER BY position").all().map(full),
    question(id) {
      const q = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
      return q ? full(q) : null;
    },
    /** nur der Text einer öffentlichen Frage, sonst null. Für „Meine Fragen“: Dort fragt jeder ohne Anmeldung, also ohne Antworten, Zitate und Vektor */
    visibleText: id => db.prepare("SELECT text FROM questions WHERE id = ? AND status = 'sichtbar'").get(id)?.text ?? null,
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
        db.prepare('UPDATE questions SET text = ?, vektor_alt = 1 WHERE id = ?').run(text, id);
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
    /** Die Moderation antwortet selbst, ohne Zitat. Ein „kein Beleg“ weicht dabei, sonst stünde beides da; der Verlauf behält es */
    writeAnswer(id, text, rolle) {
      const row = db.prepare('SELECT * FROM answers WHERE question = ? ORDER BY id').get(id);
      transaction(() => {
        if (row) db.prepare("UPDATE answers SET art = 'moderation', status = 'geprüft', modell = NULL, text = ?, bearbeitet = 0, geprueft_am = ? WHERE id = ?").run(text, today(), row.id);
        else insertAnswer(id, { art: 'moderation', status: 'geprüft', modell: null, text, zitate: [] });
        revise(id, 'antwort', row?.text ?? null, text, rolle);
      });
    },
    editAnswer(answer, text, rolle) {
      const row = answerRow(answer);
      if (row.text === text) return false;
      transaction(() => {
        /** wer eine geprüfte Antwort ändert, hat sie an diesem Tag wieder geprüft */
        db.prepare('UPDATE answers SET text = ?, bearbeitet = 1, geprueft_am = ? WHERE id = ?').run(text, reviewedOn(row.status), answer);
        revise(row.question, 'antwort', row.text, text, rolle);
      });
      return true;
    },
    setAnswerStatus(answer, status, rolle) {
      const row = answerRow(answer);
      if (row.status === status) return false;
      transaction(() => {
        db.prepare('UPDATE answers SET status = ?, geprueft_am = ? WHERE id = ?').run(status, reviewedOn(status), answer);
        revise(row.question, 'status der antwort', row.status, status, rolle);
      });
      return true;
    },

    /**
     * Endgültig, für Löschwünsche und Personenbezogenes, das durchgerutscht ist (Plan D27): Frage, Antworten, Zitate, Verlauf, Vorschlag
     * und Stimmen. Zurückziehen lässt das alles stehen. Es bleibt eine Zeile ohne Text, damit nachvollziehbar ist, wer wann gelöscht hat.
     */
    deleteQuestion(id, rolle) {
      transaction(() => {
        db.prepare('DELETE FROM citations WHERE answer IN (SELECT id FROM answers WHERE question = ?)').run(id);
        for (const table of ['answers', 'votes', 'vorschlaege', 'revisions']) db.prepare(`DELETE FROM ${table} WHERE question = ?`).run(id);
        db.prepare('DELETE FROM questions WHERE id = ?').run(id);
        revise(id, 'gelöscht', null, null, rolle);
      });
      flush();
    },
    /**
     * Nach einer Redaktion: Der alte Wortlaut steht sonst für immer in `vorher`. Wer was wann geändert hat, bleibt stehen, die Texte nicht.
     * Liefert, wie viele Einträge einen Text hatten.
     */
    purgeRevisions(id, rolle) {
      const changes = transaction(() => {
        const result = db.prepare('UPDATE revisions SET vorher = NULL, nachher = NULL WHERE question = ? AND (vorher IS NOT NULL OR nachher IS NOT NULL)').run(id);
        revise(id, 'verlauf bereinigt', null, null, rolle);
        return Number(result.changes);
      });
      flush();
      return changes;
    },

    /**
     * Zitate auf den Korpus umziehen, der jetzt ausgespielt ist (Plan D36). `move` liefert zu einem Zitat seine neue Fassung oder null;
     * geschrieben wird nur, was sich ändert, und der Verlauf nennt die alte und die neue Adresse. Liefert die Kennungen der Fragen.
     */
    relinkCitations(move, rolle = 'korpus') {
      const rows = db.prepare('SELECT c.*, a.question FROM citations c JOIN answers a ON a.id = c.answer ORDER BY c.answer, c.position').all();
      const moved = new Set();
      transaction(() => {
        for (const row of rows) {
          const neu = move({ titel: row.titel, pfad: JSON.parse(row.pfad), text: row.text, url: row.url });
          if (!neu) continue;
          const pfad = JSON.stringify(neu.pfad);
          if (neu.titel === row.titel && pfad === row.pfad && neu.text === row.text && neu.url === row.url) continue;
          db.prepare('UPDATE citations SET titel = ?, pfad = ?, text = ?, url = ? WHERE answer = ? AND position = ?').run(neu.titel, pfad, neu.text, neu.url, row.answer, row.position);
          revise(row.question, 'zitat', row.url, neu.url, rolle);
          moved.add(row.question);
        }
      });
      return [...moved];
    },

    /** Claude noch einmal gefragt (Plan D23). Öffentlich ist davon nichts, bis die Moderation übernimmt */
    requestProposal: id => db.prepare("INSERT OR REPLACE INTO vorschlaege VALUES (?, 'läuft', NULL)").run(id),
    setProposal: (id, entwurf) => db.prepare("UPDATE vorschlaege SET zustand = 'fertig', entwurf = ? WHERE question = ?").run(JSON.stringify(entwurf), id),
    dropProposal: id => db.prepare('DELETE FROM vorschlaege WHERE question = ?').run(id),
    runningProposals: () => db.prepare("SELECT question FROM vorschlaege WHERE zustand = 'läuft'").all().map(row => row.question),
    proposal(id) {
      const row = db.prepare('SELECT * FROM vorschlaege WHERE question = ?').get(id);
      return row ? { zustand: row.zustand, entwurf: row.entwurf && JSON.parse(row.entwurf) } : null;
    },
    /** Der Vorschlag ersetzt die Antwort samt Zitaten, auch ein „kein Beleg“ oder eine Antwort der Moderation; der Verlauf behält den alten Text */
    adoptProposal(id, { modell, text, zitate }, status, rolle) {
      const row = db.prepare('SELECT * FROM answers WHERE question = ? ORDER BY id').get(id);
      transaction(() => {
        if (row) {
          db.prepare('DELETE FROM citations WHERE answer = ?').run(row.id);
          db.prepare("UPDATE answers SET art = 'bot', status = ?, modell = ?, text = ?, bearbeitet = 0, geprueft_am = ? WHERE id = ?").run(status, modell, text, reviewedOn(status), row.id);
          insertCitations(row.id, zitate);
        } else insertAnswer(id, { art: 'bot', status, modell, text, zitate });
        db.prepare('DELETE FROM vorschlaege WHERE question = ?').run(id);
        revise(id, 'antwort', row?.text ?? null, text, rolle);
      });
    },

    /** eine Stimme je Kennung und Frage; 0 nimmt sie zurück. Liefert die neue Summe */
    vote(id, kennung, wert) {
      if (wert) db.prepare('INSERT INTO votes VALUES (?, ?, ?) ON CONFLICT (question, kennung) DO UPDATE SET wert = excluded.wert').run(id, kennung, wert);
      else db.prepare('DELETE FROM votes WHERE question = ? AND kennung = ?').run(id, kennung);
      return pointsOf(id);
    },

    voteTotals: () => db.prepare('SELECT count(*) AS anzahl, coalesce(sum(wert), 0) AS summe FROM votes').get(),

    /** Tagessummen für die Admin-Seite: keine Kennung, keine Frage, nur was und wie oft */
    count: art => db.prepare('INSERT INTO zaehler VALUES (?, ?, 1) ON CONFLICT (tag, art) DO UPDATE SET anzahl = anzahl + 1').run(now().slice(0, 10), art),
    counters: () => db.prepare('SELECT * FROM zaehler').all(),

    moderator: name => db.prepare('SELECT * FROM moderators WHERE name = ?').get(name) ?? null,
    saveModerator: (name, rolle, hash) => db.prepare('INSERT OR REPLACE INTO moderators VALUES (?, ?, ?)').run(name, rolle, hash),
  };
}
