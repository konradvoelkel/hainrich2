/**
 * Kostenbuch mit hartem Deckel. Jeder echte API-Aufruf läuft hierüber; ist der Deckel erreicht, startet
 * kein weiterer. Preise in $/MTok laut Claude-API-Doku, Stand 2026-10-06.
 */
import fs from 'node:fs';

export const PRICES = {
  'claude-opus-5-5': { in: 4, out: 20 },
  'claude-sonnet-5-5': { in: 2, out: 10 },
  'claude-haiku-5-5': { in: 0.1, out: 0.5 },
  /** Ziele von `fallbacks: "default"`, nur als Ersatz für eine Ablehnung */
  'claude-opus-5': { in: 5, out: 25 },
  'claude-opus-4-8': { in: 5, out: 25 },
};

export function costOf(model, usage, { batch = false } = {}) {
  const price = PRICES[model];
  if (!price) throw new Error(`kein Preis für ${model}`);
  const input = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) * 1.25 + (usage.cache_read_input_tokens ?? 0) * 0.1;
  const dollars = (input * price.in + (usage.output_tokens ?? 0) * price.out) / 1e6;
  return batch ? dollars / 2 : dollars;
}

export class Ledger {
  constructor(file, limit) {
    this.file = file;
    this.limit = limit;
    this.entries = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  }

  get total() {
    return this.entries.reduce((sum, e) => sum + e.dollars, 0);
  }

  /** wirft, wenn die geschätzten Kosten nicht mehr unter den Deckel passen */
  assertRoom(estimate = 0) {
    if (this.total + estimate > this.limit) {
      throw new Error(`Budget: ${this.total.toFixed(3)} $ verbraucht, ${estimate.toFixed(3)} $ geplant, Deckel ${this.limit} $`);
    }
  }

  add(label, model, usage, options) {
    const dollars = costOf(model, usage, options);
    this.entries.push({ label, model, batch: !!options?.batch, input: usage.input_tokens ?? 0, output: usage.output_tokens ?? 0, dollars });
    /** umbenennen statt überschreiben: Die Admin-Seite liest mit */
    fs.writeFileSync(`${this.file}.neu`, JSON.stringify(this.entries, null, 1));
    fs.renameSync(`${this.file}.neu`, this.file);
    return dollars;
  }

  /**
   * Eine Antwort mit `fallbacks`: Das oberste `usage` nennt nur den letzten Versuch, jeder Versuch steht in `iterations`. Die Abrechnung
   * ist schon passiert, ein Modell ohne Preis zählt deshalb wie das teuerste, statt den Lauf zu beenden.
   */
  addResponse(label, response) {
    const attempts = response.usage.iterations?.length ? response.usage.iterations : [{ ...response.usage, model: response.model }];
    for (const attempt of attempts) this.add(label, PRICES[attempt.model ?? response.model] ? attempt.model ?? response.model : 'claude-opus-5', attempt);
  }
}
