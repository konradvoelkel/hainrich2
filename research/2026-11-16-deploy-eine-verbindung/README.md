# Deploy über eine SSH-Verbindung

_Stand 2026-11-16, auf Commit `f811f24`. Skript: `fehlerwege.sh` (beide Deploy-Skripte in einer Kopie gegen Attrappen von `ssh` und
`rsync`, ohne Netz). Die Verbindungen sind mit `strace -f -e trace=connect` in Probeläufen gegen den Server gezählt._

**Ergebnis:** `site/deploy-app.sh` baut im Probelauf eine Verbindung zu Port 22 auf statt zwei, im echten Lauf laut Skript eine statt
drei. Scheitert ein Schritt, nennt die letzte Zeile den Schritt und was schon auf dem Server liegt. Nach dem Neustart prüft das Skript,
ob `hainrich2-web` nach fünf Sekunden aktiv ist und keinen automatischen Neustart gezählt hat.

**Grenzen:** Der echte Lauf mit Neustart ist nicht gelaufen. Gemessen sind die Probeläufe gegen den Server und alle Fehlerwege gegen
Attrappen; dass der Neustart über dieselbe Verbindung geht, zeigt am Server bisher nur der Probelauf, der an seiner Stelle den
Zustand der Unit liest. Warum `ufw limit` am 16.11. die Verbindung für den Neustart abwies, ist nicht geklärt: Beide Deploys
zusammen waren vier Verbindungen in rund 16 Sekunden, das Log der Firewall habe ich nicht gelesen. Andere Sitzungen auf diesem
Rechner zählen am Server unter derselben Adresse mit. Auch die eine Verbindung kann also abgewiesen werden, dann aber, bevor etwas
übertragen ist.

## 1. Anlass

Am 2026-11-16 um 01:54 liefen in `site/deploy-app.sh` beide `rsync` durch, die dritte Verbindung, `ssh … systemctl restart`, bekam
`Connection refused`. Das Skript endete mit Status 255, und der alte Prozess lief rund zweieinhalb Minuten über den neuen Dateien,
bis der Neustart von Hand nachgeholt war. Aus dem Status allein war nicht zu lesen, welche Hälfte durch war.

## 2. Was sich ändert

| | vorher | jetzt |
|---|---|---|
| `deploy-app.sh`, Probelauf | 2 Verbindungen (gemessen) | 1 (gemessen) |
| `deploy-app.sh`, echter Lauf | 3 (aus dem Skript gelesen) | 1 (aus dem Skript gelesen, nicht gelaufen) |
| `deploy.sh` | 1 (gemessen) | 1, unverändert |
| ein Tag mit beiden Probeläufen und beiden Deploys | 7 | 4 |
| Scheitern nach dem Übertragen | Status 255, sonst nichts | Schritt und Stand in der letzten Zeile |
| nach dem Neustart | keine Prüfung | aktiv nach 5 s, `NRestarts` gleich 0 |

- **Eine Verbindung:** Der erste Aufruf (`ssh … true`) öffnet sie mit `ControlMaster=auto` und einem Socket in einem eigenen
  Verzeichnis, `rsync -e` und der Neustart nehmen sie. Am Ende schließt `-O exit` sie; im Probelauf blieb kein Prozess und kein
  Verzeichnis zurück. `ControlPersist=30` ist nur das Netz für den Fall, dass das Skript ohne sein Ende stirbt.
- **Probelauf:** An der Stelle des Neustarts liest er `systemctl is-active hainrich2-web`. So geht auch er alle drei Schritte.
- **Stabil statt nur aktiv:** Die Unit ist vom Typ `simple` mit `Restart=always` und `RestartSec=2`. Ein Prozess, der beim Start
  stirbt, sieht zwischendurch aktiv aus; die Zahl der automatischen Neustarts verrät ihn.
- **`deploy.sh`** braucht ohnehin nur eine Verbindung und bekommt nur die letzte Zeile beim Scheitern.

## 3. Fehlerwege

`fehlerwege.sh` kopiert beide Skripte in ein leeres Verzeichnis ohne `deploy.local.env`, setzt das Ziel auf
`niemand@deploy.invalid` und stellt Attrappen von `ssh` und `rsync` in den Pfad, die mitschreiben und an der verlangten Stelle
scheitern. Zwölf Läufe, alle wie erwartet:

| Skript | Lauf | scheitert bei | Status | letzte Zeile nennt |
|---|---|---|---|---|
| `deploy-app.sh` | echt | nichts | 0 | neu gestartet, aktiv, ohne automatischen Neustart |
| `deploy-app.sh` | echt | Verbindung | 255 | nichts übertragen, Hinweis auf `ufw limit` |
| `deploy-app.sh` | echt | Code | 12 | Code kann halb übertragen sein, noch einmal starten |
| `deploy-app.sh` | echt | Korpus | 12 | Code übertragen, Korpus vielleicht nicht |
| `deploy-app.sh` | echt | Neustart, Verbindung weg | 255 | Code und Korpus übertragen, Befehl zum Nachholen |
| `deploy-app.sh` | echt | Neustart, Dienst nicht stabil | 1 | dasselbe |
| `deploy-app.sh` | Probelauf | nichts | 0 | Zustand der Unit, kein Neustart |
| `deploy-app.sh` | Probelauf | Verbindung | 255 | nichts übertragen |
| `deploy-app.sh` | Probelauf | Code | 12 | Probelauf, nichts verändert |
| `deploy.sh` | echt | nichts | 0 | Liste von rsync |
| `deploy.sh` | echt | Übertragen | 12 | Hinweis auf `ufw limit`, sonst noch einmal starten |
| `deploy.sh` | Probelauf | Übertragen | 12 | Probelauf, nichts verändert |

Je Lauf von `deploy-app.sh` prüft das Skript außerdem, dass alle Aufrufe denselben Socket nennen, dass die Verbindung am Ende
geschlossen wird und dass ein Probelauf nie `systemctl restart` schickt. Als Gegenprobe meldet es an den Skripten von `f811f24` elf
von zwölf Läufen als abweichend.

## 4. Nachmachen

```bash
research/2026-11-16-deploy-eine-verbindung/fehlerwege.sh
```

```bash
DRY_RUN=1 strace -f -qq -e trace=connect -o /tmp/deploy-app.strace site/deploy-app.sh
```

```bash
grep -c 'sin_port=htons(22)' /tmp/deploy-app.strace
```
