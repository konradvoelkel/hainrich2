/**
 * Läuft im Browser der Moderation: Cursortasten blättern, ungespeicherte Eingaben gehen nicht still verloren. Die Links
 * funktionieren auch ohne dieses Skript. In Eingabefeldern bleiben die Tasten beim Feld.
 */
let unsaved = false;
const form = document.querySelector('form.formular');
form?.addEventListener('input', () => { unsaved = true; });
form?.addEventListener('submit', () => { unsaved = false; });
addEventListener('beforeunload', event => { if (unsaved) event.preventDefault(); });

const TARGETS = { ArrowRight: 'a[rel="next"]', ArrowLeft: 'a[rel="prev"]' };
addEventListener('keydown', event => {
  const target = TARGETS[event.key];
  if (!target || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target.closest('input, textarea, select')) return;
  document.querySelector(target)?.click();
});
