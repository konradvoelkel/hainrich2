/** Die Seiten unter /mod/: reine Formulare ohne JavaScript, auch am Telefon bedienbar (Plan §9). */
import { esc } from './site.js';

function page({ base, title, user, body }) {
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
</head>
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
const badge = status => `<span class="badge ${status === 'geprüft' ? 'gut' : 'offen'}">${esc(status)}</span>`;

function group(title, questions, base) {
  if (!questions.length) return '';
  const rows = questions.map(q => `<li><a href="${base}mod/f/${esc(q.id)}/">${esc(q.text)}</a><p class="meta">${esc(q.id)} · ${esc(q.kapitel)}${q.antworten[0]?.bearbeitet ? ' · bearbeitet' : ''}</p></li>`).join('\n');
  return `<section><h2>${esc(title)} (${questions.length})</h2><ul class="fragen">\n${rows}\n</ul></section>`;
}

export function overviewPage(questions, user, base) {
  const shown = questions.filter(q => q.status === 'sichtbar');
  return page({
    base,
    user,
    title: 'Übersicht',
    body: `<h1>Fragen und Antworten</h1>
${group('Ungeprüft', shown.filter(q => answerStatus(q) !== 'geprüft'), base)}
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

export function editPage({ question, revisions, user, base, fehler = [], meldung = '', frage = question.text, antwort }) {
  const answer = question.antworten[0];
  const text = antwort ?? answer?.text ?? '';
  const withdrawn = question.status !== 'sichtbar';
  const editable = answer && answer.status !== 'kein_beleg';
  const quotes = answer?.zitate.map((z, i) => `<li><details><summary>[${i + 1}] ${esc(z.titel)}</summary><pre>${esc(z.text)}</pre><p><a href="${esc(z.url)}" rel="noopener">Im Skript ansehen</a></p></details></li>`).join('\n') ?? '';
  return page({
    base,
    user,
    title: question.id,
    body: `<p class="pfad"><a href="${base}mod/">Alle Fragen</a>${withdrawn ? '' : ` · <a href="${base}f/${esc(question.id)}/">Öffentliche Seite</a>`}</p>
<h1>${esc(question.id)} ${badge(withdrawn ? 'zurückgezogen' : answerStatus(question))}</h1>
<p class="meta">${esc(question.kapitel)}${answer?.modell ? ` · ${esc(answer.modell)}` : ''}</p>
${meldung ? `<p class="gemeldet" role="status">${esc(meldung)}</p>` : ''}
${fehler.map(f => `<p class="fehler" role="alert">${esc(f)}</p>`).join('\n')}
<form method="post" class="formular">
<label for="frage">Frage</label>
<textarea id="frage" name="frage" rows="3" required>${esc(frage)}</textarea>
${editable ? `<label for="antwort">Antwort</label>
<textarea id="antwort" name="antwort" rows="14" required>${esc(text)}</textarea>
<p class="meta">Markdown, Formeln mit $. Verweise wie [1] zeigen auf die Zitate unten.</p>` : '<p class="meta">Zu dieser Frage gibt es keine Antwort mit Beleg.</p>'}
<div class="knoepfe">
<button name="aktion" value="speichern">Speichern</button>
${editable && answer.status !== 'geprüft' ? '<button name="aktion" value="pruefen" class="haupt">Speichern und als geprüft markieren</button>' : ''}
${answer?.status === 'geprüft' ? '<button name="aktion" value="zuruecksetzen">Zurück auf ungeprüft</button>' : ''}
<button name="aktion" value="${withdrawn ? 'wiederherstellen' : 'zurueckziehen'}" formnovalidate>${withdrawn ? 'Wieder anzeigen' : 'Zurückziehen'}</button>
</div>
</form>
${quotes ? `<section><h2>Zitate</h2><p class="meta">Der Originaltext kommt aus dem Skript und lässt sich hier nicht ändern.</p><ol class="zitatliste">\n${quotes}\n</ol></section>` : ''}
${history(revisions)}`,
  });
}

export const errorPage = (base, status, text) => page({ base, title: String(status), body: `<h1>${status}</h1><p>${esc(text)}</p><p><a href="${base}mod/">Zur Übersicht</a></p>` });
