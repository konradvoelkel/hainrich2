/**
 * Der Weg einer Frage von außen (Plan §5, D20), ohne HTTP: annehmen, in die Schlange legen, Ergebnisse abholen, freigeben, ablehnen.
 * Nur hier entsteht ein Auftrag für den Worker, also hängt I1 an genau zwei Stellen: `ask` und `approve`.
 */
import { hardHits, softHits } from './checker.js';

/** Die Version steht an jeder Frage; wer die Texte ändert, erhöht sie */
export const ZUSTIMMUNG = {
  version: 1,
  oeffentlich: 'Meine Frage wird nach Prüfung durch die Moderation dauerhaft öffentlich sichtbar. Danach verarbeitet ein Sprachmodell von Anthropic (USA) sie, um eine Antwort zu erzeugen. Ich gebe keine Namen, Matrikelnummern oder anderen personenbezogenen Daten ein.',
  entwurf: 'Ich willige ein, dass meine Frage schon vor der Prüfung an Anthropic (USA) geht, damit ich sofort einen Entwurf bekomme. Frage und Entwurf sehe bis zur Entscheidung der Moderation nur ich. Ohne Einwilligung bekomme ich die Antwort nach der Freigabe. Ich kann die Einwilligung widerrufen, indem ich die Frage unter „Meine Fragen“ lösche; was schon gesendet ist, bleibt davon unberührt.',
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
      return { id, geheimnis, entwurf: senden, zurueckgehalten: einwilligung && !senden };
    },

    /** Widerruf: Auch ein Auftrag, den der Worker noch nicht gelesen hat, verschwindet */
    withdraw(id) {
      spool?.cancel(id);
      pending.remove(id);
    },

    async approve(id, { text, kapitel, antwort, status }) {
      const row = pending.get(id);
      const answer = answerOf(row.entwurf, { text: antwort, status });
      store.addQuestion({ id, text, kapitel, tag: day(now), vektor: row.entwurf?.vektor, antwort: answer });
      pending.remove(id);
      await publish(id);
      /** jetzt ist der Text freigegeben, eine Einwilligung braucht es nicht mehr */
      if (!answer && !spool?.waiting(id)) spool?.submit({ id, text });
    },

    reject(id, grund) {
      spool?.cancel(id);
      pending.reject(id, grund);
    },

    /** Ergebnisse des Worker abholen. Wer zwischendurch gelöscht wurde, hat keinen Empfänger mehr, das Ergebnis verfällt */
    async collect() {
      for (const { file, entry } of spool?.results() ?? []) {
        const { id, ...entwurf } = entry;
        if (pending.get(id)) pending.setDraft(id, entwurf);
        else if (store.question(id)) await attach(id, entwurf);
        spool.drop(file);
      }
      /** ein Neustart des Servers leert /run; dann wartet die Frage eben auf die Moderation */
      for (const row of pending.open()) if (spool && row.zustand === 'entwurf' && !spool.waiting(row.id)) pending.setDraft(row.id, { status: 'fehler' });
    },

    sweep: () => pending.sweep(),
  };

  /** nach der Freigabe erscheint die Antwort mit Badge `ungeprüft` (D10); der Checker läuft auch auf Bot-Ausgaben (Plan §8) */
  async function attach(id, entwurf) {
    if (entwurf.vektor) store.setVector(id, entwurf.vektor);
    const answer = answerOf(entwurf);
    if (answer && !store.question(id).antworten.length && !hardHits(answer.text ?? '').length) store.addAnswer(id, answer);
    await publish(id);
  }
}
