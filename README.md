# hAInrich2

Ein Frage-Antwort-Forum zum Skript [„Einführung in Deep Learning“](https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de/).
Studierende stellen Fragen zum Skript, ein Bot entwirft Antworten über die Claude API, und jede Antwort des Bots belegt sich mit
einem wörtlichen Zitat aus dem Skript. Eine Moderation gibt Fragen frei und prüft die Antworten.

Ein privates Angebot von Konrad Völkel, nicht der Heinrich-Heine-Universität Düsseldorf.

## Stand

Ein Prototyp: Seit November 2026 läuft das Forum für einen Kurs unter
[hai.konradvoelkel.com/eidl/](https://hai.konradvoelkel.com/eidl/). Lesen und abstimmen können alle; fragen kann nur, wer den
Kurscode aus dem Kurs hat. Ob und wie es weitergeht, ist offen; das Forum kann sich ändern oder wieder verschwinden.

Was gebaut und geprüft ist und was nicht, steht in [`STATUS.md`](STATUS.md). Die Entscheidungen mit Datum und Begründung stehen in
[`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md), die Messungen mit ihren Skripten unter [`research/`](research/). Diese Dokumente
sind Arbeitsunterlagen: Sie nennen auch, was nicht funktioniert hat.

## Wie es arbeitet

- **Lesen ist statisch.** Jede Frage ist eine fertige HTML-Seite, auch die Formeln. Lesen braucht kein JavaScript, kein Cookie
  und keine Anmeldung.
- **Die Suche läuft im Browser.** Ein auf 16.384 Tokens geschnittenes `multilingual-e5-small` rechnet per WebAssembly. Was jemand
  tippt, verlässt den Browser nicht, und das Modell lädt erst beim ersten Klick oder Fokus ins Suchfeld.
- **Fragen braucht einen Kurscode** aus dem Kurs. Er gibt ein Token aus, Nutzerkonten gibt es nicht.
- **Ohne Freigabe und ohne Einwilligung erreicht kein Text die Claude API.** Normal sieht erst die Moderation eine Frage, danach
  entwirft der Bot. Wer beim Absenden ausdrücklich einwilligt, bekommt sofort einen Entwurf; ein Checker hält dabei zurück, was
  nach persönlichen Angaben aussieht, etwa E-Mail-Adressen, Telefonnummern, eine Vorstellung mit Namen oder Gesundheitsangaben.
  Verlassen kann man sich auf ihn nicht, das sagen auch die Nutzungsbedingungen.
- **Zitate sind wörtlich.** Der Bot zitiert Passagen aus dem Skript, und die Moderation kann den Wortlaut eines Zitats nicht
  ändern. Ändert sich das Skript, zeigt `tools/skriptstand.mjs`, welche Antworten Wortlaut zitieren, den es nicht mehr gibt.
- **Geprüft heißt: von einem Menschen gelesen.** Eine Antwort des Bots steht als „ungeprüft“ da, bis die Moderation sie geprüft
  hat. Erst dann nennt die Seite, wer geprüft hat und wann, und erst dann darf eine Suchmaschine sie aufnehmen.
- **Ähnlichkeit entscheidet nichts.** Embeddings liefern Kandidaten, etwa für Duplikate. Entscheiden darf nur ein Klick, die
  Moderation oder ein Prüfschritt.
- **Getrennte Prozesse.** Der Web-Prozess hat keinen API-Key und keinen Weg ins Netz. Aufträge gehen über eine Schlange im
  Dateisystem an einen Worker, der als eigener Nutzer läuft und als einziger mit Claude spricht. Er bucht jede Anfrage, bevor sie
  hinausgeht, und hält an einem Tages- und einem Monatsdeckel an.
- **Löschen heißt löschen.** Die Moderation kann eine Frage samt Antworten, Verlauf und Seite endgültig entfernen. Was das nicht
  erreicht (Sicherungen, Anthropic, Kopien bei Dritten), sagt der Datenschutz der Site.

## Aufbau

| Ort | Inhalt |
|---|---|
| `lib/` | Segmentierung des Skripts, Suche, Zitate, Fragepfad, Moderation, Worker-Logik, Rendering |
| `server/web.mjs`, `server/worker.mjs` | Web-Prozess und Worker, wie sie auf dem Server laufen |
| `site/` | Bau der statischen Site, Stylesheet, Browser-Skripte, Texte unter `site/texte/` |
| `seeds/` | die Beispielfragen, mit denen das Forum startet |
| `tools/` | Korpus bauen, Zitate umziehen, Skriptstand prüfen, Antworten erzeugen und vergleichen |
| `test/`, `smoke/`, `smoke-mod/` | Unit-Tests, Browser-Tests gegen die gebaute Site und gegen die Moderation |
| `research/` | datierte Messungen und Prüfberichte, jeweils mit ihren Skripten |

Server, DNS und Webserver gehören nicht hierher, sondern in ein eigenes Repository für die Infrastruktur. Die Skripte unter
`site/` liefern nur Dateien dorthin.

## Ausprobieren

```bash
npm ci
```

```bash
npm test
```

Die Unit-Tests brauchen nichts außerhalb des Repositorys und rufen nie die echte API. Sie laufen bei jedem Push in der CI; wer
`git config core.hooksPath .githooks` setzt, bekommt dasselbe vor jedem Push auf dem eigenen Rechner.

Für den Bau der Site und die Browser-Tests fehlen hier mit Absicht das Suchmodell, die WASM-Laufzeit und die Arbeitsdaten (Korpus,
Vektoren, Antworten): Sie sind groß, und das Modell wird beim Bau gegen seine Prüfsumme geprüft. Wo sie auf dem eigenen Rechner
liegen, sagt eine gitignorte `.env.local` nach der Vorlage [`.env.example`](.env.example). Den Korpus baut
`tools/build-corpus.mjs` aus dem veröffentlichten Skript; wie das Suchmodell geschnitten wird, steht in
[`research/2026-11-04-browsermodell/`](research/2026-11-04-browsermodell/); woher alles Fremde kommt, steht in
[`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md). Die Antworten liegen nicht im Repository.

## Sicherheit

Hinweise bitte nicht als Issue, sondern wie in [`SECURITY.md`](SECURITY.md) beschrieben.

## Lizenz

| Was | Lizenz |
|---|---|
| Der Code: alles im Repository, was unten nicht eigens genannt ist | GNU Affero General Public License, Version 3 oder später (`AGPL-3.0-or-later`, [`LICENSE`](LICENSE)) |
| Die Beispielfragen in `seeds/fragen.json` | gemeinfrei, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.de) |
| Das Skript, die Zitate daraus und die Antworten auf der Site | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.de) |
| Logo, Icons und Vorschaukarte unter `site/brand/` | keine freie Lizenz: Sie sind das Erkennungszeichen dieses einen Angebots |
| Das Foto `site/brand/moderation-konrad.jpg` | keine freie Lizenz: Es zeigt Konrad Völkel |
| Impressum, Datenschutz und Nutzungsbedingungen unter `site/texte/` | keine freie Lizenz: Sie beschreiben dieses eine Angebot und nennen seinen Betreiber. Als Vorlage taugen sie nicht |
| Fremde Bestandteile | ihre eigenen Lizenzen, siehe [`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md) |

Wer den Code verändert und als Dienst im Netz anbietet, muss den Nutzern den veränderten Quelltext anbieten (AGPL §13). Dafür
gibt es `SITE_QUELLTEXT` in `site/site.env`: Steht dort eine Adresse, verlinkt die Seite „Über“ sie. Wer das Forum unter eigenem
Namen betreibt, braucht ein eigenes Logo und eigene Rechtstexte.
