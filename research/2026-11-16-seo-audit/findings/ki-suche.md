# KI-Suche (GEO), Stand 2026-11-16

Frage: Wie bereit sind Inhalt und Crawler-Regeln für KI-Suche am Tag, an dem die Vorschau endet? `noindex`, Banner und leere
Sitemap sind Absicht und hier kein Befund.

**Wertung KI-Suche: 62 / 100** (Bereitschaft für den Tag nach der Vorschau)

| Teil | Gewicht | Punkte | Kurz |
|---|---|---|---|
| Zitierbarkeit | 25 % | 65 | Antwort steht oben, Zitate belegt; bei manchen Fragen kommt der Kern erst am Ende |
| Struktur | 20 % | 70 | H1 = Frage, sauberes HTML; Extraktor verliert die Frage, Formeln dreifach im Text |
| Multimodal | 15 % | 45 | Formeln vorgerendert, sonst kaum Bilder; für diese Inhalte wenig relevant |
| Autorität und Entität (auf der Seite) | 20 % | 60 | Bot offen benannt, Quelle verlinkt; Betreiber und Lizenz fehlen auf der Frageseite |
| Technischer Zugang | 20 % | 75 | Alles im rohen HTML, kein JS nötig; keine bewusste Regel für KI-Crawler |

## Methode

Sieben Anfragen an den Host, nur GET/HEAD: `f/s09/`, `f/s12/`, `f/s03/`, `f/s23/` (mit `render_page.py --mode never`),
`robots.txt`, HEAD auf `/eidl/llms.txt`. Dazu die Crawl-Liste vom selben Tag, `lib/site.js`, `lib/render.js`,
`lib/answer.js` und die Texte in `site/texte/`. Für den Textauszug zählt das Feld `extracted_text` (trafilatura) und ein
eigener `textContent`-Auszug mit und ohne `aria-hidden`.

## Was schon trägt

- Jede Frageseite ist fertiges HTML. Keine Seite braucht JavaScript, `is_spa` ist falsch. Das reicht für jeden KI-Crawler.
- Die H1 ist die Frage im Wortlaut, wie Studierende sie stellen. Das passt zu Suchanfragen in natürlicher Sprache.
- Die Antwort steht vor den Zitaten. Ein Extraktor findet sie zuerst.
- Jede Aussage trägt eine Fußnote, jede Fußnote ein wörtliches Zitat mit Link auf die Stelle im Skript. Das ist genau die
  Belegstruktur, die Antwortmaschinen gern übernehmen.
- s03 und s23 sind fast ideal: s03 beginnt mit „Ja, …“ und zwei Definitionen in je einem Satz („Der Gradient ist ein
  Vektor …“, „Die Richtungsableitung ist dagegen eine Zahl …“). s23 nennt die Formel im ersten Satz.
- Bot-Herkunft ist offen: Autor „hAInrich2“ mit Label „Bot“, Hinweis „Diese Antwort hat ein Sprachmodell erzeugt (Claude von
  Anthropic)“, Abzeichen „geprüft“, bei s12 zusätzlich „die Moderation hat sie bearbeitet“.
- `robots.txt` sperrt nur Modelle, WASM, Suchdaten, Moderation und API. Die Inhalte sind offen.

## Befunde

### 1. Keine bewusste Regel für KI-Crawler, und `noindex` schützt nicht vor Training (Mittel, Entscheidung des Eigentümers)

**Beleg.** `robots.txt` hat nur `User-agent: *`. Damit dürfen heute alle KI-Crawler alle Frageseiten holen. `noindex` ist eine
Regel für Suchindizes, keine Abrufsperre:

| Crawler | Wofür er zählt | Heute |
|---|---|---|
| Googlebot | Google-Suche und AI Overviews | darf holen, `noindex` hält die Seiten aus Suche und AIO |
| Bingbot | Bing, Copilot | darf holen, `noindex` hält sie aus dem Index |
| OAI-SearchBot | ChatGPT Search | darf holen; ob er `noindex` beachtet, ist nicht sicher dokumentiert |
| Claude-SearchBot | Claude-Suche | darf holen; Umgang mit `noindex` nicht geprüft |
| PerplexityBot | Perplexity | darf holen; Umgang mit `noindex` nicht geprüft |
| GPTBot | OpenAI-Training (nicht ChatGPT Search) | darf holen, `noindex` hält ihn nicht ab |
| ClaudeBot | Anthropic-Training (nicht Claude-Suche) | darf holen, `noindex` hält ihn nicht ab |
| CCBot | Common Crawl, Grundlage vieler Trainingsdaten | darf holen, `noindex` hält ihn nicht ab |
| Google-Extended | Gemini-Training und -Grounding; nicht Suche, nicht AIO | erlaubt |
| Applebot-Extended | Apple-Intelligence-Training; nicht Siri/Spotlight | erlaubt |

Der Hostname ist nicht verlinkt, aber er steht in den Certificate-Transparency-Logs. Wer dort neue Namen einsammelt, findet
ihn. „Unveröffentlicht“ heißt also nicht „ungelesen“.

**Was die Rechtstexte sagen.** Nichts verspricht oder verbietet die Nutzung durch KI-Crawler. `nutzungsbedingungen.md`
erlaubt die Veröffentlichung „in diesem Forum“ und die Beantwortung durch ein Sprachmodell. `datenschutz-fragen.md` sagt,
die Frage werde „dauerhaft öffentlich“, und nach der Freigabe gebe es keine Verbindung mehr zur fragenden Person. Der
Satz über Anthropic („nutzt sie nach eigenen Angaben nicht zum Training“) betrifft nur die API, nicht ClaudeBot auf den
öffentlichen Seiten. Ein Leser könnte das verwechseln.

**Abwägung.**
- *Alles offen lassen (heute):* größte Reichweite. Freigegebene Fragen sind anonym und von der Moderation geprüft. Die Zitate
  stehen ohnehin offen unter CC BY-SA im Skript.
- *Suchbots ausdrücklich erlauben, Trainingsbots sperren:* `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`,
  `Googlebot`, `Bingbot` bleiben offen. `GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`, `Applebot-Extended`, `cohere-ai`,
  `meta-externalagent`, `Bytespider` bekommen `Disallow: /eidl/`. Sichtbarkeit in ChatGPT Search, Claude, Perplexity, AIO
  und Copilot bleibt. Kosten: die Seiten fehlen in künftigen Trainingsdaten, und Gemini nutzt sie nicht zum Grounding.
  Gewinn: Studierende können sich darauf verlassen, dass ihre Fragen nicht in Trainingsdaten wandern, soweit die Bots
  `robots.txt` achten. Eine Garantie ist das nicht.
- *Alles sperren:* widerspricht dem Zweck („einmal fragen, für alle beantworten“).

**Vorschlag, nicht Pflicht.** Vor dem Ende der Vorschau entscheiden und die Entscheidung in einem Satz in
`datenschutz-fragen.md` oder den Nutzungsbedingungen nennen („Öffentliche Seiten können Suchmaschinen und KI-Dienste lesen;
Trainings-Crawler sind per robots.txt ausgeschlossen“ oder eben nicht). Da Alpha läuft, gilt die Frage schon heute. Die
`robots.txt` gehört ins Server-Repo, die Textänderung folgt `~/files/work/RECHTSTEXTE.md`.

**Prüfen.** `curl -s https://<host>/robots.txt`, dann mit einem robots-Parser je User-Agent `/eidl/f/s03/` testen.

### 2. Der Extraktor verliert die Frage (Mittel)

**Beleg.** In allen vier Seiten beginnt `extracted_text` (trafilatura) mit dem ersten Satz der Antwort. Die H1 mit der Frage
fehlt. Ursache vermutlich: Frage und Antwort stehen in zwei getrennten `<article>`, die Frage-Karte ist kurz und hat Abstimm-
Knöpfe, also hält der Extraktor sie für Rahmen. Bei s12 („Grundlage ist die Kettenregel.“) ist eine Passage ohne Frage
kaum verständlich.

**Fix (klein).** Frage und Antwort in ein gemeinsames Element legen, etwa ein äußeres `<article>` um beide Beiträge, mit der
H1 als erstem Kind, oder die H1 vor die Frage-Karte ziehen. Das Aussehen kann gleich bleiben.

**Prüfen.** `render_page.py --mode never --json` auf eine Frageseite; `extracted_text` beginnt mit der Frage.

### 3. Formeln stehen dreifach im Text (Niedrig bis Mittel)

**Beleg.** `lib/render.js` ruft `katex.renderToString` mit der Vorgabe `htmlAndMathml`. Ein `textContent`-Auszug liefert pro
Formel MathML-Text, TeX-Annotation und HTML-Darstellung hintereinander: „Eine lineare Funktion w⋅x+bw \cdot x + bw⋅x+b
nimmt …“. trafilatura überspringt die `aria-hidden`-Kopie, behält aber zwei. Der MathML-Text allein ist verlustbehaftet:
bei s23 wird aus dem Bruch „nout=⌊n+2p−ks⌋+1“. Das TeX ist für Sprachmodelle die beste Fassung.
Gewicht: s09 hat 110 Formeln, 177 KB HTML für rund 1200 Wörter Text (12 KB gzip). Die `katex-html`-Spans machen den
größten Teil aus.

**Einordnung.** Das ist auf Mathe-Seiten im Netz üblich, und Modelle lesen es meist richtig. Es verdünnt aber jede Passage
und macht wörtliches Zitieren aus der Seite unsauber.

**Fix (Abwägung).** Option A: `output: 'mathml'`. Alle aktuellen Browser setzen MathML Core, das HTML-Drittel fällt weg,
die Seite wird deutlich kleiner; Darstellung in Chrome, Firefox und Safari vorher prüfen, besonders Brüche und Akzente.
Option B: so lassen. Option A nur mit Sichtvergleich der Formeln und den Browser-Tests (`npm run smoke`,
`SMOKE_BROWSER=webkit`). Die strenge CSP berührt das nicht.

**Prüfen.** Anzahl `class="katex-html"` im gebauten Baum, Seitengröße von s09 vorher und nachher.

### 4. Bei manchen Antworten steht der Kern am Ende (Mittel)

**Beleg.** s12 fragt „Warum rückwärts und nicht vorwärts?“. Der eigentliche Grund („dies effizienter ist, um eine Funktion
ℝⁿ→ℝ (wie den Loss) abzuleiten“) steht im letzten Satz, nach fünf fett gesetzten Zwischenschritten. s09 beginnt mit einer
Voraussetzung, die Antwort auf „warum“ verteilt sich über vier Absätze. s03 und s23 zeigen, wie es gut geht. Der
System-Prompt in `lib/answer.js` verlangt drei bis acht Sätze, sagt aber nichts über den ersten Satz.

**Fix (klein, redaktionell neutral).** Eine Zeile im Prompt: „Beantworte die Frage im ersten Satz direkt, belege und
erkläre danach.“ Für vorhandene Antworten kann die Moderation den Kernsatz nach oben ziehen. Das ändert nicht das Modell
der Redaktion, nur die Reihenfolge. Eine Prompt-Änderung braucht wie jede andere einen Vergleich am Probensatz, ohne
echte API-Läufe nur mit Zustimmung.

**Prüfen.** Für alle 29 Frageseiten den ersten Satz der Antwort neben die Frage legen und zählen, wie viele direkt antworten.

### 5. Betreiber und Lizenz fehlen auf der Frageseite (Mittel)

**Beleg.** Eine Frageseite allein sagt: Name „hAInrich2“, „Fragen und Antworten zum Skript …“, Bot = Claude von
Anthropic, „geprüft“, Link je Zitat auf die Stelle im Skript, Fußzeile „Ein privates Angebot, nicht der
Heinrich-Heine-Universität“. Sie sagt nicht, *wessen* Angebot, wer das Skript verfasst hat, und unter welcher Lizenz die
Zitate stehen. CC BY-SA 4.0 steht nur in den Nutzungsbedingungen. Das JSON-LD der Frageseite ist nur `BreadcrumbList`; der
`publisher` steht nur auf der Startseite. Wer prüft („geprüft“ von wem, wann), steht nirgends.

**Fix (klein).**
- Fußzeile: „Ein privates Angebot von Konrad Völkel, nicht der …“ (der Name steht ohnehin im Impressum).
- Unter dem Abschnitt „Originaltext aus dem Skript“ eine Zeile: Skript „Einführung in Deep Learning“, Verfasser, Lizenz
  CC BY-SA 4.0 mit Link. Das ist ohnehin, was die Lizenz für Zitate verlangt; rechtlich bitte gesondert bewerten.
- `<blockquote cite="…">` mit der Skript-URL der Passage; der Link steht schon in der `figcaption`.
- Optional, mit dem Schema-Prüfer abstimmen: JSON-LD je Frageseite mit Frage, Antwort, Autor als Bot (`SoftwareApplication`
  oder Organisation), `dateCreated`, `isBasedOn` auf die Skriptstelle, `license`. Ob Google dafür ein Rich Result zeigt, ist
  nebensächlich; der Zweck ist eine eindeutige Maschinen-Aussage. `QAPage` passt nach Googles Regeln eher nicht, weil
  Nutzer keine eigenen Antworten schreiben können.
- Datum als `<time datetime="2026-11-04">04.11.2026</time>`; heute 0 `<time>`-Elemente.

**Prüfen.** Eine Frageseite ohne Kontext lesen: Betreiber, Skript, Lizenz, Bot, Prüfung sind ohne Klick erkennbar.

### 6. Hinweistext und Abzeichen sprechen gegeneinander (Niedrig)

**Beleg.** Abzeichen „geprüft“, darunter „Prüfen Sie das Zitat.“ Für Mensch und Maschine ist unklar, was geprüft ist.
**Fix.** Bei geprüften Antworten: „… erzeugt (Claude von Anthropic), die Moderation hat sie geprüft.“ Den Aufruf zum
Prüfen nur bei „ungeprüft“ lassen.

### 7. Die langen Zitate (Niedrig, kein Handlungsbedarf)

Die Zitatblöcke sind zwei- bis viermal so lang wie die Antwort (s09: 258 Wörter Antwort, 929 Wörter Zitat, 7 Figuren). Sie
stehen nach der Antwort und sind als `<blockquote>` mit Quelle markiert. Für Extraktion ist das gut. Für Antwortmaschinen
sind sie Doppelinhalt des Skripts; zitiert wird dann eher das Skript selbst. Das ist im Sinn des Projekts. Nichts ändern.

## llms.txt und Markdown-Fassungen

`/eidl/llms.txt` gibt 404. Für 99 Seiten mit fertigem HTML ohne JavaScript bringt `llms.txt` nichts Messbares: Keine der
großen Antwortmaschinen hat zugesagt, die Datei zu lesen, und die Seiten sind ohnehin direkt lesbar. Eine Markdown-Fassung
je Frage (Frage, Antwort mit TeX in `$…$`, Zitate mit Link) wäre die sauberste Quelle für Formeln, weil sie das
Dreifach-Problem aus Befund 3 umgeht. Sie ist aber eine zweite Ausgabe, die gepflegt, gebaut und gegen `live/`
synchron gehalten werden muss, und kein Crawler fragt sie bisher gezielt ab. Empfehlung: jetzt nicht. Erst wenn Befund 3
mit `output: 'mathml'` nicht lösbar ist, oder wenn ein Dienst Markdown nachweislich nutzt. Das bestätigt das Urteil des
Audits vom 2026-11-06.

## Nicht geprüft

- Marken- und Entitätssignale außerhalb der Seite (Wikipedia, Reddit, YouTube, LinkedIn, Erwähnungen, Backlinks, Sichtbarkeit
  in ChatGPT oder Perplexity). Der Hostname ist nicht öffentlich, darum ging weder Name noch Host an einen fremden Dienst.
  Keine Schätzung.
- Wie OAI-SearchBot, Claude-SearchBot und PerplexityBot `noindex` behandeln; nur aus Dokumentationswissen, nicht gemessen.
- Serverprotokolle zu tatsächlichen Bot-Besuchen gibt es nicht (keine Zugriffsprotokolle).
- Die übrigen 25 Frageseiten nur über die Crawl-Liste (Überschriften, Wortzahl), nicht einzeln gelesen.
- Darstellung der Formeln mit `output: 'mathml'` in echten Browsern.
- Rechtliche Bewertung der Lizenzangabe für die Zitate.
