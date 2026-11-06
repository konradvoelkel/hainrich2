/**
 * Zitate auf einen neuen Korpus umziehen. Eine Antwort zitiert Passagen mit ID und Hash; ändert das Skript Seitennamen
 * oder Schnitt, passen beide nicht mehr, obwohl der Text noch dasteht. Umziehen darf nur, was wörtlich steht. Das Ziel
 * eines Links zählt nicht zum Wortlaut, der Folienlink am Kapitelanfang auch nicht. Alles andere bleibt stehen und bricht
 * den Build (I4).
 */
const wording = text => text.replace(/\]\([^)]*\)/g, ']').replace(/\s+/g, ' ').trim();
const content = text => wording(text.replace(/^\[Folien VL[^\]]*\]\([^)]*\)\s*/, ''));

/** Die neue Passage zum Zitat und wie sie gefunden wurde, oder null */
export function moveCitation(cited, passages) {
  const pool = [...passages.filter(p => p.page === cited.page), ...passages.filter(p => p.page !== cited.page)];
  const same = pool.find(p => p.id === cited.id && p.hash === cited.hash);
  if (same) return { passage: same, how: 'gleich' };
  const moved = pool.find(p => p.hash === cited.hash);
  if (moved) return { passage: moved, how: 'verschoben' };
  const old = content(cited.text) || wording(cited.text);
  const relinked = pool.find(p => content(p.text) === old);
  if (relinked) return { passage: relinked, how: 'neuer Link' };
  const larger = pool.find(p => content(p.text).includes(old));
  return larger ? { passage: larger, how: 'neu geschnitten' } : null;
}
