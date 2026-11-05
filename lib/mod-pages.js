/** Die Seiten unter /mod/: reine Formulare, auch am Telefon und ohne JavaScript bedienbar (Plan §9). Das eine Skript sind die Cursortasten. */
import { UNTERFOREN } from './forum.js';
import { GRUENDE } from './fragen.js';
import { esc } from './site.js';

function page({ base, title, user, body, keys = false }) {
  const logout = user ? `<form method="post" action="${base}mod/abmelden"><button>Abmelden</button></form>` : '';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | Moderation</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${base}style.css">
${keys ? `<script src="${base}mod/tasten.js" defer></script>\n` : ''}</head>
<body class="mod">
<header class="kopf"><a class="marke" href="${base}mod/">Moderation</a><span>${user ? `${esc(user.name)}, ${esc(user.rolle)}` : 'hAInrich2'}</span>${logout}</header>
<main>
${body}
</main>
</body>
</html>
`;
}

export function loginPage(base, fehler = '') {
  return page({
    base,
    title: 'Anmelden',
    body: `<h1>Anmelden</h1>
${fehler ? `<p class="fehler" role="alert">${esc(fehler)}</p>` : ''}
<form method="post" action="${base}mod/anmelden" class="formular">
<label for="name">Name</label>
<input id="name" name="name" autocomplete="username" required>
<label for="passphrase">Passphrase</label>
<input id="passphrase" name="passphrase" type="password" autocomplete="current-password" required>
<button class="haupt">Anmelden</button>
</form>`,
  });
}

const answerStatus = q => q.antworten[0]?.status ?? 'ohne Antwort';
const badge = status => `<span class="badge ${status === 'geprüft' ? 'gut' : 'offen'}">${esc(status.replace('_', ' '))}</span>`;

/** Antwortfeld, wenn von Claude nichts Brauchbares da ist: Die Moderation schreibt selbst, das Feld darf leer bleiben */
const ownAnswer = (text, note) => `<label for="antwort">Eigene Antwort der Moderation</label>
<textarea id="antwort" name="antwort" rows="10">${esc(text ?? '')}</textarea>
<p class="meta">${esc(note)} Sie erscheint als Antwort der Moderation, ohne Zitat und gleich als geprüft. Markdown, Formeln mit $.</p>`;

function group(title, questions, base) {
  if (!questions.length) return '';
  const rows = questions.map(q => `<li><a href="${base}mod/f/${esc(q.id)}/">${esc(q.text)}</a><p class="meta">${esc(q.id)} · ${esc(q.kapitel)}${q.antworten[0]?.bearbeitet ? ' · bearbeitet' : ''}${q.punkte ? ` · ${q.punkte > 0 ? '+' : ''}${q.punkte} Punkte` : ''}</p></li>`).join('\n');
  return `<section><h2>${esc(title)} (${questions.length})</h2><ul class="fragen">\n${rows}\n</ul></section>`;
}

function pendingGroup(rows, base) {
  if (!rows.length) return '';
  const state = row => (row.zustand === 'entwurf' ? 'Entwurf läuft' : row.entwurf?.status === 'ok' ? 'mit Entwurf' : 'ohne Entwurf');
  const items = rows.map(row => `<li><a href="${base}mod/neu/${esc(row.id)}/">${esc(row.text)}</a><p class="meta">${esc(row.tag)} · ${state(row)}${row.treffer.length ? ` · ${esc(row.treffer.join(', '))}` : ''}</p></li>`).join('\n');
  return `<section><h2>Neue Fragen (${rows.length})</h2><ul class="fragen">\n${items}\n</ul></section>`;
}

export function overviewPage(questions, user, base, neue = [], meldung = '') {
  const shown = questions.filter(q => q.status === 'sichtbar');
  return page({
    base,
    user,
    title: 'Übersicht',
    body: `<h1>Fragen und Antworten</h1>
${user.rolle === 'admin' ? `<p class="pfad"><a href="${base}mod/zahlen/">Zahlen</a></p>` : ''}
${meldung ? `<p class="gemeldet" role="status">${esc(meldung)}</p>` : ''}
${pendingGroup(neue, base)}
${group('Ungeprüft', shown.filter(q => !['geprüft', 'kein_beleg'].includes(answerStatus(q))), base)}
${group('Kein Beleg', shown.filter(q => answerStatus(q) === 'kein_beleg'), base)}
${group('Geprüft', shown.filter(q => answerStatus(q) === 'geprüft'), base)}
${group('Zurückgezogen', questions.filter(q => q.status !== 'sichtbar'), base)}`,
  });
}

function history(revisions) {
  if (!revisions.length) return '';
  const rows = revisions.map(r => `<li><details><summary>${esc(r.zeit.slice(0, 16).replace('T', ' '))} UTC · ${esc(r.feld)} · ${esc(r.rolle)}</summary>
<p class="meta">Vorher</p><pre>${esc(r.vorher ?? '')}</pre><p class="meta">Nachher</p><pre>${esc(r.nachher ?? '')}</pre></details></li>`).join('\n');
  return `<section><h2>Verlauf</h2><ul class="verlauf">\n${rows}\n</ul></section>`;
}

function stepper({ prev, next, index, total }, base) {
  const step = (id, rel, text, key) => (id ? `<a class="knopf" rel="${rel}" href="${base}mod/f/${esc(id)}/" aria-keyshortcuts="${key}" title="Taste ${text.includes('→') ? '→' : '←'}">${text}</a>` : '<span></span>');
  return `<nav class="blaettern" aria-label="Fragen durchblättern">${step(prev, 'prev', '← Zurück', 'ArrowLeft')}<span class="meta">${index + 1} von ${total}</span>${step(next, 'next', 'Weiter →', 'ArrowRight')}</nav>`;
}

const quotesOf = zitate => zitate.map((z, i) => `<li><details><summary>[${i + 1}] ${esc(z.titel)}</summary><pre>${esc(z.text)}</pre><p><a href="${esc(z.url)}" rel="noopener">Im Skript ansehen</a></p></details></li>`).join('\n');

export function editPage({ question, revisions, user, base, nav, fehler = [], meldung = '', frage = question.text, antwort }) {
  const answer = question.antworten[0];
  const text = antwort ?? answer?.text ?? '';
  const withdrawn = question.status !== 'sichtbar';
  const editable = answer && answer.status !== 'kein_beleg';
  const quotes = quotesOf(answer?.zitate ?? []);
  return page({
    base,
    user,
    title: question.id,
    keys: true,
    body: `<p class="pfad"><a href="${base}mod/">Alle Fragen</a>${withdrawn ? '' : ` · <a href="${base}f/${esc(question.id)}/">Öffentliche Seite</a>`}</p>
${stepper(nav, base)}
<h1>${esc(question.id)} ${badge(withdrawn ? 'zurückgezogen' : answerStatus(question))}</h1>
<p class="meta">${esc(question.kapitel)}${answer?.modell ? ` · ${esc(answer.modell)}` : ''}</p>
${meldung ? `<p class="gemeldet" role="status">${esc(meldung)}</p>` : ''}
${fehler.map(f => `<p class="fehler" role="alert">${esc(f)}</p>`).join('\n')}
<form method="post" class="formular">
<label for="frage">Frage</label>
<textarea id="frage" name="frage" rows="3" required>${esc(frage)}</textarea>
${editable ? `<label for="antwort">Antwort</label>
<textarea id="antwort" name="antwort" rows="14" required>${esc(text)}</textarea>
<p class="meta">Markdown, Formeln mit $. Verweise wie [1] zeigen auf die Zitate unten.</p>` : ownAnswer(antwort, answer ? 'Claude fand dazu im Skript nichts. Bleibt das Feld leer, steht öffentlich „nichts gefunden“.' : 'Noch gibt es keine Antwort.')}
<div class="knoepfe">
<button name="aktion" value="speichern">Speichern</button>
${editable && answer.status !== 'geprüft' ? '<button name="aktion" value="pruefen" class="haupt">Speichern und als geprüft markieren</button>' : ''}
${answer?.status === 'geprüft' && answer.art !== 'moderation' ? '<button name="aktion" value="zuruecksetzen">Zurück auf ungeprüft</button>' : ''}
<button name="aktion" value="${withdrawn ? 'wiederherstellen' : 'zurueckziehen'}" formnovalidate>${withdrawn ? 'Wieder anzeigen' : 'Zurückziehen'}</button>
</div>
</form>
${quotes ? `<section><h2>Zitate</h2><p class="meta">Der Originaltext kommt aus dem Skript und lässt sich hier nicht ändern.</p><ol class="zitatliste">\n${quotes}\n</ol></section>` : ''}
${history(revisions)}`,
  });
}

const ENTWURF_FEHLT = {
  kein_beleg: 'Claude fand dazu im Skript nichts. Ohne eigene Antwort erscheint die Frage mit „nichts gefunden“.',
  deckel: 'Der Kostendeckel des Worker war erreicht. Nach der Freigabe versucht er es noch einmal.',
  verweigert: 'Das Modell hat abgelehnt. Nach der Freigabe versucht der Worker es noch einmal.',
};

/** Eine neue Frage entscheiden. Der Text steht noch in `pending.db`, nichts davon ist öffentlich */
export function pendingPage({ row, user, base, fehler = [], frage = row.text, antwort, kapitel }) {
  const draft = row.entwurf?.status === 'ok' ? row.entwurf : null;
  const chosen = kapitel ?? row.entwurf?.kapitel;
  const options = UNTERFOREN.map(forum => `<optgroup label="${esc(forum.titel)}">${forum.kapitel.map(k => `<option${k === chosen ? ' selected' : ''}>${esc(k)}</option>`).join('')}</optgroup>`).join('\n');
  const note = row.zustand === 'entwurf' ? 'Der Entwurf läuft noch.'
    : row.entwurf && !draft ? ENTWURF_FEHLT[row.entwurf.status] ?? 'Ein Entwurf kam nicht zustande. Nach der Freigabe versucht der Worker es noch einmal.'
      : row.einwilligung ? '' : 'Ohne Einwilligung, die Frage war noch nicht bei Claude. Die Antwort entsteht nach der Freigabe.';
  return page({
    base,
    user,
    title: 'Neue Frage',
    body: `<p class="pfad"><a href="${base}mod/">Alle Fragen</a></p>
<h1>Neue Frage <span class="badge offen">nicht öffentlich</span></h1>
<p class="meta">${esc(row.tag)}${draft ? ` · ${esc(draft.modell)}` : ''}</p>
${note ? `<p class="meta">${esc(note)}</p>` : ''}
${fehler.map(f => `<p class="fehler" role="alert">${esc(f)}</p>`).join('\n')}
<form method="post" class="formular">
<label for="frage">Frage</label>
<textarea id="frage" name="frage" rows="4" required>${esc(frage)}</textarea>
<label for="kapitel">Kapitel</label>
<select id="kapitel" name="kapitel" required><option value="">Bitte wählen</option>
${options}
</select>
${draft ? `<label for="antwort">Antwort</label>
<textarea id="antwort" name="antwort" rows="14" required>${esc(antwort ?? draft.text)}</textarea>
<p class="meta">Markdown, Formeln mit $. Verweise wie [1] zeigen auf die Zitate unten.</p>` : ownAnswer(antwort, row.entwurf?.status === 'kein_beleg' ? 'Das Feld darf leer bleiben.' : 'Bleibt das Feld leer, schreibt Claude nach der Freigabe.')}
${row.treffer.length ? `<p class="fehler">Der Checker schlägt an: ${esc(row.treffer.join(', '))}. Personenbezogenes gehört vor der Freigabe aus dem Text.</p>
<label class="haken"><input type="checkbox" name="gesehen" value="1"><span>Gelesen, der Text enthält nichts Personenbezogenes mehr.</span></label>` : ''}
<div class="knoepfe">
<button name="aktion" value="freigeben"${draft ? '' : ' class="haupt"'}>Freigeben</button>
${draft ? '<button name="aktion" value="pruefen" class="haupt">Freigeben und als geprüft markieren</button>' : ''}
</div>
<label for="grund">Grund einer Ablehnung, die fragende Person sieht ihn sieben Tage</label>
<select id="grund" name="grund">${Object.entries(GRUENDE).map(([key, text]) => `<option value="${key}">${esc(text)}</option>`).join('')}</select>
<div class="knoepfe"><button name="aktion" value="ablehnen" formnovalidate>Ablehnen und Text löschen</button></div>
</form>
${draft ? `<section><h2>Zitate</h2><p class="meta">Der Originaltext kommt aus dem Skript und lässt sich hier nicht ändern.</p><ol class="zitatliste">\n${quotesOf(draft.zitate)}\n</ol></section>` : ''}`,
  });
}

const number = n => n.toLocaleString('de-DE');
const dollars = n => `${n.toFixed(2).replace('.', ',')} $`;

function table(head, rows) {
  return `<div class="breit"><table class="zahlen"><thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
<tbody>
${rows.map(row => `<tr>${row.map((cell, i) => (i ? `<td>${esc(cell)}</td>` : `<th scope="row">${esc(cell)}</th>`)).join('')}</tr>`).join('\n')}
</tbody></table></div>`;
}

const pairs = rows => table(['', 'Anzahl'], rows.map(([name, n]) => [name, number(n)]));

const ENTWURF = { ok: 'Antwort mit Zitat', teilantwort: 'davon Teilantwort', kein_beleg: 'Kein Beleg', verweigert: 'Modell lehnte ab', ohne_zitat: 'Ohne Zitat', abgeschnitten: 'Abgeschnitten', fehler: 'Fehler', deckel: 'Deckel erreicht' };

function gauge(label, value, max, text) {
  return `<p class="deckel"><label>${esc(label)}: ${esc(text)}<progress value="${Math.min(value, max)}" max="${max}">${esc(text)}</progress></label></p>`;
}

/** Nur Summen, nichts davon führt zu einer Person. Öffentlich ist das nicht, aber es gäbe auch nichts zu schützen außer den Kosten */
export function statsPage({ zahlen, fehler, user, base }) {
  const { deckel, forum, fragen } = zahlen;
  const best = forum.beste.map(q => `<li><a href="${base}mod/f/${esc(q.id)}/">${esc(q.text)}</a><p class="meta">${q.punkte} Punkte</p></li>`).join('\n');
  return page({
    base,
    user,
    title: 'Zahlen',
    body: `<p class="pfad"><a href="${base}mod/">Alle Fragen</a></p>
<h1>Zahlen</h1>
<p class="meta">Tage in UTC. Das ist die Sicht dieser App: Sie kennt nur, was der Server ausgegeben hat. Die Rechnung steht in der Console von Anthropic. Seitenaufrufe zählt hier nichts.</p>
${fehler ? `<p class="fehler" role="alert">${esc(fehler)}</p>` : ''}
<section><h2>Claude</h2>
${gauge('Anfragen heute', deckel.tag.wert, deckel.tag.max, `${deckel.tag.wert} von ${deckel.tag.max}`)}
${gauge('Kosten diesen Monat', deckel.monat.wert, deckel.monat.max, `${dollars(deckel.monat.wert)} von ${dollars(deckel.monat.max)}`)}
${table(['Zeitraum', 'Anfragen', 'Tokens rein', 'Tokens raus', 'Kosten', 'je Anfrage'], zahlen.zeitraeume.map(z => [z.name, number(z.anfragen), number(z.rein), number(z.raus), dollars(z.dollar), z.anfragen ? dollars(z.dollar / z.anfragen) : '–']))}
${zahlen.modelle.length ? `<h3>Modelle diesen Monat</h3>\n${table(['Modell', 'Anfragen', 'Kosten'], zahlen.modelle.map(m => [m.modell, number(m.anfragen), dollars(m.dollar)]))}` : ''}
<h3>Ergebnisse diesen Monat</h3>
${pairs(zahlen.entwuerfe.map(([art, n]) => [ENTWURF[art], n]))}
</section>
<section><h2>Forum heute</h2>
${pairs([['Sichtbare Fragen', forum.sichtbar], ['davon Beispielfragen', forum.beispiele], ['davon von außen', forum.vonAussen], ['Antwort geprüft', forum.geprueft], ['Antwort ungeprüft', forum.ungeprueft], ['Kein Beleg', forum.keinBeleg], ['Ohne Antwort', forum.ohneAntwort], ['Antwort der Moderation', forum.vonModeration], ['Warten auf Moderation', forum.offen], ['Abgegebene Stimmen', forum.stimmen], ['Summe der Punkte', forum.summe]])}
${best ? `<h3>Beste Fragen</h3>\n<ul class="fragen">\n${best}\n</ul>` : ''}
</section>
<section><h2>Fragen diesen Monat</h2>
${pairs([['Eingereicht', fragen.eingereicht], ['mit Einwilligung', fragen.einwilligung], ['vom Checker zurückgehalten', fragen.zurueckgehalten], ['vom Checker gesperrt', fragen.gesperrt], ['Freigegeben', fragen.freigegeben], ['Abgelehnt', fragen.abgelehnt], ['Selbst gelöscht', fragen.widerrufen], ['Antworten der Moderation', fragen.moderationsantworten], ['Ausgegebene Tokens', fragen.tokens], ['Falsche Kurscodes', fragen.falscheCodes], ['Gebremste Anfragen', fragen.gebremst]])}
</section>
${zahlen.verlauf.length ? `<section><h2>Letzte 14 Tage</h2>
${table(['Tag', 'Fragen', 'Freigaben', 'Stimmen', 'Anfragen', 'Kosten'], zahlen.verlauf.map(d => [d.tag, number(d.fragen), number(d.freigegeben), number(d.stimmen), number(d.anfragen), dollars(d.dollar)]))}
</section>` : ''}`,
  });
}

export const errorPage = (base, status, text) => page({ base, title: String(status), body: `<h1>${status}</h1><p>${esc(text)}</p><p><a href="${base}mod/">Zur Übersicht</a></p>` });
