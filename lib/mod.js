/**
 * Der Web-Prozess der Moderation: Anmelden, neue Fragen entscheiden, Bearbeiten, Prüfen, Zurückziehen. Kein API-Key, kein Framework
 * (Plan §4). Jede Änderung geht erst in die Datenbank und schreibt dann die betroffenen Seiten neu.
 */
import fs from 'node:fs';
import { createLimiter, createSessions, dummyHash, verifyPassphrase } from './auth.js';
import { hardHits } from './checker.js';
import { UNTERFOREN } from './forum.js';
import { GRUENDE } from './fragen.js';
import { clientOf, readBody, sameOrigin } from './http.js';
import { editPage, errorPage, loginPage, overviewPage, pendingPage } from './mod-pages.js';
import { createPublisher } from './publish.js';

export const MOD_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
const COOKIE = '__Secure-sitzung';
const MAX_BODY = 200_000;
const KEYS = fs.readFileSync(new URL('./mod-tasten.js', import.meta.url));
const SESSION_SECONDS = 12 * 3600;

const cookieOf = req => (req.headers.cookie ?? '').split(/; */).find(c => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
async function readForm(req) {
  if (!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) return null;
  const body = await readBody(req, MAX_BODY);
  return body && new URLSearchParams(body.toString('utf8'));
}

/** Was vor dem Speichern gelten muss; der Checker läuft auch auf Moderationsänderungen (Plan §8) */
function problems(frage, antwort, answer) {
  const found = [];
  if (frage.length < 5) found.push('Die Frage ist zu kurz.');
  for (const hit of hardHits(frage)) found.push(`Die Frage enthält etwas, das nicht öffentlich werden darf: ${hit}.`);
  if (antwort === null) return found;
  if (!antwort) found.push('Die Antwort ist leer.');
  for (const hit of hardHits(antwort)) found.push(`Die Antwort enthält etwas, das nicht öffentlich werden darf: ${hit}.`);
  const prose = antwort.replace(/```[\s\S]*?```|`[^`\n]+`/g, '');
  for (const [, n] of prose.matchAll(/\[(\d+)\]/g)) {
    if (+n < 1 || +n > answer.zitate.length) found.push(`Den Verweis [${n}] gibt es nicht, die Antwort hat ${answer.zitate.length} Zitate.`);
  }
  return [...new Set(found)];
}

export function createHandler({ store, live, base = '/eidl/', sessions = createSessions(), now = Date.now, publish = createPublisher(live, store), fragen = null }) {
  const root = `${base}mod`;
  const perClient = createLimiter({ max: 5, now });
  const overall = createLimiter({ max: 30, now });

  /** nosniff, Referrer-Policy und Co. setzt Caddy für den ganzen Host; doppelt kämen sie als Liste an */
  const send = (res, status, html, headers = {}) => {
    res.writeHead(status, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': MOD_CSP,
      ...headers,
    });
    res.end(html);
  };
  const redirect = (res, location, headers = {}) => send(res, 303, '', { Location: location, ...headers });

  async function login(req, res) {
    const client = clientOf(req);
    if (!perClient.allowed(client) || !overall.allowed('alle')) return send(res, 429, loginPage(base, 'Zu viele Versuche. Bitte später noch einmal.'));
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    const user = store.moderator(form.get('name') ?? '');
    const right = await verifyPassphrase(form.get('passphrase') ?? '', user?.hash ?? await dummyHash);
    if (!user || !right) {
      perClient.fail(client);
      overall.fail('alle');
      return send(res, 401, loginPage(base, 'Name oder Passphrase stimmen nicht.'));
    }
    perClient.clear(client);
    const token = sessions.create({ name: user.name, rolle: user.rolle });
    return redirect(res, `${root}/`, { 'Set-Cookie': `${COOKIE}=${token}; Path=${base}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}` });
  }

  async function save(req, res, user, question) {
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    const answer = question.antworten[0];
    const editable = answer && answer.status !== 'kein_beleg';
    const action = form.get('aktion');
    const done = meldung => publish(question.id).then(() => redirect(res, `${root}/f/${question.id}/?ok=${meldung}`));

    if (action === 'zurueckziehen' || action === 'wiederherstellen') {
      store.setQuestionStatus(question.id, action === 'zurueckziehen' ? 'zurückgezogen' : 'sichtbar', user.rolle);
      return done(action);
    }
    if (action === 'zuruecksetzen' && answer) {
      store.setAnswerStatus(answer.id, 'ungeprüft', user.rolle);
      return done(action);
    }
    if (action !== 'speichern' && action !== 'pruefen') return send(res, 400, errorPage(base, 400, 'Unbekannte Aktion.'));

    const frage = (form.get('frage') ?? '').replace(/\r\n/g, '\n').trim();
    const antwort = editable ? (form.get('antwort') ?? '').replace(/\r\n/g, '\n').trim() : null;
    const fehler = problems(frage, antwort, answer);
    if (fehler.length) return send(res, 422, editPage({ question, revisions: store.revisions(question.id), user, base, nav: store.neighbours(question.id), fehler, frage, antwort: antwort ?? undefined }));
    store.editQuestion(question.id, frage, user.rolle);
    if (editable) store.editAnswer(answer.id, antwort, user.rolle);
    if (action === 'pruefen' && editable) store.setAnswerStatus(answer.id, 'geprüft', user.rolle);
    return done(action);
  }

  /** Die Entscheidung über eine neue Frage. Der Checker läuft hier zuletzt und auf dem, was wirklich öffentlich wird */
  async function decide(req, res, user, row) {
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    const action = form.get('aktion');
    if (action === 'ablehnen') {
      fragen.reject(row.id, GRUENDE[form.get('grund')] ?? GRUENDE.sonst);
      return redirect(res, `${root}/?ok=abgelehnt`);
    }
    if (action !== 'freigeben' && action !== 'pruefen') return send(res, 400, errorPage(base, 400, 'Unbekannte Aktion.'));

    const draft = row.entwurf?.status === 'ok' ? row.entwurf : null;
    const frage = (form.get('frage') ?? '').replace(/\r\n/g, '\n').trim();
    const antwort = draft ? (form.get('antwort') ?? '').replace(/\r\n/g, '\n').trim() : null;
    const kapitel = form.get('kapitel') ?? '';
    const fehler = problems(frage, antwort, { zitate: draft?.zitate ?? [] });
    if (!UNTERFOREN.some(forum => forum.kapitel.includes(kapitel))) fehler.push('Bitte ein Kapitel wählen.');
    if (row.treffer.length && form.get('gesehen') !== '1') fehler.push('Der Checker hat angeschlagen, bitte den Text lesen und das bestätigen.');
    if (fehler.length) return send(res, 422, pendingPage({ row, user, base, fehler, frage, antwort: antwort ?? undefined, kapitel }));
    await fragen.approve(row.id, { text: frage, kapitel, antwort: antwort ?? undefined, status: action === 'pruefen' && draft ? 'geprüft' : 'ungeprüft' });
    return redirect(res, `${root}/f/${row.id}/?ok=freigegeben`);
  }

  const MELDUNGEN = {
    freigegeben: 'Freigegeben und veröffentlicht.',
    abgelehnt: 'Abgelehnt, der Text ist gelöscht.',
    speichern: 'Gespeichert und veröffentlicht.',
    pruefen: 'Als geprüft markiert und veröffentlicht.',
    zuruecksetzen: 'Wieder ungeprüft.',
    zurueckziehen: 'Zurückgezogen, die öffentliche Seite ist weg.',
    wiederherstellen: 'Wieder sichtbar.',
  };

  async function route(req, res) {
    const url = new URL(req.url, 'http://x');
    const path = url.pathname;
    if (path === root) return redirect(res, `${root}/`);
    if (path === `${root}/tasten.js` && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Security-Policy': MOD_CSP });
      return res.end(KEYS);
    }
    if (!path.startsWith(`${root}/`)) return send(res, 404, errorPage(base, 404, 'Nicht gefunden.'));
    if (req.method === 'POST' && !sameOrigin(req)) return send(res, 403, errorPage(base, 403, 'Anfrage von fremder Seite.'));
    if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, errorPage(base, 405, 'Nicht erlaubt.'));

    if (path === `${root}/anmelden` && req.method === 'POST') return login(req, res);
    const token = cookieOf(req);
    const user = sessions.get(token);
    if (!user) return req.method === 'GET' && path === `${root}/` ? send(res, 200, loginPage(base)) : redirect(res, `${root}/`);
    if (path === `${root}/abmelden` && req.method === 'POST') {
      sessions.drop(token);
      return redirect(res, `${root}/`, { 'Set-Cookie': `${COOKIE}=; Path=${base}; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    }
    if (path === `${root}/` && req.method === 'GET') return send(res, 200, overviewPage(store.questions(), user, base, fragen?.offen() ?? [], MELDUNGEN[url.searchParams.get('ok')] ?? ''));

    const neu = fragen && path.match(new RegExp(`^${root}/neu/([a-z0-9-]+)/$`))?.[1];
    if (neu) {
      const row = fragen.get(neu);
      if (!row || row.zustand === 'abgelehnt') return send(res, 404, errorPage(base, 404, 'Diese Frage gibt es nicht mehr.'));
      return req.method === 'POST' ? decide(req, res, user, row) : send(res, 200, pendingPage({ row, user, base }));
    }

    const id = path.match(new RegExp(`^${root}/f/([a-z0-9-]+)/$`))?.[1];
    const question = id ? store.question(id) : null;
    if (!question) return send(res, 404, errorPage(base, 404, 'Diese Frage gibt es nicht.'));
    if (req.method === 'POST') return save(req, res, user, question);
    return send(res, 200, editPage({ question, revisions: store.revisions(id), user, base, nav: store.neighbours(id), meldung: MELDUNGEN[url.searchParams.get('ok')] ?? '' }));
  }

  return (req, res) => route(req, res).catch(error => {
    console.error(error);
    if (!res.headersSent) send(res, 500, errorPage(base, 500, 'Das ging schief. Gespeichertes bleibt erhalten, die Seite ist womöglich noch nicht neu geschrieben.'));
  });
}
