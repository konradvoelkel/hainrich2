# Sicherheitshinweise melden

## Unterstützte Versionen

Es gibt genau einen unterstützten Stand: den, der auf
[hai.konradvoelkel.com/eidl/](https://hai.konradvoelkel.com/eidl/) läuft, und damit den aktuellen
`main`-Branch. Ältere Stände werden nicht zurückgepflegt.

## Melden

Bitte **keine** öffentlichen Issues für Sicherheitslücken. Stattdessen eine E-Mail an die
Kontaktadresse im [Impressum](https://hai.konradvoelkel.com/eidl/impressum/). Eine Antwort folgt in
der Regel innerhalb weniger Tage.

Was dazuzählt: alles, womit Text ohne Freigabe und ohne Einwilligung die Claude API erreicht, womit
sich die Moderation umgehen oder übernehmen lässt, womit fremde Fragen oder Entwürfe lesbar werden,
und Schwächen in der ausgelieferten Seite (XSS, CSP), im Fragepfad unter `lib/api.js` oder in der
Trennung von Web-Prozess und Worker.

Was nicht dazuzählt:

- Der Kurscode ist für alle Studierenden eines Kurses derselbe. Wer ihn kennt, kann fragen; das ist
  so gewollt. Die Grenzen je Adresse und Token bremsen, sie verhindern keinen Missbrauch mit vielen
  Adressen.
- Stimmen lassen sich nicht prüfen. Wer die Browserdaten löscht, stimmt noch einmal.
- Fachliche Fehler in Antworten des Bots: Die bitte über die Kontaktadresse melden, die Moderation
  korrigiert sie.
- Fehler im Skript selbst gehören zum Skript, nicht hierher.
