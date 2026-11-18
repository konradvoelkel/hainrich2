/**
 * Der Fragepfad unter /eidl/api/: Token, neue Frage, „Meine Fragen“, Löschen. JSON, kein Cookie, kein API-Key (I5). Alles außer dem Text
 * einer Frage bleibt im Arbeitsspeicher, Adressen und Tokens werden nicht gespeichert (Plan §10).
 */
import { checkToken, createLimiter, issueToken, tokenKey, verifyPassphrase } from './auth.js';
import { hardHits } from './checker.js';
import { kapitelBySlug } from './forum.js';
import { MAX_FRAGE, MAX_OFFEN, MIN_FRAGE, ZUSTIMMUNG } from './fragen.js';
import { clientOf, plainPath, readJson, sameOrigin, sendJson } from './http.js';
import { renderQuestion } from './render.js';
import { draftCard } from './site.js';

const MAX_BODY = 20_000;
const MAX_MEINE = 50;
const HOUR = 3600_000;
const MINUTE = 60_000;
export const READS_PER_MINUTE = 600;

export function createApi({ fragen, pending, store, hash, base = '/eidl/', now = Date.now }) {
  const root = `${base}api/`;
  const key = tokenKey(hash);
  /** für den Entwurf unter „Meine Fragen“: Er darf nur ins Skript verlinken */
  const site = store.site();
  /** Ein Hörsaal kann hinter einer Adresse sitzen, deshalb nicht knapper (D24) */
  const wrongCode = createLimiter({ max: 10, now });
  const wrongOverall = createLimiter({ max: 60, now });
  const tokensPerClient = createLimiter({ max: 30, window: HOUR, now });
  const askPerToken = createLimiter({ max: 2, window: HOUR, now });
  const askPerClient = createLimiter({ max: 20, window: HOUR, now });
  /** „Meine Fragen“ fragt alle drei Sekunden nach, solange ein Entwurf läuft, und hinter einer Adresse sitzen viele: großzügig, nicht offen */
  const readsPerClient = createLimiter({ max: READS_PER_MINUTE, window: MINUTE, now });

  const send = sendJson;
  const refuse = (res, status, fehler, extra = {}) => send(res, status, { fehler, ...extra });

  async function token(req, res, { kurscode }) {
    const client = clientOf(req);
    if (!wrongCode.allowed(client) || !wrongOverall.allowed('alle') || !tokensPerClient.allowed(client)) {
      store.count('gebremst');
      return refuse(res, 429, 'Zu viele Versuche. Bitte später noch einmal.');
    }
    /** Zählen, bevor scrypt rechnet: Sonst sind gleichzeitige Versuche alle schon durch, wenn der erste als falsch feststeht */
    const attempt = [wrongCode.fail(client), wrongOverall.fail('alle')];
    const issued = tokensPerClient.count(client);
    if (!await verifyPassphrase(String(kurscode ?? '').trim(), hash)) {
      issued();
      store.count('code_falsch');
      return refuse(res, 401, 'Dieser Kurscode stimmt nicht.');
    }
    for (const forget of attempt) forget();
    store.count('token');
    return send(res, 200, { token: issueToken(key) });
  }

  function ask(req, res, { frage, zustimmung, einwilligung, kapitel }) {
    const bearer = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
    if (!checkToken(key, bearer)) return refuse(res, 401, 'Bitte geben Sie zuerst den Kurscode ein.');
    const client = clientOf(req);
    if (!askPerToken.allowed(bearer) || !askPerClient.allowed(client)) {
      store.count('gebremst');
      return refuse(res, 429, 'Sie haben gerade schon Fragen gestellt. Bitte später noch einmal.');
    }
    if (zustimmung !== ZUSTIMMUNG.version) return refuse(res, 400, 'Bitte stimmen Sie den Bedingungen zu.');
    const text = String(frage ?? '').replace(/\r\n/g, '\n').trim();
    if (text.length < MIN_FRAGE) return refuse(res, 422, 'Die Frage ist zu kurz.');
    if (text.length > MAX_FRAGE) return refuse(res, 422, `Die Frage ist zu lang, möglich sind ${MAX_FRAGE} Zeichen.`);
    const hits = hardHits(text);
    if (hits.length) {
      store.count('checker_sperre');
      return refuse(res, 422, 'Die Frage enthält etwas, das hier nicht stehen darf. Sie wurde nicht gespeichert.', { treffer: hits });
    }
    if (pending.count() >= MAX_OFFEN) return refuse(res, 503, 'Gerade warten zu viele Fragen auf die Moderation. Bitte später noch einmal.');
    askPerToken.count(bearer);
    askPerClient.count(client);
    /** Der Hinweis aus einer Kapitelseite ist nur ein Vorschlag; was unbekannt ist, bleibt draußen */
    const hinweis = kapitelBySlug(typeof kapitel === 'string' ? kapitel : '')?.titel ?? null;
    return send(res, 201, fragen.ask({ text, einwilligung: einwilligung === true, kapitel: hinweis }));
  }

  /** „Meine Fragen“ und Löschen brauchen kein Token, also eine eigene Bremse. Liefert true, wenn die Antwort schon raus ist */
  function throttled(req, res) {
    const client = clientOf(req);
    if (readsPerClient.allowed(client)) {
      readsPerClient.count(client);
      return false;
    }
    store.count('gebremst');
    refuse(res, 429, 'Zu viele Anfragen. Bitte gleich noch einmal.');
    return true;
  }

  /** Eine Frage ist nach der Freigabe nicht mehr mit einem Geheimnis verbunden, aber öffentlich: Dann reicht die Kennung */
  function status({ id, geheimnis }) {
    const row = pending.mine(id, geheimnis);
    if (!row) {
      const text = store.visibleText(String(id));
      return text === null ? { id, zustand: 'weg' } : { id, zustand: 'öffentlich', url: `f/${id}/`, html: renderQuestion(text) };
    }
    if (row.zustand === 'abgelehnt') return { id, zustand: 'abgelehnt', grund: row.grund };
    const entwurf = row.entwurf && { status: row.entwurf.status, html: row.entwurf.status === 'ok' ? draftCard(row, site) : '' };
    return { id, zustand: row.zustand, text: row.text, html: renderQuestion(row.text), tag: row.tag, einwilligung: row.einwilligung, treffer: row.treffer.length > 0, entwurf };
  }

  function mine(req, res, { fragen: list }) {
    if (throttled(req, res)) return undefined;
    if (!Array.isArray(list) || list.length > MAX_MEINE) return refuse(res, 400, 'Ungültige Anfrage.');
    return send(res, 200, { fragen: list.map(status) });
  }

  function remove(req, res, { id, geheimnis }) {
    if (throttled(req, res)) return undefined;
    if (!pending.mine(id, geheimnis)) return refuse(res, 404, 'Diese Frage gibt es nicht mehr.');
    fragen.withdraw(id);
    return send(res, 200, {});
  }

  async function route(req, res) {
    /** nur Pfade, die roh schon unter `api/` liegen (lib/http.js, `plainPath`) */
    const path = plainPath(req.url);
    if (!path?.startsWith(root)) return refuse(res, 404, 'Nicht gefunden.');
    if (req.method !== 'POST') return refuse(res, 405, 'Nicht erlaubt.');
    if (!sameOrigin(req)) return refuse(res, 403, 'Anfrage von fremder Seite.');
    const data = await readJson(req, MAX_BODY);
    if (!data) return refuse(res, 400, 'Ungültige Anfrage.');
    switch (path.slice(root.length)) {
      case 'token': return token(req, res, data);
      case 'fragen': return ask(req, res, data);
      case 'meine': return mine(req, res, data);
      case 'loeschen': return remove(req, res, data);
      default: return refuse(res, 404, 'Nicht gefunden.');
    }
  }

  return (req, res) => route(req, res).catch(error => {
    console.error(error);
    if (!res.headersSent) refuse(res, 500, 'Das ging schief. Bitte noch einmal.');
  });
}

/** ohne Kurscode-Hash bleibt der Fragepfad zu, auch wenn der Code schon auf dem Server liegt */
export const closedApi = (req, res) => sendJson(res, 503, { fehler: 'Fragen lassen sich noch nicht stellen.' });
