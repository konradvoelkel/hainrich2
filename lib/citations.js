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

/** Steht der Wortlaut eines Zitats noch in einer der Passagen, egal wo? Wie moveCitation ohne Ort, für viele Zitate gegen einen Korpus */
export function quotedIn(passages) {
  const texts = passages.map(p => content(p.text));
  return cited => {
    const old = content(cited.text) || wording(cited.text);
    return texts.some(text => text.includes(old));
  };
}

/**
 * Für die Zitate in `public.db` (Plan D36): wohin ein Zitat im Korpus gehört, als `{ titel, pfad, text, url }`, oder null, wenn sein
 * Wortlaut dort nicht mehr steht. Die Datenbank kennt von einem Zitat weder Kennung noch Hash, also entscheidet der Wortlaut, zuerst
 * auf derselben Seite des Skripts. Der Wortlaut ändert sich dabei nie: Steht er als eigene Passage da, kommt deren Text (nur Linkziele
 * können anders sein); ist er Teil einer größeren Passage geworden, bleibt der alte Text und zeigt auf sie.
 */
const TEIL_AB = 80;

export function relinker(passages, quoteUrl) {
  const pageOf = address => address.split('#')[0];
  const known = passages.map(passage => ({ passage, content: content(passage.text) }));
  return zitat => {
    const old = content(zitat.text) || wording(zitat.text);
    const here = pageOf(zitat.url);
    const pool = [...known.filter(k => pageOf(k.passage.link) === here), ...known.filter(k => pageOf(k.passage.link) !== here)];
    const same = pool.find(k => k.content === old);
    /** Ein kurzes Zitat stünde als Bruchstück an vielen Stellen: Dann zählt nur die Passage, die genau so lautet */
    const found = (same ?? (old.length >= TEIL_AB ? pool.find(k => k.content.includes(old)) : null))?.passage;
    if (!found) return null;
    const text = same ? found.text : zitat.text;
    return { titel: found.title, pfad: found.path, text, url: quoteUrl({ ...found, text }) };
  };
}
