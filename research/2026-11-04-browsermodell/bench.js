// Latenz im Browser: gleiche Runtime und Einstellungen wie hAInrich (modules/model.js), Modell im Hauptthread.
import { pipeline, env } from './transformers.js';
const u = new URLSearchParams(location.search), model = u.get('model'), prefix = u.get('prefix') ?? '', threads = +(u.get('threads') ?? 1);
env.allowRemoteModels = false; env.allowLocalModels = true; env.localModelPath = '/models/'; env.useBrowserCache = false;
env.backends.onnx.wasm.wasmPaths = { mjs: '/wasm/ort-wasm-simd-threaded.mjs', wasm: '/wasm/ort-wasm-simd-threaded.wasm' };
env.backends.onnx.wasm.numThreads = threads;
const d = await (await fetch('/bench.json')).json();
const t0 = performance.now();
const pipe = await pipeline('feature-extraction', model, { dtype: 'q8' });
const load = performance.now() - t0;
const emb = async s => (await pipe(s, { pooling: 'mean', normalize: true })).data;
for (let i = 0; i < 3; i++) await emb(prefix + d.questions[i]);
const ms = [];
for (const q of d.questions) { const t = performance.now(); await emb(prefix + q); ms.push(performance.now() - t); }
ms.sort((a, b) => a - b);
const t1 = performance.now(); await emb('passage: ' + d.long); const long = performance.now() - t1;
let minCos = 1;
for (const [q, v] of Object.entries(d.expected[model] ?? {})) {
  const e = await emb(prefix + q); let c = 0; for (let i = 0; i < e.length; i++) c += e[i] * v[i]; minCos = Math.min(minCos, c);
}
window.__result = { load: Math.round(load), median: Math.round(ms[ms.length >> 1]), p95: Math.round(ms[Math.floor(ms.length * .95)]), long: Math.round(long), minCos: +minCos.toFixed(5), isolated: self.crossOriginIsolated };

// ?dump=1: alle Texte im Browser einbetten, um gemischte Vektoren zu prüfen (mixed.py)
if (u.get('dump')) {
  const a = await (await fetch('/all.json')).json(); const q = {}, c = [];
  for (const s of a.q) q[s] = Array.from(await emb(prefix + s));
  for (const s of a.c) c.push(Array.from(await emb('passage: ' + s)));
  window.__vectors = { q, c };
}
