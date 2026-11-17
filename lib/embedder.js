/** Das Modell in Node. Im Browser läuft dasselbe über die WASM-Runtime, siehe site/such-worker.js. */
import * as transformers from '@huggingface/transformers';
import { createEmbedder as create } from './model.js';
import { ort } from './orte.js';

export { MODEL_ID } from './model.js';
export const MODEL_DIR = process.env.HAINRICH2_MODELS ?? `${ort('models', 'trim')}/`;
export const createEmbedder = () => create(transformers, { modelPath: MODEL_DIR });
