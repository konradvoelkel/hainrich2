# Strukturierte Daten, Stand 2026-11-18 (vierter Durchgang, erster nach dem Start)

Grundlage: rohes HTML in `seiten/` (29 Frageseiten, dazu Startseite, Unterforum, Kapitelseite, Über, Impressum), ein Wegwerf-Skript mit `re` und `json` (nicht im Repo).
Googles Doku und jeden Validator konnte ich nicht nutzen (Regel 2). Was ich über Googles Anforderungen sage, ist Gedächtnis (Stand Frühjahr 2026), als solches gekennzeichnet.

## 1. Gegen gestern (Bericht vom 17.11., Befunde N1 bis N8)

| Punkt | Stand | Beleg |
|---|---|---|
| N1 Kein Test über alle Seiten | offen | Test nicht gelesen, nicht ausgeführt; Prüfung unten läuft als Wegwerf-Skript, nicht als Test. Nach wie vor ein Dutzend Zeilen. |
| N2 Doppelte `citation` | behoben | 0 Dubletten in allen 29 Blöcken. Die Menge der Adressen (ohne `:~:text=`) gleich den sichtbaren Zitatlinks, 29 von 29 (s12: sichtbar 5 Zitate, Markup 3 Adressen, weil zwei Abschnitte doppelt zitiert werden). |
| N3 `Answer.text` ist Markdown | offen | `**…**` und `$…$` stehen weiter im `text` (s. `0cfd2b864eda`); niedrig, kein Rich Result zu erwarten. |
| N4 `upvoteCount` weglassen | bleibt richtig | nicht im Markup. |
| N5a `name` von `0cfd2b864eda` ohne Dollarzeichen | offen | `name` hat „x^2“, `text` hat „$x^2$“; sichtbar die gesetzte Formel. |
| N5b `author` der Beispielfrage nur im Markup | behoben | sichtbar jetzt „von Konrad Völkel“ (Stichprobe s02, s05, s17, s26, s29: je 2 Treffer, Frage und Prüfvermerk). |
| N6 Pfad endet am Kapitel | bleibt, in Ordnung | Frageseite: Forum > Unterforum > Kapitel mit `item`; sichtbar `nav.pfad` ebenso. |
| N7 `AboutPage` auf Über | offen, gleichgültig | Über und Impressum ohne JSON-LD. |
| N8 Zitatmarke im Wort (s22) | nicht geprüft | Bereich Inhalt, heute nicht erneut verglichen. |
| Bot-`Organization` ohne `@id`/`url` | offen | weiter anonymes Objekt, 28 mal wiederholt. |

## 2. Prüfergebnis (29 Frageseiten, je Seite maschinell)

- Alle Blöcke sind gültiges JSON, `@context` überall `https://schema.org`, Typen `QAPage` > `Question` > `Answer` > `CreativeWork` (citation) > `Organization`/`Person`. Keine Platzhalter, keine relativen URLs.
- `mainEntity.text` gleich sichtbarer H1: 29 von 29 (bei `0cfd2b864eda` mit LaTeX-Quelle statt KaTeX-HTML verglichen, Formeltext gleich).
- `name` gleich `text`: 28 von 29; Ausreißer `0cfd2b864eda` (s. N5a).
- `answerCount` gleich Zahl der `article.beitrag.antwort`: 29 von 29 (immer 1).
- `acceptedAnswer.url` zeigt auf `#b2`, vorhanden: 29 von 29.
- `dateCreated` (Frage) gleich `<time datetime>` der Frage: 29 von 29 (mit grep gegen das erste `<time datetime>` der Seite).
- `citation`: keine doppelte Adresse, 29 von 29.

## 3. Neue Befunde

### Niedrig
**S1. `lastReviewed` gleich dem sichtbaren Vermerk: 28 von 28.** Bei jeder Seite mit „Geprüft am TT.MM.JJJJ von …“ steht genau ein Vermerk, und `lastReviewed` ist dieses Datum (05.11., 10.11., 17.11.). Die acht am 17.11. neu erzeugten (s17, s18, s20, s21, s22, s24, s26 und `0cfd2b864eda`) zeigen 17.11. Mehr als einen Vermerk pro Seite gibt es nicht, „jüngster Tag“ ist also eindeutig.
**S2. `bf8ec38f9c86`: `lastReviewed` ohne sichtbaren Vermerk.** Die Antwort ist von der Moderation (`aria-label="Antwort der Moderation"`, `author` verweist auf `#betreiber`), sichtbar stehen nur das Abzeichen „geprüft“ und das Datum 05.11.2026 an der Antwort. Das Markup sagt `lastReviewed: 2026-11-05`, `dateModified: 2026-11-05`, `reviewedBy`: Betreiber. Das Datum ist nicht erfunden (es ist das sichtbare Antwortdatum), aber der Satz „Geprüft am … von …“ fehlt. Zählt als Markup ohne wörtliches Gegenstück; vermutlich harmlos. Zu tun: entweder `reviewedBy`/`lastReviewed` an dieser Seite weglassen (der Verfasser prüft sich selbst) oder den Vermerk wie auf den anderen Seiten zeigen. Eine Entscheidung des Betreibers, keine Technik.
**S3. `reviewedBy`/`lastReviewed` an `QAPage`.** Beide sind Eigenschaften von `WebPage` (`QAPage` ist Unterklasse), also dort zulässig; `reviewedBy` zeigt auf den Personenknoten per `@id`, der im selben Graphen steht. Formal in Ordnung. Ob Google sie auswertet, weiß ich nicht (Gedächtnis: für QAPage nicht in der Doku). Nur Verständlichkeit für andere Verbraucher; nicht ändern.
**S4. `dateModified` an der Antwort.** Steht an s02, s12, s15, s25, s29 und `bf8ec38f9c86`, immer gleich dem Prüfdatum, und an diesen Seiten steht sichtbar „bearbeitet“. Gestern hatte zusätzlich s18, s19, s21, s22, s26 ein `dateModified`; heute nicht mehr, und sichtbar fehlt dort „bearbeitet“ auch (am 17.11. neu erzeugt, nicht von Hand bearbeitet). Konsistent. Was fehlt: `dateCreated` oder `datePublished` an den Antworten. Würde ich nicht ergänzen, das Antwortdatum ist nur als Prüfdatum bekannt (sonst erfunden). Die Antwort ist an den acht neu erzeugten Seiten am 17.11. entstanden, aber die Frage von 04.11.; das Markup lässt die Lücke offen, richtig.
**S5. `author` der Frage.** 27 Beispielfragen: Person `#betreiber`, sichtbar „von Konrad Völkel“, passt. Zwei Testfragen: kein `author`; sichtbar bei `0cfd2b864eda` nur der Prüfvermerk, bei `bf8ec38f9c86` Name nur an der Moderationsantwort. Passt. Antworten des Bots: `Organization` mit Namen „hAInrich2-Bot (Claude von Anthropic), von der Moderation geprüft“, sichtbar „Claude von Anthropic“ und Prüfvermerk. Für `QAPage` verlangt Google nach meiner Erinnerung `author` nur als Empfehlung (Person oder Organization, Name); ob der lange Name Meldungen auslöst, weiß ich nicht. Nicht nachgeschlagen.
**S6. Lizenz.** `license` an der Frage (CC0) und an der Antwort (CC BY-SA 4.0), jeweils gleich dem sichtbaren Absatz am Ende: 29 von 29 Seiten haben „Diese Frage ist gemeinfrei … Antworten … CC BY-SA 4.0“. Auch die zwei Testfragen tragen jetzt beides (gestern keines). `0cfd2b864eda` und die 27 anderen haben im Skript-Absatz (CC BY-SA, „Aus dem Skript … von Konrad Völkel“) einen zweiten Lizenzsatz für das Zitat; er hat kein Markup, passt zu den `CreativeWork`-Zitaten ohne `license`. Kein Fehler.
**S7. `0cfd2b864eda`: `name` ohne Dollarzeichen, `text` mit.** Gleich wie N5a; hier die einzige Seite mit Formel in der Frage. `Answer.text` enthält Markdown (`**Ausgangspunkt:**`, `$x$`). Niedrig.

### Mittel
Keiner. Die Parität (`text` gleich H1, `answerCount`, `#b2`, Zitate, `lastReviewed`) hält an allen Seiten, und der Umbau vom 17.11. hat sie nicht gebrochen.

## 4. Startseite, Pfade
- Startseite: ein Graph, `WebSite#website` (Name, URL, Sprache, Beschreibung, `publisher`) und `Person#betreiber`. `url` gleich dem Canonical `https://hai.konradvoelkel.com/eidl/`. Kein `potentialAction`/`SearchAction` (Suche läuft im Browser): richtig.
- `BreadcrumbList`: Unterforum Forum > Name (letzte Stufe ohne `item`), Kapitelseite Forum > Unterforum > Kapitel (letzte Stufe ohne `item`), Frageseite Forum > Unterforum > Kapitel (mit `item`). Pfade stimmen mit `nav.pfad` und der Verzeichnisstruktur überein (Stichprobe `grundlagen`, `kapitel/backpropagation`, s05, `bf8ec38f9c86`; Adressen mit `https://hai.konradvoelkel.com/eidl/…`, absolut). Die Kapitelseiten sind `noindex`, ihr Markup stört nicht.

## 5. Wo ein Validator warnen würde

Sicher falsch: nichts gefunden.

Vermutlich eine Warnung oder ein Hinweis (alles aus Gedächtnis, nicht geprüft):
1. `QAPage`/`Question` ohne `upvoteCount` und ohne `author` an Testfragen (empfohlene, keine Pflichtfelder).
2. `acceptedAnswer` ohne `upvoteCount`/`dateCreated`.
3. Letzte `BreadcrumbList`-Stufe auf Frageseiten mit `item` ist in Ordnung, auf Kapitelseiten ohne `item` auch.
4. Dass Leser nicht antworten können, ist keine Warnung des Werkzeugs, sondern eine Richtlinienfrage (entschieden, QAPage gewollt).
5. `reviewedBy`/`lastReviewed` an `QAPage`: vermutlich ignoriert, nicht gemeldet.

## 6. Punkte (Einschätzung, keine Messung)
Gestern 86, heute 88. Markup und Sichtbares stimmen an allen Seiten überein, die Dubletten sind weg, Autor und Lizenz stimmen; offen bleiben `bf8ec38f9c86` ohne Vermerk, Markdown im `text`, ein anonymer Bot-Autor und kein Test über alle Seiten.

## 7. Nicht geprüft
- Googles Doku, Rich-Results-Test, Search-Console-Bericht (Regel 2).
- `npm test` und der Test `test/site.test.mjs` (Regel 4).
- Auflösung der Zitat- und Pfadadressen (kein Hostabruf).
- Die Seitenmenge: 27 `sNN`-Seiten (s19 und s27 fehlen) plus beide Testfragen gleich 29; stimmt.
