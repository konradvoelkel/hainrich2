/**
 * Die Zahlen für die Admin-Seite (Plan §9). Die Kosten stehen im Kostenbuch des Worker, das der Web-Prozess nur liest. Was sonst passiert,
 * zählen Tageszähler ohne Bezug zu einer Person, und nur, was jemand absichtlich tut: Seitenaufrufe zählt hier nichts (I10).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DOLLARS_PER_MONTH, REQUESTS_PER_DAY } from './draft.js';

const DAY = 86_400_000;
const WEEK_DAYS = 7;
const HISTORY_DAYS = 14;
const TOP = 5;

const isoDay = ms => new Date(ms).toISOString().slice(0, 10);

/** alle Monate des Kostenbuchs; ein Fehler beim Lesen soll die Seite nicht kosten, die übrigen Zahlen stimmen ja */
export function readCosts(dir) {
  if (!dir) return { entries: [], fehler: 'Das Kostenbuch ist hier nicht eingebunden.' };
  try {
    const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^kosten-\d{4}-\d{2}\.json$/.test(f)) : [];
    const entries = files.flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
    return { entries: entries.map(e => ({ tag: e.label, modell: e.model, rein: e.input, raus: e.output, dollar: e.dollars, offen: !!e.offen })), fehler: null };
  } catch (error) {
    console.error('Kostenbuch:', error.message);
    return { entries: [], fehler: 'Das Kostenbuch ließ sich nicht lesen.' };
  }
}

const total = entries => entries.reduce((sum, e) => ({ anfragen: sum.anfragen + 1, rein: sum.rein + e.rein, raus: sum.raus + e.raus, dollar: sum.dollar + e.dollar }), { anfragen: 0, rein: 0, raus: 0, dollar: 0 });

function byModel(entries) {
  const models = [...new Set(entries.map(e => e.modell))].sort();
  return models.map(modell => ({ modell, ...total(entries.filter(e => e.modell === modell)) }));
}

const answerState = q => q.antworten[0]?.status ?? 'ohne Antwort';

function forum(questions, offen, stimmen) {
  const state = name => questions.filter(q => answerState(q) === name).length;
  return {
    sichtbar: questions.length,
    beispiele: questions.filter(q => q.herkunft === 'beispiel').length,
    vonAussen: questions.filter(q => q.herkunft !== 'beispiel').length,
    geprueft: state('geprüft'),
    ungeprueft: state('ungeprüft'),
    keinBeleg: state('kein_beleg'),
    ohneAntwort: state('ohne Antwort'),
    vonModeration: questions.filter(q => q.antworten[0]?.art === 'moderation').length,
    offen: offen.length,
    stimmen: stimmen.anzahl,
    summe: stimmen.summe,
    beste: [...questions].filter(q => q.punkte > 0).sort((a, b) => b.punkte - a.punkte).slice(0, TOP).map(q => ({ id: q.id, text: q.text, punkte: q.punkte })),
  };
}

export function figures({ entries, counters, questions, offen, stimmen, today }) {
  const from = days => isoDay(Date.parse(today) - (days - 1) * DAY);
  const month = today.slice(0, 7);
  const thisMonth = entries.filter(e => e.tag.startsWith(month));
  const inMonth = art => counters.filter(c => c.art === art && c.tag.startsWith(month)).reduce((sum, c) => sum + c.anzahl, 0);
  const onDay = (art, tag) => counters.find(c => c.art === art && c.tag === tag)?.anzahl ?? 0;
  const days = Array.from({ length: HISTORY_DAYS }, (_, i) => from(i + 1));
  return {
    today,
    zeitraeume: [
      ['Heute', entries.filter(e => e.tag === today)],
      [`${WEEK_DAYS} Tage`, entries.filter(e => e.tag >= from(WEEK_DAYS))],
      ['Dieser Monat', thisMonth],
      ['Insgesamt', entries],
    ].map(([name, part]) => ({ name, ...total(part) })),
    modelle: byModel(thisMonth),
    /** Anfragen ohne Antwort: Im Buch steht der schlimmste Fall, was sie wirklich gekostet haben, weiß nur die Console */
    ohneAntwort: total(thisMonth.filter(e => e.offen)),
    deckel: {
      tag: { wert: entries.filter(e => e.tag === today).length, max: REQUESTS_PER_DAY },
      monat: { wert: total(thisMonth).dollar, max: DOLLARS_PER_MONTH },
    },
    entwuerfe: ['ok', 'teilantwort', 'kein_beleg', 'verweigert', 'ohne_zitat', 'abgeschnitten', 'fehler', 'deckel'].map(art => [art, inMonth(`entwurf_${art}`)]),
    fragen: {
      eingereicht: inMonth('frage'),
      einwilligung: inMonth('frage_einwilligung'),
      zurueckgehalten: inMonth('frage_zurueckgehalten'),
      gesperrt: inMonth('checker_sperre'),
      freigegeben: inMonth('freigegeben'),
      abgelehnt: inMonth('abgelehnt'),
      widerrufen: inMonth('widerrufen'),
      geloescht: inMonth('geloescht'),
      moderationsantworten: inMonth('moderationsantwort'),
      tokens: inMonth('token'),
      falscheCodes: inMonth('code_falsch'),
      gebremst: inMonth('gebremst'),
    },
    forum: forum(questions, offen, stimmen),
    verlauf: days.map(tag => {
      const part = total(entries.filter(e => e.tag === tag));
      return { tag, fragen: onDay('frage', tag), freigegeben: onDay('freigegeben', tag), stimmen: onDay('stimme', tag), anfragen: part.anfragen, dollar: part.dollar };
    }).filter(d => d.fragen || d.freigegeben || d.stimmen || d.anfragen),
  };
}
