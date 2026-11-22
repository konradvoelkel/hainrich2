import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

/**
 * Der Hook ist das Tor vor dem Push, die CI das danach (Playbook §5 Punkt 7). Laufen sie auseinander, ist der Hook grün und die CI rot
 * oder umgekehrt. `npm ci` ersetzt der Hook durch `npm ls --all` gegen die vorhandenen Pakete: Er soll ohne Netz auskommen.
 */
test('der Pre-Push-Hook fährt jeden Schritt der CI', () => {
  const hook = read('.githooks/pre-push');
  const schritte = [...read('.github/workflows/tests.yml').matchAll(/^\s+run: (.+)$/gm)].map(m => m[1].trim());
  assert.deepEqual(schritte, ['npm ci --ignore-scripts', 'npm test'], 'ein neuer Schritt in der CI gehört auch in .githooks/pre-push und in diese Liste');
  assert.match(hook, /^\s*npm ls --all >\/dev\/null$/m, 'die Pakete entsprechen package-lock.json');
  assert.match(hook, /^\s*npm test >/m);
  assert.match(hook, /^set -euo pipefail$/m);
});

/**
 * Ab Node 24 schreibt `node --test` auch in eine Datei im Spec-Format. Der Hook las die Zusammenfassung im TAP-Format, fand nichts, und
 * `set -euo pipefail` beendete ihn ohne ein Wort, obwohl alle Tests grün waren (2026-11-21, Playbook §3.7).
 */
test('der Hook legt den Reporter fest, und eine Zusammenfassung ohne Treffer beendet ihn nicht', () => {
  const hook = read('.githooks/pre-push');
  assert.match(hook, /^\s*local -x NODE_OPTIONS="\$\{NODE_OPTIONS:\+\$NODE_OPTIONS \}--test-reporter=tap"$/m);
  const zeile = hook.split('\n').find(z => z.includes("grep -E '^# (tests|pass|fail) '"));
  assert.ok(zeile, 'die Zusammenfassung wird noch gelesen');
  assert.match(zeile, /\|\| true\)$/, 'ein grep ohne Treffer darf unter set -e den Hook nicht beenden');
  assert.match(hook, /keine TAP-Zusammenfassung/, 'fehlt sie, sagt der Hook das');
});

test('der Hook prüft den gepushten Commit in einem eigenen Worktree und räumt ihn auch nach einem Fehler weg', () => {
  const hook = read('.githooks/pre-push');
  assert.match(hook, /git worktree add --quiet --detach "\$wt" "\$sha"/);
  assert.match(hook, /^trap aufraeumen EXIT$/m, 'unter set -e feuert eine RETURN-Falle nicht (Playbook §3.7)');
  assert.ok(fs.statSync(new URL('../.githooks/pre-push', import.meta.url)).mode & 0o100, 'ausführbar, sonst überspringt Git ihn still');
});
