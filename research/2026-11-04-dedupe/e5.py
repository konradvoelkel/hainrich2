import json,torch,sys
from transformers import AutoTokenizer,AutoModel
n='intfloat/multilingual-e5-large'
tok=AutoTokenizer.from_pretrained(n,local_files_only=True)
dev='cuda' if torch.cuda.is_available() else 'cpu'
m=AutoModel.from_pretrained(n,local_files_only=True).to(dev).eval()
if dev=='cuda': m=m.half()
d=json.load(open('set.json'))
def emb(texts,prefix):
    out=[]
    for i in range(0,len(texts),32):
        b=tok([prefix+t for t in texts[i:i+32]],padding=True,truncation=True,max_length=512,return_tensors='pt').to(dev)
        with torch.no_grad(): h=m(**b).last_hidden_state
        a=b['attention_mask'].unsqueeze(-1).to(h.dtype)
        v=(h*a).sum(1)/a.sum(1)
        out+=torch.nn.functional.normalize(v.float(),dim=1).cpu().tolist()
    return out
texts=list(dict.fromkeys([t for p in d['pos'] for t in p[:2]]+[t for p in d['neg'] for t in p]+[t for p in d['cross'] for t in p]))
q=dict(zip(texts,emb(texts,'query: ')))
c=emb([k['text'] for k in d['chunks']],'passage: ')
json.dump({'q':q,'c':c},open('e5large.json','w'))
print('e5 done',dev,len(texts),len(c))
