/**
 * Der Weg einer Frage von außen (Plan §5, D20), ohne HTTP: annehmen, in die Schlange legen, Ergebnisse abholen, freigeben, ablehnen.
 * Nur hier entsteht ein Auftrag für den Worker, also hängt I1 an genau drei Stellen: `ask`, `approve` und `again`.
 */
import { hardHits, softHits } from './checker.js';

/** Die Version steht an jeder Frage; wer die Texte ändert, erhöht sie */
export const ZUSTIMMUNG = {
  version: 2,
  oeffentlich: 'Meine Frage wird nach Prüfung durch die Moderation dauerhaft öffentlich sichtbar. Danach verarbeitet ein Sprachmodell von Anthropic (USA) sie, um eine Antwort zu erzeugen. Ich gebe keine Namen, Matrikelnummern oder anderen personenbezogenen Daten ein.',
  entwurf: 'Ich willige ein, dass meine Frage schon vor der Prüfung an Anthropic (USA) geht, damit ich sofort einen Entwurf bekomme. Frage und Entwurf sehen bis zur Entscheidung außer mir nur die Moderation. Ohne Einwilligung bekomme ich die Antwort nach der Freigabe. Ich kann die Einwilligung widerrufen, indem ich die Frage unter „Meine Fragen“ lösche; was schon gesendet ist, bleibt davon unberührt.',
};

export const GRUENDE = {
  uebung: 'Das Forum behandelt nur Skriptinhalte, keine Übungsaufgaben und nichts Organisatorisches.',
  person: 'Die Frage enthält personenbezogene Angaben.',
  doppelt: 'Diese Frage gibt es schon im Forum.',
  sonst: 'Die Frage passt nicht ins Forum.',
};

export const MIN_FRAGE = 10;
export const MAX_FRAGE = 1500;
export const MAX_OFFEN = 100;

const day = now => new Date(now()).toISOString().slice(0, 10);

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
    ask({ text, einwilligung }) {
      const treffer = softHits(text);
      const senden = !!spool && einwilligung && !treffer.length;
      const { id, geheimnis } = pending.add({ text, zustimmung: ZUSTIMMUNG.version, einwilligung, treffer, zustand: senden ? 'entwurf' : 'wartet' });
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
    async approve(id, { text, kapitel, antwort, status }) {
      const row = pending.get(id);
      const own = antwort && row.entwurf?.status !== 'ok';
      const answer = own ? { art: 'moderation', status: 'geprüft', modell: null, text: antwort, zitate: [] } : answerOf(row.entwurf, { text: antwort, status });
      store.addQuestion({ id, text, kapitel, tag: day(now), vektor: row.entwurf?.vektor, antwort: answer });
      pending.remove(id);
      store.count('freigegeben');
      if (own) store.count('moderationsantwort');
      await publish(id);
      /** jetzt ist der Text freigegeben, eine Einwilligung braucht es nicht mehr */
      if (!answer && !spool?.waiting(id)) spool?.submit({ id, text });
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
      for (const { file, entry } of spool?.results() ?? []) {
        const { id, ...entwurf } = entry;
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
    },

    sweep: () => pending.sweep(),
    nochmal: !!spool,
  };

  /** Der Checker läuft auch hier: Was er sperrt, kann niemand übernehmen */
  async function propose(id, { vektor, ...entwurf }) {
    if (vektor) store.setVector(id, vektor);
    store.setProposal(id, entwurf.status === 'ok' && hardHits(entwurf.text).length ? { status: 'checker' } : entwurf);
    await publish(id);
  }

  /** nach der Freigabe erscheint die Antwort mit Badge `ungeprüft` (D10); der Checker läuft auch auf Bot-Ausgaben (Plan §8) */
  async function attach(id, entwurf) {
    if (entwurf.vektor) store.setVector(id, entwurf.vektor);
    const answer = answerOf(entwurf);
    if (answer && !store.question(id).antworten.length && !hardHits(answer.text ?? '').length) store.addAnswer(id, answer);
    await publish(id);
  }
}
