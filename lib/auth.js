/**
 * Anmeldung der Moderation: Passphrasen als scrypt-Hash, Sitzungen und Fehlversuche nur im Arbeitsspeicher. Ein Neustart
 * meldet alle ab, und es bleibt nichts liegen, das zu einer Adresse führt (Plan §9, §10).
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
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

/** Fehlversuche je Schlüssel im Zeitfenster */
export function createLimiter({ max, window = 15 * 60_000, now = Date.now }) {
  const failures = new Map();
  const live = key => (failures.get(key) ?? []).filter(t => t > now() - window);
  return {
    allowed: key => live(key).length < max,
    fail(key) {
      failures.set(key, [...live(key), now()]);
    },
    clear(key) {
      failures.delete(key);
    },
  };
}
