# Sucherlebnis (SXO), 18.11.2026

Grundlage: rohes HTML in `seiten/` (vor allem s09, s12, s23, s24, s13, s06, s04, `kapitel/backpropagation`, `kapitel/word2vec`), `crawl.json`,
`perf.txt`, `auszug.txt`, `bilder/frage-mobil.png`, `bilder/kapitel-mobil.png`. Kein Abruf am Host, **keine Websuche** (harte Regel 2).
Suchabsicht und erwarteter Seitentyp sind deshalb **meine Einschätzung**, keine Trefferliste. Höhen am Telefon: gemessen am Foto von s09
(1082 × 2202 px bei Faktor 2,625, also rund 412 × 838 CSS-px), für s12 und s23 aus der Länge der H1 hochgerechnet, nicht gerendert.
**SXO-Gap-Score: 70 von 100** (gestern 68), getrennt von jedem SEO-Score.

## 1. Gegen gestern

| Punkt vom 17.11. | Stand | Beleg |
|---|---|---|
| HOCH: Kapitellink unter der Antwort führt im Kreis | behoben | `nav.weiter` hat jetzt Unterforum und „Kapitel … im Skript lesen“, kein Link mehr auf die Kapitelseite; die steht nur im Pfad |
| HOCH: s29 Titel verspricht ein Warum, Antwort sagt „offen“ | offen | Titel unverändert, Beschreibung „… bleibt daher offen“ (bekannt, Text des Betreibers) |
| HOCH: bf8ec Titel „besser als PyTorch?“, H1 „einfacher mit Keras?“ | offen | `<title>` und H1 wie gestern, Antwort 201 Wörter Seite |
| HOCH: s19 Titel gegen Beschreibung | entfällt | s19 gelöscht (404) |
| MITTEL: Beschreibungen mit „…“ statt Formel | behoben | `auswertung.txt`: „mit … vor dem Ende: []“; s23 nennt jetzt `n_out = ⌊(n + 2p - k)/s⌋ + 1` |
| MITTEL: Beschreibungen am Ende abgeschnitten | anders | 11 enden auf „…“, aber nach ganzen Sätzen; s12 bricht weiter vor dem Grund ab |
| MITTEL: Zu viel Rahmen vor der Antwort am Telefon | weitgehend behoben | kein Banner, CC0-Zeile am Ende, Kapitellink unter der H1 weg; s09: Antwort ab rund 60 % statt 70 %, rund 11 statt 5 Zeilen sichtbar |
| Badge „geprüft“ und Prüfvermerk doppelt | offen | beide stehen weiter untereinander (`.badge.gut` und `p.pruefung`) |
| s12: Kern (Effizienz) erst am Ende | offen | „effizient“ steht bei Wort 261 von 314 der Antwort; Liste beginnt mit „Grundlage ist die Kettenregel“ |
| s12: Beschreibung ohne Grund | offen | „Grundlage ist die Kettenregel. Es gilt D(f ∘ g) = … ausgewertet …“ |
| s15: keine Abbildung | offen | nur `logo.svg`; XOR ohne Bild der vier Punkte |
| s14 „[es]“, s17 „Sie haben recht:“ in der Beschreibung | offen | beide unverändert in `crawl.json` |
| s27 Titel ohne Suchbegriff | entfällt | s27 gelöscht |
| s21, s26, 0cfd2 Titel ohne Fachbegriff | offen | Titel unverändert |
| „Beispielfrage“ unerklärt | anders | daneben steht jetzt „von Konrad Völkel“; ein `title` oder Link fehlt weiter (`span.badge` ohne Attribut) |
| Skriptstand nicht sichtbar (Lehrender) | offen | keine Fassung, kein Modell auf der Frageseite; das Modell nennt nur `ueber/` |
| Kapitelseiten ohne Einleitung | offen, jetzt wichtiger | 130 bis 189 Wörter, siehe Befund HOCH 2 |
| Suche lädt 24 MB vor dem ersten Treffer | offen | Hinweis steht auf Start- und Kapitelseite |
| Volle Frage als Linktext | bleibt richtig | unverändert |

## 2. Neue Befunde

### HOCH 1: Nach der Antwort kommen anderthalb Bildschirme Zitate, dann erst ein nächster Schritt, und der ist ein Unterforum
- Wo: Frageseite, Reihenfolge `div.text` → `section.zitate` (eingeklappte `figure`s) → `p.lizenz` → `nav.weiter`. `perf.txt` misst bei
  s09 eine Zitatsektion von 1243 CSS-px bei 3434 px Seite, also rund 1,5 Bildschirme zwischen Antwortende und „Mehr Fragen …“.
- Warum: Wer aus der Suche kommt und die Antwort gelesen hat, sieht als Nächstes Zitat-Anrisse, die er nicht gesucht hat. Der Weg weiter
  ist danach ein Unterforum ohne Zahl; in `f/praxis/` stehen zwei Fragen, eine davon die eigene. Verwandte Fragen gibt es nicht.
- Tun: Unter dem letzten Absatz der Antwort eine Zeile „Zum Nachlesen: 7 Stellen im Skript (unten)“ und gleich danach `nav.weiter`
  **vor** die Zitate ziehen, oder zwei bis drei Kurztitel aus demselben Unterforum in Kapitelreihenfolge (kein Kosinus nötig). Den
  Unterforumlink mit Zahl („10 Fragen in Lernen und Training“).
- Woran: `nav.weiter` liegt im Foto der ganzen Seite oberhalb der Zitate; später mehr als eine Seite je Sitzung bei Einstieg auf `f/s…/`.

### HOCH 2: Wer aus dem Skript auf eine Kapitelseite kommt, erfährt nicht, was ihn hier erwartet
- Wo: alle 29 `f/kapitel/<id>/`, Beispiel `seiten/eidl__f__kapitel__backpropagation.html` und `…__word2vec.html`.
- Befund, nachgeprüft: H1 „Fragen zu „Backpropagation““, Knopf „Frage stellen“, Unterforum und „Kapitel im Skript“, Suche mit 24-MB-Hinweis,
  dann **eine** Frage (25 von 29 Kapiteln), bei word2vec, anwendungsbeispiele und adversarial-attacks-polysemie keine: „Zu diesem Kapitel
  gibt es noch keine Frage. Stellen Sie die erste.“ Kein Satz dazu, dass ein Bot mit Skriptzitat antwortet, dass die Moderation prüft,
  dass Fragen einen Kurscode brauchen. Das steht erst hinter „Frage stellen“ (`f/neu/`) und auf `ueber/`.
- Warum: Der Link im Skript ist seit heute der Hauptzugang. Die Absicht dort ist „ich habe eine Frage zu diesem Kapitel“; der Knopf passt.
  Aber ein Leser des öffentlichen Skripts ohne Kurscode läuft eine Seite weiter in die Wand, und auf den drei leeren Seiten gibt es
  außer dem Unterforum nichts zu lesen. s20 (word2vec auf Audio) hängt an einem anderen Kapitel; die word2vec-Seite sagt trotzdem „keine Frage“.
- Tun: Ein Satz unter der H1: „Antworten schreibt ein Sprachmodell aus diesem Skript, die Moderation prüft sie. Fragen stellen kann,
  wer den Kurscode aus ILIAS hat; lesen können alle.“ Auf leeren Kapitelseiten die Fragen der Nachbarkapitel im selben Unterforum.
- Woran: Weniger abgebrochene Besuche auf `f/neu/` nach Einstieg über eine Kapitelseite (sobald es Zahlen gibt).

### MITTEL 1: Vor der Antwort steht noch Rahmen, den ein Leser aus der Suche nicht braucht
- s09 auf dem Foto, von oben: Kopf mit Unterzeile (rund 100 px), Pfad, Fragekarte („?“, „Frage von Konrad Völkel“, ▲ 0 ▼, Datum,
  „Beispielfrage“, „Melden“, „#1“, H1), Antwortkopf („hAInrich2 Bot“), Zeile „geprüft“/„Melden“/„#2“, Prüfvermerk (2 Zeilen).
  Antwort ab rund 505 von 838 px; sichtbar rund 11 Zeilen, der Kern („Gerade nimmt Werte in ganz ℝ an“) steht drin. Gut.
- s23 (H1 133 Zeichen, zwei Zeilen länger): Antwort ab geschätzt 68 %, die Formel im ersten Satz liegt wahrscheinlich noch im ersten
  Bildschirm. s12 (H1 117 Zeichen): sichtbar ist Kettenregel und Formel, der Grund liegt rund zwei Bildschirme tiefer (siehe oben, offen).
- Braucht der Leser: H1, Pfad (Kontext), Unterzeile „zum Skript …“ (erklärt „das Skript“), Prüfvermerk (Vertrauen). Braucht er nicht vor
  der Antwort: Punktestand „0“ (wirkt wie „niemand fand das gut“), zweimal „Melden“, „#1“/„#2“, eigene Zeile für das Badge „geprüft“.
- Tun: Badge und Prüfvermerk in eine Zeile; Punkte und Melden der Frage in eine Zeile unter der H1 oder ans Ende der Fragekarte.
  Spart geschätzt 3 bis 4 Zeilen. Woran: Foto von s12 zeigt den zweiten Listenpunkt ohne Scrollen.

### MITTEL 2: „Melden“ öffnet ein Mailprogramm, das viele nicht haben
- Wo: `a.melden` an jedem Beitrag, `href="mailto:…?subject=…&body=…"`, `title="Öffnet eine vorbereitete E-Mail"`, `aria-label="Beitrag 1 melden"`.
  Größe laut `perf.txt` 51 × 31 px.
- Was passiert (Erfahrung, nicht getestet): Android ohne Mail-App: nichts oder ein kurzer Hinweis. Webmail-Nutzer am Laptop: Browser
  fragt nach einer App oder öffnet ein nie eingerichtetes Desktop-Programm. Hochschulrechner (Windows): oft der Einrichtungsassistent
  eines Mailprogramms oder „App auswählen“. In allen Fällen ist der vorbereitete Text weg, die Adresse steht nirgends auf der Frageseite.
- Sagt die Seite es vorher? Nur im `title`, und den sieht am Telefon niemand (kein Hover); Screenreader lesen ihn meist als Beschreibung.
  Rückweg gibt es: Fuß „Inhalt melden“ → `impressum/#inhalte-melden`, dort aber „an die oben genannte Adresse“, nicht die Adresse selbst.
- Tun: Im Abschnitt `#inhalte-melden` die Adresse direkt hinschreiben; den Link „Melden (E-Mail)“ nennen oder ein ✉-Zeichen davor.
  Ziel auf dem Telefon auf mindestens 44 px Höhe. Entscheidung „Melden bleibt E-Mail“ wird damit nicht berührt.

### NIEDRIG
- „Frage von Konrad Völkel“ an Beispielfragen und `ueber/`: „Die Fragen kommen von Nutzern“, „Wer fragt, bleibt anonym“. Für Fremde
  wirkt das widersprüchlich, für den Prüfenden wie Selbstgespräch (fragt, prüft und schrieb das Skript). Ein Satz auf `ueber/` zu
  „Beispielfragen“ und ein Link vom Badge dorthin löst beides.
- s24 beginnt „Ja, genau: Bei Temperature Scaling: Seien s_i := −d(v, code(t_i)) die Logits“: richtig, aber Skript-Notation; wer von
  außen kommt, erwartet zuerst `softmax(z / T)` und „T > 1 flacher, T < 1 spitzer“, das steht erst im dritten Satz.
- Die 13 Fragen mit veraltetem Zitat (bekannt): Für den Prüfenden ist das jetzt öffentlich sichtbar, der Zitatlink markiert im Skript
  nichts. Die Seite selbst sagt es nicht; nur `ueber/#wer-prüft` warnt allgemein. Folge für das Vertrauen, keine neue Messung.

## 3. Seitentyp gegen Absicht (Einschätzung, ohne Suche)

| Frage (Unterforum) | Absicht, geschätzt | Liefert der erste Absatz? |
|---|---|---|
| s23 Conv2d-Ausgabegröße (Architekturen) | Anleitung: Formel plus Rechenbeispiel mit Code | Ja: Formel im ersten Satz, MNIST-Beispiel mit `nn.Linear(16*4*4, 10)`. Beste Seite der Site für die Suche. |
| s13 `zero_grad()` (Lernen) | kurze Erklärung mit Code | Ja, im zweiten Satz („neue Gradienten werden zu den alten addiert“). Gegen die englische Doku nur bei deutscher Anfrage. |
| s12 Backprop rückwärts (Lernen) | Erklärung, Kern ist der Aufwand | Nein: Kettenregel zuerst, Effizienz bei Wort 261 von 314. Gestern offen, heute offen. |
| s04 Jedes Netz ein MLP? (Grundlagen) | kurze Begriffsabgrenzung | Ja: „Nein, … eine bestimmte, einfache Form“. Typ passt, Konkurrenz durch Glossare hoch. |
| s24 Temperatur Softmax (Praxis) | kurze Antwort mit Formel und Wirkung | Halb: „Ja“ sofort, dann Skript-Notation; Wirkung von T erst im dritten Satz. |
| s06 Hugging-Face `device` (Grundlagen) | Anleitung mit Code | Der erste Satz ist der bekannte irreführende; bei einer Anleitungsabsicht ist es genau der Satz, den ein Ausschnitt übernähme. |

## 4. Drei Personen

| Person | Was klappt | Was hakt |
|---|---|---|
| Studierende mit Kurscode | Vom Skript ein Klick zur Kapitelseite, „Frage stellen“ groß oben, Antwort am Telefon ohne Scrollen sichtbar. | Auf der Kapitelseite meist nur eine Frage, nach der Antwort kein Weg zu verwandten Fragen außer dem ganzen Unterforum. |
| Selbstlerner aus der Suche | H1 ist seine Frage, Unterzeile erklärt „das Skript“, „Kapitel … im Skript lesen“ ist der richtige nächste Schritt. | Der Schritt liegt anderthalb Bildschirme unter den Zitaten; „Frage stellen“ führt ihn ohne Vorwarnung zur Kurscode-Wand. |
| Wer prüfen will, ob man der Bot-Antwort trauen kann | Prüfvermerk mit Datum, Name und Link auf „Wer prüft“, jedes Zitat wörtlich und verlinkt, „Bot“ deutlich markiert. | Kein Skriptstand und kein Modell an der Seite; bei 13 Fragen markiert der Zitatlink im Skript nichts, und Fragender und Prüfer sind derselbe. |

## 5. Punkte

| Dimension | 17.11. | 18.11. | Warum |
|---|---|---|---|
| Seitentyp | 12/15 | 12/15 | s29 und bf8ec unverändert, s19 und s27 weg |
| Inhaltstiefe | 11/15 | 11/15 | Antworten gleich; s12 weiter mit Kern am Ende |
| Nutzerführung | 9/15 | 10/15 | Kreis-Link weg, Skriptkapitel verlinkt; nächster Schritt unter den Zitaten, Kapitelseiten ohne Einleitung |
| Strukturierte Daten | 10/15 | 11/15 | `reviewedBy`, `lastReviewed`, `citation` (Rich Result laut Entscheidung unwahrscheinlich) |
| Medien | 7/15 | 7/15 | keine Abbildung (s15) |
| Vertrauen | 12/15 | 12/15 | Prüfvermerk vorn und ohne Banner; dafür veraltete Zitate jetzt öffentlich und „Melden“ ohne Rückweg auf der Seite |
| Aktualität | 7/10 | 7/10 | Prüfdatum sichtbar, Skriptstand fehlt |
| **Summe** | **68** | **70** | Erster Bildschirm deutlich besser; der Weg nach der Antwort und der Einstieg über die Kapitelseiten tragen den Start noch nicht. |

## 6. Nicht geprüft

- Keine Websuche: Suchabsicht, Konkurrenz, SERP-Features (KI-Übersicht, „Ähnliche Fragen“) sind geschätzt, nicht beobachtet.
- Nichts gerendert: s12 und s23 am Telefon aus Zeichenzahl der H1 hochgerechnet; das ganze Foto (`frage-mobil-ganz.png`) nicht ausgemessen.
- Verhalten von `mailto:` auf echten Geräten (Android, iOS, Hochschul-Windows) nicht getestet, nur aus Erfahrung beschrieben.
- Ob Google `title` und Beschreibung übernimmt, und wie es mit Links auf `noindex`-Kapitelseiten umgeht: Doku nicht nachschlagbar.
- Die Suche im Browser und alles hinter dem Kurscode.
