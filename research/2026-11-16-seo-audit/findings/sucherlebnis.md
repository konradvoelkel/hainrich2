# Sucherlebnis (SXO), 16.11.2026

Frage: Wenn `noindex` fällt, bekommt dann jemand, der über eine Suchmaschine auf einer Seite unter `/eidl/` landet,
was er gesucht hat? Die Vorschau, das Banner und die leere Sitemap sind Absicht und hier kein Befund.

**SXO-Gap-Score bei Freigabe: 60 von 100** (getrennt von jedem SEO-Health-Score).

| Dimension | Punkte | Begründung |
|---|---|---|
| Seitentyp | 12/15 | Frageseiten passen zu langen „Warum …?“-Suchen. Kapitelseiten sind dünn. |
| Inhaltstiefe | 11/15 | Antworten sind fachlich dicht. `f/s12/` nennt den Kern erst im letzten Absatz. |
| Nutzerführung | 7/15 | Frageseiten sind Sackgassen. Der Kurscode wird Fremden nicht erklärt. |
| Strukturierte Daten | 6/15 | Nur `BreadcrumbList`. Kein Frage-Antwort-Typ. |
| Medien | 7/15 | Formeln sauber gesetzt, aber keine Abbildung auf den Frageseiten. Formeln fehlen in Titel und Beschreibung. |
| Vertrauen | 10/15 | Wörtliches Zitat mit Link ins Skript, Bot offen gekennzeichnet, Badge „geprüft“, Moderation mit Namen. |
| Aktualität | 7/10 | Datum an jeder Frage und Antwort. Kein Hinweis, auf welchen Skriptstand sich das Zitat bezieht. |

## 1. Fünf Frageseiten gegen die Suchergebnisse

Gesucht wurde mit allgemeinen deutschen Anfragen. Weder Host noch Name gingen an die Suchmaschine. Das Suchwerkzeug zeigt
die Liste der Treffer, keine SERP-Features (Featured Snippet, KI-Übersicht, „Ähnliche Fragen“).

### `f/s09/`: Logarithmus der Odds statt Wahrscheinlichkeit

- Anfrage: „logistische Regression warum Log Odds linear modellieren statt Wahrscheinlichkeit“
- Absicht: verstehen, Prüfungsvorbereitung. Phase: Bewusstsein und Vertiefung.
- Was rankt: Tutorials und Glossare (DataCamp auf Deutsch, IBM, flowhunt-Glossar), eine Kurseinheit der Uni Göttingen, das Buch
  „Interpretable ML“. Meist Englisch, meist lange Gesamtdarstellungen der logistischen Regression, die die Warum-Frage nur nebenbei
  beantworten.
- Passung: **gut.** Die Antwort steht im ersten Satz („eine lineare Funktion nimmt beliebige reelle Werte an, eine Wahrscheinlichkeit
  aber nicht“) und ist auf dem Handy im ersten Bildschirm sichtbar (`bilder/frage-mobil.png`). Eine knappe deutsche Seite genau zu dieser
  Frage hat eine echte Chance.
- Bruch: Der Titel endet vor dem Kern: „Warum modelliert man den Logarithmus der Odds … | hAInrich2“. „linear“ und
  „Wahrscheinlichkeit“ fehlen. Die Beschreibung ersetzt `w·x+b` durch „…“. Die Seite hat 2959 Wörter, gut drei Viertel davon sind
  Zitatblöcke.

### `f/s12/`: Warum rückwärts ableiten

- Anfrage: „Backpropagation warum rückwärts statt vorwärts Ableitung“
- Absicht: verstehen. Gesucht ist das Effizienzargument.
- Was rankt: viele deutsche Glossar- und KI-Blogseiten (mind-verse, metricgate, llmbase, studysmarter, hyper.ai, eine Seite mit dem
  Titel „Warum Backpropagation rückwärts laufen muss“) und auf Englisch der Blogbeitrag „Why Backprop Goes Backward“. Die Treffer sagen
  einhellig: Rückwärts kostet ein Gradient aller Gewichte etwa so viel wie ein bis zwei Vorwärtsdurchläufe. Vorwärts bräuchte man einen
  Durchlauf pro Parameter.
- Passung: **Seitentyp ja, Aufbau nein.** Die Konkurrenz auf Deutsch ist schwach. Aber die Antwort beginnt mit fünf Stichpunkten
  (Kettenregel, Vorgehen im Skript, Wiederverwendung, Pfadsumme, PyTorch). Der eigentliche Grund („effizienter, um eine Funktion
  ℝⁿ→ℝ wie den Loss abzuleiten“) steht im letzten Absatz, auf dem Handy mehrere Bildschirme tief. Die Kostenaussage in Zahlen fehlt.
  Die Beschreibung beginnt mit einem Markdown-Strich: „- Grundlage ist die Kettenregel. Es gilt ….“

### `f/s23/`: Ausgabegröße einer Conv2d-Schicht

- Anfrage: „Conv2d Ausgabegröße berechnen Padding Stride“
- Absicht: ein Fehler im eigenen Code, schnell eine Formel. Praktisch, nicht Prüfung.
- Was rankt: Lehrbuch d2l.ai (mehrfach), PyTorch-Doku, machinelearningmastery, leyaa.ai, apxml. Format: Formel plus durchgerechnetes
  Beispiel. Fast alles Englisch.
- Passung: **sehr gut.** Die Formel steht im ersten Satz, danach das MNIST-Beispiel mit Code. Das ist genau das Format der Treffer, und
  eine deutsche Seite dazu ist selten. Bruch: Die Beschreibung ersetzt die Formel durch „…“. Das Zitat wiederholt die Antwort fast
  wörtlich, die Seite ist dadurch doppelt so lang wie nötig.

### `f/s15/`: XOR mit einem Neuron

- Anfrage: „warum kann ein einzelnes Neuron kein XOR lernen“
- Absicht: verstehen, Klassiker der Prüfung.
- Was rankt: Folien und Skripte von Hochschulen (PDF), englische Lernseiten zum „XOR problem“, ein Forschungsartikel. Fast alle zeigen
  das Bild mit vier Punkten und einer Geraden, die nicht trennen kann.
- Passung: **mittel.** Seitentyp passt, aber die Seite hat keine Abbildung. Die Treffer leben vom Bild. Die Beschreibung ist kaum lesbar:
  „Ein einzelnes Neuron (Perzeptron) berechnet …. Geometrisch beschreibt die Gleichung … eine Hyperebene H in … (in …: eine Gerade)“.
  Gegen Hochschulfolien und Wikipedia-artige Seiten hat die Seite nur über die genaue Formulierung eine Chance.

### `f/bf8ec38f9c86/`: Keras statt PyTorch (echte Frage einer Studentin oder eines Studenten)

- Anfrage: „Keras oder PyTorch lernen was ist besser“
- Absicht: Entscheidung, Vergleich.
- Was rankt: Vergleichsartikel und Listen (Coursera, stackshare, GeeksforGeeks, hackr.io, deepsense.ai), fast alle Englisch.
- Passung: **Fehlpassung, Schwere HOCH für diese Anfrage.** Die Suche will einen Vergleich mit Kriterien. Die Seite hat drei kurze Absätze
  der Moderation, 163 Wörter, ohne Zitat und ohne Beleg für „über 80 % des Forschungscodes“. Als Antwort im Kurs ist sie richtig.
  Als Landeseite aus der Suche verliert sie. Kein Handlungsbedarf außer: nicht als Suchziel einplanen.

### Wo die Seite nicht gewinnen kann

Bei Begriffsanfragen („Backpropagation“, „Logistische Regression“) gewinnen Wikipedia, Lehrbücher, Hochschulfolien und Videos. Diese
Formate kann die Seite nicht sein. Chancen bestehen bei langen, genauen Warum- und Wie-Fragen auf Deutsch (`f/s09/`, `f/s12/`,
`f/s23/`), wo die deutschen Treffer oft dünne KI-Glossare sind.

## 2. Personas und ihr Weg

### A. Studentin im Kurs, kommt aus ILIAS auf die Startseite (Handy)

Erster Bildschirm (`bilder/start-mobil.png`): Banner, H1, ein Satz zur Idee, Suchfeld, Knopf „Frage stellen“. Gut. Sie tippt, die
Suche lädt beim ersten Klick rund 24 MB. Das steht da, aber im Mobilnetz ist das eine Hürde vor dem ersten Treffer. Kein Treffer:
„Diese Frage stellen“ führt zum Kurscode, den sie hat. Nach dem Lesen einer Antwort kommt sie nur über den Pfad ins Unterforum zurück,
nicht zu ihrem Kapitel.

User Story: Als Studentin vor der Klausur will ich zu meinem Kapitel alle Fragen sehen, damit ich nicht dieselbe Frage noch einmal stelle.
Signal: Die Suche „Backpropagation Fragen und Antworten Klausur“ findet keine Sammlung von Fragen, nur Folien und Glossare.

### B. Lernender von außen, kommt aus der Suche auf `f/s12/` (Handy)

Er sieht: Header mit Slogan, Pfad, Kasten „Frage“ mit H1, dann den Bot-Kasten. Auf `f/s09/` und `f/s23/` ist die Antwort im ersten
Bildschirm. Auf `f/s12/` sieht er „Grundlage ist die Kettenregel“ und muss fünf Stichpunkte lesen, bis der Grund kommt. Danach folgen
lange Blöcke „Originaltext aus dem Skript“ mit Herleitungen. Am Ende kommt nur der Footer. Kein Link „Mehr Fragen zu Backpropagation“,
keine verwandte Frage. Der Kapitelname im Pfad und unter der H1 ist reiner Text. Der einzige Weg weiter führt aus der Seite hinaus ins
Skript. Wer doch „Frage stellen“ findet, steht vor dem Feld „Kurscode aus ILIAS“ ohne Erklärung.

User Stories:
- Als Lernender will ich im ersten Absatz den Grund lesen, damit ich nicht scrollen muss. Signal: Alle Treffer zu dieser Anfrage nennen das
  Effizienzargument sofort.
- Als Lernender will ich nach der Antwort die nächste verwandte Frage sehen, damit ich weiterlerne, statt zurück zur Suche zu gehen. Signal:
  Die Konkurrenz (d2l.ai, Lernplattformen) verlinkt den nächsten Abschnitt.
- Als Lernender will ich bei XOR das Bild sehen. Signal: Fast jeder Treffer zu „XOR einzelnes Neuron“ zeigt die vier Punkte.

### C. Kollege, der Lehre macht

Er will wissen, was das ist und wie verlässlich. Er findet die Hinweise „Beispielfrage“, „geprüft“, „Diese Antwort hat ein Sprachmodell
erzeugt“, den Footer „privates Angebot“ und die Seite `ueber/`. Das schafft Vertrauen. Was fehlt: auf der Frageseite der Stand des
Skripts, aus dem zitiert wird.

### Bewertung je Persona (Relevanz, Klarheit, Vertrauen, Handlung, je 25)

| Persona | R | K | V | H | Summe | Schwächste Stelle |
|---|---|---|---|---|---|---|
| B. Lernender aus der Suche | 20 | 14 | 19 | 8 | 61 | Kein Weg weiter, Kern zu spät bei `f/s12/`, Kurscode-Wand |
| A. Studentin im Kurs | 22 | 18 | 20 | 16 | 76 | Kein Weg von der Frage zum Kapitel |
| C. Kollege | 18 | 19 | 21 | 15 | 73 | Skriptstand nicht sichtbar |

## 3. Kapitelseiten und Unterforen

Die 29 Kapitelseiten (`f/kapitel/<id>/`, 137 bis 181 Wörter) sind **Navigation**, keine Landeseiten. `f/kapitel/backpropagation/`
hat eine einzige Frage. Der Titel „Fragen zu „Backpropagation“ | hAInrich2“ passt zur Suche „Backpropagation Fragen“, aber dort ranken
Folien, Skripte und Glossare, und eine Liste mit einer Frage befriedigt niemanden. Die Kapitelseite wird schon mit einer einzigen
geprüften Frage auf `index,follow` gestellt (`kapitelPage` in `lib/site.js`). Für die Rolle als Landeseite fehlen: zwei bis drei Sätze
zum Kapitel (am besten der wörtliche Anfang des Skriptkapitels), mehrere Fragen und eine Antwortvorschau in der Liste. Ohne das: bis
mindestens drei geprüfte Fragen auf `noindex` lassen.

Die vier Unterforen (`f/grundlagen/` usw.) sind Hubs mit Liste und Kapitelliste. Als Suchziel taugen sie nicht, als Verteiler sind sie
richtig. Sie sind derzeit der einzige Link von der Frageseite nach oben.

## 4. Der Fragepfad ohne Kurscode

Der Knopf „Frage stellen“ steht für alle sichtbar auf Startseite, Unterforen und Kapitelseiten, auf der Kapitelseite ganz oben. Er führt
auf `f/neu/`. Dort stehen der Hinweis auf die Suche und das Feld „Kurscode aus ILIAS“ (`bilder/neu-mobil.png`). Dass nur Kursteilnehmende
fragen können und dass Lesen für alle offen ist, steht nur auf `ueber/`. Wer von außen kommt, merkt das erst, wenn er keinen Code hat.
Was er stattdessen tun kann (suchen, im Skript lesen, Inhalt melden), sagt die Seite nicht. Schwere MITTEL. Formulare wurden nicht
abgeschickt, die Schritte nach dem Code sind nicht geprüft.

## 5. Änderungen, nach Wirkung auf den Erfolg eines Suchenden

1. **Frageseite ist keine Sackgasse mehr (HOCH).** Den Kapitelnamen im Pfad und unter der H1 auf `f/kapitel/<id>/` verlinken. Unter der
   Antwort, vor den Zitaten, „Weitere Fragen zu <Kapitel>“ mit zwei bis vier Fragen desselben Kapitels. Die Auswahl nach Kapitel und
   Punkten reicht. Woran man es merkt: in `crawl.json` hat jede Frageseite mindestens einen eingehenden Link von einer anderen Frageseite
   und einen Link auf ihre Kapitelseite. Später in der Search Console: mehr Seiten pro Sitzung bei Einstiegen auf `f/s…/`.
2. **Antwort zuerst (HOCH).** Der erste Absatz jeder Antwort beantwortet die Frage in ein bis zwei Sätzen, Begründung danach. Bei
   `f/s12/` heißt das: das Effizienzargument nach oben, mit der Kostenaussage (ein Rückwärtsdurchlauf für alle Gewichte statt ein
   Durchlauf pro Gewicht). Das kann die Moderation bei der Freigabe prüfen oder der Prompt fordern. Woran man es merkt: die Beschreibung
   von `f/s12/` beginnt nicht mehr mit „- “, und bei einem Blick auf alle Frageseiten steht der Kern im ersten Bildschirm am Handy.
3. **Titel und Beschreibung ohne Auslassungen (MITTEL).** Ein kurzer Titel je Frage, den die Moderation festlegt (z. B. „Warum
   Backpropagation rückwärts rechnet“, „Logit statt Wahrscheinlichkeit: warum linear in den Log-Odds“), statt der gekürzten H1. Die
   Beschreibung aus dem ersten Satz ohne Formel, sonst aus einem Kurztext. Betrifft `f/s09/`, `f/s12/`, `f/s15/`, `f/s23/` und weitere.
   Woran man es merkt: kein Titel und keine Beschreibung in `crawl.json` enthält „…“. Später: die Klickrate je Seite in der Search Console.
4. **Kurscode-Wand vorher erklären (MITTEL).** Unter jedem Knopf „Frage stellen“ oder direkt über dem Feld auf `f/neu/` ein Satz: „Fragen
   können Teilnehmende des Kurses mit dem Code aus ILIAS. Lesen und suchen kann jede und jeder.“ Dazu Links auf die Suche und das Skript.
   Woran man es merkt: im Smoke-Test steht der Satz auf `f/neu/` ohne JavaScript, und die Zahl der falschen Codes im Log sinkt.
5. **Kapitelseiten erst ab drei Fragen indexieren und mit Einleitung (NIEDRIG).** Die Regel in `kapitelPage` von „mindestens eine“ auf
   „mindestens drei geprüfte Fragen“ ändern und zwei Sätze aus dem Skriptanfang des Kapitels zeigen. Woran man es merkt: keine Kapitelseite
   mit `index` und weniger als drei Fragen in `crawl.json`.

Daneben, kleiner: eine Abbildung bei `f/s15/` (vier Punkte, keine Gerade trennt) und ein strukturierter Typ für Frage und Antwort. Ob
Google `QAPage` oder `DiscussionForumPosting` für Antworten von Bot und Moderation ohne Antworten von Nutzern zulässt, ist offen
(siehe `strukturierte-daten.md`).

## Was nicht geprüft ist

- Keine echten SERP-Features (KI-Übersicht, Featured Snippet, „Ähnliche Fragen“, Videos). Das Suchwerkzeug liefert nur Trefferlisten,
  nicht den Ort Deutschland und nicht das Google-Ranking im Einzelnen.
- Suchvolumen: unbekannt, nicht gemessen.
- Kein Formular abgeschickt, kein Kurscode eingegeben. Alles nach dem Feld „Kurscode“ ist ungesehen.
- Die Suche im Browser (24 MB Modell) wurde nicht ausgelöst.
- Gerendert wurden `f/s09/`, `f/s12/`, `f/s23/` und `f/bf8ec38f9c86/`. `f/s15/` und die Kapitelseiten nur aus `crawl.json`, den Bildern und
  dem Quelltext.
- Die Anfragen an den Host: vier Renderläufe im Browser laden je Seite Schriften, Skripte und Bilder mit (laut `perf.txt` bis 13 Anfragen
  je Frageseite). Das sind geschätzt 30 bis 50 Anfragen, vermutlich über der Grenze von etwa 30, alle GET.
