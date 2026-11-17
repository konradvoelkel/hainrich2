import json,glob,re,os
pos=[
("Was ist der Unterschied zwischen Batch Gradient Descent und Mini-Batch SGD?","Worin unterscheiden sich Mini-Batches vom vollen Gradientenabstieg?",["08-","26-"]),
("Warum braucht man überhaupt nichtlineare Aktivierungsfunktionen?","Was passiert, wenn ein Netz keine Nichtlinearität hat?",["11-","12-","02-"]),
("Wieso verschwindet der Gradient bei Sigmoid in tiefen Netzen?","Warum lernen tiefe Netze mit Sigmoid so schlecht, Stichwort vanishing gradient?",["11-","12-","13-","18-"]),
("Was macht der Reparametrisierungstrick beim VAE?","Wozu braucht der Variational Autoencoder den Reparameterization Trick?",["15-"]),
("Wie wähle ich die Lernrate?","Welchen Wert sollte die learning rate haben?",["08-","26-","03-"]),
("Warum benutzt man Cross-Entropy statt MSE für Klassifikation?","Wieso nimmt man bei Klassifikationsproblemen nicht den quadratischen Fehler als Loss?",["07-","06-"]),
("Was bedeutet der Universelle Approximationssatz?","Kann ein neuronales Netz wirklich jede Funktion lernen?",["13-"]),
("Wie funktioniert Backpropagation?","Kann mir jemand die Rückwärtsausbreitung der Gradienten erklären?",["09-"]),
("Was ist ein Tensor in PyTorch?","Was genau versteht PyTorch unter einem Tensor?",["05-"]),
("Was macht loss.backward()?","Was passiert genau, wenn ich backward auf dem Loss aufrufe?",["10-","09-"]),
("Warum muss man optimizer.zero_grad() aufrufen?","Wieso muss ich die Gradienten vor jedem Schritt zurücksetzen?",["10-","06-"]),
("Wozu dient der Softmax am Ende des Netzes?","Warum steht in der letzten Schicht ein Softmax?",["06-","02-","08-"]),
("Was ist der Unterschied zwischen Autoencoder und VAE?","Worin unterscheidet sich ein normaler Autoencoder vom Variational Autoencoder?",["15-","14-"]),
("Wie lernt word2vec seine Wortvektoren?","Woher kommen die Embeddings bei word2vec?",["16-"]),
("Was ist Attention im Transformer?","Wie funktioniert der Aufmerksamkeitsmechanismus bei Transformern?",["19-"]),
("Warum kann ein einzelnes Perzeptron XOR nicht lernen?","Wieso scheitert das Perzeptron am XOR-Problem?",["02-","12-","09-"]),
("Was ist Overfitting und wie erkenne ich es?","Woran sehe ich, dass mein Modell überangepasst ist?",["14-","24-"]),
("Was ist der Unterschied zwischen Parametern und Hyperparametern?","Was zählt als Hyperparameter und was als Parameter?",["01-","03-","08-","12-"]),
("Wofür braucht man die Kettenregel beim Training?","Was hat die Kettenregel mit dem Lernen neuronaler Netze zu tun?",["08-","09-","10-"]),
("Warum sagt man, ein RNN hat ein Gedächtnis?","Wie merkt sich ein rekurrentes Netz frühere Eingaben?",["18-"]),
("Was ist Maximum Likelihood?","Was bedeutet es, die Wahrscheinlichkeit der Daten zu maximieren?",["07-"]),
("Was ist die ELBO?","Was genau optimiert man beim VAE, diese evidence lower bound?",["15-"]),
("Warum ist ReLU so beliebt?","Wieso verwendet heute fast jeder ReLU als Aktivierung?",["11-"]),
("Was ist ein Berechnungsgraph?","Wie merkt sich Autograd die Rechenschritte?",["10-","05-"]),
]
neg=[
("Warum ist ReLU besser als Sigmoid?","Wann ist Sigmoid besser als ReLU?"),
("Was ist ein Autoencoder?","Was ist ein Variational Autoencoder?"),
("Wie berechne ich den Gradienten der Cross-Entropy?","Wie berechne ich den Gradienten des MSE-Loss?"),
("Was ist der Unterschied zwischen Encoder und Decoder im Transformer?","Was ist der Unterschied zwischen Encoder und Decoder im Autoencoder?"),
("Wie wähle ich die Lernrate?","Wie wähle ich die Batchgröße?"),
("Was passiert, wenn die Lernrate zu groß ist?","Was passiert, wenn die Lernrate zu klein ist?"),
("Warum braucht man nichtlineare Aktivierungsfunktionen?","Warum braucht man eine Loss-Funktion?"),
("Wie funktioniert Backpropagation bei RNNs?","Wie funktioniert Backpropagation bei Feedforward-Netzen?"),
("Was macht optimizer.step()?","Was macht optimizer.zero_grad()?"),
("Warum kann ein einzelnes Perzeptron XOR nicht lernen?","Wie kann ein Netz mit einer versteckten Schicht XOR lernen?"),
("Was ist Softmax?","Was ist Sigmoid?"),
("Was ist die Dimension des Tensors nach der ersten Schicht?","Was ist die Dimension des Tensors nach der letzten Schicht?"),
("Was ist Skip-gram bei word2vec?","Was ist CBOW bei word2vec?"),
("Warum verschwindet der Gradient bei Sigmoid?","Warum explodiert der Gradient bei RNNs?"),
("Wie viele Parameter hat ein vollverbundenes Netz?","Wie viele Schichten sollte ein vollverbundenes Netz haben?"),
("Was ist L1-Regularisierung?","Was ist L2-Regularisierung?"),
("Was ist der Reparametrisierungstrick?","Was ist die KL-Divergenz im VAE?"),
("Was ist Self-Attention?","Was ist Cross-Attention?"),
("Wann benutzt man Adam?","Wann benutzt man SGD mit Momentum?"),
("Wie funktioniert ein Graph Neural Network?","Wie funktioniert ein Recurrent Neural Network?"),
("Konvergiert SGD immer?","Konvergiert das Perzeptron immer?"),
("Ist Deep Learning dasselbe wie maschinelles Lernen?","Ist ein Perzeptron dasselbe wie ein Neuron?"),
("Was ist Positional Encoding?","Was ist One-Hot-Encoding?"),
("Warum normalisiert man die Eingaben?","Warum initialisiert man die Gewichte zufällig?"),
]
cross=[
("What does the reparameterization trick do in a VAE?","Was macht der Reparametrisierungstrick beim VAE?"),
("Why do we need non-linear activation functions?","Warum braucht man überhaupt nichtlineare Aktivierungsfunktionen?"),
("How do I choose the learning rate?","Wie wähle ich die Lernrate?"),
("Why can't a single perceptron learn XOR?","Warum kann ein einzelnes Perzeptron XOR nicht lernen?"),
("What is the chain rule used for in training?","Wofür braucht man die Kettenregel beim Training?"),
("What is overfitting?","Was ist Überanpassung?"),
]
root=os.environ['EIDL_SKRIPT']  # das Repo des Skripts
chunks=[]
for f in sorted(glob.glob(root+'/part-*/*.md')):
    t=open(f,encoding='utf8').read()
    t=re.sub(r'^---\n.*?\n---\n','',t,flags=re.S)
    stem=os.path.basename(f)
    head=''
    buf=''
    def flush():
        global buf
        b=buf.strip()
        if len(b)>=80: chunks.append({'file':stem,'head':head,'text':(head+'\n'+b)[:900]})
        buf=''
    for para in re.split(r'\n\s*\n',t):
        m=re.match(r'^(#{1,4}) (.+)',para)
        if m:
            flush(); head=m.group(2).strip(); continue
        if len(buf)+len(para)>700: flush()
        buf+=para+'\n\n'
    flush()
json.dump({'pos':pos,'neg':neg,'cross':cross,'chunks':chunks},open('set.json','w'),ensure_ascii=False)
print(len(pos),len(neg),len(cross),'chunks',len(chunks),'mean chars',sum(len(c['text']) for c in chunks)//len(chunks))
