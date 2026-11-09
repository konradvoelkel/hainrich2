# hAInrich2

Ein Frage-Antwort-Forum zum Skript [„Einführung in Deep Learning“](https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de/),
live unter [hai.konradvoelkel.com/eidl/](https://hai.konradvoelkel.com/eidl/). Studierende stellen Fragen zum Skript, ein Bot
entwirft Antworten über die Claude API, und jede Antwort des Bots belegt sich mit einem wörtlichen Zitat aus dem Skript. Eine
Moderation gibt Fragen frei und prüft die Antworten.

Ein privates Angebot von Konrad Völkel, nicht der Heinrich-Heine-Universität Düsseldorf.

## Wie es arbeitet

- **Lesen ist statisch.** Jede Frage ist eine fertige HTML-Seite, auch die Formeln. Lesen braucht kein JavaScript, kein Cookie
  und keine Anmeldung.
- **Die Suche läuft im Browser.** Ein auf 16.384 Tokens geschnittenes `multilingual-e5-small` rechnet per WebAssembly. Was jemand
  tippt, verlässt den Browser nicht, und das Modell lädt erst beim ersten Klick ins Suchfeld.
- **Fragen braucht einen Kurscode** aus dem Kurs. Er gibt ein Token aus, Nutzerkonten gibt es nicht.
- **Ohne Freigabe und ohne Einwilligung erreicht kein Text die Claude API.** Normal sieht erst die Moderation eine Frage, danach
  entwirft der Bot. Wer beim Absenden ausdrücklich einwilligt, bekommt sofort einen Entwurf; ein Checker hält dabei zurück, was
  nach persönlichen Angaben aussieht, etwa E-Mail-Adressen, Telefonnummern, eine Vorstellung mit Namen oder Gesundheitsangaben.
- **Zitate sind wörtlich.** Der Bot zitiert Passagen aus dem Skript, und die Moderation kann den Wortlaut eines Zitats nicht
  ändern. Ändert sich das Skript, zeigt `tools/skriptstand.mjs`, welche Antworten Wortlaut zitieren, den es nicht mehr gibt.
- **Ähnlichkeit entscheidet nichts.** Embeddings liefern Kandidaten, etwa für Duplikate. Entscheiden darf nur ein Klick, die
  Moderation oder ein Prüfschritt.
- **Getrennte Prozesse.** Der Web-Prozess hat keinen API-Key. Aufträge gehen über eine Schlange im Dateisystem an einen Worker,
  der als eigener Nutzer läuft und als einziger mit Claude spricht. Er zählt seine Kosten selbst und hält an einem Tages- und
  einem Monatsdeckel an.

Die Entscheidungen mit Datum und Begründung stehen in [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md), was geprüft ist und was
nicht in [`STATUS.md`](STATUS.md), die Messungen mit ihren Skripten unter [`research/`](research/).

## Aufbau

| Ort | Inhalt |
|---|---|
| `lib/` | Segmentierung des Skripts, Suche, Zitate, Fragepfad, Moderation, Worker-Logik, Rendering |
| `server/web.mjs`, `server/worker.mjs` | Web-Prozess und Worker, wie sie auf dem Server laufen |
| `site/` | Bau der statischen Site, Stylesheet, Browser-Skripte, Rechtstexte unter `site/texte/` |
| `tools/` | Korpus bauen, Zitate umziehen, Skriptstand prüfen, Antworten erzeugen und vergleichen |
| `test/`, `smoke/`, `smoke-mod/` | Unit-Tests, Browser-Tests gegen die gebaute Site und gegen die Moderation |

Server, DNS und Caddy gehören nicht hierher, sondern in ein eigenes Repository für die Infrastruktur.

## Ausprobieren

```bash
npm ci
npm test
```

Die Unit-Tests brauchen nichts außerhalb des Repositorys und rufen nie die echte API. Für Bau und Browser-Tests fehlen hier mit
Absicht das Suchmodell, die WASM-Laufzeit und die Arbeitsdaten (Korpus, Vektoren, Antworten): Sie sind groß, und das Modell wird
beim Bau gegen seine Prüfsumme geprüft. Woher alles kommt, steht in
[`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md).

## Sicherheit

Hinweise bitte nicht als Issue, sondern wie in [`SECURITY.md`](SECURITY.md) beschrieben.

## Lizenz

Der Code steht unter der GNU Affero General Public License, Version 3 oder später (`AGPL-3.0-or-later`, siehe
[`LICENSE`](LICENSE)). Wer ihn verändert und als Dienst im Netz anbietet, muss den Nutzern den veränderten Quelltext anbieten.

Ausgenommen ist das Foto `site/brand/moderation-konrad.jpg`: Es zeigt Konrad Völkel und steht unter keiner freien Lizenz. Das
Skript und die Zitate daraus stehen unter CC BY-SA 4.0, fremde Bestandteile unter ihren eigenen Lizenzen
([`THIRD_PARTY_PROVENANCE.md`](THIRD_PARTY_PROVENANCE.md)).
