/**
 * Anmeldung der Moderation: Passphrasen als scrypt-Hash, Sitzungen und Fehlversuche nur im Arbeitsspeicher. Ein Neustart
 * meldet alle ab, und es bleibt nichts liegen, das zu einer Adresse führt (Plan §9, §10).
 */
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);
const COST = 2 ** 15;
const options = N => ({ N, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const clean = passphrase => passphrase.normalize('NFKC');

export const MIN_PASSPHRASE = 12;

export async function hashPassphrase(passphrase) {
  const salt = randomBytes(16);
  const key = await derive(clean(passphrase), salt, 32, options(COST));
  return `scrypt$${COST}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassphrase(passphrase, stored) {
  const [, cost, salt, key] = stored.split('$');
  const expected = Buffer.from(key, 'base64');
  const actual = await derive(clean(passphrase), Buffer.from(salt, 'base64'), expected.length, options(+cost));
  return timingSafeEqual(actual, expected);
}

/** gegen unbekannte Namen, damit die Antwortzeit keinen Namen verrät */
export const dummyHash = hashPassphrase(randomBytes(32).toString('base64'));

const digest = token => createHash('sha256').update(token).digest('base64');

/**
 * Das Token zum Kurscode: zufällig und signiert, der Server merkt sich nichts (Plan §10). Der Schlüssel hängt am Hash des Codes,
 * ein neuer Code macht also alle alten Tokens ungültig.
 */
export const tokenKey = hash => createHash('sha256').update(`token:${hash}`).digest();
const sign = (key, id) => createHmac('sha256', key).update(id).digest('base64url');

export function issueToken(key) {
  const id = randomBytes(16).toString('base64url');
  return `${id}.${sign(key, id)}`;
}

export function checkToken(key, token) {
  const [id, signature = ''] = String(token).split('.');
  const expected = Buffer.from(sign(key, id));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessions({ ttl = 12 * 3600_000, now = Date.now } = {}) {
  const open = new Map();
  return {
    create(user) {
      const token = randomBytes(32).toString('base64url');
      open.set(digest(token), { ...user, until: now() + ttl });
      return token;
    },
    get(token) {
      if (!token) return null;
      const session = open.get(digest(token));
      if (session && session.until > now()) return session;
      open.delete(digest(token));
      return null;
    },
    drop(token) {
      if (token) open.delete(digest(token));
    },
  };
}

const SWEEP_AT = 5000;

/**
 * Fehlversuche oder Aufrufe je Schlüssel im Zeitfenster. Zählen gibt zurück, womit sich genau dieser Eintrag wieder streichen lässt: Wer
 * zwischen Prüfen und Ergebnis warten muss, zählt vorher und streicht bei Erfolg. Andersherum kommen gleichzeitige Versuche alle
 * durch, bevor der erste gezählt ist (research/2026-11-11-threat-model, C1).
 */
export function createLimiter({ max, window = 15 * 60_000, now = Date.now }) {
  const failures = new Map();
  const live = key => (failures.get(key) ?? []).filter(t => t > now() - window);
  const put = (key, list) => (list.length ? failures.set(key, list) : failures.delete(key));
  const count = key => {
    const stamp = now();
    put(key, [...live(key), stamp]);
    /** abgelaufene Schlüssel bleiben sonst für immer liegen */
    if (failures.size > SWEEP_AT) for (const other of [...failures.keys()]) put(other, live(other));
    let counted = true;
    return () => {
      if (!counted) return;
      counted = false;
      const list = live(key);
      const index = list.indexOf(stamp);
      if (index >= 0) list.splice(index, 1);
      put(key, list);
    };
  };
  return {
    allowed: key => live(key).length < max,
    fail: count,
    count,
    clear(key) {
      failures.delete(key);
    },
  };
}
