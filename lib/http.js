/** Was Moderation und Fragepfad gemeinsam brauchen, um einer Anfrage zu trauen. */

/** Caddy hängt die Adresse hinten an, nur der letzte Eintrag stammt nicht vom Client */
export const clientOf = req => req.headers['x-forwarded-for']?.split(',').at(-1).trim() ?? req.socket.remoteAddress;

/**
 * Sec-Fetch-Site setzt der Browser selbst. Origin allein reicht nicht: Unter `Referrer-Policy: no-referrer`, die Caddy für den
 * ganzen Host setzt, schickt er bei gleicher Herkunft `Origin: null`.
 */
export const sameOrigin = req => {
  const site = req.headers['sec-fetch-site'];
  if (site) return site === 'same-origin';
  try {
    return new URL(req.headers.origin).host === req.headers.host;
  } catch {
    return false;
  }
};

/** der Rumpf als Buffer, oder null, wenn er zu groß ist */
export async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

/** ein JSON-Objekt aus dem Rumpf, sonst null */
export async function readJson(req, limit) {
  try {
    const data = JSON.parse(await readBody(req, limit));
    return typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}
