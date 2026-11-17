# Anthropic SDK 1.4.0 → 1.8.0: Schickt der Worker dieselben Anfragen?

_Stand 2026-11-16, Zweig `abhaengigkeiten-2026-11`, auf Commit `d526026`. Skripte: `attrappe.mjs` (der echte `server/worker.mjs` gegen
einen Attrappen-Server), `werkzeug.mjs` (die Aufrufwege der Werkzeuge), `vergleich.mjs`. Alles läuft in einem Netz-Namensraum ohne
Außenverbindung, ohne Key und ohne echten Aufruf._

**Ergebnis:** Ja. In 19 Szenarien gehen mit 1.8.0 dieselben Anfragen hinaus wie mit 1.4.0: der Rumpf Byte für Byte, die Kopfzeilen bis
auf die zwei, die die Fassung nennen. Das Ergebnis in der Schlange, das Kostenbuch, die Zahl der Anfragen und das Ende des Prozesses
sind gleich. Anders ist eine Logzeile: Bei einem Fehler schreibt der Worker jetzt dessen Klasse statt `Error`. Ausgespielt ist damit
nichts, auf dem VPS läuft 1.4.0 bis zum nächsten `site/deploy-app.sh`.

**Grenzen:** Die Attrappe antwortet so, wie die Dokumentation und `lib/` die API beschreiben. Der Vergleich zeigt, dass das SDK sich
gleich verhält, nicht dass die echte API eine Anfrage annimmt; das zeigt erst ein echter Aufruf, und den gab es nicht. Gemessen auf
einem Rechner mit Node 22.22.3, die Node-Fassung des VPS habe ich nicht geprüft. Von den Versionshinweisen 1.5.0 bis 1.8.0 habe ich
jeden Eintrag gelesen. Vom Code habe ich die Unterschiede in `client.mjs`, `core/api-promise.mjs`, `internal/utils/log.mjs`,
`lib/internal/beta-messages-request.mjs`, `resources/beta/messages/messages.mjs` und `lib/transform-json-schema.mjs` gelesen, dazu
`core/error.mjs` der neuen Fassung; nicht `core/streaming.mjs`, die Tracing-Dateien und die Ressourcen der Admin-API.

## 1. Warum prüfen

Das SDK rechnet nichts. Es schickt Anfragen, die Geld kosten und Text von Studierenden tragen, und drei Zusagen hängen an seinem
Verhalten:

- **Keine Anfrage ohne Buchung** (`CLAUDE.md`, „Was beißt“ 13, Plan D26). Das SDK darf nichts selbst wiederholen (`maxRetries: 0`).
  Eine Absage muss einen `status` tragen, dann nimmt `lib/draft.js` die Buchung zurück. Ein Abbruch oder Timeout darf keinen tragen,
  dann bleibt sie stehen.
- **Die Anfrage selbst:** API-Version, Beta-Kopfzeile, `fallbacks: "default"`, Timeout.
- **Das Log:** Der Worker schreibt nie den Text einer Frage hinein.

Bisher stand das im Code und in Kommentaren. `test/draft.test.mjs` prüft `lib/draft.js` mit einem nachgebauten `call`, die Zeilen des
Workers, die den Client bauen, lief vor dieser Messung nur der Betrieb.

## 2. Was sich im Paket ändert

- `package-lock.json`: nur der Eintrag des SDK. Die Prüfsumme ist die der Registry und die des Pakets, das ich vorher einzeln geladen
  und ausgepackt habe. Die drei Abhängigkeiten (`standardwebhooks`, `json-schema-to-ts`, `@opentelemetry/api`) bleiben, das Paket hat
  kein Installationsskript.
- `node_modules`, Datei für Datei: nur Dateien des SDK (1.094 geändert, 9 neu, alle `core/error-classes.*`) und
  `node_modules/.package-lock.json`. Der installierte Baum ist Datei für Datei das ausgepackte Paket.
- `tools/app-files.mjs` nennt dieselben 65 Zeilen, der App-Deploy trägt also nur `package.json` und `node_modules/@anthropic-ai/sdk`.
- 1.8.0 ist vom 10.11.2026 und war bei der Messung sechs Tage alt.

Was aus den Versionshinweisen diesen Code berührt:

| Fassung | Eintrag | Folge hier |
|---|---|---|
| 1.5.0 | Fehlerklassen je HTTP-Status und je Fehlercode, dazu `apiMessage`, `errorCode` und `details` am Fehler | `error.status` bleibt eine Zahl, `lib/draft.js` entscheidet wie bisher (Szenarien `status-*`) |
| 1.5.0 | Streaming dekodiert je Stück statt je Zeile | `tools/gen-seeds.mjs`; gleiche Nachricht, auch wenn ein Stück mitten im Umlaut endet (`werkzeug-strom`) |
| 1.6.0 | jeder Fehler heißt wie seine Klasse | die Logzeile `Entwurf gescheitert:` nennt die Klasse |
| 1.7.0 | das Debug-Log enthält den Rumpf einer gescheiterten Antwort | nur mit `ANTHROPIC_LOG=debug`, siehe Nebenbefund 2 |
| 1.7.0 | die Helfer für strukturierte Ausgabe behalten `const` und `enum` | die Helfer nutzt hier niemand; das rohe Schema mit `enum` aus `tools/triage-checks.mjs` geht unverändert hinaus (`werkzeug-schema-enum`) |

Der Rest sind neue Modellnamen, die Admin-API und Dokumentation.

## 3. Messung

`attrappe.mjs` startet je Szenario einen HTTP-Server auf `127.0.0.1` und den echten Worker als Prozess, mit einer Frage aus
`seeds/fragen.json` in der Schlange, dem Korpus `work/korpus-2026-11-15b` und einem Schlüssel, der keiner ist. Der Server hält jede
Anfrage fest und antwortet nach Drehbuch. Verglichen werden Methode, Adresse, alle Kopfzeilen, der Rumpf samt SHA-256, die Zahl der
Anfragen, das Ergebnis in der Schlange, das Kostenbuch, der Rückgabewert des Prozesses und seine Logzeilen.

| Szenario | Die Attrappe antwortet | Anfragen | Ergebnis | Kostenbuch | Logzeile 1.4.0 → 1.8.0 |
|---|---|---|---|---|---|
| `antwort` | Antwort mit Zitat | 1 | `ok` | 1 Buchung | keine |
| `zweiter-anlauf` | erst `KEIN_BELEG`, dann Antwort | 2 | `ok` | 2 Buchungen | keine |
| `fallback` | Antwort vom Ersatzmodell, zwei Versuche in `usage.iterations` | 1 | `ok` | 2 Buchungen, eine je Modell | keine |
| `verweigert` | `stop_reason: "refusal"` | 1 | `verweigert` | 1 Buchung | keine |
| `abgeschnitten` | `stop_reason: "max_tokens"` | 1 | `abgeschnitten` | 1 Buchung | keine |
| `status-400` | 400 | 1 | `fehler` | leer | `Error 400` → `BadRequestError 400` |
| `status-401` | 401 | 1 | `fehler` | leer | `Error 401` → `AuthenticationError 401` |
| `status-429` | 429 mit `retry-after` und `x-should-retry: true` | 3 | `fehler` | leer | `Error 429` → `RateLimitError 429` |
| `status-429-mit-code` | 429 mit `details.error_code` | 3 | `fehler` | leer | `Error 429` → `RampLimitExceededError 429` |
| `status-500` | 500 | 3 | `fehler` | leer | `Error 500` → `InternalServerError 500` |
| `status-529` | 529 | 3 | `fehler` | leer | `Error 529` → `OverloadedError 529` |
| `abbruch` | trennt nach der Anfrage | 1 | `fehler` | 0,60 $ offen | `Error` → `APIConnectionError` |
| `halbe-antwort` | 200, der Rumpf bricht ab | 1 | `fehler` | 0,60 $ offen | `TypeError`, in beiden |
| `timeout` | nichts | 1 | `fehler` nach 120 s | 0,60 $ offen | `Error` → `APIConnectionTimeoutError` |
| `werkzeug-antwort` | Antwort mit Zitat, `messages.create` ohne Beta | 1 | `ok` | – | keine |
| `werkzeug-richter` | zwei Urteile als JSON | 2 | Duplikat erkannt | – | keine |
| `werkzeug-schema-enum` | ein Urteil als JSON | 1 | gelesen | – | keine |
| `werkzeug-strom` | Ereignisstrom in Stücken zu 37 Bytes | 1 | Nachricht vollständig | – | keine |
| `werkzeug-batch` | Batch anlegen, zweimal Stand, Ergebnisse als JSONL | 4 | eine Antwort, ein Fehler | – | keine |

Die drei Anfragen bei 429, 500 und 529 sind die drei Versuche aus `lib/draft.js`, im Abstand von 2 und 8 Sekunden. Jede trägt
`x-stainless-retry-count: 0`: Das SDK hat in keiner Fassung selbst wiederholt, auch nicht, wenn die Antwort es dazu einlädt. Bei
Abbruch, halber Antwort und Timeout geht genau eine Anfrage hinaus, und die Buchung über 0,60 $ bleibt offen stehen.

Was der Worker in beiden Fassungen schickt: `POST /v1/messages` mit `anthropic-version: 2026-10-21`,
`anthropic-beta: server-side-fallback-2026-07-01`, dem Schlüssel als `authorization: Bearer`, `x-stainless-timeout: 120` und keiner
Trace-Kopfzeile. Der Rumpf hat 29.879 Bytes (SHA-256 `d1d5b365…848d75`), 30 Dokumente und `fallbacks: "default"`. Verschieden sind
nur `user-agent` und `x-stainless-package-version`.

Die 14 Szenarien des Workers liefen je Fassung zweimal, mit demselben Satz bis auf die Zeiten. Als Gegenprobe meldet `vergleich.mjs`
vier von Hand eingebaute Abweichungen: ein anderes `max_tokens`, eine andere API-Version, eine vierte Anfrage und eine fehlende
Buchung.

## 4. Tests am Zweig

- `npm test`: 230 von 230.
- `npm run smoke`: 19 von 19 in Chromium. `npm run smoke:mod`: 23 von 23 in Chromium.

Firefox und WebKit habe ich nicht wiederholt: Das SDK steht weder in der gebauten Site noch im Web-Prozess, nur
`server/worker.mjs` und fünf Werkzeuge importieren es.

## 5. Nachmachen

Einmal mit der alten und einmal mit der neuen Fassung in `node_modules`, in getrennte Verzeichnisse:

```bash
unshare -rn sh -c 'ip link set lo up && node research/2026-11-16-anthropic-sdk-1.8.0/attrappe.mjs $HAINRICH2_DATEN/work/korpus-aktuell <ausgabe>'
```

```bash
node research/2026-11-16-anthropic-sdk-1.8.0/vergleich.mjs <alt> <neu>
```

Ein Lauf dauert gut zwei Minuten, weil `timeout` die zwei Minuten des Workers abwartet. Mit `'^werkzeug-'` als drittem Argument
laufen nur die Werkzeuge. Ohne Netz-Namensraum bricht `attrappe.mjs` ab.

## 6. Nebenbefunde

1. **Die Logzeile wird genauer und bleibt ohne Inhalt.** `Entwurf gescheitert: RateLimitError 429` sagt mehr als `Error 429`, und ein
   Timeout ist jetzt von einem Abbruch zu unterscheiden. Klasse und Status tragen keinen Text der Frage. Nach dieser Zeile sucht
   nichts, weder hier noch im Server-Repo.
2. **`ANTHROPIC_LOG=debug` schreibt ab 1.7.0 den Rumpf einer Absage ins Log**, also die Fehlermeldung der API, und die kann Teile der
   Anfrage zitieren. Die Vorgabe ist `warn`, und im Server-Repo setzt keine Datei die Variable. Wer sie zur Fehlersuche einschaltet,
   bricht die Zusage aus `lib/draft.js`.
3. **Den Worker startet bisher kein Test als Prozess.** `attrappe.mjs` ist das Erste, das `server/worker.mjs` von der Schlange bis zum
   Kostenbuch durchläuft. Als Test in `npm test` taugt es so nicht: Es braucht `unshare` und wartet zwei Minuten.
