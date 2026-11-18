# SEO-Audit von hai.konradvoelkel.com/eidl/, vierter Durchgang

_Stand 2026-11-18, gemessen am ausgespielten Stand `89a8b4a`, gegen 01:20. Das ist der erste Durchgang nach dem Ende der Vorschau
(17.11. abends). Die Skripte sind die vom 17.11., unverändert: `../2026-11-17-seo-audit/{crawl.py,auswertung.py,perf.mjs,wiederbesuch.mjs,auszug.py}`.
Sechs Fachprüfungen liefen als Subagenten auf dem lokalen Crawl, ihre Berichte liegen in `findings/`. Rohdaten und Bilder liegen
außerhalb des Repos unter `work/seo-audit-2026-11-18/`._

**Ergebnis:** Die Site ist seit gestern Abend sichtbar: 35 von 97 Seiten tragen `index,follow`, die Sitemap nennt genau diese 35,
und Googles Live-Test nimmt eine Frageseite samt `QAPage` an. Die Einschätzung liegt bei **85 von 100** (17.11.: 84, 16.11.: 79,
06.11.: 68); die Zahl ist geschätzt, nicht gemessen. Das Gerüst trägt. Was jetzt zählt, ist Inhalt, der live steht: Gegen das Skript
von heute zitieren mindestens 13 der 29 indexierbaren Antworten Wortlaut, den es so nicht mehr hat, und im extrahierten Text, wie ihn
ein Sprachmodell liest, fehlt seit dem Umbau von gestern der Beleg. Die ersten Links von außen (aus dem Skript) landen auf
Kapitelseiten, die `noindex` tragen und nichts erklären.

**Grenzen:** Keine Rankings, kein Suchvolumen, keine Backlinks, keine Felddaten; Google kennt die Seiten seit zwei Stunden. Der Name
ging in keinen fremden Dienst außer in die eigene Search Console des Betreibers: kein PageSpeed, kein Rich-Results-Test von außen,
kein Online-Validator, keine Marken- oder Backlink-Abfrage. Googles Dokumentation hat niemand nachgeschlagen; was dazu hier steht,
ist Erfahrungswissen, außer wo der Live-Test der Search Console es zeigt. Lighthouse ist nicht installiert. Die Moderation hinter
der Anmeldung ist nicht Teil des Crawls. Die Ladezeiten stammen aus drei Läufen in Chromium auf einer Maschine unter Last.

## 1. Punkte je Bereich

| Bereich | Gewicht | 16.11. | 17.11. | heute | Grund |
|---|---:|---:|---:|---:|---|
| Technik | 22 % | 86 | 90 | 92 | Sitemap und `robots`-Meta decken sich genau, `lastmod` gleicht dem Prüfdatum, 404 für Gelöschtes. Abzug: die Links von außen treffen `noindex`. |
| Inhalt | 23 % | 74 | 77 | 75 | Die Texte sind besser (22 von 29 antworten im ersten Satz), aber was vor dem Start weg sein sollte, ist jetzt live: veraltete Zitate, drei Seiten halten ihren Titel nicht. |
| Auf der Seite | 20 % | 76 | 84 | 86 | Kurztitel überall, Beschreibungen ohne Lücken, Wege nach der Antwort. Offen: sieben Beschreibungen enden mitten im Gedanken, der nächste Schritt liegt unter den Zitaten. |
| Strukturierte Daten | 10 % | 70 | 86 | 90 | 29 von 29 stimmen mit dem Sichtbaren überein, die Prüfung steht im Markup, und Googles Live-Test meldet ein gültiges Q&A-Element. Fünf unkritische Hinweise. |
| Leistung | 10 % | 93 | 96 | 95 | Gewicht und Anfragen wie gestern, CLS 0. LCP im besten von drei Läufen 0,62 bis 0,73 s; die Messung lief unter Last. |
| KI-Suche | 10 % | 68 | 70 | 75 | Die Frage steht in 29 von 29 Auszügen vorn, das Prüfdatum ist lesbar, Formeln kommen sauber an. Dagegen: Der Beleg ist aus dem Auszug gefallen. |
| Bilder | 5 % | 92 | 92 | 92 | Unverändert, nicht neu geprüft. |

## 2. Was aus den Befunden vom 17.11. geworden ist

| Befund vom 17.11. | Stand | Beleg |
|---|---|---|
| 0 Alles `noindex`, Sitemap leer | entfällt | Vorschau beendet: 35 Seiten `index,follow`, Sitemap mit 35 Adressen, eingereicht. |
| 1 Zehn Antworten zitieren veralteten Wortlaut | anders | Gegen den ausgespielten Korpus keine mehr; gegen das Skript von heute mindestens 13 (Befund 1). |
| 2 Die Frage fehlt im extrahierten Text | behoben | 29 von 29, immer am Anfang (`auszug.py`). |
| 3 s29, s20, s06 halten den Titel nicht | offen | s20 ist neu erzeugt und hält ihn weiter nicht (Befund 4). |
| 4 „Alle Fragen zu …“ führt im Kreis | behoben | Unter der Antwort stehen Unterforum und Skriptkapitel. Neu: Sie liegen unter den Zitaten (Befund 5). |
| 5 Elf schwache Beschreibungen | teils | 77 bis 151 Zeichen, keine Lücke mehr; sieben enden mitten im Gedanken (Befund 7). |
| 6 Acht schwache Kurztitel | teils | s19 und s27 sind gelöscht; die übrigen sechs sind nicht neu gelesen. |
| 7 Die Hälfte beginnt mit der Antwort | besser | 22 von 29 (gestern 19 von 31). |
| 8 Über-Seite gegen Impressum und Frageseite | anders | Die Über-Seite sagt jetzt „von Nutzern“, die Seiten zeigen 27-mal „Frage von Konrad Völkel“ (Befund 8). |
| 9 `QAPage`: vier kleine Makel | behoben bis auf einen | Quellen einmal, Prüfung im Markup, Autor sichtbar. Offen: Markdown im Text der Antwort. |
| 10 Sitemap ohne `lastmod` | behoben | 34 von 35 Einträgen, bei allen 29 Fragen gleich `lastReviewed`. |
| 11 „Melden“ ohne Bezug | behoben | `aria-label="Beitrag n melden"`, seit gestern ein `mailto:` mit dem Beitrag im Text (Befund 6). |
| 12 Viel Rahmen vor der Antwort | besser | Banner, Lizenzzeile und zweiter Kapitellink sind weg; bei s09 beginnt die Antwort bei rund 60 % des ersten Bildschirms statt 70 %. |
| niedrig: `/eidl/index.html` 200, 301 neben 308 | offen | Im Server-Repo gemeldet, unschädlich. |

## 3. Befunde

Nummern sind neu; in Klammern die Fachprüfung, deren Bericht die Einzelheiten trägt.

### Hoch

**1. „Wörtliches Zitat“ stimmt bei mindestens 13 von 29 indexierbaren Antworten nicht mehr** (Inhalt). Das Skript ist dem Korpus vom
15.11. voraus (93 Passagen geändert oder weg, 120 geändert oder neu, in allen 29 Kapiteln). Gegen das Skript von heute zitieren s01,
s02, s04, s06, s09, s12, s15, s16, s17, s20, s21, s25 und s26 Wortlaut, den es so nicht mehr hat; die zwei Testfragen sind nicht
gerechnet. Vier davon (s17, s20, s21, s26) sind erst gestern neu erzeugt und geprüft worden: Sie entstanden gegen den alten Korpus,
ein frisches Prüfdatum schützt also nicht. Die Moderation meldet nichts, weil sie am ausgespielten Korpus misst. Das Versprechen
steht in der Beschreibung der Startseite, auf der Über-Seite und im Impressum, und der Vermerk darüber lautet „Geprüft … von Konrad
Völkel, Autor des Skripts“. _Tun:_ Korpus aus dem Skript von heute bauen und ausspielen, danach die gelisteten Antworten neu belegen
lassen und prüfen (kostet je Antwort Geld). _Damit es nicht wiederkehrt:_ `tools/skriptstand.mjs` vor jedem Ausspielen des Skripts
fahren, oder am Zitatblock sagen, von welchem Tag der Wortlaut stammt. _Woran man es sieht:_ `tools/skriptstand.mjs` meldet „nichts
zu tun“, und dieselbe Rechnung über den Stand vom Server ergibt null.

**2. Im extrahierten Text fehlt der Beleg** (KI-Suche, an allen 29 Seiten nachgezählt). Seit gestern stehen die Zitate in einem
`<aside>`, damit ein Extraktor die Frage nicht verwirft. Der Preis: Im Auszug von trafilatura bleiben 205 Zitatmarken `[n]` auf 28
Seiten ohne ihr Ziel, die Überschrift „Originaltext aus dem Skript“ ohne Text darunter und „Prüfen Sie das Zitat“ ohne Zitat. Nur
einer von 29 Auszügen nennt überhaupt eine Adresse des Skripts. Der Hinweis „Sprachmodell (Claude)“ steht in 28 Auszügen, aber nie in
den ersten 400 Zeichen; vorn steht nur, wer geprüft hat. Dazu eine Zählung der Fachprüfung, die ich nicht nachgerechnet habe: Die
Antworten bestehen zu 24 bis 78 % (Median 51 %) aus Wortlaut des Skripts, ohne Anführungszeichen; im HTML zeigt die Marke das an, im
Auszug liest es sich als Text des Bots. _Tun:_ (a) eine Zeile außerhalb des `<aside>`, etwa unter dem Prüfvermerk: „Grundlage:
Kapitel …, Abschnitte …“ mit Links ins Skript; (b) den Vermerk um die Herkunft erweitern („Antwort eines Sprachmodells, geprüft am
… von …“). _Woran man es sieht:_ `auszug.py`, erweitert um „Auszug nennt eine Adresse des Skripts“ und „Sprachmodell in den ersten
400 Zeichen“, zählt 28 statt 1 und 28 statt 0, und die Frage bleibt bei 29 von 29 vorn.

**3. Die einzigen Links von außen treffen Seiten, die `noindex` tragen und nichts erklären** (Technik, Sucherlebnis). Das Skript
verlinkt seit heute von jeder seiner 29 Kapitelseiten auf die Kapitelseite des Forums. Alle 29 tragen `noindex` (Regel: indexierbar
erst mit drei geprüften Fragen); 23 zeigen eine Frage, drei zeigen zwei, drei keine (`adversarial-attacks-polysemie`,
`anwendungsbeispiele`, `word2vec`: „Stellen Sie die erste.“). Kein Satz sagt, was das Forum ist, dass ein Sprachmodell mit Zitat
antwortet und wer prüft; dass Fragen einen Kurscode braucht, erfährt man eine Seite später. Ob Google die Links einer dauerhaft
gesperrten Seite weiter zählt, ist nicht nachgeschlagen. _Tun:_ ein bis zwei Sätze Einleitung auf jeder Kapitelseite, mit dem
Hinweis auf den Kurscode; und entscheiden, ob die Schwelle bleibt (Befund 3 vom 16.11. wollte dünne Listen draußen halten) oder ob
eine Kapitelseite mit einer geprüften Frage und Einleitung in den Index darf. _Woran man es sieht:_ In der Search Console stehen die
29 Kapitelseiten unter „durch noindex ausgeschlossen“ oder eben nicht.

**4. Drei Seiten halten nicht, was ihr Titel sagt** (Inhalt). s29 beginnt mit einer Absage. s06: Die Beschreibung bricht bei
„device=0 meint dort die …“ ab, der erste Satz führt in die Irre. s20 ist gestern neu erzeugt worden und nennt bis zum letzten Satz
keine Einheit für Audio, der Titel fragt danach. Alle drei sind indexierbar. Das sind Texte des Betreibers. _Tun:_ selbst antworten
oder den Kurztitel an die Antwort anpassen.

**5. Der nächste Schritt liegt unter anderthalb Bildschirmen Zitaten** (Sucherlebnis). Bei s09 ist der Zitatblock 1243 px hoch bei
3434 px Seite; erst darunter stehen Lizenz und „Mehr Fragen im Unterforum …“. Verwandte Fragen nennt die Seite nicht. _Tun:_
`nav.weiter` vor den Zitatblock ziehen und zwei bis drei Kurztitel aus demselben Unterforum nennen. Vorsicht: Solche Listen stünden
nach jeder Änderung auf anderen Seiten falsch, deshalb gab es sie bisher nicht; eine Liste aus Kurztiteln altert langsamer als eine
mit Zahlen. _Woran man es sieht:_ Der Link steht im zweiten Bildschirm statt im fünften.

### Mittel

**6. „Melden“ hat ohne Mailprogramm keinen Rückweg** (Sucherlebnis, Agenten). Der Link ist seit gestern ein `mailto:`. Den Hinweis
im `title` sieht am Telefon niemand, das Ziel misst 51 × 31 px, und die Adresse steht nirgends sichtbar auf der Frageseite. Der Fuß
führt zu „Inhalte melden“ im Impressum, dort steht „die oben genannte Adresse“ in der Schreibweise mit „[at]“. Wie Mailprogramme
sich verhalten, ist Erfahrung, nicht getestet. _Tun:_ im Impressum unter „Inhalte melden“ sagen, was die E-Mail enthalten soll,
falls der Link nichts öffnet; mehr braucht es nicht.

**7. Sieben Beschreibungen enden mitten im Gedanken** (Inhalt, nachgezählt). Die Regel von gestern nimmt ganze Sätze, aber s11 endet
auf „Warum?“, s22 in einem offenen Anführungszeichen, s24 auf einer Definition, s06 auf „…“ hinter einem Halbsatz. Elf enden
insgesamt auf „…“. _Tun:_ nicht auf eine Frage, einen Doppelpunkt oder in einem offenen Zitat enden; dann lieber einen Satz weniger.

**8. Wer fragt, passt nicht zur Über-Seite** (Inhalt, Sucherlebnis). Die Über-Seite sagt „Die Fragen kommen von Nutzern“ und an
anderer Stelle, wer frage, bleibe anonym; 27 Seiten zeigen „Frage von Konrad Völkel“, die zwei Testfragen des Betreibers stehen als
„Anonymer Nutzer“. Das ist sein Text; den Satz hat er am 17.11. so gewählt.

**9. Googles Live-Test: gültig, mit fünf unkritischen Hinweisen** (eigene Probe, Abschnitt 5). `dateCreated` der Frage ist ein Tag
ohne Uhrzeit („Invalid datetime value“, „missing a time zone“); der Antwort fehlen `upvoteCount` und `datePublished`; dem Autor der
Bot-Antwort fehlt `url`. Alle fünf sind als optional markiert. _Tun, ohne Entscheidung:_ `url` am Autor der Bot-Antwort (die
Über-Seite). _Zu entscheiden:_ Eine Uhrzeit an `dateCreated` wäre erfunden, die Datenbank kennt nur den Tag; ein Veröffentlichungstag
der Antwort ebenso, sie kennt nur den Tag der Prüfung. Weglassen ist ehrlich und kostet nur den Hinweis.

**10. Schwache erste Sätze** (KI-Suche, Inhalt). s10 „Ja, genau so ist es.“, s12 „Grundlage ist die Kettenregel.“, s29 (Absage); s25
sagt denselben Inhalt zweimal; in s22 trägt die tragende Stelle keine Zitatmarke, in s18 steht ein Satz ohne Verb. Sein Text, oder
ein neuer Lauf.

### Niedrig

- **Unbenannte `<aside>` als Landmarken** (Agenten): drei auf s09 (zwei Absenderkästen, der Zitatblock). `aria-labelledby` auf die
  Überschrift „Originaltext aus dem Skript“ gäbe dem Zitatblock einen Namen; danach `auszug.py` neu fahren.
- **`bf8ec38f9c86`** (strukturierte Daten, Inhalt): Die Antwort ist von der Moderation selbst, im Markup stehen `reviewedBy` und
  `lastReviewed`, sichtbar nur Abzeichen und Datum. Die Seite hat 201 Wörter und ist indexierbar; `f/praxis/` hat 137.
- **Kein Satz zu automatischer Nutzung** (Agenten): Weder `robots.txt` noch die Nutzungsbedingungen sagen, ob ein Agent abstimmen
  oder absenden darf. Seine Entscheidung.
- **Die Site sagt nicht, zu welcher Vorlesung und Hochschule das Skript gehört** (KI-Suche). Ob das zu „privates Angebot“ passt,
  entscheidet er.
- **Entdeckungsdateien** (Agenten): `llms.txt`, `security.txt` und `ai-catalog.json` gibt es nicht. Bei 35 Seiten mit Sitemap lohnt
  davon nichts; eine `security.txt` wäre unabhängig davon üblich.
- **`/eidl/index.html` antwortet mit 200, 301 steht neben 308** (Technik): wie gestern, im Server-Repo gemeldet.
- **Markdown im `Answer.text`**, `name` und `text` der Frage weichen bei `0cfd2b864eda` in der Formel ab (strukturierte Daten).

## 4. Messwerte

| Was | 17.11. | heute |
|---|---|---|
| Seiten im Crawl | 99 | 97 (s19 und s27 gelöscht), keine kaputt, kein Link ins Leere |
| `index,follow` / `noindex` | 0 / 99 | 35 / 62 |
| Adressen in der Sitemap | 0 | 35, genau die indexierbaren; 34 mit `lastmod` |
| Titel | längster 65, keiner doppelt | ebenso, keiner mit „…“ |
| Beschreibungen der Fragen | 7 unter 70 Zeichen, 4 mit Lücke | 77 bis 151 Zeichen, keine Lücke, keine doppelt, 11 enden auf „…“ |
| Frage im Auszug von trafilatura | 1 von 31 | 29 von 29, immer vorn |
| Prüfvermerk mit Datum im Auszug | ohne Datum | 28 von 28 Seiten mit Vermerk |
| Zitatmarken ohne Ziel im Auszug | nicht gezählt | 205 auf 28 Seiten |
| Fragen je Kapitelseite | | keine: 3, eine: 23, zwei: 3 |
| Gewicht Startseite / Frageseite s09 | 58 KB / 137 KB | 59 KB / 138 KB, 7 und 11 Anfragen wie gestern |
| LCP gedrosselt, sechs Seiten | 0,58 bis 0,68 s, ein Lauf | 0,62 bis 0,73 s im besten von drei Läufen; bis 1,40 s unter Last |
| CLS | 0 | 0 |
| Wiederbesuch | rund 1 KB | 0,9 KB, CSS und Skripte mit 304 |

Die Ladezeiten sind nicht mit gestern vergleichbar: Auf der Maschine liefen andere Arbeiten (Last 7 bis 23). Gewicht und Zahl der
Anfragen sind gleich, deshalb nehme ich an, dass sich nichts verschlechtert hat; gemessen ist das nicht.

## 5. Was Google bisher sagt

Aus der Search Console des Betreibers (Domain-Property, angelegt am 17.11., automatisch bestätigt), am 18.11. gegen 01:25:

- **Sitemap:** eingereicht am 17.11., Status „Success“, 35 Seiten erkannt.
- **URL-Prüfung für `f/s09/`:** „URL is not on Google“, Grund „Discovered – currently not indexed“; gefunden über die Sitemap, noch
  nie abgerufen. Das ist zwei Stunden nach dem Einreichen der erwartbare Stand.
- **Live-Test derselben Seite:** „URL is available to Google“, „Page can be indexed“. Erkannt: Breadcrumbs, ein gültiges Element;
  Q&A, ein gültiges Element, „eligible for Google Search's rich results“, mit fünf unkritischen Hinweisen (Befund 9). Google liest
  `reviewedBy` als die Person, `lastReviewed`, beide Lizenzen und die Quellen unter `citation`.

Damit hat zum ersten Mal ein Werkzeug von Google das Markup gesehen. Ob ein Rich Result erscheint, sagt das nicht: Die Regel, dass
Leser antworten können müssen, prüft der Test nicht. Eine Indexierung habe ich nicht beantragt.

## 6. Reihenfolge

1. **Korpus nachziehen und die 13 Antworten neu belegen (Befund 1).** Seine Entscheidung, wann; im Skript wird noch geändert.
2. **Kapitelseiten:** Einleitung bauen, Schwelle entscheiden (Befund 3).
3. **Beleg im Auszug:** Zeile „Grundlage: …“ und Herkunft im Vermerk (Befund 2). Beides lässt sich bauen und messen.
4. **Seine Texte:** s29, s06, s20, erste Sätze, Über-Seite (Befunde 4, 8, 10).
5. **Klein, ohne Entscheidung:** `nav.weiter` vor die Zitate (5), Regel für das Ende der Beschreibungen (7), `url` am Bot-Autor
   (9), Name für den Zitatblock, ein Satz im Impressum (6).
6. **In einer Woche:** Search Console lesen: indexierte Seiten, „durch noindex ausgeschlossen“, Q&A unter „Enhancements“.

## 7. Wie gemessen wurde

- Crawl mit `crawl.py` (nur GET, 97 Seiten, rohes HTML je Seite gesichert), Auszählung mit `auswertung.py` gegen den Crawl vom 17.11.
- `auszug.py` und eine eigene Zählung über alle 29 Frageseiten mit trafilatura 2.3.1 (Marken, Adressen, Herkunftshinweis).
- `perf.mjs` dreimal (Pixel 7, CPU vierfach gebremst, langsames 4G), `wiederbesuch.mjs` einmal.
- Skript gegen Korpus: `tools/skriptstand.mjs` und dieselbe Rechnung über den Stand der Beispielfragen vom Server.
- Search Console: URL-Prüfung und Live-Test für eine Frageseite, von Hand im Browser.
- Sechs Fachprüfungen als Subagenten, nur auf den lokalen Dateien; zwei durften den Host abrufen (Technik zehnmal, Agenten viermal,
  nur HEAD). Von ihren Angaben habe ich nachgezählt: Marken und Adressen im Auszug, Fragen je Kapitelseite, die genannten
  Beschreibungen, welche der neu erzeugten Antworten schon wieder veraltet zitieren. Nicht nachgerechnet habe ich den Anteil an
  Skriptwortlaut in den Antworten und die Urteile über einzelne Texte.

## 8. Nicht geprüft

Rankings, Suchvolumen, Backlinks, Felddaten. Ob und wann Google indexiert. Die zwei Testfragen gegen das Skript von heute. Ob ein
Mailprogramm die vorbereitete E-Mail ganz übernimmt. Andere Extraktoren als trafilatura. Der Zugänglichkeitsbaum im Browser (nur aus
dem HTML gelesen). Ladezeiten auf einem echten Telefon und auf einer Maschine ohne Last. Die sechs Kurztitel, die gestern als schwach
galten. Alles hinter Kurscode und Anmeldung.

## 9. Umgebaut am 2026-11-18, nach dem Bericht

Auf Konrads Wort („Ja, umbauen“) gebaut ist, was keine Entscheidung braucht. Gemessen am lokalen Bau aus dem Stand vom Server (27
Beispielfragen; die zwei Testfragen baut nur der Server). **Ausgespielt am 2026-11-18 um 02:12** (`25b36b9`) und am Host
nachgemessen, siehe unter der Tabelle.
`../2026-11-17-seo-audit/auszug.py` zählt dafür seit heute drei Dinge mehr: Herkunft in den ersten 400 Zeichen, zitiertes Kapitel
beim Namen, Adresse des Skripts im Auszug mit Links. Die Zahlen „vorher“ stammen aus demselben Skript über den Crawl vom 18.11.

| Befund | Was jetzt gilt | Gemessen |
|---|---|---|
| 2 Beleg im Auszug | Die Zeile über den Zitaten nennt die Kapitel, aus denen die Antwort zitiert, jedes einmal und mit Link auf seine Seite im Skript: „Aus dem Skript … von Konrad Völkel, Kapitel „Logistische Regression“, Lizenz CC BY-SA 4.0.“ Sie steht vor dem `<aside>` und bleibt deshalb im Auszug. Keine neue Zeile unter dem Prüfvermerk: Die Antwort soll auf dem Telefon nicht noch tiefer beginnen. | `auszug.py`: zitiertes Kapitel beim Namen im Auszug 27 von 27 (Crawl vom 18.11.: 1 von 28), Adresse des Skripts im Auszug mit Links 27 von 27 (0 von 28) |
| 2 Herkunft vorn | Der Prüfvermerk beginnt mit der Herkunft: „Antwort eines Sprachmodells, geprüft am … von Konrad Völkel, Autor des Skripts.“ | „Sprachmodell“ in den ersten 400 Zeichen des Auszugs 27 von 27 (0 von 28). Die Frage steht weiter auf allen 27 vorn. Preis: bei 375 px drei Zeilen statt zwei, die Antwort beginnt eine Zeile tiefer (rund 22 px) |
| 3 Kapitelseiten | Jede der 29 Kapitelseiten sagt unter der Titelzeile, wer antwortet und prüft und dass Fragen einen Kurscode braucht, mit Link auf die Über-Seite. Die zwei Sätze sind dieselben wie auf der Startseite und im Frageformular, aus einer Quelle im Code. Die Schwelle für `index` ist unverändert | 146 px hoch bei 375 px, zwei Zeilen am Schreibtisch |
| 7 Ende der Beschreibungen | Eine Beschreibung endet nicht mehr auf einer Frage oder einem Doppelpunkt (wenn ohne den Satz noch 70 Zeichen bleiben), nicht in einer offenen Klammer und nicht in einem offenen Zitat (das schließt mit „…“); ein Satzanfang von unter fünf Wörtern bleibt weg; ein Einschub im Zitat verliert seine Klammern | 5 von 27 geändert: s11 ohne „Warum?“, s22 schließt das Zitat, s15 endet vor der Klammer, s14 ohne „[es]“, s01 ist jetzt der ganze erste Satz (52 Zeichen, vorher 77 mit „In der Perzeptronregel …“). Keine endet auf „?“ oder „:“, 9 enden auf „…“ |
| 9 Hinweis aus dem Live-Test | Der Autor der Bot-Antwort im `QAPage` trägt `url`, die Über-Seite | im Unit-Test und im Browser-Test |
| niedrig: Landmarken | Das `<aside>` mit den Zitaten heißt „Zitate aus dem Skript“ | Auszug unverändert, siehe oben |

**Am Host nach dem Ausspielen** (alle 29 Frageseiten neu abgerufen, nur GET, dazu drei Kapitelseiten): Frage vorn im Auszug 29 von
29; Herkunft in den ersten 400 Zeichen 28 von 28 Seiten mit Antwort des Bots; zitiertes Kapitel beim Namen 28 von 28 Seiten mit
Zitat; Adresse des Skripts im Auszug mit Links 28 von 28; Bot-Autor mit `url` 28 von 28; keine Beschreibung endet auf „?“ oder „:“,
10 auf „…“, eine (s22) schließt ihr Zitat mit „…“. Die drei Kapitelseiten tragen die Einleitung und weiter `noindex`. Die
Browser-Tests gegen den Host: 22 von 22.

**Nicht gebaut, mit Grund.**

- **`nav.weiter` vor die Zitate, mit verwandten Fragen (5):** Das stellt die Navigation vor den Beleg und braucht eine Liste, die auf
  anderen Seiten altert. Das ist eine Entscheidung über die Seite, keine Kleinigkeit.
- **Ein Satz im Impressum (6):** Dort steht schon, dass die Meldung die Adresse der Seite und den Grund nennen soll. Mehr wäre ein
  Eingriff in einen Rechtstext.
- **`aside.autor` zu `div`:** Das ändert, was ein Extraktor als Text der Karte nimmt. Ohne eigenen Messlauf nicht.
- **s24, s05, s06, s20, s29 in den Beschreibungen:** Dort ist der erste Satz der Antwort das Problem, keine Regel hilft. Bei s06 würde
  ein Schnitt am Semikolon die Beschreibung auf „schreibt man dafür device=-1“ enden lassen, also auf dem Wert für die CPU.
- **„Prüfen Sie das Zitat“ an einer geprüften Antwort** (Fachprüfung KI-Suche, N3): Der Satz ist die Kennzeichnung nach I8, sein
  Wortlaut ist nicht meiner. Mit dem neuen Vermerk steht die Herkunft an einer geprüften Antwort jetzt zweimal da.

**Beim Messen aufgefallen.** Ein Extraktor, der Links behält, bekommt gleich nach der Frage den `mailto:`-Link von „Melden“ mit dem
ganzen vorbereiteten Text, rund 700 Zeichen, und noch einmal an der Antwort. Ohne Links (so zählt `auszug.py` die ersten 400 Zeichen)
bleibt davon das Wort „Melden“. Das ist Rauschen, kein Fehler; kürzer würde es nur mit einem kürzeren vorbereiteten Text.
