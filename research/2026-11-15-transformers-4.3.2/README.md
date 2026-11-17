# transformers.js 4.3.0 → 4.3.2: Rechnet die neue Fassung dieselben Vektoren?

_Stand 2026-11-15, Zweig `abhaengigkeiten-2026-11`, Ausgang Commit `8aafbdf`. Skripte: `node-vektoren.mjs` (Passagen und Fragen in
Node), `browser-vektoren.mjs` (Fragen und Trefferlisten im Browser, hinter der CSP von `site/serve.mjs`). Beide laufen lokal, ohne
Netz und ohne API._

**Ergebnis:** Ja, Byte für Byte, in Node und in drei Browsern. Der Korpus und die gespeicherten Fragevektoren bleiben, wie sie sind.
Ausgespielt ist damit nichts: Auf dem VPS und in `www/` läuft 4.3.0, bis `site/deploy.sh` und `site/deploy-app.sh` zusammen gehen.

**Grenzen:** Gemessen sind die 466 Passagen von `work/korpus-2026-11-15b` und die 30 Seed-Fragen, auf einem Rechner (x86-64, Ryzen 7
5700X, Node 22.22.3) und in Headless-Browsern von Playwright. Kein Telefon, kein echtes Safari, nicht die CPU des VPS. Ladezeit und
Latenz habe ich nicht gemessen. Von 4.3.1 und 4.3.2 habe ich die Versionshinweise gelesen, nicht den Code.

## 1. Warum messen

Die Bibliothek rechnet die Vektoren, nach denen die Suche Fragen und Passagen ordnet. Sie läuft zweimal: in Node (Korpus, Fragevektoren
beim Bau, Worker) und im Browser (Suchanfrage). Eine Fassung, die anders rechnet, würde neue Anfragen gegen alte Vektoren halten. Deshalb
bekommt jeder Wechsel einen Vergleich und keinen Testlauf, auch ein Patch-Release (Playbook §3.6).

## 2. Was sich im Paket ändert

- `package-lock.json`: nur `@huggingface/transformers`, Prüfsumme wie in der Registry. `onnxruntime-node` 1.30.0, `onnxruntime-web`
  1.31.0-dev.20260914-8d85527a0, `onnxruntime-common` und `sharp` bleiben.
- `node_modules`, Datei für Datei verglichen: nur Dateien dieses Pakets, 33 geändert, 21 neu (Modellklassen für EmbeddingGemma 2 und
  LFM3 samt Typen).
- Gebauter Baum, 413 Dateien: nur `transformers.min.js` und seine drei komprimierten Fassungen. 581.935 → 587.917 Bytes, mit Brotli
  140.227 → 141.444. Die WASM-Runtime und das Modell sind dieselben Dateien.

| Datei | SHA-256 |
|---|---|
| `transformers.min.js` 4.3.0 | `1475fd440e9932ab206682ee42cb18f6097403e9ee77ea62084c592d0f83597d` |
| `transformers.min.js` 4.3.2 | `8b5a3171f8876bab2b1820a7d65eb87628e3d30bb5ea85b9dd398e76eb34decb` |

## 3. Messung

Vor dem Wechsel rechnet 4.3.0 im frisch installierten Worktree die `vectors.json` des Korpus Byte für Byte nach. Damit ist die
Rechnung auf diesem Rechner wiederholbar, und eine Abweichung danach läge an der Fassung.

| Was | 4.3.0 | 4.3.2 |
|---|---|---|
| Node, 466 Passagen, ungerundet | `11157448…3d17eb`, gleich `vectors.json` | dieselbe Datei |
| Node, 30 Seed-Fragen, ungerundet | `ada7337a…651289` | dieselbe Datei |
| Browser, 30 Seed-Fragen, ungerundet | `6d5d9c32…1a8eb1` | dieselbe Datei |
| Browser, Trefferlisten aus `such-worker.js` | `d9c00477…a717ac` | dieselbe Datei |

„Dieselbe Datei“ heißt `cmp` ohne Befund. Die Browserzeilen gelten für Chromium 159, Firefox 159 und WebKit 27.2 (Playwright 1.65.1);
alle drei liefern untereinander dieselben Bytes. Mit den Browsern von Playwright 1.63.0 (Chromium 153, Firefox 155, WebKit 26.6) kam
für 4.3.0 ebenfalls dieselbe Datei heraus. Node und Browser unterscheiden sich voneinander (kleinster Kosinus 0,9977 über die 30
Fragen); das ist der Abstand aus `research/2026-11-04-browsermodell`, „Browser gegen Node“, und er ist mit beiden Fassungen derselbe.

Die Vektoren im Browser kommen aus genau den ausgelieferten Dateien: `transformers.min.js`, `model.js`, `wasm/` und `models/` aus dem
gebauten Baum, mit denselben relativen Pfaden wie in `such-worker.js`. Die Trefferlisten liefert der echte Worker. In keinem Lauf gab
es einen Konsolenfehler oder eine Anfrage an einen fremden Host.

## 4. Tests am Zweig

- `npm test`: 230 von 230.
- `npm run smoke`: 19 von 19 in Chromium, Firefox und WebKit.
- `npm run smoke:mod`: 23 von 23 in Chromium und Firefox. Unter WebKit scheitern 14 von 23 an der Anmeldung, dieselben Tests mit
  Playwright 1.63.0 und 1.65.1; das ist die alte Lücke aus `STATUS.md`, kein Rückschritt.

## 5. Nachmachen

```bash
node research/2026-11-15-transformers-4.3.2/node-vektoren.mjs $HAINRICH2_DATEN/work/korpus-aktuell <ausgabe>
```

```bash
node site/build.mjs --modell claude-opus-5-5 --stimmen --fragen --ziel <probe-baum>
```

```bash
node research/2026-11-15-transformers-4.3.2/browser-vektoren.mjs <probe-baum> <ausgabe> firefox
```

Einmal vor und einmal nach dem Wechsel, in getrennte Verzeichnisse, dann `cmp`. Der Bau braucht ein eigenes `--ziel`, sonst
überschreibt er den Baum, aus dem `site/deploy.sh` ausliefert.

## 6. Nebenbefunde

1. **`site/deploy-app.sh` schickt das lokale `node_modules` auf den VPS.** Ein `npm install` im Arbeitsbaum geht also mit dem nächsten
   App-Deploy mit, auch wenn der nur einen Korpus nachziehen soll. Deshalb lief der Wechsel in einem eigenen Worktree.
2. **Ohne Installationsskripte fehlt eine Datei der Deploy-Liste.** `npm ci --ignore-scripts`, wie in der CI, lässt
   `libonnxruntime_providers_shared.so` weg; die holt nur das Installationsskript von `onnxruntime-node`, zusammen mit 270 MB für CUDA.
   `tools/app-files.mjs` nennt die Datei. Nach dem Lesen von `site/deploy-app.sh` bricht der Deploy dann lokal beim Zusammenstellen
   ab, bevor er den VPS berührt; ausgeführt habe ich das nicht. Der Embedder rechnet auf der CPU auch ohne die Datei.
3. **Eine absolute Adresse als `modelPath` ergibt im Browser eine Pipeline ohne aufrufbaren Tokenizer** (`this.tokenizer is not a
   function`, 4.3.0, auf der Seite statt im Worker). Mit `./models/` wie in `such-worker.js` geht es. Die Ursache habe ich nicht
   gesucht, mit 4.3.2 nicht wiederholt.
