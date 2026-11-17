# Fremde Bestandteile

Nichts davon liegt in diesem Repository. Pakete kommen über `npm ci` nach `package-lock.json`, Modell und WASM liegen außerhalb
(`models/` und `wasm/` sind gitignored) und werden beim Bau gegen ihre Prüfsumme geprüft. Die Website nennt die Lizenzen im Impressum.

## Was die Website ausliefert

| Bestandteil | Fassung | Lizenz | Herkunft |
|---|---|---|---|
| Suchmodell `e5s-16384` | geschnitten aus `Xenova/multilingual-e5-small`, Revision `761b726dd34fb83930e26aab4e9ac3899aa1fa78` | MIT, wie das Basismodell [`intfloat/multilingual-e5-small`](https://huggingface.co/intfloat/multilingual-e5-small) | Vokabular auf 16.384 Tokens geschnitten, `onnx/model_quantized.onnx` SHA-256 `f37dfa6645b390114197d006274c4f330a71b12c973f55194f64a301aaef20d4`. Die behaltenen Token-IDs stehen in `research/2026-11-04-browsermodell/keep-ids-16384.txt`, der Schnitt in `trim.py` daneben. |
| [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) | 1.31.0-dev.20260914-8d85527a0 | MIT | `ort-wasm-simd-threaded.{mjs,wasm}` aus dem npm-Paket `onnxruntime-web` |
| [Transformers.js](https://github.com/huggingface/transformers.js) | 4.3.2 | Apache 2.0 | npm `@huggingface/transformers` |
| [KaTeX](https://katex.org/) | 0.19.1 | MIT | npm `katex`, Formeln werden beim Bau gesetzt |
| [markdown-it](https://github.com/markdown-it/markdown-it) | 15.0.3 | MIT | npm `markdown-it` |
| [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) | 5.3.0 (Fontsource) | SIL Open Font License 1.1 | npm `@fontsource-variable/bricolage-grotesque`, die Lizenz liegt als `schrift/OFL.txt` auf der Site |

## Nur beim Bauen oder auf dem Server

| Bestandteil | Fassung | Lizenz | Wofür |
|---|---|---|---|
| [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) | 1.8.0 | Apache 2.0 | der Worker, der Entwürfe bei Claude anfragt |
| [ONNX Runtime für Node](https://github.com/microsoft/onnxruntime) | 1.30.0 | MIT | npm `onnxruntime-node`, über Transformers.js: rechnet die Vektoren beim Bau und auf dem Server. Dorthin gehen nur die Dateien für die CPU (`tools/app-files.mjs`) |
| [sharp](https://sharp.pixelplumbing.com/) | 0.35.5 | Apache 2.0 | npm `sharp` mit `@img/sharp-linux-x64`, eine Abhängigkeit von Transformers.js. Ohne sie startet die Bibliothek nicht; Bilder verarbeitet hier nichts |
| [libvips](https://www.libvips.org/) | 8.18.7, aus `@img/sharp-libvips-linux-x64` 1.3.4 | LGPL 3.0 oder später | die Bibliothek hinter sharp: unverändert als fertige Binärdatei aus dem npm-Paket, dynamisch geladen. Welche weiteren Bibliotheken darin stecken, nennt `versions.json` im Paket |
| [Playwright](https://playwright.dev/) | 1.65.1 | Apache 2.0 | Browser-Tests |
| [Inter](https://rsms.me/inter/) | lokal installiert | SIL Open Font License 1.1 | `tools/render_brand.py` setzt damit die Vorschaukarte `site/brand/og-card.png`; die Schrift selbst wird nicht ausgeliefert |

Die Zitate auf der Site stammen aus dem Skript [„Einführung in Deep Learning“](https://eidl-skript-131e30.pages.cs.uni-duesseldorf.de/)
von Konrad Völkel, CC BY-SA 4.0. Der Korpus daraus liegt nicht im Repository.
