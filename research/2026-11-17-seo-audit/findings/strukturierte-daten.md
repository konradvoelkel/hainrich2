# Strukturierte Daten, Stand 2026-11-17 (dritter Durchgang)

Punkte als Startbereitschaft: gestern 72, heute 86 von 100 (Einschätzung, keine Messung).
Grundlage: rohes HTML aller 99 Seiten in `seiten/`, ein lokales Python-Skript (Parser aus der Standardbibliothek, im Scratchpad, nicht im Repo).
Nicht möglich: Googles Doku und der Rich-Results-Test (Regel 2). Was ich über Googles Anforderungen sage, ist Gedächtnis (Stand Frühjahr 2026) und als solches gekennzeichnet.

## 1. Gegen gestern

| Punkt vom 16.11. | Stand | Beleg |
|---|---|---|
| Alle Blöcke parsen, kein `http://`, keine relativen URLs, keine Platzhalter | behoben/bleibt | 99 Seiten, 0 Parse-Fehler, `@context` überall `https://schema.org`; 64 BreadcrumbList (33 + 31), 1 WebSite/Person-Graph, 31 QAPage/Person-Graphen |
| `<` im Block maskiert | bleibt | `<` kommt in s24 und einer weiteren Seite vor, die Blöcke parsen trotzdem |
| BreadcrumbList bestanden | bleibt | Positionen lückenlos, jede Stufe außer der letzten mit absolutem `item`, Namen gleich dem sichtbaren `nav.pfad` bei allen 64 |
| Letzte Stufe trägt Kapitelnamen, nicht die Frage | anders | Auf den 31 Frageseiten hat die dritte Stufe jetzt `item` (Kapitelseite), die Frage selbst fehlt im Pfad. Passt zum sichtbaren Pfad. Siehe Befund N6 |
| WebSite: ohne `@id`, Person nur als `publisher` | behoben | `@graph` mit `WebSite#website` und `Person#betreiber`, `publisher` verweist per `@id` |
| Kein `potentialAction` | bleibt richtig | Suche läuft im Browser |
| Name „hAInrich2“ vor Freigabe prüfen | offen | Entscheidung des Eigentümers, steht weiter in `name`, `og:site_name`, `<title>` |
| QAPage nur an geprüften Antworten | behoben | `qaPage()` gibt sonst `null` zurück; alle 31 Seiten haben eine geprüfte Antwort und das Markup |
| Autor ehrlich (Bot als Organization, Moderation als Person) | behoben | 30 Antworten Organization mit dem verlangten Namen, `bf8ec38f9c86` Verweis auf die Person (Antwort ist dort sichtbar „der Moderation“) |
| `digitalSourceType` weglassen | behoben | nicht vorhanden; sichtbar steht „Claude von Anthropic“ (am Antwortende) |
| `upvoteCount` nur bei gleicher Zahl, sonst weglassen | behoben (weggelassen) | siehe N4 |
| Datum aus der Datenbank | behoben | `dateCreated` als Datum (`2026-11-04`), gleich dem `<time datetime>` der Frage |
| `dateModified` nur bei Bearbeitung | behoben | 11 Antworten (s02, s12, s15, s18, s19, s21, s22, s25, s26, s29, bf8ec38f9c86) mit `dateModified` gleich dem Prüfdatum; auf den bearbeiteten Seiten steht sichtbar „bearbeitet“ |
| Mathe: `text` als LaTeX-Quelle statt KaTeX-HTML | anders | LaTeX-Quelle ja, aber die rohe Markdown-Quelle samt `**`, Zaunzeichen usw. (N3) |
| Moderation `acceptedAnswer`, Bot `suggestedAnswer` | behoben | Code in `qaPage()`; mit nur einer Antwort ist sie `acceptedAnswer` |
| `citation` ohne Textfragment | behoben, mit Makel | exakt gleich den sichtbaren Zitatlinks (N2), aber Dubletten |
| Beispielfragen eventuell nicht markieren | entschieden | Eigentümer will QAPage; Folge in N5 |
| Person als eigener Knoten mit `@id` | behoben | `#betreiber` in allen 32 Graphen identisch |
| BreadcrumbList auf ueber/ (optional) | offen, gleichgültig | N7 |
| Test in `npm test` | teilweise | `test/site.test.mjs` Z. 377 ff. prüft Struktur, Lizenz, Autor an einer Beispielseite; die Parität über alle Seiten (N1) steht nicht darin; ich habe die Tests nicht ausgeführt |
| Fragen mit Moderationsantwort nicht geprüft | geprüft | `bf8ec38f9c86`, in Ordnung |

## 2. Neue Befunde

### Prüfergebnis zu den Fragen 1 und 2 (alle 31 QAPage-Blöcke)
Je Seite geprüft, 31 von 31:
- Block parst; Typen `QAPage` > `Question` > `Answer` > `CreativeWork` (citation) > `Organization`/`Person`; Wertebereiche stimmen (`answerCount` Zahl, `dateCreated` Datum, `license` URL, `author` Person oder Organization, `suggestedAnswer` nur wo mehr als eine Antwort, hier nirgends nötig). Keine Ausreißer in der Schema-Form.
- `Question.text` gleich der H1: 31/31 (mit LaTeX-Quelle für die Formeln verglichen). `name` gleich `text` bei 30; Ausreißer `0cfd2b864eda` (siehe N5).
- `acceptedAnswer.url` zeigt auf `#b2`, das es in der Seite gibt: 31/31 (`id="b2"` ist ein `article`).
- `answerCount` gleich der Zahl der `article.antwort`: 31/31 (immer 1).
- `dateCreated` gleich `<time datetime>` der Frage: 31/31.
- `citation`-URLs gleich den `figcaption`-Links ohne Textfragment, in gleicher Reihenfolge und Anzahl: 31/31 (134 Einträge).
- Lizenz: `license` (CC0) an der Frage bei genau den 29 Seiten, auf denen „gemeinfrei“ sichtbar steht; die zwei Testfragen haben weder sichtbaren Text noch Markup. Antworten 31/31 mit CC BY-SA 4.0 und sichtbarem Lizenzabsatz.
- Platzhalter, relative URLs, `http://`: keine.

### Mittel
**N1. Kein Test über alle Seiten.** Der Test (`test/site.test.mjs` Z. 377) prüft eine Seite. Die Parität (Text gleich H1, `#b2` existiert, Zahl der Antworten, Zitatlinks) wäre mit meinem Skript als Test über alle gebauten Frageseiten ein Dutzend Zeilen. Wirkt, wenn eine künftige Änderung am Renderer das Markup vom Sichtbaren entfernt, ohne dass jemand es merkt.

**N2. Doppelte `citation`-Einträge.** In 21 der 31 Antworten steht dieselbe URL mehrfach (134 Einträge, nur 97 verschiedene; Beispiel s01: dreimal `…/perzeptron-trainieren/#die-lernregel`). Ursache: mehrere Zitate aus einem Abschnitt, nach dem Abschneiden des Textfragments identisch. Kein Fehler, aber Rauschen; die sichtbaren Links sind dagegen tatsächlich getrennte Zitate, deshalb stimmen Markup und Sichtbares ein-zu-eins. Zu tun: in `qaPage()` nach `url` entduplizieren (`new Map`). Folge: dann stimmt die Zahl nicht mehr mit den sichtbaren Zitaten, aber die Menge der Adressen schon. Das ist besser, weil Google/Maschinen Quellen, nicht Zitate zählen. Ob das Duplikat schadet, ist unbekannt (vermutlich nicht).

**N3. `Answer.text` ist Markdown-Quelle.** Gemessen an den 31 Antworten: 24 mit `**`, 22 mit einzelnem `*`, 29 mit `$…$`, 27 mit Backslash (LaTeX), 9 mit Backticks, 1 mit Codezaun (` ```python ` in s23), 31 mit Absatztrennung `\n\n`. Das Sichtbare ist gesetztes HTML. Für Google ist `text` Klartext oder eingeschränktes HTML; was dort mit Markdown geschieht, weiß ich nicht sicher (ich vermute: wird als Text gezeigt oder gekürzt, keine Prüfung des Inhalts). Der Wortlaut-Vergleich bestätigt aber, dass bis auf Satzzeichen der sichtbare Text enthalten ist (nur zwei Ausreißer: s22, s23, siehe unten). Empfehlung (niedrige Priorität, da kein Rich Result zu erwarten ist): `**`, `*` und Codezäune entfernen, Absätze als `\n\n` lassen, `$…$` behalten (liest sich auch ohne Renderer), Backslash-Befehle bleiben. Nicht nötig, solange der Eigentümer QAPage nur als Maschinenlesbarkeit sieht.

**N4. `upvoteCount`: Weglassen ist richtig.** Die Zahl steht statisch im HTML (`<span class="punkte">`, Frage-Aside): 8 von 31 Seiten haben 1 (s02, s04, s12, s15, s17, s25, s28, bf8ec38f9c86), die übrigen 0. Sie stammt vom Bau (`question.punkte`, `lib/site.js` Z. 249), das Skript `stimmen.js` überschreibt sie danach. Würde man sie ins Markup schreiben, stimmte sie nur bis zur nächsten Stimme, solange die Seite nicht neu erzeugt wird (ob die Server-Seiten unter `live/` bei jeder Stimme neu entstehen, habe ich nicht geprüft). Auch dürfte jeder abstimmen, nicht nur Antwortende. Bei 0/1 Stimmen bringt die Zahl nichts. Nicht ergänzen.

**N5. Zwei Ungenauigkeiten an der Frage.**
- `0cfd2b864eda`: `text` hat `$x$` und `$x^2$` (LaTeX-Quelle, gleich dem Sichtbaren), `name` hat die Dollarzeichen entfernt („…in x gesteckt … z.B. x^2?“). Konsistent mit sich selbst, aber `name` ist für Formeln unleserlicher als der gesetzte Text. Nur diese Seite betroffen (die einzige Frage mit `$`).
- `author` an der Frage: 29 Beispielfragen verweisen auf die Person, auf der Seite steht aber nur „Frage“ + Abzeichen „Beispielfrage“, nicht Konrad Völkel. Das Markup sagt mehr als das Sichtbare. Inhaltlich ist es wahr (Beispielfragen vom Betreiber), und gestern hatte ich geraten, bei Anonymen wegzulassen; die Folge der Entscheidung: entweder sichtbar „Beispielfrage von Konrad Völkel“ oder `author` weglassen. Kein Verstoß gegen die Richtlinie „Markup muss sichtbar sein“ im strengen Sinn, es ist eine Angabe, die man nicht überprüfen kann.

### Niedrig
**N6. Pfad endet am Kapitel.** Frageseiten: BreadcrumbList Forum > Unterforum > Kapitel (mit `item`), die Frage fehlt. Normal für einen Pfad, der nur die Vorfahren zeigt. Google mag die aktuelle Seite als letzte Stufe ohne `item`. Sichtbar ist es ebenso; nur ändern, wenn der sichtbare Pfad die Frage auch zeigt.

**N7. Über, Kapitelseiten, Foren.** Kapitel- und Unterforumseiten (33) tragen BreadcrumbList und sonst nichts, richtig so. Über, Impressum, Datenschutz, Nutzungsbedingungen, `f/neu/` und die 29 Varianten (zusammen 34) tragen keins, richtig so. Kein Typ fehlt, der ein Rich Result hätte. Optional `AboutPage` auf `ueber/` (kein Nutzen für Google, nur Lesbarkeit; die Person per `@id` als `about`/`mainEntity` ist die ehrlichste Verknüpfung zum Abschnitt „Wer prüft“ und gäbe dem `#betreiber`-Knoten eine Seite zum Auflösen). Umgekehrt: kein Markup ohne sichtbares Gegenstück.

**N8. Wortlaut: Zitatmarke mitten im Wort.** s22: sichtbar `weiter[3]läuft` (die Marke `[3]` steht im Wort „weiterläuft“, danach nochmals hinter „Standard-Implementierung“). Das Markup hat „weiterläuft“. Kein Markup-Fehler, aber ein Darstellungsfehler der Antwort (Lesen, Vorlesen); die Quelle der Marke liegt im Antworttext oder im Renderer. Außerhalb meines Bereichs, hier nur weil mein Parität-Prüfer es fand. (s23: Wort „python“ nur im Codezaun der Quelle, sichtbar in `class="language-python"`; kein Fehler.)

## 3. Beantwortung der Fragen 3, 4, 5

**Frage 3, Autor.** Ehrlich: ja. Der Name nennt Bot, Modell, Hersteller und die Prüfung; sichtbar steht „Claude von Anthropic“ und „Geprüft von Konrad Völkel“ auf derselben Seite. Moderation ist `author` nur da, wo sie wirklich schreibt (bf8ec38f9c86).
Beste Form? `SoftwareApplication` wäre schema.org-gerechter für „Software“, aber `author` erlaubt dort nur `Person` oder `Organization` (Wertebereich); ein `SoftwareApplication` als Autor ist formal falsch, und Google nimmt als Autor nur Person/Organization (Gedächtnis, nicht geprüft). Dafür spräche die Wahrheit des Typs, dagegen: ungültiger Wert, kein Nutzen. Bleibt: Organization ist ein Notbehelf, aber der gültige. Verbessern könnte man:
- Kürzerer `name` „hAInrich2-Bot (Claude von Anthropic)“ und die Prüfung in einem eigenen Feld; Google zeigt den Namen unter Umständen im Ergebnis, ein langer Satz wirkt dort sonderbar (Unsicher: ob es je angezeigt wird). Die Prüfung gehört eigentlich nicht in den Namen des Autors; schema.org hat dafür an `Answer` keine saubere Eigenschaft (`reviewedBy` gilt für `WebPage`). Vorschlag: Name behalten, wie er ist, wenn die Ehrlichkeit im Namen Vorrang hat; sonst `name: "hAInrich2-Bot (Claude von Anthropic)"` plus `Answer.editor` oder `contributor` auf die Person. Beides ist Geschmack, kein Fehler.
- `@id` und `url` (`…/eidl/ueber/`) ergänzen, damit der Bot ein Knoten mit Seite wird, nicht 31-mal ein anonymes Objekt.

**Frage 4, was fehlt** (Gedächtnis, unsicher). Meine Erinnerung: Question verlangt `name`, `answerCount` und `acceptedAnswer` oder `suggestedAnswer`; Answer verlangt `text`. Empfohlen: `author`, `dateCreated`, `upvoteCount`, `url`, bei der Frage auch `text`. Dann fehlen nur Empfehlungen:
- `upvoteCount` an Frage und Antwort: bewusst, siehe N4.
- `author` an Fragen von außen: bewusst; bei anonymen Fragenden bleibt nur ein Hinweis in der Search Console, kein Fehler. An den Beispielfragen vorhanden (N5).
- `dateCreated` an den Antworten: fehlt überall. Sichtbar ist nur das Prüfdatum. Nicht erfinden; höchstens `datePublished` = Prüfdatum, weil es sichtbar steht (Unsicher, ob es sachlich das Veröffentlichungsdatum der Antwort ist).
- `datePublished` neben `dateCreated`: schadet nicht, bringt für Google vermutlich nichts (ich erinnere die Doku mit `dateCreated`; nicht sicher).
- Doku fordert, dass Nutzer antworten können; entschieden (QAPage gewollt).

**Frage 5, ein oder zwei Blöcke.** Gleichgültig. Google liest jeden Block für sich, ein gemeinsamer `@graph` ändert nichts an der Auswertung. Zwei Blöcke haben den kleinen Vorteil, dass ein Fehler in einem den anderen nicht ansteckt; das Zusammenlegen wäre nur für Verbraucher nützlich, die den Graphen als Ganzes laden. Nicht ändern.

## 4. Nicht geprüft
- Google-Rich-Results-Test, Search-Console-Bericht und Googles aktuelle Doku zu QAPage (Regel 2, Gedächtnis ist Stand Frühjahr 2026).
- Ob `dateCreated` mit reinem Datum im Google-Test ohne Warnung durchgeht (nach meiner Erinnerung ja, ISO 8601 Datum ist zulässig).
- Ob die serverseitig erzeugten Seiten unter `live/` die Stimmenzahl bei jeder Stimme neu schreiben (nur für N4 relevant).
- Ausführen von `npm test` (Regel 4).
- Auflösung aller Breadcrumb- und Zitat-URLs per HEAD (Hostabruf nicht erlaubt).
- Die zwei Testfragen ohne Lizenzangabe: ob das Fehlen der Lizenz gewollt ist, ist keine Frage der Technik.
