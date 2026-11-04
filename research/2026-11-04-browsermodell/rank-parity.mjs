// node rank-parity.mjs <set.json> <vectors.json>: lib/rank.js gegen die Zahlen aus cand2.py (Kosinus+2*Profil k=20).
import fs from 'node:fs';
import { centerPassages, profile, rankQuestions } from '../../lib/rank.js';
const d = JSON.parse(fs.readFileSync(process.argv[2])), e = JSON.parse(fs.readFileSync(process.argv[3]));
const bank = [...new Set([...d.pos.map(q => q[1]), ...d.neg.flat()])];
const B = bank.map(t => e.q[t]), C = centerPassages(e.c), P = B.map(v => profile(C, v));
const ranks = d.pos.map(([a, b]) => rankQuestions(e.q[a], B, P, C).filter(i => bank[i] !== a).indexOf(bank.indexOf(b)) + 1);
console.log([1, 3, 5, 10, 20].map(k => `Top${k}=${Math.round(100 * ranks.filter(r => r <= k).length / ranks.length)}%`).join(' '));
