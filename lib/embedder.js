/**
 * Das geschnittene e5-small in Node. Im Browser läuft dasselbe Modell über die WASM-Runtime; die
 * Prefixe gehören zum Modell und dürfen nicht fehlen.
 */
import * as transformers from '@huggingface/transformers';

export const MODEL_DIR = process.env.HAINRICH2_MODELS ?? '/media/konrad/xtraspace/hainrich2/models/trim/';
export const MODEL_ID = 'e5s-16384';

export async function createEmbedder() {
  const { pipeline, env } = transformers;
  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = MODEL_DIR;
  const pipe = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' });
  const embed = async text => Array.from((await pipe(text, { pooling: 'mean', normalize: true })).data);
  return { query: text => embed(`query: ${text}`), passage: text => embed(`passage: ${text}`) };
}
