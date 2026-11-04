# Status

_Stand 2026-11-04._

## Was existiert

- Git-Repo auf `main`, Remote `origin` ist das private `konradvoelkel/hainrich2` auf GitHub.
- `DEVELOPMENT_PLAN.md`, `CLAUDE.md`, dieses Dokument.
- `research/2026-11-04-dedupe/`: Messskripte und Ergebnisse zu Duplikaterkennung, Skript-Suche und
  Antworten mit lokalen Modellen.
- `research/2026-11-04-browsermodell/`: Modellwahl für den Browser. Das geschnittene Modell liegt
  außerhalb des Repos auf `xtraspace`, die Token-IDs im Repo.

## Was nicht existiert

- Kein Anwendungscode, keine Rolle im Server-Repo, kein DNS-Eintrag, keine Rechtstexte.
- Kein Key für den VPS. Der Laptop-Key liegt außerhalb des Repos und ist getestet.

## Nicht geprüft

- Ob der Laptop-Key im Workspace `hainrich2` hängt und das Limit von 20 $ greift. Der Key zeigt nur
  eine Workspace-ID, das lässt sich von hier nicht unterscheiden.
- Claude als Antwortgeber, Citations mit Opus 5.5.
- Latenz auf einem echten Telefon; gemessen ist nur CPU-Drosselung im Headless-Chromium.
- Text-Fragmente auf den MyST-Seiten.
- Alle Trefferquoten stammen aus einem kleinen, selbst geschriebenen Set, nicht aus echten Fragen.
- Der Abnahmewert für Duplikate in den Top 5 (85 %) ist nicht erreicht: 74 bis 80 %.

## Nächster Schritt

Phase 1 aus dem Plan: Korpus, Antwort-Pipeline, Seeds. Phase 0 ist abgeschlossen, bis auf die Latenz
auf einem echten Telefon.
