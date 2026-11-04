// node embed.mjs <set.json> <modelPath> <modelId> <queryPrefix> <passagePrefix> <out.json>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const [set,modelPath,id,qp,pp,out]=process.argv.slice(2);
const require=createRequire('/home/konrad/Sciebo/hhu/hainrich/tools/package.json');
const t=await import(require.resolve('@huggingface/transformers'));
t.env.allowRemoteModels=false;t.env.allowLocalModels=true;t.env.localModelPath=modelPath;
const pipe=await t.pipeline('feature-extraction',id,{dtype:'q8'});
const emb=async s=>Array.from((await pipe(s,{pooling:'mean',normalize:true})).data);
const d=JSON.parse(fs.readFileSync(set,'utf8'));
const texts=[...new Set([...d.pos.flatMap(p=>[p[0],p[1]]),...d.neg.flat(),...d.cross.flat()])];
const q={};for(const s of texts)q[s]=await emb(qp+s);
const c=[];for(const k of d.chunks)c.push(await emb(pp+k.text));
fs.writeFileSync(out,JSON.stringify({q,c}));console.log(id,'done',texts.length,c.length);
