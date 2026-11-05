/**
 * Der Fragepfad unter /eidl/api/: Token, neue Frage, „Meine Fragen“, Löschen. JSON, kein Cookie, kein API-Key (I5). Alles außer dem Text
 * einer Frage bleibt im Arbeitsspeicher, Adressen und Tokens werden nicht gespeichert (Plan §10).
 */
import { checkToken, createLimiter, issueToken, tokenKey, verifyPassphrase } from './auth.js';
import { hardHits } from './checker.js';
import { MAX_FRAGE, MAX_OFFEN, MIN_FRAGE, ZUSTIMMUNG } from './fragen.js';
import { clientOf, readJson, sameOrigin, sendJson } from './http.js';
import { draftCard } from './site.js';

const MAX_BODY = 20_000;
const MAX_MEINE = 50;
const HOUR = 3600_000;

export function createApi({ fragen, pending, store, hash, base = '/eidl/', now = Date.now }) {
  const root = `${base}api/`;
  const key = tokenKey(hash);
  const wrongCode = createLimiter({ max: 5, now });
  const wrongOverall = createLimiter({ max: 30, now });
  const tokensPerClient = createLimiter({ max: 5, window: HOUR, now });
  const askPerToken = createLimiter({ max: 2, window: HOUR, now });
  const askPerClient = createLimiter({ max: 6, window: HOUR, now });

  const send = sendJson;
  const refuse = (res, status, fehler, extra = {}) => send(res, status, { fehler, ...extra });

  async function token(req, res, { kurscode }) {
    const client = clientOf(req);
    if (!wrongCode.allowed(client) || !wrongOverall.allowed('alle') || !tokensPerClient.allowed(client)) return refuse(res, 429, 'Zu viele Versuche. Bitte später noch einmal.');
    if (!await verifyPassphrase(String(kurscode ?? '').trim(), hash)) {
      wrongCode.fail(client);
      wrongOverall.fail('alle');
      return refuse(res, 401, 'Dieser Kurscode stimmt nicht.');
    }
    tokensPerClient.count(client);
    return send(res, 200, { token: issueToken(key) });
  }

  function ask(req, res, { frage, zustimmung, einwilligung }) {
    const bearer = req.headers.authorization?.replace(/^Bearer /, '') ?? '';
    if (!checkToken(key, bearer)) return refuse(res, 401, 'Bitte geben Sie zuerst den Kurscode ein.');
    const client = clientOf(req);
    if (!askPerToken.allowed(bearer) || !askPerClient.allowed(client)) return refuse(res, 429, 'Sie haben gerade schon Fragen gestellt. Bitte später noch einmal.');
    if (zustimmung !== ZUSTIMMUNG.version) return refuse(res, 400, 'Bitte stimmen Sie den Bedingungen zu.');
    const text = String(frage ?? '').replace(/\r\n/g, '\n').trim();
    if (text.length < MIN_FRAGE) return refuse(res, 422, 'Die Frage ist zu kurz.');
    if (text.length > MAX_FRAGE) return refuse(res, 422, `Die Frage ist zu lang, möglich sind ${MAX_FRAGE} Zeichen.`);
    const hits = hardHits(text);
    if (hits.length) return refuse(res, 422, 'Die Frage enthält etwas, das hier nicht stehen darf. Sie wurde nicht gespeichert.', { treffer: hits });
    if (pending.count() >= MAX_OFFEN) return refuse(res, 503, 'Gerade warten zu viele Fragen auf die Moderation. Bitte später noch einmal.');
    askPerToken.count(bearer);
    askPerClient.count(client);
    return send(res, 201, fragen.ask({ text, einwilligung: einwilligung === true }));
  }

  /** Eine Frage ist nach der Freigabe nicht mehr mit einem Geheimnis verbunden, aber öffentlich: Dann reicht die Kennung */
  function status({ id, geheimnis }) {
    const row = pending.mine(id, geheimnis);
    if (!row) return store.question(String(id))?.status === 'sichtbar' ? { id, zustand: 'öffentlich', url: `f/${id}/` } : { id, zustand: 'weg' };
    if (row.zustand === 'abgelehnt') return { id, zustand: 'abgelehnt', grund: row.grund };
    const entwurf = row.entwurf && { status: row.entwurf.status, html: row.entwurf.status === 'ok' ? draftCard(row) : '' };
    return { id, zustand: row.zustand, text: row.text, tag: row.tag, einwilligung: row.einwilligung, treffer: row.treffer.length > 0, entwurf };
  }

  function mine(res, { fragen: list }) {
    if (!Array.isArray(list) || list.length > MAX_MEINE) return refuse(res, 400, 'Ungültige Anfrage.');
    return send(res, 200, { fragen: list.map(status) });
  }

  function remove(res, { id, geheimnis }) {
    if (!pending.mine(id, geheimnis)) return refuse(res, 404, 'Diese Frage gibt es nicht mehr.');
    fragen.withdraw(id);
    return send(res, 200, {});
  }

  async function route(req, res) {
    if (req.method !== 'POST') return refuse(res, 405, 'Nicht erlaubt.');
    if (!sameOrigin(req)) return refuse(res, 403, 'Anfrage von fremder Seite.');
    const data = await readJson(req, MAX_BODY);
    if (!data) return refuse(res, 400, 'Ungültige Anfrage.');
    switch (new URL(req.url, 'http://x').pathname.slice(root.length)) {
      case 'token': return token(req, res, data);
      case 'fragen': return ask(req, res, data);
      case 'meine': return mine(res, data);
      case 'loeschen': return remove(res, data);
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
