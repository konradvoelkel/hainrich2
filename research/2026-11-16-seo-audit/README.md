# SEO-Audit von hai.konradvoelkel.com/eidl/, zweiter Durchgang

_Stand 2026-11-16, gemessen am ausgespielten Stand `92b6560`. Skripte: `crawl.py` (unverändert vom 06.11., 99 Seiten) und `perf.mjs`
(Ladezeiten, erste Suche, Bildschirmfotos, um zwei Seitentypen erweitert). Sieben Fachprüfungen liefen als Subagenten, ihre Berichte
liegen in `findings/`. Rohdaten und Bildschirmfotos liegen außerhalb des Repos unter `work/seo-audit-2026-11-16/`._

**Ergebnis:** Die Site ist weiter gewollt unsichtbar: `noindex` auf allen 99 Seiten, leere Sitemap. Seit dem 06.11. gibt es keinen
Rückschritt, und alle damals behobenen Befunde halten. Die Startbereitschaft liegt bei **79 von 100** (06.11.: 68, nach den
Korrekturen rund 77). Das ist eine Einschätzung, keine Messung. Was heute bremst, ist nicht mehr Technik, sondern die Frageseite
selbst: Sie führt nirgends weiter, „geprüft“ sagt nicht von wem, und die 29 neuen Kapitelseiten gingen dünn in den Index.

**Grenzen:** Keine Daten von Google, keine Rankings, kein Suchvolumen, keine Backlinks, keine Felddaten. Der unverlinkte Name ging in
keinen fremden Dienst: kein PageSpeed, kein Rich-Results-Test, keine Marken- oder Backlink-Abfrage. Lighthouse ist nicht installiert
und wurde nicht geladen, die Agenten-Tauglichkeit ist deshalb von Hand beurteilt. Die Suchergebnisse stammen aus sechs allgemeinen
deutschen Suchanfragen ohne den Namen der Site. Die Inhaltsprüfung hat 14 der 31 Frageseiten am Host gelesen. Ladezeiten stammen aus
je einem Lauf in Chromium, kein echtes Telefon. `public.db` und die Moderation hinter der Anmeldung hat niemand gelesen.

## 1. Punkte je Bereich

| Bereich | Gewicht | 06.11. | heute | Grund |
|---|---:|---:|---:|---|
| Technik | 22 % | 85 | 86 | Sauber crawlbar, starke Kopfzeilen, echte 404-Seite. Das Ende der Vorschau braucht zwei Schalter, einen gibt es noch nicht. |
| Inhalt | 23 % | 75 | 74 | Antworten gut lesbar und belegt. Dagegen: „geprüft“ ohne Prüfer und Datum, dünne Kapitelseiten, einzelne veraltete Zitate. |
| Auf der Seite | 20 % | 55 | 76 | Titel und Beschreibungen sind repariert. Frageseiten verlinken weder ihr Kapitel noch andere Fragen, alle 31 Titel enden auf „…“. |
| Strukturierte Daten | 10 % | 15 | 70 | `WebSite` und `BreadcrumbList` sind gültig und stimmen mit dem sichtbaren Pfad überein. `QAPage` bleibt eine Abwägung. |
| Leistung | 10 % | 95 | 93 | LCP 0,58 bis 0,82 s bei gedrosseltem Netz, CLS 0. Die eigene Schrift kostet 41 KB, Dateien werden bei jedem Besuch neu geprüft. |
| KI-Suche | 10 % | 60 | 68 | Gut zitierbar und für Agenten lesbar. Keine Regel für Trainings-Crawler, die Frage fehlt im extrahierten Text. |
| Bilder | 5 % | 85 | 92 | Nur Logo und ein Foto, Maße gesetzt, OG-Karte aktuell. |

## 2. Was seit dem 06.11. hält

- Alle 99 Seiten: eigener Titel bis 65 Zeichen, genau eine H1, `lang="de"`, vollständige OG-Angaben. Canonical auf sich selbst bei den
  70 echten Seiten; die 29 Varianten `f/neu/?kapitel=…` zeigen auf `f/neu/`. Keine verwaiste Seite, kein toter interner Link.
- Beschreibungen sind der Anfang der Antwort, keine fehlt, keine ist länger als 160 Zeichen.
- Eine unbekannte Adresse liefert 404 mit einer Seite und Weg zurück.
- Nur geprüfte Fragen und was zu ihnen führt, werden beim Ende der Vorschau indexierbar (`lib/site.js:16`, `:96`, `:373`). Impressum,
  Datenschutz, Nutzungsbedingungen, das Frageformular und die 404-Seite bleiben `noindex`.
- Lesen geht ohne JavaScript, auch Formeln. Kein seitliches Scrollen bei 360, 768 und 1366 px, Kontrast überall mindestens 5,5:1,
  der dunkle Modus ist lesbar.

| Seite | Anfragen | Übertragen | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|
| Startseite | 7 (5) | 57 KB (10) | 0,64 s (0,54) | 0 | 0 ms |
| Frage s09 | 13 (11) | 158 KB (110) | 0,82 s (0,66) | 0 | 187 ms (98) |
| Über | 6 (4) | 56 KB (9) | 0,58 s (0,45) | 0 | 0 ms |
| Unterforum | 9 (7) | 100 KB (53) | 0,63 s (0,48) | 0 | 0 ms |
| Kapitelseite | 7 | 57 KB | 0,62 s | 0 | 0 ms |
| Frageformular | 7 | 59 KB | 0,62 s | 0 | 0 ms |

In Klammern die Werte vom 06.11., Bedingungen wie damals: Pixel 7, 1,6 MBit/s, 150 ms Latenz, CPU vierfach gedrosselt. Der Zuwachs ist
die eigene Schrift. Beim Tippen in die Suche mit Modell-Download gab es keine lange Aufgabe.

## 3. Befunde

### Gewollt, kein Fehler

**0. Alles ist `noindex`, die Sitemap ist leer.** Das bleibt, bis Konrad die Vorschau beendet.

### Hoch: vor dem Ende der Vorschau

**1. Eine Frageseite führt nirgends weiter.** Keine der 31 Frageseiten verlinkt ihre Kapitelseite oder eine andere Frage (im Crawl
gezählt: 0 von 31). Der Kapitelname unter der H1 und im Pfad ist reiner Text. Wer von außen auf einer Frage landet, hat danach nur
den Fuß der Seite. _Tun:_ Kapitelname auf `f/kapitel/<kennung>/` verlinken, darunter „Weitere Fragen zu diesem Kapitel“.
_Prüfen:_ Im Crawl hat jede Frage einen Link auf ihr Kapitel und mindestens einen auf eine andere Frage, wo es eine gibt.
_Beobachten:_ eingehende Links je Kapitelseite.

**2. „geprüft“ sagt nicht, wer prüft und wann.** Am Bot-Beitrag steht `04.11.2026 · geprüft`. Das Datum ist das der Frage, ein
`<time>`-Element gibt es nicht, und dass der Prüfer der Autor des Skripts ist, steht nur im Impressum. Das ist das stärkste
Vertrauenssignal der Site, und es ist auf der Seite, auf der ein Suchender landet, nicht zu sehen. _Tun:_ „geprüft von …, Autor des
Skripts, am …“ mit `<time datetime>`, dazu ein Absatz „Wer prüft“ auf `ueber/`. Ob der Name auf jeder Frageseite stehen soll, ist
Konrads Entscheidung. _Prüfen:_ s09 zeigt Rolle und Datum der Prüfung.

**3. 28 Kapitelseiten gingen dünn in den Index.** Eine Kapitelseite wird indexierbar, sobald sie eine geprüfte Frage hat
(`lib/site.js:297`). Die Seiten haben 133 bis 181 Wörter; 25 von 29 haben genau eine Frage, drei haben zwei, eine hat keine.
_Tun:_ `index` erst ab drei geprüften Fragen, darunter `noindex,follow` und kein Sitemap-Eintrag; ein kurzer Einstieg je Kapitel
wäre der zweite Schritt. Heute bliebe damit jede Kapitelseite draußen, und das passt: Sie sind Navigation, bis mehr Fragen da sind.
_Prüfen:_ Ein Bau mit `--release` trägt kein Kapitel mit weniger als drei Fragen in die Sitemap ein.

**4. Das Ende der Vorschau hat zwei Schalter, und einen davon gibt es nicht.** `site/build.mjs --release` gilt nur für die statischen
Seiten. Start, Unterforen, Kapitel, Fragen und Sitemap schreibt der Web-Prozess und liest `vorschau` aus `public.db`
(`tools/import-public.mjs:36` setzt es beim Import auf wahr). Dafür gibt es weder einen Knopf noch einen Test. Mit nur einem Schalter
bliebe alles Dynamische `noindex`. _Tun:_ Schalter in der Moderation, dazu ein Test, der mit `vorschau: false` veröffentlicht und
Robots-Angabe und Sitemap prüft. _Prüfen:_ nach dem Umschalten am Host eine geprüfte Frage und die Sitemap ansehen.

**5. Entscheidung: Es gibt keine Regel für Trainings-Crawler.** `robots.txt` kennt nur `User-agent: *`. `noindex` hält Seiten aus
Suchindizes, aber nicht vom Abrufen ab, und der Name steht in den CT-Logs. Auf den Seiten stehen seit der Alpha Fragen von
Studierenden. Die Rechtstexte sagen dazu nichts; der Satz zum Training in `datenschutz-fragen.md` meint die API. _Abwägung:_
Trainings-Crawler aussperren (GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended) und Such-Crawler zulassen kostet keine
Sichtbarkeit in der Suche; offen lassen ist einfacher und entspricht der CC-Lizenz des Skripts. So oder so gehört ein Satz dazu in
die Datenschutzerklärung, Text und `robots.txt` am selben Tag. Das gilt schon jetzt, nicht erst zum Start.

### Mittel

**6. Mindestens vier Fragen tragen ein Zitat, das es so im Skript nicht mehr gibt.** Am Host nachgezählt: Von 134 Zitat-Adressen
fehlen 4 im aktuellen Korpus (Abschnitt plus erste acht Wörter), je eine in s12, s19, s29 und `0cfd2b864eda`. Das ist eine untere
Grenze, die genaue Liste zeigt die Moderation. Bei s12 steht außerdem die eigentliche Antwort im letzten Absatz und ohne Beleg,
obwohl das Skript inzwischen „Warum rückwärts?“ hat. „Claude noch einmal fragen“ kostet Geld und ist Konrads Klick.

**7. Alle 31 Fragetitel enden auf „…“.** Die Grenze von 65 Zeichen hält, aber bei etwa der Hälfte fällt der Fachbegriff weg
(`zero_grad`, ReLU, Adam). Das löst nur ein Kurztitel, den die Moderation setzt (Rest von Befund 4 vom 06.11.).

**8. Sechs Beschreibungen sind beschädigt.** Bei s03, s09, s15, s21 und s28 steht „…“ an der Stelle einer Formel mitten im Satz, s12
beginnt mit „- “. _Tun:_ in `excerpt` Listenzeichen entfernen und Formeln durch ihren Text ersetzen oder vor der ersten abschneiden.
_Prüfen:_ keine Beschreibung mit „ … “ vor dem Ende im Crawl.

**9. Das Frageformular sagt ohne Kurscode weder, wer fragen darf, noch was mit dem Text geschieht.** Im HTML von `f/neu/` sind beide
Formulare `hidden`, bis das Skript läuft; der Einwilligungstext erscheint erst mit gültigem Kurscode. Ein Außenstehender erfährt
nicht, dass Fragen dem Kurs vorbehalten ist und was er stattdessen tun kann. _Tun:_ ein fester Satz mit Link auf den Datenschutz
im Einstieg. Der Satz ist kein neuer Zustimmungstext, braucht aber Konrads Blick, weil er neben einem steht.

**10. Auf dem Telefon bestehen Frageseiten zu zwei Dritteln aus Zitat.** Bei s09 nehmen sieben Zitatblöcke 68 % der Höhe ein, bei s12
59 %; die Zitate sind 1,7- bis 3,3-mal so lang wie die Antwort und stehen wortgleich im öffentlichen Skript. Das Zitat ist das
Versprechen der Site, also eine Abwägung: einklappen mit sichtbarem ersten Satz (`<details>`) hilft dem Lesen, `data-nosnippet` am
Zitatblock hält die Trefferbeschreibung bei der eigenen Antwort.

**11. Die Suche sagt ihre Treffer nicht an.** `#treffer` ist keine Live-Region, `#suchstatus` wird beim Erscheinen der Treffer nicht
erneuert und zeigt weiter „das Sprachmodell lädt noch“ (Bildschirmfoto `start-phone-suche-viewport.png`). Der Suchbereich ist keine
Landmarke. _Tun:_ Status auf „N Fragen, M Stellen“ setzen, `role="search"`.

**12. Der Fokus geht im Frageformular verloren.** Nach „Weiter“ verschwindet das Formular, das den Fokus hält; nach dem Absenden
gibt es nur `scrollIntoView`. Aus `site/fragen.js` gelesen, nicht im Browser geprüft.

**13. Breite Formeln zeigen nicht, dass sie scrollen.** Auf dem Telefon ist der Kasten 262 px breit, der Inhalt bis 563 px. _Tun:_
Schatten am rechten Rand, `tabindex="0"`.

**14. Die Frage fehlt im extrahierten Text.** Ein Textextraktor (trafilatura) beginnt bei allen vier untersuchten Seiten (s03, s09,
s12, s23) mit der Antwort und lässt die H1 weg. Ob Antwortmaschinen genauso extrahieren, ist nicht gemessen. Antworten sind außerdem `article` ohne Überschrift. _Tun:_ Frage und
Antworten in ein gemeinsames Element, eine verborgene Überschrift je Antwort.

**15. Mischfall bei der Indexierung.** Eine Frageseite wird indexierbar, sobald eine Antwort „geprüft“ ist, auch wenn eine zweite
auf derselben Seite „ungeprüft“ ist (`lib/site.js:16`). Regel entscheiden, Test dazu.

**16. `QAPage` bleibt offen.** Leser können keine Antworten abgeben, das verlangt Google. Ob die Ausnahme für Bildungsseiten greift,
ist unbelegt, ein Rich-Result ist unwahrscheinlich. Falls doch: nur geprüfte Antworten, Bot als Autor benannt, kein
`upvoteCount`, kein `digitalSourceType` (an `Answer` nicht bestätigt). Das fertige Beispiel steht in
`findings/strukturierte-daten.md`.

**17. Betreiber und Lizenz fehlen auf der Frageseite.** Der Fuß sagt nicht, wessen Site das ist, und neben den Zitaten stehen weder
Autor noch CC BY-SA 4.0. Ob die Lizenzangabe dort nötig ist, ist eine Rechtsfrage.

### Niedrig

- **Dateien werden bei jedem Besuch neu geprüft.** `cache-control: no-cache` auf CSS, JS, Schrift, Logo und Icons; nur `katex/`
  hat einen Tag. Server-Repo: `max-age` für Schrift, Logo und Icons.
- **Die 404-Seite nennt `/eidl/404.html` als Canonical und `og:url`.** Canonical dort weglassen.
- **Kleine Tippziele auf dem Telefon:** Zitatmarken `[1]` 18×19 px, `#1` 17×22 px, Abstimmpfeile 37×30 px direkt aneinander.
- **Abstimmen für Vorleseprogramme:** Der Zähler heißt nur über `title`, in Listen stehen die Knöpfe im Zeilenkopf.
- **Kein Sprunglink, Antworten ohne Namen im Zugänglichkeitsbaum, Linktexte „[1]“ und „#2“.**
- **Suchauszüge verlieren ihre Formeln:** „Aus … soll ein Ausdruck der Form … werden“.
- **Kein Frische-Signal:** kein Datum der Antwort oder der Bearbeitung, Sitemap ohne `lastmod` (Befund 13 vom 06.11.).
- **Umleitungen mischen 301 und 308**, `/eidl/index.html` antwortet mit 200. Beides harmlos.
- **Testfrage `bf8ec38f9c86`:** 79 Wörter ohne Beleg, „über 80 %“ ohne Quelle. Für die Suchanfrage „Keras oder PyTorch“ passt der
  Seitentyp nicht.
- **„Beispielfrage“ gegen `ueber/`:** 29 von 31 Fragen tragen das Abzeichen, die Über-Seite sagt, Fragen kämen von Studierenden.
- **Lange Listen:** Unterforen und Kapitel listen alle Fragen ohne Blättern. Bei 31 Fragen kein Thema.

**Nicht nötig:** `llms.txt`, Markdown-Fassungen, `ai-catalog.json`, WebMCP, FAQ-Markup, `SearchAction` (die Suche läuft im Browser
ohne Adresse).

## 4. Wo die Site in der Suche eine Chance hat

Sechs allgemeine Suchanfragen, ohne den Namen der Site: Reine Begriffsanfragen gehen an Wikipedia, Lehrbücher, Folien und Videos, das
kann diese Site nicht sein. Lange, genaue Warum- und Wie-Fragen auf Deutsch sind dünn besetzt, meist mit kurzen Glossaren oder
englischen Anleitungen. Dort passt eine Frageseite mit direkter Antwort und Beleg: s09 (Log-Odds) und s23 (Ausgabegröße einer
Faltung) treffen das Format der Treffer gut, s12 (warum rückwärts) hätte eine echte Chance, stellt die Antwort aber ans Ende.
Kapitelseiten sind Navigation, keine Landeseiten. Suchvolumen ist ungemessen, und das Publikum kommt weiter zuerst über ILIAS.

## 5. Reihenfolge

Jeder Schritt hängt an dem davor, und keiner wirkt in der Suche, solange die Vorschau läuft.

1. **Jetzt entscheiden, unabhängig vom Start:** Befund 5 (Trainings-Crawler), weil die Alpha läuft.
2. **Kleiner Umbau am Code, ohne Server-Repo:** Befunde 1, 3, 8, 11, 13, 14 und die 404-Seite. Befund 1 zuerst, er macht die
   Kapitelseiten erst nützlich.
3. **Mit Konrads Text oder Klick:** Befunde 2, 6, 7, 9, 10 und 17.
4. **Vor dem Start:** Befund 4 (Schalter mit Test), dann 15 und 16 entscheiden.
5. **Nach dem Start:** Search Console einrichten und nach vier Wochen ansehen, welche Fragen Eindrücke bekommen. Erst dann lohnt die
   Arbeit an Kurztiteln über die auffälligsten hinaus.

## 6. Wie gemessen wurde

- **Crawl:** `python3 research/2026-11-16-seo-audit/crawl.py <ausgabe.json>`, nur GET, 0,15 s Pause, 100 Adressen in 23 Sekunden.
- **Ladezeiten:** `node research/2026-11-16-seo-audit/perf.mjs <bildverzeichnis>`.
- **Fachprüfungen:** sieben Subagenten des Plugins `claude-seo` 2.4.2 (Technik, Inhalt, strukturierte Daten, KI-Suche,
  Agenten-Tauglichkeit, Sucherlebnis, Darstellung), jeder mit denselben Regeln: nur lesen, nichts absenden, nichts unter `api/`
  und `mod/`, kein fremder Dienst mit dem Namen der Site. Sitemap, Titel, Bilder und Ladezeiten sind ohne Subagent ausgewertet.
- **Nachgeprüft vor der Übernahme:** die Regeln für die Indexierung im Quelltext, die Verlinkung der Fragen im Crawl, das
  Frageformular und die 404-Seite am Host, die veralteten Zitate.
- **Drei Berichtigungen:** Die Inhaltsprüfung nannte 18 Antworten mit veraltetem Zitat. Die Zahl stand im Auftrag und gilt für die
  lokalen Beispielantworten; am Host sind es mindestens 4 (Vermerk in `findings/inhalt.md`). Dieselbe Prüfung zählte acht
  beschädigte Beschreibungen, im Crawl sind es sechs, und 24 Kapitelseiten mit genau einer Frage, im Crawl sind es 25.
- **Eine Überschreitung:** Die Prüfung des Sucherlebnisses hat ihr Limit von 30 Abrufen nach eigener Angabe um geschätzt bis zu 20
  überschritten, weil sie vier Seiten im Browser gerendert hat. Es waren nur GET-Abrufe.

## 7. Umgesetzt am 2026-11-16

Nach dem Audit umgebaut, im Arbeitsbaum, **nicht ausgespielt**. Am Host ist davon nichts zu sehen, bis `site/deploy.sh` und danach
`site/deploy-app.sh` laufen: erst das Stylesheet, dann die Vorlagen, sonst steht der Sprunglink kurz ungestaltet oben.

| Befund | Stand | Wie geprüft |
|---|---|---|
| 1 Frageseite führt nirgends weiter | Kapitelname im Pfad und unter der H1 verlinkt, am Ende „Alle Fragen zu …“ und das Unterforum | Unit-Test, Browser-Test klickt von s04 zur Kapitelseite und findet die Frage dort |
| 3 dünne Kapitelseiten | `index` und Sitemap erst ab drei geprüften Fragen (`KAPITEL_INDEX_AB`) | Unit-Tests für Seite und Sitemap |
| 4 Ende der Vorschau | `test/vorschau.test.mjs` veröffentlicht mit `vorschau` an und aus und prüft Robots-Angabe und Sitemap | läuft in `npm test` |
| 8 beschädigte Beschreibungen | Auszug ohne Listenzeichen; lesbare Formeln als Text („w · x + b“, „ℝ“, „[0, 1]“), Brüche und Summen bleiben Auslassung | Unit-Test; lokale s09: „Eine lineare Funktion w · x + b nimmt …“ |
| 9 Frageformular | fester Satz, wer fragen kann, mit Link auf den Datenschutz; Wortlaut aus `site/texte/ueber.md` | Unit-Test |
| 11 Suche | Statuszeile sagt „N Fragen und M Stellen im Skript gefunden“, Suchbereich ist `role="search"` | Browser-Test in drei Browsern |
| 12 Fokus im Frageformular | nach „Weiter“ im Fragefeld, nach dem Absenden auf „Meine Fragen“ mit Meldung | Browser-Test der Moderation in Chromium und Firefox |
| 13 breite Formeln | der Rand verblasst, wo noch etwas kommt (`animation-timeline: scroll()`, sonst wie bisher) | in Chromium gemessen: Maske an 8 breiten Formeln von s09, keine an der schmalen |
| 14 Frage im extrahierten Text | Frage und Antworten in einem Element, jeder Beitrag mit Namen | Unit-Test für das Markup; **ob ein Extraktor die Frage damit mitnimmt, ist nicht geprüft** |
| 10 Zitate auf dem Telefon | lange Zitate sind eingeklappt und zeigen Anfang und Quelle, eine Marke [n] klappt ihr Zitat auf (`site/zitate.js`); dazu `data-nosnippet` am Zitatblock (Konrad, 16.11.: „Zitate einklappen ist gut“) | Unit-Test, Browser-Test in drei Browsern; bei 360 px im lokalen Bau: s09 von 7760 auf 3839 px, Zitate von 74 auf 42 % des Inhalts, s12 von 6190 auf 3774 px, s04 von 6532 auf 3822 px |
| niedrig | 404 ohne Canonical und `og:url`; Sprunglink; `<time datetime>` an Frage und Antwort; sprechende Namen für „[1]“ und „#2“; Tippziele ab 24 px (Zitatmarke 26×29, Nummer 29×31, Pfad und Fuß 29 bis 31 hoch) | Unit- und Browser-Tests, Tippziele in Chromium bei 360 px gemessen |

Tests danach: `npm test` 234 von 234, `npm run smoke` 20 von 20 in Chromium, Firefox und WebKit, `npm run smoke:mod` 23 von 23 in
Chromium und Firefox, alles gegen einen eigenen Probe-Bau.

**Eine Abweichung vom Bericht:** Befund 1 schlug eine Liste weiterer Fragen auf jeder Frageseite vor. Die gibt es nicht. Eine Stimme
schreibt nur ihre eigene Frageseite neu (`lib/publish.js`), eine solche Liste stünde also nach jeder Änderung auf den Nachbarseiten
falsch. Die Frageseite verweist deshalb auf Kapitel und Unterforum, und die listen ihre Fragen immer frisch.

**Zum Einklappen:** Ein Zitat bis 220 Zeichen bleibt offen. Der volle Wortlaut steht immer im HTML, die Quelle immer sichtbar. Ohne
JavaScript klappt ein Klick auf die Zeile das Zitat auf, nur die Marke [n] öffnet es dann nicht von selbst. Die Frageseite lädt dafür
ein Skript mehr, aber nur, wenn sie ein langes Zitat hat. Gedruckt wird ein eingeklapptes Zitat nicht.

**Nicht geprüft:** das Frageformular mit dem neuen Satz im Bild (die statische Site enthält `f/neu/` nicht, der Browser-Test der
Moderation hat die Seite bedient), der Formelrand in Firefox und WebKit, ein Vorleseprogramm.

**Bleibt bei Konrad:** 2 (wer prüft und wann), 5 (Trainings-Crawler), 6 (veraltete Zitate, kostet je Frage), 7 (Kurztitel),
15 (Mischfall), 16 (`QAPage`), 17 (Betreiber und Lizenz an der Frageseite), der Schalter in der Moderation
für das Ende der Vorschau, und im Server-Repo `cache-control` für Schrift, Logo und Icons.
