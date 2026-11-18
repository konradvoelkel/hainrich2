/** Was Moderation und Fragepfad gemeinsam brauchen, um einer Anfrage zu trauen. */

/**
 * Wofür eine Adresse bei den Bremsen zählt. Ein Anschluss hat bei IPv6 ein ganzes /64, also zählt das Präfix: Sonst wäre jede Grenze
 * je Adresse mit der nächsten Adresse umgangen. IPv4 bleibt, wie es ist, auch in der Schreibweise `::ffff:203.0.113.7`.
 */
export function networkOf(address = '') {
  const plain = address.split('%')[0];
  if (!plain.includes(':')) return plain;
  if (plain.includes('.')) return plain.slice(plain.lastIndexOf(':') + 1);
  const [head, tail] = plain.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = tail === undefined ? left : [...left, ...new Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right];
  return `${groups.slice(0, 4).map(group => (parseInt(group, 16) || 0).toString(16)).join(':')}::/64`;
}

/** Caddy hängt die Adresse hinten an, nur der letzte Eintrag stammt nicht vom Client */
export const clientOf = req => networkOf(req.headers['x-forwarded-for']?.split(',').at(-1).trim() ?? req.socket.remoteAddress);

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

/**
 * Der Pfad einer Anfrage, wenn er roh schon so dasteht, wie `new URL()` ihn auflöst, sonst null. Vor der Moderation steht eine
 * Schranke des Webservers (Plan D50), und der entscheidet an seinem Bild des Pfads, wer ohne Zugang durchkommt. Die App rechnet mit
 * `new URL().pathname`, das `..`, `%2e%2e` und `\` auflöst: Sehen beide verschiedene Pfade, bedient die App einen, den der Webserver
 * für einen anderen hielt. Was nicht eindeutig ist, bedient sie deshalb gar nicht.
 */
export function plainPath(url) {
  if (typeof url !== 'string') return null;
  const raw = url.split('?')[0];
  try {
    const parsed = new URL(url, 'http://x');
    return parsed.host === 'x' && parsed.pathname === raw ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Verteilt eine Anfrage auf Abstimmen, Fragepfad und Moderation. Jeder der drei steht ausdrücklich da: Früher bekam die Moderation
 * alles, was nicht mit `api/` begann, auch `/eidl/API/…`, das der Webserver ohne Rücksicht auf Groß- und Kleinschreibung zum offenen
 * Fragepfad zählt. Abstimmen ist nur die genaue Adresse, mit einer Abfrage dahinter antwortet der Fragepfad.
 */
export function createRouter({ base, api, mod, voting = null }) {
  return (req, res) => {
    const path = plainPath(req.url);
    if (path !== null) {
      if (voting && req.url === `${base}api/stimme`) return voting(req, res);
      if (path.startsWith(`${base}api/`)) return api(req, res);
      if (path === `${base}mod` || path.startsWith(`${base}mod/`)) return mod(req, res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end('Nicht gefunden.\n');
  };
}

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
