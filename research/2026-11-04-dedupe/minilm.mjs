import fs from 'node:fs';
import { createRequire } from 'node:module';
const R=process.env.HAINRICH1; // das Repo des Vorgängers
const require=createRequire(R+'/tools/package.json');
const transformers=await import(require.resolve('@huggingface/transformers'));
const {createEmbedder}=await import(R+'/modules/model.js');
const e=createEmbedder(transformers,{modelPath:R+'/models/'});
await e.load();
const d=JSON.parse(fs.readFileSync('set.json','utf8'));
const texts=[...new Set([...d.pos.flatMap(p=>[p[0],p[1]]),...d.neg.flat(),...d.cross.flat()])];
const q={};for(const t of texts)q[t]=Array.from(await e.embed(t));
const c=[];for(const k of d.chunks)c.push(Array.from(await e.embed(k.text)));
fs.writeFileSync('minilm.json',JSON.stringify({q,c}));
console.log('minilm done',texts.length,c.length);
