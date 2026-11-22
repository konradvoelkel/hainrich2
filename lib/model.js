/**
 * Das geschnittene e5-small. Die Laufzeit kommt von außen, damit Node und Browser denselben Code nutzen;
 * die Prefixe gehören zum Modell und dürfen nicht fehlen.
 */
export const MODEL_ID = 'e5s-16384';

export async function createEmbedder({ pipeline, env }, { modelPath, wasmPath = null }) {
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = modelPath;
  if (wasmPath) {
    env.backends.onnx.wasm.wasmPaths = { mjs: `${wasmPath}ort-wasm-simd-threaded.mjs`, wasm: `${wasmPath}ort-wasm-simd-threaded.wasm` };
    env.backends.onnx.wasm.numThreads = 1;
    /** sonst lädt die Bibliothek die Runtime über eine blob:-URL, und die verbietet unsere CSP */
    env.useWasmCache = false;
    /**
     * Kein Cache Storage: Dort nahm die Bibliothek das Modell vor dem Netz und ohne Ablauf, ein Neuschnitt unter demselben Namen wäre bei
     * Wiederbesuchern nie angekommen, während `vektoren.json` schon neu ist. So gilt der HTTP-Cache des Webservers, für das Modell ein
     * Tag (research/2026-11-21-modern-web-guidance, Abschnitt 2). Ein Neuschnitt bekommt trotzdem einen neuen Namen.
     */
    env.useBrowserCache = false;
  }
  const pipe = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' });
  const embed = async text => Array.from((await pipe(text, { pooling: 'mean', normalize: true })).data);
  return { query: text => embed(`query: ${text}`), passage: text => embed(`passage: ${text}`) };
}
