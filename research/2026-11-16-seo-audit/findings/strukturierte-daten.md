# Strukturierte Daten, Stand 2026-11-16

Score als Bereitschaft für das Ende der Vorschau: 72 von 100.

## Was vorhanden ist (aus crawl.json, alle 100 Seiten, und f/s09/ live)
- 64 BreadcrumbList, 1 WebSite (Startseite). Alle Blöcke parsen als JSON. Kein Block mit `http://`, keine relativen URLs, keine Platzhalter.
- Ausgabe in `lib/site.js` Z. 78: `<` wird zu `<` maskiert. Das ist richtig, ein `</script>` im Text kann den Block nicht beenden.
- Nicht bestätigt: Google-Validierung. Das ging ohne Drittdienst nicht.

## Prüfung je Block
**BreadcrumbList: bestanden.**
- 60 Pfade mit 3 Stufen (Forum > Unterforum > Seite), 4 mit 2 Stufen. Jede Stufe außer der letzten hat `item` mit absoluter URL. Die letzte hat keins. Das ist nach Googles Doku zulässig.
- Der sichtbare Pfad (`nav.pfad` auf f/s09/) stimmt mit dem Block überein: Forum > Lernen und Training > Logistische Regression.
- Auffällig, kein Fehler: Die letzte Stufe trägt den Kapitelnamen, nicht die Frage (H1). Der Pfad zeigt ebenfalls den Kapitelnamen, also stimmen Markup und Sichtbares überein.
- Positionen laufen ab 1 ohne Lücke. `inLanguage` ist an Breadcrumbs nicht vorgesehen.

**WebSite: formal bestanden, inhaltlich dünn.**
- `name`, `url`, `inLanguage: de`, `description`, `publisher` sind da.
- Kein `potentialAction`. Das ist richtig. Die Suche läuft im Browser ohne URL-Parameter, ein SearchAction mit `urlTemplate` wäre falsch. Google zeigt die Sitelinks-Suchbox ohnehin nicht mehr.
- Der Name "hAInrich2" ist der Entwurfsname. Vor der Freigabe prüfen, ob er der öffentliche Name sein soll. Er steht auch in `og:site_name` und `<title>`. Für Google ist `name` plus `alternateName` die Quelle des Site-Namens. Gleiche Schreibweise überall halten.
- Mittel: `publisher` nutzt Person mit `name` und `url` (www.konradvoelkel.com). Das ist die einzige Person im Graphen. Richtig, weil der Betreiber privat verantwortlich ist, nicht die HHU. Es fehlt `@id`, daher kann man die Person nicht von Antworten aus referenzieren.

**Person:** Nur eingebettet als `publisher` der WebSite, kein eigener Knoten. Gut so. Keine Organization erfinden, die HHU ist nicht Betreiber. Kein `sameAs`, kein Bild. Beides ist optional.

**Fehlend ohne Schaden:** ueber/, f/neu/ (29 Varianten), impressum, datenschutz, nutzungsbedingungen haben kein JSON-LD. Das ist richtig. Optional: BreadcrumbList auf ueber/ (2 Stufen). Nutzen klein.

## Empfehlung QAPage

**Einschätzung: markieren, aber nur mit offenem Ausgang. Sicherheit mittel bis gering.**

Eignung nach Googles Richtlinien (soweit mir bekannt):
- QAPage-Doku verlangt: eine Frage pro Seite, Nutzer können Antworten abgeben. Hier können Leser nicht antworten. Das Feld schließt die Seite nach dem Wortlaut aus.
- Education Q&A ist ein anderes Feature (Quiz mit Flashcards). Es passt zu Frage-Antwort-Paaren aus einem Lehrtext nur grob und war an Englisch und bestimmte Anbieter gebunden. Dass diese Ausnahme für ein deutsches Forum mit Bot-Antworten gilt, ist nicht belegt.
- Wahrscheinlich: Google zeigt kein Q&A-Rich-Result. Das Markup bleibt als Maschinenlesbarkeit gültiges schema.org.
- Nicht geprüft: aktuelle Doku-Fassung von Mai bis November 2026, und ob Google die Q&A-Anzeige noch ausspielt. Das bräuchte Googles Werkzeuge oder die Live-Doku. Ich habe beides nicht benutzt.

Risiken beim Markieren von Bot-Antworten:
1. Markup muss dem sichtbaren Inhalt entsprechen. Nur Antworten markieren, die sichtbar sind und das Abzeichen "geprüft" tragen. Ungeprüfte nicht markieren.
2. Autor ehrlich angeben. Nie die Moderation als Autor eines Bot-Textes. Bot-Antwort: `author` als Organization/Software mit Namen "Claude (Anthropic), geprüft von Moderation". Moderationsantwort: `author` als Person (Verweis auf die Person per @id).
3. `digitalSourceType` ist in schema.org an Bild/Medien-Typen definiert (IPTC-Wert `https://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia`). Ob es an `Answer` gültig ist, habe ich nicht bestätigt. Ich würde es weglassen und stattdessen im `author`-Namen und im sichtbaren Hinweis die KI-Herkunft nennen. Das Hinweisfeld der Seite ("Diese Antwort hat ein Sprachmodell erzeugt") ist schon da.
4. `upvoteCount`: Die Seite liefert statisch "0" und lädt die Stimmen per Skript nach. Nur ausgeben, wenn der Build dieselbe Zahl hat, sonst weicht Markup von der Anzeige ab. Sicherer: weglassen.
5. Datumsangaben: Sichtbar steht nur "04.11.2026", ohne `<time>`. `dateCreated` kann ISO 8601 aus der Datenbank kommen. `dateModified` nur, wenn die Moderation bearbeitet hat.
6. Mathe: `text` als Klartext mit LaTeX-Quelle (die `annotation`-Texte), nicht KaTeX-HTML.
7. Mehrere Antworten (Bot und Moderation) gleichzeitig: Moderation als `acceptedAnswer`, Bot als `suggestedAnswer`. Gibt es nur eine geprüfte Bot-Antwort, ist `acceptedAnswer` vertretbar, weil die Moderation sie freigegeben hat.
8. `citation`: Das Skriptzitat gehört an die Antwort als `citation` (CreativeWork mit `url` und `name`). Die Zitat-Links der Seite (mit `:~:text=`-Fragment) sind absolute URLs. Für das Markup die Adresse ohne Textfragment nehmen.

### Beispiel (f/s09/, nur zur Prüfung vor Einsatz, nicht ausgespielt)
```json
{
  "@context": "https://schema.org",
  "@type": "QAPage",
  "inLanguage": "de",
  "mainEntity": {
    "@type": "Question",
    "name": "Warum modelliert man den Logarithmus der Odds linear und nicht direkt die Wahrscheinlichkeit?",
    "text": "Warum modelliert man den Logarithmus der Odds linear und nicht direkt die Wahrscheinlichkeit?",
    "answerCount": 1,
    "dateCreated": "2026-11-04T00:00:00+01:00",
    "author": {"@type": "Person", "@id": "https://hai.konradvoelkel.com/eidl/#betreiber"},
    "acceptedAnswer": {
      "@type": "Answer",
      "url": "https://hai.konradvoelkel.com/eidl/f/s09/#b2",
      "text": "Eine lineare Funktion w \\cdot x + b nimmt beliebige reelle Werte an, eine Wahrscheinlichkeit aber nicht. [...]",
      "dateCreated": "2026-11-04T00:00:00+01:00",
      "author": {"@type": "Organization", "name": "hAInrich2-Bot (Claude von Anthropic), von der Moderation geprüft"},
      "citation": {
        "@type": "CreativeWork",
        "name": "Logistische Regression › Lineare Regression zur Klassifikation",
        "url": "https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de/logistische-regression/#lineare-regression-zur-klassifikation"
      }
    }
  }
}
```
Hinweise: Autor der Frage in Wirklichkeit unbekannt (Studierende anonym, Beispielfragen vom Betreiber). Bei anonymen Fragen `author` weglassen. Die Datumswerte oben sind aus dem sichtbaren Datum abgeleitet, die Uhrzeit ist erfunden: im Build das echte Datum aus der Datenbank nehmen. `[...]` im Text durch den vollen Antworttext ersetzen. Bei Beispielfragen ("Beispielfrage"-Abzeichen) ist die Anzeige selbst als Beispiel gekennzeichnet; erwägen, diese nicht zu markieren.

## Empfehlung 2: Person als eigener Knoten mit @id
Gleich zu QAPage nötig, sonst nicht. Auf der Startseite die Person aus dem `publisher` herauslösen:
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "WebSite", "@id": "https://hai.konradvoelkel.com/eidl/#website", "name": "hAInrich2", "url": "https://hai.konradvoelkel.com/eidl/", "inLanguage": "de",
     "publisher": {"@id": "https://hai.konradvoelkel.com/eidl/#betreiber"}},
    {"@type": "Person", "@id": "https://hai.konradvoelkel.com/eidl/#betreiber", "name": "Konrad Völkel", "url": "https://www.konradvoelkel.com"}
  ]
}
```
(Die Beschreibung weglassen oder aus dem Original übernehmen.) Der Wert ist klein. Nur machen, wenn QAPage kommt.

## Andere Typen, je eine Zeile
- Organization: nein. Betreiber ist eine Privatperson, die HHU ist es nicht.
- LearningResource / Course: nein. Die Seiten sind Fragen, nicht der Kurs. Der Kurs liegt auf der Skript-Seite.
- Quiz / Education Q&A: nein. Keine Karteikarten, kein Prüfungsformat.
- Article / BlogPosting / NewsArticle: nein. Es gibt keine Artikel.
- DiscussionForumPosting: nein, wie schon im Audit vom 06.11. entschieden (Leser schreiben keine Antworten, Bot-Inhalt).
- FAQPage: nein. Google zeigt kein Rich-Result mehr.
- ItemList für die Unterforum-Tabellen: nein, kein Rich-Result.

## Prüfung ohne Drittdienst
1. Lokal: Seiten bauen, mit `node site/build.mjs`, dann aus jeder Seite alle `ld+json`-Blöcke ziehen und mit `JSON.parse` prüfen. Kleinen Test in `npm test` aufnehmen: pro Frageseite genau ein QAPage, Frage-Text gleich dem H1, `acceptedAnswer.url` zeigt auf ein existierendes `id` (`#b2`), alle URLs absolut und mit `https://`, kein Block ohne sichtbares Gegenstück.
2. Parität: Test, dass der `text` der Antwort im sichtbaren Antworttext vorkommt (nach Entfernen von KaTeX-HTML).
3. Auflösung: Jede Breadcrumb-`item`-URL per HEAD gegen den Server (`SMOKE_URL`) prüfen. Mein Befund: Alle 64 Blöcke haben absolute URLs, der Pfad stimmt mit dem sichtbaren Pfad bei f/s09/. Einen vollen HEAD-Lauf aller Item-URLs habe ich nicht gemacht (Anfragenlimit).
4. Nach Aufhebung von `noindex`: Search Console, Bericht "Verbesserungen". Das ist Googles Werkzeug und sieht die Adresse. Das Eigentümerentscheidung.

## Nicht geprüft
- Google-Rich-Results-Test und Googles aktuelle Doku zu QAPage und Education Q&A (Datenschutzregel, keine Online-Prüfung).
- `digitalSourceType` an Answer gegen schema.org (aus dem Gedächtnis, unsicher).
- Alle Breadcrumb-URLs per HEAD.
- Fragen mit Moderationsantwort (Autorenmarkierung als Person).
- ueber/-Seite im Detail (laut Crawl ohne JSON-LD).
