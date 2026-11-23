/**
 * Trusted Types auf den öffentlichen Seiten (Konrad, 2026-11-23, E19; research/2026-11-21-modern-web-guidance, Sicherheit B2). Die CSP
 * nimmt HTML und Skript-Adressen nur noch als Objekt aus einer erlaubten Policy an. Beide Wege stehen hier und sonst nirgends:
 *
 * - HTML vom Server (Frage, Entwurf, Treffer) säubert DOMPurify im Browser noch einmal. Der Server reicht nie rohes HTML durch
 *   (lib/render.js); DOMPurify ist die zweite Linie, denn darin steht Text von Studierenden und von Claude. Das Objekt kommt aus der
 *   Policy `dompurify`, die DOMPurify selbst anlegt.
 * - Die Policy `hainrich` lässt als Skript-Adresse nur den Such-Worker zu.
 *
 * Kennt ein Browser Trusted Types nicht, geht alles wie vorher, und DOMPurify säubert trotzdem.
 */
import DOMPurify from './purify.js';

/**
 * KaTeX schreibt zu jeder Formel MathML mit `semantics` und `annotation`, dem TeX-Quelltext für Vorleseprogramme. DOMPurify verwirft
 * beide sonst und ließe den Quelltext als losen Text in der Formel stehen. `annotation-xml`, durch das HTML in MathML käme, bleibt gesperrt.
 */
const KONFIG = { ADD_TAGS: ['semantics', 'annotation'], RETURN_TRUSTED_TYPE: true };

export function setzeHTML(element, html) {
  element.innerHTML = DOMPurify.sanitize(html, KONFIG);
}

const WORKER = new URL('such-worker.js', import.meta.url).href;
const policy = globalThis.trustedTypes?.createPolicy('hainrich', {
  createScriptURL(url) {
    if (url !== WORKER) throw new TypeError(`Als Skript ist nur der Such-Worker erlaubt, nicht ${url}`);
    return url;
  },
});

export const suchWorker = () => new Worker(policy ? policy.createScriptURL(WORKER) : WORKER, { type: 'module' });
