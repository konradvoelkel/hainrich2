/**
 * Abstimmen über Fragen (Plan D21): ohne Anmeldung, also ohne Token und ohne Cookie. Der Browser würfelt je Frage eine Kennung, der Server
 * speichert nur deren Hash (I11). Überprüfbar ist das nicht, die Summe sortiert deshalb nur. Die Seiten schreibt er gebündelt neu: Eine
 * Stimme soll nicht sieben komprimierte Dateien kosten.
 */
import { createHash } from 'node:crypto';
import { createLimiter } from './auth.js';
import { clientOf, readJson, sameOrigin, sendJson } from './http.js';

export const FLUSH_MS = 15_000;
const HOUR = 3600_000;
const MAX_BODY = 500;
const KENNUNG = /^[0-9a-f]{32}$/;

export function createVoting({ store, publish, now = Date.now }) {
  /** hoch angesetzt: Ein Hörsaal sitzt hinter einer Adresse. Das bremst Skripte, Manipulation verhindert es nicht */
  const perClient = createLimiter({ max: 200, window: HOUR, now });
  const overall = createLimiter({ max: 5000, window: HOUR, now });
  const changed = new Set();

  async function vote(req, res) {
    if (req.method !== 'POST') return sendJson(res, 405, { fehler: 'Nicht erlaubt.' });
    if (!sameOrigin(req)) return sendJson(res, 403, { fehler: 'Anfrage von fremder Seite.' });
    const client = clientOf(req);
    if (!perClient.allowed(client) || !overall.allowed('alle')) return sendJson(res, 429, { fehler: 'Gerade kommen zu viele Stimmen an. Bitte später noch einmal.' });
    const data = await readJson(req, MAX_BODY);
    if (!data || !KENNUNG.test(data.kennung) || ![-1, 0, 1].includes(data.wert)) return sendJson(res, 400, { fehler: 'Ungültige Anfrage.' });
    const question = store.question(String(data.id));
    if (question?.status !== 'sichtbar') return sendJson(res, 404, { fehler: 'Diese Frage gibt es nicht.' });
    perClient.count(client);
    overall.count('alle');
    const punkte = store.vote(question.id, createHash('sha256').update(data.kennung).digest('base64'), data.wert);
    changed.add(question.id);
    return sendJson(res, 200, { punkte });
  }

  return {
    handle: (req, res) => vote(req, res).catch(error => {
      console.error(error);
      if (!res.headersSent) sendJson(res, 500, { fehler: 'Das ging schief. Bitte noch einmal.' });
    }),
    /** die Fragen mit neuen Stimmen und die Listen, einmal für alle */
    async flush() {
      if (!changed.size) return;
      const ids = [...changed];
      changed.clear();
      await publish(...ids);
    },
  };
}
