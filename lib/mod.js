/**
 * Der Web-Prozess der Moderation: Anmelden, neue Fragen entscheiden, Bearbeiten, Prüfen, Zurückziehen. Kein API-Key, kein Framework
 * (Plan §4). Jede Änderung geht erst in die Datenbank und schreibt dann die betroffenen Seiten neu.
 */
import fs from 'node:fs';
import { checkDevice, createLimiter, createSessions, DEVICE_SECONDS, dummyHash, issueDevice, verifyPassphrase } from './auth.js';
import { hardHits } from './checker.js';
import { UNTERFOREN } from './forum.js';
import { GRUENDE, KURZTITEL_MAX, KURZTITEL_MIN, kurztitelOf } from './fragen.js';
import { clientOf, readBody, sameOrigin } from './http.js';
import { editPage, errorPage, loginPage, overviewPage, pendingPage, statsPage, titlesPage } from './mod-pages.js';
import { createPublisher, publishAll } from './publish.js';
import { MAX_AUFTRAG } from './spool.js';
import { staleAnswers } from './skriptstand.js';
import { figures, readCosts } from './zahlen.js';

export const MOD_CSP = "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";
const COOKIE = '__Secure-sitzung';
const MAX_BODY = 200_000;
const KEYS = fs.readFileSync(new URL('./mod-tasten.js', import.meta.url));
const SESSION_SECONDS = 12 * 3600;

/** Das Gerät, nicht die Sitzung (lib/auth.js, Plan D41). Es gilt nur unter `mod/`, lesende Seiten sehen es nie */
const GERAET = '__Secure-geraet';
const cookieOf = (req, name = COOKIE) => (req.headers.cookie ?? '').split(/; */).find(c => c.startsWith(`${name}=`))?.slice(name.length + 1);
async function readForm(req) {
  if (!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded')) return null;
  const body = await readBody(req, MAX_BODY);
  return body && new URLSearchParams(body.toString('utf8'));
}

/** Was vor dem Speichern gelten muss; der Checker läuft auch auf Moderationsänderungen (Plan §8) */
function problems(frage, antwort, answer) {
  const found = [];
  if (frage.length < 5) found.push('Die Frage ist zu kurz.');
  /** länger nähme der Worker sie nicht an (lib/spool.js) */
  if (frage.length > MAX_AUFTRAG) found.push(`Die Frage ist zu lang, möglich sind ${MAX_AUFTRAG} Zeichen.`);
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

/** Ein Kurztitel aus einem Formular: leer nimmt ihn zurück, sonst muss er in die Grenzen passen, und der Checker läuft auch hier */
function titleInput(value) {
  const eingabe = (value ?? '').replace(/\s+/g, ' ').trim();
  const titel = eingabe ? kurztitelOf(eingabe) : null;
  const fehler = eingabe && !titel ? [`Der Kurztitel braucht ${KURZTITEL_MIN} bis ${KURZTITEL_MAX} Zeichen, es sind ${eingabe.length}.`] : [];
  for (const hit of hardHits(eingabe)) fehler.push(`Der Kurztitel enthält etwas, das nicht öffentlich werden darf: ${hit}.`);
  return { eingabe, titel, fehler };
}

export function createHandler({ store, live, base = '/eidl/', sessions = createSessions(), now = Date.now, publish = createPublisher(live, store), fragen = null, kosten = null, passages = null }) {
  const root = `${base}mod`;
  const publishEverything = publish.all ?? (() => publishAll(live, store));
  /** Antworten, deren Zitat das ausgespielte Skript so nicht mehr hat; ohne Korpus keine */
  const stale = questions => (passages ? staleAnswers(questions.map(q => ({ id: q.id, zitate: q.antworten[0]?.zitate ?? [] })), passages) : []);
  const perClient = createLimiter({ max: 5, now });
  const overall = createLimiter({ max: 30, now });
  const perDevice = createLimiter({ max: 5, now });

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
    /**
     * Ein Gerät, das sich schon einmal richtig angemeldet hat, zählt gegen seine eigene Grenze statt gegen die für alle: Sonst sperrt
     * ein Fremder mit 30 falschen Versuchen auch die Moderation aus. Die Grenze je Adresse gilt für beide. Geprüft wird das Cookie
     * ohne Warten, `store.moderator` ist eine synchrone Abfrage.
     */
    const geraet = checkDevice(cookieOf(req, GERAET), name => store.moderator(name)?.hash, now());
    const [shared, key] = geraet ? [perDevice, geraet] : [overall, 'alle'];
    if (!perClient.allowed(client) || !shared.allowed(key)) return send(res, 429, loginPage(base, 'Zu viele Versuche. Bitte später noch einmal.'));
    /** Zählen vor dem ersten Warten, wie beim Kurscode in lib/api.js; stimmt die Passphrase, wird der Versuch gestrichen */
    perClient.fail(client);
    const forget = shared.fail(key);
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    const user = store.moderator(form.get('name') ?? '');
    const right = await verifyPassphrase(form.get('passphrase') ?? '', user?.hash ?? await dummyHash);
    if (!user || !right) return send(res, 401, loginPage(base, 'Name oder Passphrase stimmen nicht.'));
    perClient.clear(client);
    forget();
    const token = sessions.create({ name: user.name, rolle: user.rolle });
    return redirect(res, `${root}/`, { 'Set-Cookie': [
      `${COOKIE}=${token}; Path=${base}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`,
      `${GERAET}=${issueDevice(user.name, user.hash, now())}; Path=${root}/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DEVICE_SECONDS}`,
    ] });
  }

  async function save(req, res, user, question) {
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    const answer = question.antworten[0];
    const editable = answer && answer.status !== 'kein_beleg';
    const action = form.get('aktion');
    const done = meldung => publish(question.id).then(() => redirect(res, `${root}/f/${question.id}/?ok=${meldung}`));
    const pageWith = extra => editPage({ question, veraltet: stale([question])[0]?.nummern ?? [], revisions: store.revisions(question.id), user, base, nav: store.neighbours(question.id), nochmal: fragen?.nochmal, vorschlag: store.proposal(question.id), ...extra });

    /** Plan D27: unwiderruflich, also nur für admin und nur mit Haken. Zurückziehen bleibt der schnelle Weg für alle */
    if (action === 'loeschen' || action === 'verlauf_bereinigen') {
      if (user.rolle !== 'admin') return send(res, 403, errorPage(base, 403, 'Löschen ist der Rolle admin vorbehalten. Zurückziehen nimmt die Seite sofort weg.'));
      if (form.get('bestaetigt') !== '1') return send(res, 422, pageWith({ fehler: ['Bitte bestätigen Sie mit dem Haken, dass sich das nicht rückgängig machen lässt.'] }));
      if (action === 'verlauf_bereinigen') {
        store.purgeRevisions(question.id, user.rolle);
        return redirect(res, `${root}/f/${question.id}/?ok=${action}`);
      }
      fragen?.drop(question.id);
      store.deleteQuestion(question.id, user.rolle);
      store.count('geloescht');
      await publish(question.id);
      return redirect(res, `${root}/?ok=geloescht`);
    }

    if (action === 'zurueckziehen' || action === 'wiederherstellen') {
      store.setQuestionStatus(question.id, action === 'zurueckziehen' ? 'zurückgezogen' : 'sichtbar', user.rolle);
      return done(action);
    }
    if (action === 'zuruecksetzen' && answer) {
      store.setAnswerStatus(answer.id, 'ungeprüft', user.rolle);
      return done(action);
    }
    if (action === 'nochmal') {
      if (!fragen?.again(question.id)) return send(res, 409, errorPage(base, 409, 'Das geht gerade nicht: Die Frage ist nicht öffentlich, oder es läuft schon ein Auftrag.'));
      return redirect(res, `${root}/f/${question.id}/?ok=nochmal`);
    }
    if (action === 'verwerfen') {
      store.dropProposal(question.id);
      return redirect(res, `${root}/f/${question.id}/?ok=verwerfen`);
    }
    if (action === 'titel_vorschlagen') {
      if (!fragen?.suggest(question.id)) return send(res, 409, errorPage(base, 409, 'Das geht gerade nicht: Die Frage ist nicht öffentlich, oder es läuft schon ein Auftrag.'));
      return redirect(res, `${root}/f/${question.id}/?ok=titel_vorschlagen`);
    }
    if ((action === 'uebernehmen' || action === 'uebernehmen_pruefen') && fragen?.adopt(question.id, action === 'uebernehmen' ? 'ungeprüft' : 'geprüft', user.rolle)) return done(action);
    if (action !== 'speichern' && action !== 'pruefen') return send(res, 400, errorPage(base, 400, 'Unbekannte Aktion.'));

    const frage = (form.get('frage') ?? '').replace(/\r\n/g, '\n').trim();
    /** ohne Text von Claude ist das Feld freiwillig, leer heißt: nichts schreiben */
    const eingabe = (form.get('antwort') ?? '').replace(/\r\n/g, '\n').trim();
    const antwort = editable || eingabe ? eingabe : null;
    const kurz = titleInput(form.get('kurztitel'));
    const fehler = [...problems(frage, antwort, { zitate: answer?.zitate ?? [] }), ...kurz.fehler];
    if (fehler.length) return send(res, 422, pageWith({ fehler, frage, antwort: antwort ?? undefined, kurztitel: kurz.eingabe }));
    store.editQuestion(question.id, frage, user.rolle);
    /** Ein Formular ohne das Feld, etwa aus einem Reiter von vor dem Update, nimmt keinen Titel zurück */
    if (form.has('kurztitel')) store.setTitle(question.id, kurz.titel, user.rolle);
    if (editable) store.editAnswer(answer.id, antwort, user.rolle);
    else if (antwort) {
      store.writeAnswer(question.id, antwort, user.rolle);
      store.count('moderationsantwort');
    }
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
    const eingabe = (form.get('antwort') ?? '').replace(/\r\n/g, '\n').trim();
    const antwort = draft || eingabe ? eingabe : null;
    const kapitel = form.get('kapitel') ?? '';
    const kurz = titleInput(form.get('kurztitel'));
    const fehler = [...problems(frage, antwort, { zitate: draft?.zitate ?? [] }), ...kurz.fehler];
    if (!UNTERFOREN.some(forum => forum.kapitel.includes(kapitel))) fehler.push('Bitte ein Kapitel wählen.');
    if (row.treffer.length && form.get('gesehen') !== '1') fehler.push('Der Checker hat angeschlagen, bitte den Text lesen und das bestätigen.');
    if (fehler.length) return send(res, 422, pendingPage({ row, user, base, fehler, frage, antwort: antwort ?? undefined, kapitel, kurztitel: kurz.eingabe }));
    await fragen.approve(row.id, { text: frage, kapitel, antwort: antwort ?? undefined, status: action === 'pruefen' && draft ? 'geprüft' : 'ungeprüft', kurztitel: kurz.titel });
    return redirect(res, `${root}/f/${row.id}/?ok=freigegeben`);
  }

  /** Alle Kurztitel auf einmal: Jedes Feld gilt, wie es dasteht. Bei einem Fehler wird nichts gespeichert, die Eingaben bleiben stehen */
  async function saveTitles(req, res, user) {
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    if (form.get('aktion') !== 'titel_speichern') return send(res, 400, errorPage(base, 400, 'Unbekannte Aktion.'));
    const questions = store.visible();
    const inputs = questions.filter(q => form.has(`t-${q.id}`)).map(q => ({ q, ...titleInput(form.get(`t-${q.id}`)) }));
    const fehler = inputs.flatMap(({ q, fehler: found }) => found.map(f => `${q.id}: ${f}`));
    if (fehler.length) return send(res, 422, titlesPage({ questions, user, base, fehler, werte: Object.fromEntries(inputs.map(i => [i.q.id, i.eingabe])) }));
    const changed = inputs.filter(({ q, titel }) => store.setTitle(q.id, titel, user.rolle)).map(i => i.q.id);
    if (changed.length) await publish(...changed);
    return redirect(res, `${root}/titel/?ok=titel`);
  }

  /** Plan D33: nur admin, nur mit Haken. Danach ist jede Seite neu zu schreiben, nicht nur eine */
  async function preview(req, res, user) {
    const form = await readForm(req);
    if (!form) return send(res, 400, errorPage(base, 400, 'Das Formular kam nicht an.'));
    const action = form.get('aktion');
    if (action !== 'vorschau_beenden' && action !== 'vorschau_an') return send(res, 400, errorPage(base, 400, 'Unbekannte Aktion.'));
    if (form.get('bestaetigt') !== '1') return send(res, 422, errorPage(base, 422, 'Bitte bestätigen Sie den Schritt mit dem Haken.'));
    store.setSite('vorschau', action === 'vorschau_an');
    console.log(`Vorschau ${action === 'vorschau_an' ? 'an' : 'beendet'} durch ${user.rolle}`);
    await publishEverything();
    return redirect(res, `${root}/zahlen/?ok=${action}`);
  }

  const MELDUNGEN = {
    freigegeben: 'Freigegeben und veröffentlicht.',
    abgelehnt: 'Abgelehnt, der Text ist gelöscht.',
    speichern: 'Gespeichert und veröffentlicht.',
    pruefen: 'Als geprüft markiert und veröffentlicht.',
    zuruecksetzen: 'Wieder ungeprüft.',
    zurueckziehen: 'Zurückgezogen, die öffentliche Seite ist weg.',
    wiederherstellen: 'Wieder sichtbar.',
    nochmal: 'Der Auftrag ist bei Claude.',
    verwerfen: 'Vorschlag verworfen.',
    titel_vorschlagen: 'Der Auftrag ist bei Claude. Der Vorschlag steht in rund einer Minute im Feld „Kurztitel“.',
    titel: 'Kurztitel gespeichert und veröffentlicht.',
    vorschau_beenden: 'Die Vorschau ist beendet, alle Seiten dieses Servers sind neu geschrieben. Jetzt den Bau mit --release ausspielen.',
    vorschau_an: 'Die Site ist wieder Vorschau, alle Seiten dieses Servers sind neu geschrieben.',
    uebernehmen: 'Vorschlag übernommen und veröffentlicht, ungeprüft.',
    uebernehmen_pruefen: 'Vorschlag übernommen, als geprüft markiert und veröffentlicht.',
    verlauf_bereinigen: 'Die alten Fassungen sind aus dem Verlauf entfernt.',
    geloescht: 'Endgültig gelöscht: Frage, Antwort, Zitate, Verlauf und Stimmen. In den Sicherungen läuft der Text binnen sechs Monaten aus.',
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
    if (path === `${root}/` && req.method === 'GET') {
      const questions = store.questions();
      const veraltet = stale(questions.filter(q => q.status === 'sichtbar')).map(a => a.id);
      return send(res, 200, overviewPage(questions, user, base, fragen?.offen() ?? [], MELDUNGEN[url.searchParams.get('ok')] ?? '', veraltet));
    }

    if (path === `${root}/zahlen/`) {
      if (user.rolle !== 'admin') return send(res, 403, errorPage(base, 403, 'Diese Seite ist der Rolle admin vorbehalten.'));
      if (req.method === 'POST') return preview(req, res, user);
      const { entries, fehler } = readCosts(kosten);
      const today = new Date(now()).toISOString().slice(0, 10);
      return send(res, 200, statsPage({ zahlen: figures({ entries, counters: store.counters(), questions: store.visible(), offen: fragen?.offen() ?? [], stimmen: store.voteTotals(), today }), fehler, user, base, vorschau: !!store.site().vorschau, meldung: MELDUNGEN[url.searchParams.get('ok')] ?? '' }));
    }

    if (path === `${root}/titel/`) {
      if (req.method === 'POST') return saveTitles(req, res, user);
      return send(res, 200, titlesPage({ questions: store.visible(), user, base, meldung: MELDUNGEN[url.searchParams.get('ok')] ?? '' }));
    }

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
    return send(res, 200, editPage({ question, veraltet: stale([question])[0]?.nummern ?? [], revisions: store.revisions(id), user, base, nav: store.neighbours(id), nochmal: fragen?.nochmal, vorschlag: store.proposal(id), meldung: MELDUNGEN[url.searchParams.get('ok')] ?? '' }));
  }

  return (req, res) => route(req, res).catch(error => {
    console.error(error);
    if (!res.headersSent) send(res, 500, errorPage(base, 500, 'Das ging schief. Gespeichertes bleibt erhalten, die Seite ist womöglich noch nicht neu geschrieben.'));
  });
}
