# SEO-Audit von hai.konradvoelkel.com/eidl/

_Stand 2026-11-06, gemessen am ausgespielten Stand `2d085af`. Skripte: `crawl.py` (41 Seiten, Metadaten, Links), `perf.mjs`
(Ladezeiten, erste Suche, Bildschirmfotos)._

**Ergebnis:** Die Site ist heute für Suchmaschinen unsichtbar, und das ist gewollt: `noindex` auf allen 41 Seiten, leere Sitemap.
Für das Ende der Vorschau ist sie technisch gut vorbereitet. Schwach sind Titel, Beschreibungen und strukturierte Daten.
Die Startbereitschaft lag bei **68 von 100**. Das ist eine Einschätzung, keine Messung. Die Befunde 3, 4, 5, 7 (ohne `QAPage`), 8 und 9 sind seit dem
2026-11-06 live. Damit steigt die Summe auf rund 77: „Auf der Seite“ 80, „Strukturierte Daten“ 50, „Bilder“ 95.

**Grenzen:** Keine Daten von Google, keine Rankings, kein Suchvolumen, keine Backlinks, keine Felddaten zu Core Web Vitals. Search
Console ist nicht eingerichtet und kann ohne Indexierung wenig liefern. Die PageSpeed-API von Google habe ich nicht benutzt,
damit der unverlinkte Name nicht in einen weiteren Dienst geht. Die Ladezeiten stammen aus je einem Lauf in Chromium, nicht
von einem echten Telefon. `public.db` auf dem Server habe ich nicht gelesen, der Zugriff wurde abgelehnt.

## Punkte je Bereich

| Bereich | Gewicht | Punkte | Grund |
|---|---:|---:|---|
| Technik | 22 % | 85 | Sauber crawlbar, starke Kopfzeilen. Es fehlen eine 404-Seite und ein Schalter für das Ende der Vorschau. |
| Inhalt | 23 % | 75 | Lange, geprüfte Antworten mit wörtlichem Zitat. Dagegen stehen Platzhalter-Antworten und eine dünne Startseite. |
| Auf der Seite | 20 % | 55 | Titel zu lang, Beschreibungen ohne Inhalt, H1 „Forum“. |
| Strukturierte Daten | 10 % | 15 | Kein JSON-LD auf keiner Seite. |
| Leistung | 10 % | 95 | Laborwerte sehr gut, Felddaten fehlen. |
| KI-Suche | 10 % | 60 | Gut zitierbar und offen für Crawler, aber heute nicht im Index. |
| Bilder | 5 % | 85 | Maße gesetzt, Logo korrekt als Schmuck. Die OG-Karte ist veraltet. |

## Was schon gut ist

- **Indexierung nach Prüfung ist schon gebaut (I9).** Nur Fragen mit geprüfter Antwort bekommen `index,follow` und einen Sitemap-Eintrag.
- **Lesen geht ohne JavaScript.** Alles steht als statisches HTML da, auch Formeln.
- **Alle 41 Seiten:** eigener Titel, genau eine H1, Canonical auf sich selbst, `lang="de"`, vollständige OG-Angaben. Keine verwaiste
  Seite, kein toter interner Link.
- **Schnell.** Gemessen mit Pixel 7, 1,6 MBit/s, 150 ms Latenz, CPU vierfach gedrosselt:

| Seite | Anfragen | Übertragen | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|
| Startseite | 5 | 10 KB | 0,54 s | 0 | 0 ms |
| Frage s09 | 11 | 110 KB | 0,66 s | 0 | 98 ms |
| Über | 4 | 9 KB | 0,45 s | 0 | 0 ms |
| Unterforum | 7 | 53 KB | 0,48 s | 0 | 0 ms |

- **Das Suchmodell bremst die Seite nicht.** Es lädt erst beim ersten Klick. Beim Tippen mit Modell-Download gab es keine langen Aufgaben,
  das längste Ereignis dauerte 72 ms. Der Lauf hatte keine Netzdrosselung.
- **Kopfzeilen:** strenge CSP, HSTS, `nosniff`, Brotli, kein Tracking.
- **Inhalt:** Frageseiten haben meist 1000 bis 3000 Wörter, jede Bot-Antwort belegt sich mit wörtlichem Zitat und Link. Dazu kommen
  Impressum, die Seite „Über hAInrich2“ und eine sichtbare Kennzeichnung als Bot.

## Befunde

### Gewollt, kein Fehler

**0. Alles ist `noindex`, die Sitemap ist leer.** Das bleibt so, bis Konrad die Vorschau beendet. Einen Schalter gibt es noch nicht:
`vorschau` steht in `public.db`, Tabelle `meta`.

### Hoch

**1. Erledigt: Alle 31 Antworten stehen auf dem Host als „geprüft“.** Im lokalen Baum sind die Beispielantworten „ungeprüft“ (`lib/site.js:47`), auf dem
Host „geprüft“. Das sah nach einem Fehler aus, Konrad hat am 2026-11-06 bestätigt, dass er sie selbst so markiert hat. Beim Ende der Vorschau gehen damit alle 31 Seiten
in den Index, auch s19, s10, s04, s05 und s09, deren Antworten laut `research/2026-11-05-skriptluecken/` zu Unrecht sagen, etwas sei offen, und die beiden
Testfragen (Befund 10).

**2. Behoben: Fehlerseiten sind leer.** `/eidl/gibtesnicht/` liefert 404 mit 0 Byte. Das trifft auch jeden alten Link auf eine zurückgezogene Frage,
der Besucher sieht eine weiße Seite. Nötig ist `handle_errors` in der Caddy-Rolle und eine Seite aus dem Bau. _Prüfen:_ `curl` auf eine
falsche Adresse liefert Status 404 und HTML mit Link zum Forum.

**3. Behoben: Beschreibungen sagen nichts über die Antwort.** Auf Frageseiten steht nur „Frage zum Kapitel X, beantwortet mit wörtlichem Zitat aus dem
Skript.“ (`lib/site.js:150`). Zwei Paare sind dadurch gleich, und ein Kapitel mit Fragezeichen ergibt „Was ist Deep Learning?.“. Besser ist der
Anfang der Antwort, `excerpt` gibt es schon. _Prüfen:_ keine doppelte Beschreibung im Crawl.

**4. Behoben: Titel sind zu lang.** 32 von 41 liegen über 60 Zeichen, die Frageseiten bei 79 bis 169. In der Trefferliste werden sie abgeschnitten, und
„hAInrich2“ fällt hinten weg. Bei `0cfd2b864eda` steht rohes `$x$` im Titel. Der `<title>` sollte am Wortende kürzen und Formeln auflösen, die H1
bleibt vollständig. Fragen, die mit „Ich bringe … durcheinander“ beginnen, tragen ihr Thema erst spät. Das löst nur ein Kurztitel, den
die Moderation setzt. _Prüfen:_ kein Titel über 65 Zeichen.

**5. Behoben: Die Seite „Über hAInrich2“ bliebe nach dem Ende der Vorschau `noindex`.** `textPage` gibt `robots` nicht weiter, die Vorgabe ist `noindex`
(`lib/site.js:52`, `:258`). Für Impressum und Datenschutz ist das in Ordnung, für diese Seite nicht. Die Sitemap enthält außerdem weder die Startseite
noch diese Seite (`lib/site.js:265`). Dazu kommen der doppelte Titel „Über hAInrich2 | hAInrich2“ und die Beschreibung „Über hAInrich2 von
hAInrich2.“. _Prüfen:_ Ein Bau mit `--release` trägt beide Seiten in die Sitemap ein.

**6. Behoben: Ein Zitat führt ins Leere.** Frage s12 verlinkt `folien/vl12.pdf#page=2` im Skript, das gibt 404. Das Deck ist nicht kaputt, sondern noch nicht freigegeben: Das Skript liefert nur aus, was in `slides/freigegeben.txt` steht, derzeit VL 1 bis 4, und verlinkt nur das. Unser Korpus vom 2026-11-04 ist älter als diese Regel und enthält 24 solcher Zeilen. Die Zitate zeigen den Folienlink am Anfang deshalb nicht mehr an, gespeichert bleibt der wörtliche Text. Von 55 externen Links antworten 49 mit
200, fünf `hdl.handle.net`-Links mit 403. Die sperren vermutlich nur meine Abfrage, von Hand nachsehen lohnt trotzdem.

### Mittel

**7. Zum Teil behoben: Keine strukturierten Daten.** `WebSite` auf der Startseite und `BreadcrumbList` auf Unterforen und Fragen sind live, die Brotkrumen
folgen dem sichtbaren Pfad. Von Googles Prüfwerkzeug ist das nicht bestätigt, die Site ist `noindex` und der Name soll nicht in weitere Dienste.

`QAPage` passt nur bedingt. Google verlangt: „Users must be able to submit answers to the question.“ Bei uns antworten nur Bot und Moderation.
Ausgenommen sind laut Google Bildungsseiten mit Hausaufgabenfragen und einer Antwort von Fachleuten; ob das hier zutrifft, ist Auslegung.
`DiscussionForumPosting` fällt weg, weil `author.name` Pflicht ist und Inhalte vom Betreiber ausgeschlossen sind. Das widerspricht dem Verzicht
auf Namen. Falls `QAPage` kommt, gehört `digitalSourceType` an die Bot-Antworten, sonst nimmt Google menschlichen Text an.

**8. Behoben: Die Startseite sagt wenig.** Die H1 heißt „Forum“, die Seite hat 150 Wörter. Der Skriptname steht nur in einer Kopfzeile ohne Überschrift.
Eine H1 mit dem Skriptnamen und zwei Sätze mit Link auf „Über hAInrich2“ reichen.

**9. Behoben: Die OG-Karte ist veraltet.** Sie sagt „Jede Antwort mit wörtlichem Zitat“, Antworten der Moderation haben aber keines. Außerdem steht dort „hAInrich“,
die Site heißt hAInrich2 (`tools/render_brand.py:105`). Die Karte erscheint, wenn jemand den Link teilt, also auch in Chats des Kurses.

**10. Entschieden: Die beiden Testfragen bleiben.** `bf8ec38f9c86` und `0cfd2b864eda` (Konrad, 2026-11-06).

### Niedrig

**11. Adressen ohne Wörter.** `f/s01/` sagt nichts über den Inhalt. Der Effekt ist klein, lässt sich aber nur vor dem Start billig ändern. Ich würde es lassen.

**12. Die Wurzel leitet dauerhaft um.** `/` geht per 301 auf `/eidl/`. Browser merken sich das. Sollen weitere Skripte eine Startseite an der Wurzel bekommen, ist 302 besser.

**13. Sitemap ohne `lastmod`.** Nützlich, sobald Antworten sich ändern, und aus `public.db` leicht zu haben.

**Nicht nötig:** `llms.txt`, Web-Manifest, FAQ-Markup (Google hat die Darstellung im Mai 2026 eingestellt).

## Reihenfolge

Die Vorschau bleibt vorerst: Konrad gibt den Link zuerst den Studierenden (2026-11-06). Alles für die Suche wirkt also erst später.

1. **Erledigt:** Befund 10 ist entschieden.
2. **Kleiner Umbau, ohne Server-Repo:** Befunde 3, 4, 5 und 8 sind erledigt.
3. **Mit Server-Repo:** Befund 2 ist erledigt, Befund 6 ebenso.
4. **Vor dem Start:** Schalter für das Ende der Vorschau, dann die Entscheidung zu `QAPage`.
5. **Nach dem Start:** Search Console einrichten, nach vier Wochen ansehen, welche Fragen Eindrücke bekommen, und erst dann über Kurztitel
   oder Adressen nachdenken.

Das Publikum kommt zuerst über ILIAS, nicht über Google. Deshalb zählt die Vorschau beim Teilen eines Links mehr als das Ranking. Wie viele
Menschen auf Deutsch nach diesen Fragen suchen, ist ungemessen.
