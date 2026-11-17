/**
 * Der Weg einer Frage von außen (Plan §5, D20), ohne HTTP: annehmen, in die Schlange legen, Ergebnisse abholen, freigeben, ablehnen.
 * Nur hier entsteht ein Auftrag für den Worker, also hängt I1 an genau drei Stellen: `ask`, `approve` und `again`.
 */
import { hardHits, softHits } from './checker.js';
import { textDigest } from './spool.js';

/**
 * Die Version steht an jeder Frage; wer die Texte ändert, erhöht sie. 3 (2026-11-17, Plan D30, D31): Die Frage wird mit dem Absenden
 * gemeinfrei, und nach der Freigabe entsteht neben der Antwort ein Vorschlag für den Kurztitel.
 */
export const ZUSTIMMUNG = {
  version: 3,
  oeffentlich: 'Meine Frage wird nach Prüfung durch die Moderation dauerhaft öffentlich sichtbar. Danach verarbeitet ein Sprachmodell von Anthropic (USA) sie, um eine Antwort und einen Kurztitel zu erzeugen. Ich gebe meine Frage gemeinfrei (CC0 1.0): Alle dürfen sie frei verwenden, ohne mich zu fragen oder zu nennen. Ich gebe keine Namen, Matrikelnummern oder anderen personenbezogenen Daten ein.',
  entwurf: 'Ich willige ein, dass meine Frage schon vor der Prüfung an Anthropic (USA) geht, damit ich sofort einen Entwurf bekomme. Frage und Entwurf sehen bis zur Entscheidung außer mir nur die Moderation. Ohne Einwilligung bekomme ich die Antwort nach der Freigabe. Ich kann die Einwilligung widerrufen, indem ich die Frage unter „Meine Fragen“ lösche; was schon gesendet ist, bleibt davon unberührt.',
};

/** Ab dieser Version der Zustimmung steht die Frage unter CC0 1.0. Ältere Fragen haben das nie erklärt, sie tragen keinen Lizenzvermerk */
export const CC0 = { kennung: 'CC0-1.0', ab: 3, name: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/deed.de', kanonisch: 'https://creativecommons.org/publicdomain/zero/1.0/' };

export const GRUENDE = {
  uebung: 'Das Forum behandelt nur Skriptinhalte, keine Übungsaufgaben und nichts Organisatorisches.',
  person: 'Die Frage enthält personenbezogene Angaben.',
  doppelt: 'Diese Frage gibt es schon im Forum.',
  sonst: 'Die Frage passt nicht ins Forum.',
};

export const MIN_FRAGE = 10;
export const MAX_FRAGE = 1500;
export const MAX_OFFEN = 100;

/**
 * Der Kurztitel steht im Suchergebnis und im Browser-Tab vor „ | hAInrich2“; zusammen sind das 65 Zeichen, danach schneidet die
 * Trefferliste ab (research/2026-11-16-seo-audit, Befund 7). Leer oder null heißt: kein Kurztitel.
 */
export const KURZTITEL_MIN = 5;
export const KURZTITEL_MAX = 53;
/** Eingabe zu einem Kurztitel: eine Zeile, oder null, wenn sie keiner ist */
export function kurztitelOf(value) {
  const titel = String(value ?? '').replace(/\s+/g, ' ').trim();
  return titel.length >= KURZTITEL_MIN && titel.length <= KURZTITEL_MAX ? titel : null;
}

const day = now => new Date(now()).toISOString().slice(0, 10);

/**
 * Ein Vektor gilt nur für den Wortlaut, für den er gerechnet wurde (Plan D35). Das Kennzeichen `von` trägt jedes Ergebnis des Worker seit
 * dem 2026-11-17; ein älteres ohne Kennzeichen gilt nur, wenn der Text nachweislich derselbe ist. So wird nach einer Redaktion bei der
 * Freigabe nie der Vektor des alten Wortlauts öffentlich: Aus ihm ließe sich womöglich zurückrechnen, was gestrichen wurde.
 */
const fits = (entwurf, text, original = null) => Array.isArray(entwurf?.vektor) && (entwurf.von ? entwurf.von === textDigest(text) : original !== null && text === original);

/** Antwort für `public.db`; ohne Beleg gibt es den festen Satz, ohne brauchbares Ergebnis nichts */
function answerOf(entwurf, { text = entwurf?.text, status = 'ungeprüft' } = {}) {
  if (entwurf?.status === 'kein_beleg') return { art: 'bot', status: 'kein_beleg', modell: entwurf.modell, text: null, zitate: [] };
  if (entwurf?.status !== 'ok') return null;
  return { art: 'bot', status, modell: entwurf.modell, text, zitate: entwurf.zitate, bearbeitet: text !== entwurf.text };
}

export function createFragen({ store, pending, spool = null, publish, now = Date.now }) {
  return {
    offen: () => pending.open(),
    get: id => pending.get(id),

    /** Harte Treffer prüft der Aufrufer vorher; was hier ankommt, darf gespeichert werden */
    ask({ text, einwilligung, kapitel = null }) {
      const treffer = softHits(text);
      const senden = !!spool && einwilligung && !treffer.length;
      const { id, geheimnis } = pending.add({ text, zustimmung: ZUSTIMMUNG.version, einwilligung, treffer, zustand: senden ? 'entwurf' : 'wartet', kapitel });
      if (senden) spool.submit({ id, text });
      store.count('frage');
      if (einwilligung) store.count('frage_einwilligung');
      if (einwilligung && !senden) store.count('frage_zurueckgehalten');
      return { id, geheimnis, entwurf: senden, zurueckgehalten: einwilligung && !senden };
    },

    /** Widerruf: Auch ein Auftrag, den der Worker noch nicht gelesen hat, verschwindet */
    withdraw(id) {
      spool?.cancel(id);
      pending.remove(id);
      store.count('widerrufen');
    },

    /** Ohne brauchbaren Entwurf ist `antwort` die eigene Antwort der Moderation, dann braucht es auch keinen Auftrag mehr */
    async approve(id, { text, kapitel, antwort, status, kurztitel = null }) {
      const row = pending.get(id);
      const own = antwort && row.entwurf?.status !== 'ok';
      const answer = own ? { art: 'moderation', status: 'geprüft', modell: null, text: antwort, zitate: [] } : answerOf(row.entwurf, { text: antwort, status });
      /** ohne passenden Vektor stehen Nullen da, und der Worker rechnet ihn aus dem freigegebenen Text */
      const vektor = fits(row.entwurf, text, row.text) ? row.entwurf.vektor : undefined;
      store.addQuestion({ id, text, kapitel, tag: day(now), vektor, vektorAlt: !vektor, antwort: answer, kurztitel, lizenz: row.zustimmung >= CC0.ab ? CC0.kennung : null });
      pending.remove(id);
      store.count('freigegeben');
      if (own) store.count('moderationsantwort');
      await publish(id);
      /**
       * Jetzt ist der Text freigegeben, eine Einwilligung braucht es nicht mehr. Erst hier entsteht auch der Vorschlag für den Kurztitel
       * (D31), nie vor der Freigabe: Die Einwilligung gilt dem Entwurf. Läuft der Entwurf noch, bleibt es bei ihm.
       */
      if (!spool || spool.waiting(id)) return;
      if (!answer) spool.submit({ id, text, ...(kurztitel ? {} : { titel: true }) });
      /** Eine Frage, die noch nie bei Claude war und von dort keine Antwort braucht, geht auch für den Titel nicht hin; dafür gibt es den Knopf an der Frage */
      else if (!kurztitel && row.entwurf) spool.submit({ id, text, titel: true, nurTitel: true });
    },

    reject(id, grund) {
      spool?.cancel(id);
      pending.reject(id, grund);
      store.count('abgelehnt');
    },

    /** Nur was öffentlich steht, geht noch einmal zu Claude, der Text ist ja freigegeben. Das Ergebnis wartet als Vorschlag, öffentlich ändert sich nichts */
    again(id) {
      const question = store.question(id);
      if (!spool || question?.status !== 'sichtbar' || spool.waiting(id)) return false;
      store.requestProposal(id);
      spool.submit({ id, text: question.text, gruendlich: true });
      store.count('nochmal');
      return true;
    },

    /** Nur für eine öffentliche Frage und auf einen Klick der Moderation: Claude schlägt einen Kurztitel vor, er wartet als Vorschlag */
    suggest(id) {
      const question = store.question(id);
      if (!spool || question?.status !== 'sichtbar' || spool.waiting(id)) return false;
      spool.submit({ id, text: question.text, titel: true, nurTitel: true });
      store.count('titel_auftrag');
      return true;
    },

    /** Die Frage wird endgültig gelöscht: Ein Auftrag, den der Worker noch nicht gelesen hat, verschwindet; ein spätes Ergebnis findet in `collect` keinen Empfänger */
    drop: id => spool?.cancel(id),

    /** Ein Vorschlag ohne Text lässt sich nur verwerfen */
    adopt(id, status, rolle) {
      const entwurf = store.proposal(id)?.entwurf;
      if (entwurf?.status !== 'ok') return false;
      store.adoptProposal(id, entwurf, status, rolle);
      return true;
    },

    /** Ergebnisse des Worker abholen. Wer zwischendurch gelöscht wurde, hat keinen Empfänger mehr, das Ergebnis verfällt */
    async collect() {
      const neuGerechnet = [];
      for (const { file, entry } of spool?.results() ?? []) {
        const { id, titel, ...entwurf } = entry;
        /** Ein neu gerechneter Vektor gilt nur, wenn die Frage noch so dasteht wie beim Auftrag; sonst kommt gleich der nächste */
        if (entwurf.art === 'vektor') {
          const question = store.question(id);
          if (question && entwurf.von && fits(entwurf, question.text)) {
            store.freshVector(id, entwurf.vektor);
            neuGerechnet.push(id);
          }
          spool.drop(file);
          continue;
        }
        /** Der Checker läuft auch hier, und nur für eine Frage, die öffentlich steht: Ein Kurztitel entsteht nie vor der Freigabe */
        const vorschlag = kurztitelOf(titel);
        if (vorschlag && !hardHits(vorschlag).length && store.question(id)) store.suggestTitle(id, vorschlag);
        if (entwurf.art === 'titel') {
          spool.drop(file);
          continue;
        }
        store.count(`entwurf_${entwurf.status}`);
        if (entwurf.teilantwort) store.count('entwurf_teilantwort');
        if (pending.get(id)) pending.setDraft(id, entwurf);
        else if (store.proposal(id)) await propose(id, entwurf);
        else if (store.question(id)) await attach(id, entwurf);
        spool.drop(file);
      }
      /** ein Neustart des Servers leert /run; dann wartet die Frage eben auf die Moderation */
      for (const row of pending.open()) if (spool && row.zustand === 'entwurf' && !spool.waiting(row.id)) pending.setDraft(row.id, { status: 'fehler' });
      for (const id of store.runningProposals()) if (spool && !spool.waiting(id)) store.setProposal(id, { status: 'fehler' });
      /**
       * Bearbeitete Fragen bekommen ihren Vektor neu (D35). Der Worker rechnet ihn lokal, die Schlange ist nur das Vehikel; öffentlich ist
       * der Text ohnehin. Je Frage liegt höchstens ein Auftrag in der Schlange, ein laufender anderer geht vor.
       */
      if (neuGerechnet.length) await publish(...neuGerechnet);
      for (const { id, text } of spool ? store.staleVectors() : []) if (!spool.waiting(id)) spool.submit({ id, text, nurVektor: true });
    },

    sweep: () => pending.sweep(),
    nochmal: !!spool,
  };

  /** Der Checker läuft auch hier: Was er sperrt, kann niemand übernehmen */
  async function propose(id, { vektor, von, ...entwurf }) {
    if (fits({ vektor, von }, store.question(id).text)) store.freshVector(id, vektor);
    store.setProposal(id, entwurf.status === 'ok' && hardHits(entwurf.text).length ? { status: 'checker' } : entwurf);
    await publish(id);
  }

  /** nach der Freigabe erscheint die Antwort mit Badge `ungeprüft` (D10); der Checker läuft auch auf Bot-Ausgaben (Plan §8) */
  async function attach(id, entwurf) {
    if (fits(entwurf, store.question(id).text)) store.freshVector(id, entwurf.vektor);
    const answer = answerOf(entwurf);
    if (answer && !store.question(id).antworten.length && !hardHits(answer.text ?? '').length) store.addAnswer(id, answer);
    await publish(id);
  }
}
