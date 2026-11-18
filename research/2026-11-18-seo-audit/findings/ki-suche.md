# KI-Suche (GEO), Stand 2026-11-18 (vierter Durchgang, erster nach dem Start)

Grundlage: rohes HTML in `seiten/` (29 Frageseiten, Startseite, Über), `crawl.json`, `auszug.txt`, `robots.txt`, `sitemap.xml`,
`lib/site.js`, `lib/render.js`, `site/texte/*.md`. Extraktor: trafilatura 2.3.1 aus der vorhandenen venv, eigenes Wegwerfskript
außerhalb des Repos, nur auf die lokalen Kopien angewandt (Text- und Markdown-Ausgabe mit Metadaten). Von Hand gelesen: s09, s10,
s12, s25, s29, `bf8ec38f9c86`, Über, Startseite; maschinell alle 29. Kein Abruf des Hosts, kein Netz.

## 1. Gegen gestern (Bericht vom 17.11.)

| Nr. | Punkt | Stand | Beleg |
|---|---|---|---|
| N1 | Frage fehlt im Auszug | **behoben** | 29/29 Auszüge beginnen mit der H1-Frage (eigene Messung, deckt sich mit `auszug.txt`) |
| N2 | Erster Satz antwortet nur bei 14/29 | anders | 15/27 Beispielfragen direkt (s20, s21 neu formuliert, gut); s03, s07, s10, s11, s17, s24 an die Frage gebunden; s05, s12, s14, s15, s22 erst Vorlauf; s29 Absage. Ziel ≥ 24 nicht erreicht |
| N3 | Zitatblock, `data-nosnippet`, Marken, Formeln | anders | Zitate jetzt in `section.zitate > aside`, fallen aus dem Auszug (unten N2, N3). Formeln: 29/29 sauberes TeX, kein KaTeX-HTML mehr im Auszug (gestern 9/29 dreifach) |
| N4 | Prüfung fehlt im JSON-LD | **behoben**, Rest offen | `reviewedBy` → `#betreiber` und `lastReviewed` an jeder `QAPage`. Offen: `Answer` ohne `dateCreated` (0/29), `citation` ohne `author` (0/29), Autor des Bots weiter Freitext „…, von der Moderation geprüft“ (`lib/site.js:195`), Person ohne `sameAs` |
| 5a | `<blockquote cite>` | offen | s09: 7× `<blockquote>` ohne `cite`. Weiter nachrangig |
| 6 | „geprüft“ neben „Prüfen Sie das Zitat“ | offen, jetzt schärfer | `lib/site.js:365`; der Satz steht in 28/28 Bot-Auszügen, das Zitat selbst in keinem (unten N3) |
| N5 | Rechtstexte zu Training durch Dritte | offen | `datenschutz-fragen.md:25` unverändert; Nutzungsbedingungen sagen nur „werden öffentlich“ |
| N6 | `llms.txt` lohnt nicht | unverändert | unten N6 |
| N7 | Prüfvermerk ohne Datum | **behoben** | „Geprüft am 05.11.2026 von Konrad Völkel, Autor des Skripts.“ steht in 28/28 Bot-Auszügen direkt unter der Frage |
| – | Skript verlinkt das Forum | erledigt (anders als vorgeschlagen) | Links zeigen auf Kapitelseiten mit `noindex`; Folgen unten N5 |

## 2. Neue Befunde

### Hoch

**N1. Was ein Modell jetzt bekommt: Frage, Prüfvermerk, ganze Antwort, Kennzeichnung. Das ist der große Schritt.**
Auszug s10 (gekürzt): H1-Frage → „Geprüft am 05.11.2026 von Konrad Völkel, Autor des Skripts.“ → Antwort in voller Länge mit
`\(…\)`-TeX → „Diese Antwort hat ein Sprachmodell erzeugt (Claude von Anthropic). Prüfen Sie das Zitat.“ → „Originaltext aus dem
Skript“ → Lizenzzeile. Gemessen an allen 29: Frage vorn 29/29, Prüfvermerk mit Datum 28/29 (fehlt nur bei `bf8ec38f9c86`, die
Moderationsantwort trägt keinen), KI-Hinweis 28/28 Bot-Antworten, KaTeX-Reste 0/29. Der Hinweis auf das Sprachmodell steht
allerdings **hinter** der Antwort; „hAInrich2 · Bot“ aus `aside.autor` fällt weg. Ein Modell, das nur die ersten 150 Wörter
nimmt, sieht „vom Skriptautor geprüft“, aber nicht „von Claude geschrieben“. Tun (klein): Den Prüfvermerk erweitern zu
„Antwort eines Sprachmodells (Claude), geprüft am … von …“; dann trägt die erste Zeile nach der Frage beides. Sichtbar daran,
dass der Auszug die Kennzeichnung vor dem ersten Antwortsatz hat.

**N2. Der Beleg ist aus dem Auszug verschwunden, der Wortlaut des Skripts nicht: er steht unmarkiert in der Antwort.**
Mit dem `<aside>` fehlen im Auszug alle Zitate samt Link (Kapitel, Abschnitt, Textfragment). Was bleibt: die Überschrift „Originaltext
aus dem Skript“ ohne Text darunter, „Aus dem Skript „Einführung in Deep Learning“ von Konrad Völkel“ ohne Kapitel und ohne URL, und
in 28/28 Bot-Antworten 4–11 Marken `[1]`…`[11]` ohne Ziel (Markdown-Ausgabe: `\[1\]`). „Kapitel … im Skript lesen“ (`nav.weiter`)
fällt ebenfalls weg; nur 2 von 27 Auszügen nennen überhaupt ein Kapitel. Zugleich habe ich gezählt, wie viel der Antwort wörtlich
im Zitatblock steht (8-Wort-Folgen, ohne Formeln): **24 % bis 78 %, Median 51 %**, ohne Anführungszeichen und ohne `<q>`
(s10 78 %, s15 74 %, s24 73 %, s25 70 %). Beispiel s25: „Das Skript beschreibt das Pretraining ausdrücklich als optional: Nach
einem optionalen Pretraining (z.B. als Decoder …) wird der Generator … trainiert (Finetuning).[1]“ ist ab dem Doppelpunkt Skripttext.
Im HTML ist das durch die Marke noch erkennbar; im Auszug liest ein Modell es als Satz des Bots.
Gewonnen hat der Umbau: stabiler Hauptpfad bei 29/29 (die Frage!), kein doppelter Text, Antwort statt Zitatlast vorn.
Verloren: die Quelle als URL und die Grenze zwischen Zitat und Erklärung. Für die Zitierbarkeit der Forumsseite selbst ist das
verkraftbar (die Seite wird als URL zitiert); für die Glaubwürdigkeit „belegt“ fehlt dem Modell der Beleg.
Tun, nach Aufwand: (a) eine Textzeile direkt unter dem Prüfvermerk, nicht im `aside`: „Grundlage: Skript „Einführung in Deep
Learning“, Kapitel X, Abschnitte Y, Z“ mit Links; (b) wörtliche Stellen in der Antwort mit „…“ oder `<q cite>` markieren (Prompt
oder Renderer); (c) Marken im Auszug hinnehmen oder als `<sup><a>` lassen, sie sind Rauschen, kein Fehler. Sichtbar daran, dass
der Auszug Kapitel und URL nennt und Zitate als Zitate erkennbar sind.

### Mittel

**N3. „Prüfen Sie das Zitat“ zeigt im Auszug ins Leere.** Der Satz steht in 28/28 Auszügen, das Zitat in keinem, und er steht
neben „Geprüft am … von Konrad Völkel“. Ein Modell, das die Seite zusammenfasst, bekommt zwei Signale, die sich widersprechen
(„geprüft“ / „bitte selbst prüfen“). Tun: bei geprüften Antworten den Satz weglassen oder zu „Die Zitate stehen unter der Antwort“
ändern (`lib/site.js:365`).

**N4. Zitierbarkeit der Antworten (erster Satz, Geschlossenheit).** Absätze sind weiter gut bemessen (Antworten 146–304 Wörter).
Gut, für sich zitierbar:
- s01 „Die Lernrate ist ein Hyperparameter, kein Parameter.“
- s25 „Nein, ein Autoencoder-Decoder ist keine Voraussetzung.“ (nur mit Frage verständlich, die steht jetzt aber davor)
- s09 „Eine lineare Funktion \(w \cdot x + b\) nimmt beliebige reelle Werte an, eine Wahrscheinlichkeit aber nicht.“
Schwach:
- s10 „Ja, genau so ist es.“ (die eigentliche Aussage „aus dem Produkt wird per Logarithmus eine Summe“ steht im dritten Satz)
- s12 „Grundlage ist die Kettenregel.“ als Listenpunkt; der Grund (rückwärts ist für \(\mathbb{R}^n \to \mathbb{R}\) billiger) steht als letzter Absatz
- s29 „Die Skriptpassagen vergleichen SGD und Adam nicht hinsichtlich der Generalisierung.“ (bekannt, Text des Betreibers)
Dazu s24 „Ja, genau: Bei Temperature Scaling: Seien …“ (zwei Doppelpunkte, Zitat ohne Übergang) und in s25 derselbe Inhalt zweimal
hintereinander („Nach dem GAN-Training passen die beiden Teile allerdings nicht mehr zusammen: Nach dem GAN-Training des Decoders
passen Encoder und Decoder aber nicht mehr zusammen …“). Tun: redaktionell bei s10, s12 den Kernsatz nach vorn; s25 die Doppelung.

**N5. Skript oder Forum: wen zitiert ein Modell?** Nachgeprüft ist nur die eine Seite: Die Forumsantworten bestehen zur Hälfte aus
dem Wortlaut des Skripts (N2), der Auszug nennt das Skript als Grundlage ohne URL, und die Zitate verlinken mit Textfragment in
das Skript. Dass das Skript eine `llms-full.txt` hat und aufs Forum verlinkt, habe ich nicht gesehen, nur aus dem Auftrag.
Einschätzung: Für eine Sachfrage („Was ist die Lernrate?“) wird ein Modell das Skript nehmen, wenn es beide findet: gleicher
Wortlaut, Primärquelle, eine Datei mit allem, Autor bekannt. Das ist kein Schaden. Die Forumsseite gewinnt dort, wo **die Frage**
das Suchmuster ist (Formulierung von Studierenden, „Warum rückwärts und nicht vorwärts?“), wo eine Antwort mehrere Kapitel
verbindet (s10, s26) und wo sie sagt, was im Skript **nicht** steht (s29, s22). Genau diese Teile sind die Sätze des Bots, nicht
die Zitate; N2 (b) macht sie unterscheidbar. Die Links vom Skript zeigen auf Kapitelseiten mit `noindex`, die aber `follow` tragen
und alle Frageseiten verlinken: Entdeckung klappt, als Quelle zitiert wird die Kapitelseite nicht. Billig und in eigener Hand:
in der `llms.txt`/`llms-full.txt` des Skripts eine Zeile „Fragen und geprüfte Antworten zum Skript: …/eidl/“; ob ein Anbieter
das liest, ist nicht belegt.

### Niedrig

**N6. `llms.txt`: weiter nicht nötig.** In `seiten/`, `robots.txt` und `sitemap.xml` kommt keine `llms.txt` vor; der Crawl folgt
Links, ein Fehlen am Host ist damit nicht bewiesen. Bei 35 indexierbaren Seiten, SSR-HTML ohne JS-Pflicht, Sitemap mit `lastmod`
und Kapitelseiten als Linkliste bringt sie nach meinem Wissen keinen messbaren Gewinn; keine große Suchmaschine hat zugesagt, sie
zu lesen (nicht nachgeschlagen). Wenn, dann vom Build erzeugt, wie gestern beschrieben.

**N7. Über-Seite und Herkunft.** Auszug der Über-Seite (562 Wörter) sagt klar: Forum zum Skript, Fragen von Nutzern, Antworten
eines Sprachmodells (Claude Opus 5.5), Moderation = Konrad Völkel, Autor des Skripts, geprüft gegen den Skriptstand des Tages,
Prototyp, privat, nicht die HHU, AGPL. Was ein Modell nirgends erfährt: dass das Skript eine **Vorlesung** begleitet und an welcher
Hochschule (das Wort „Vorlesung“ steht nur in einem Zitat in s01; HHU nur verneinend im Fuß und beim Vorgänger hAInrich). Das ist
für Autorität „Lehrmaterial einer Universitätsvorlesung, vom Dozenten geprüft“ das stärkste Signal, das die Site hat, und es fehlt
im Text und im Graph (Person ohne `jobTitle`, `affiliation`, `sameAs`). Tun: ein Satz auf der Über-Seite („Das Skript begleitet
die Vorlesung … von Konrad Völkel an der …“), `sameAs` an die Person. Ob das mit „privates Angebot, nicht der HHU“ verträglich
formuliert werden kann, entscheidet der Eigentümer.

**N8. Kleinigkeiten im Auszug.** Startseite: Überschriften „Diese Fragen liegen am nächsten“ und „Im Skript“ ohne Inhalt (per JS
gefüllt). trafilatura meldet `sitename: Hainrich2` (normalisiert, `og:site_name` ist korrekt `hAInrich2`; Artefakt des Werkzeugs).
Die Moderationsantwort `bf8ec38f9c86` hat im Auszug weder Autor noch Datum, und „über 80% des Forschungscodes“ steht ohne Quelle.
Zitat-Bildunterschriften in s10 und s11 enden auf „Nicht-stochastischer Gradientenabstieg??“ (vermutlich die Überschrift im Skript).

**Crawler-Zugang (nachgeprüft, `robots.txt`).** Nur `User-agent: *`, gesperrt `models/ wasm/ daten/ mod/ api/`. Damit frei:
Googlebot (Suche und AI Overviews), Bingbot (Copilot), OAI-SearchBot (ChatGPT-Suche), Claude-SearchBot, PerplexityBot; ebenso die
Trainings-Crawler GPTBot, ClaudeBot, CCBot, Google-Extended (Gemini-Training und -Grounding), Applebot-Extended, cohere-ai.
Entscheidung des Eigentümers, keine Empfehlung. Ob Antwortmaschinen außer Google `data-nosnippet` achten: nicht belegt.

## 3. Punkte (Einschätzung, keine Messung)

| Teil | Gewicht | 17.11. | 18.11. | Grund |
|---|---|---|---|---|
| Zitierbarkeit | 25 % | 70 | 72 | Frage + Antwort als Paket; erster Satz 15/27; Skriptwortlaut unmarkiert, Marken ohne Ziel |
| Struktur | 20 % | 70 | 86 | Frage vorn 29/29, Prüfvermerk mit Datum 28/29, Formeln sauber |
| Multimodal | 15 % | 45 | 45 | unverändert, für den Inhalt kaum relevant |
| Autorität | 20 % | 82 | 80 | `reviewedBy`/`lastReviewed` gewonnen; Quelle als URL und KI-Hinweis vorn im Auszug verloren, Vorlesung/Hochschule nirgends |
| Technischer Zugang | 20 % | 78 | 86 | indexierbar, Sitemap, alles im rohen HTML, Auszug in einem Pfad stabil |

**Gesamt: gestern 70, heute 75.** Mit N1 (Kennzeichnung vorn) und N2 (a) (Kapitel und URL als Text) etwa 80, mit N2 (b) und N4 darüber.
Grobe Plattformeinschätzung: Google AI Overviews 70 (folgt Googlebot, `data-nosnippet` hält Zitate heraus), Bing Copilot 70,
ChatGPT-Suche 75, Perplexity 75; alle ohne Messung, es gibt noch keine Daten aus der Search Console oder Bot-Protokollen.

## 4. Nicht geprüft

- Andere Extraktoren (Readability, die eigenen der Anbieter); mit reinem `textContent` stünde KaTeX weiter dreifach im Text
  (`lib/render.js:48`, Vorgabe `htmlAndMathml`).
- Die `llms-full.txt` und die Forumslinks des Skripts: fremde Domain, nicht abgerufen. Ob am Host eine `llms.txt` liegt: nicht nachgesehen.
- Ob OAI-SearchBot, Claude-SearchBot, PerplexityBot `data-nosnippet` beachten; Googles aktuelle Doku dazu: nicht nachgeschlagen.
- Marken- und Erwähnungssignale (Wikipedia, Reddit, YouTube, LinkedIn, ChatGPT-Sichtbarkeit): Name und Host gingen an keinen Dienst.
- Ob bereits ein Bot eine Seite geholt hat: keine Serverprotokolle.
