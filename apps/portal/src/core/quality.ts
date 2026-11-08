/**
 * Adaptive quality governor. Samples frame time over a rolling window and steps particle count,
 * device pixel ratio and post-processing between tiers, with hysteresis so it cannot flap:
 *  - dropping needs a full window above DOWN_MS and at least MIN_DWELL_MS since the last change;
 *  - rising needs a long, clean window and UP_DWELL_MS since the last change;
 *  - a drop soon after a rise doubles the time before the next rise (back-off).
 */

export type PostLevel = 'none' | 'bloom' | 'full';

export interface QualityTier {
  readonly id: 0 | 1 | 2 | 3;
  readonly particles: number;
  readonly dprCap: number;
  readonly post: PostLevel;
}

export const BASE_PARTICLES = 6000;
export const MIN_PARTICLES = 3000;

export const TIERS: readonly QualityTier[] = [
  { id: 0, particles: 3000, dprCap: 1, post: 'none' },
  { id: 1, particles: 3600, dprCap: 1, post: 'none' },
  { id: 2, particles: 4800, dprCap: 1.5, post: 'bloom' },
  { id: 3, particles: BASE_PARTICLES, dprCap: 2, post: 'full' },
];

export const WINDOW_FRAMES = 90;
export const UP_WINDOW_FRAMES = 240;
export const DOWN_MS = 22.5;
export const UP_MEAN_MS = 17.8;
export const UP_P95_MS = 21;
export const MIN_DWELL_MS = 2500;
export const UP_DWELL_MS = 8000;
export const BACKOFF_BASE_MS = 20000;
/** Samples longer than this are tab switches or breakpoints, not rendering cost. */
export const OUTLIER_MS = 250;

export class QualityGovernor {
  readonly #samples: number[] = [];
  #tier: number;
  #maxTier: number;
  #lastChange = -Infinity;
  #lastRise = -Infinity;
  #riseBlockedUntil = -Infinity;
  #backoff = BACKOFF_BASE_MS;

  constructor(startTier: number = 3, maxTier: number = 3) {
    this.#maxTier = Math.max(0, Math.min(3, maxTier));
    this.#tier = Math.max(0, Math.min(this.#maxTier, startTier));
  }

  get tier(): QualityTier {
    return TIERS[this.#tier]!;
  }

  /** Feeds one frame time. Returns the new tier when it changes, otherwise null. */
  push(dtMs: number, nowMs: number): QualityTier | null {
    if (!(dtMs > 0) || dtMs > OUTLIER_MS) return null;
    this.#samples.push(dtMs);
    if (this.#samples.length > UP_WINDOW_FRAMES) this.#samples.shift();
    const sinceChange = nowMs - this.#lastChange;

    if (this.#tier > 0 && this.#samples.length >= WINDOW_FRAMES && sinceChange >= MIN_DWELL_MS) {
      const recent = this.#samples.slice(-WINDOW_FRAMES);
      if (mean(recent) > DOWN_MS) {
        if (nowMs - this.#lastRise < UP_DWELL_MS * 2) {
          this.#backoff *= 2;
          this.#riseBlockedUntil = nowMs + this.#backoff;
        }
        return this.#move(this.#tier - 1, nowMs);
      }
    }

    if (
      this.#tier < this.#maxTier &&
      this.#samples.length >= UP_WINDOW_FRAMES &&
      sinceChange >= UP_DWELL_MS &&
      nowMs >= this.#riseBlockedUntil
    ) {
      const sorted = [...this.#samples].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)]!;
      if (mean(this.#samples) <= UP_MEAN_MS && p95 <= UP_P95_MS) {
        this.#lastRise = nowMs;
        return this.#move(this.#tier + 1, nowMs);
      }
    }
    return null;
  }

  /** Forces a tier (used by the quality override and tests). */
  set(tier: number, nowMs: number): QualityTier {
    this.#tier = Math.max(0, Math.min(this.#maxTier, tier));
    this.#lastChange = nowMs;
    this.#samples.length = 0;
    return this.tier;
  }

  #move(next: number, nowMs: number): QualityTier {
    this.#tier = next;
    this.#lastChange = nowMs;
    this.#samples.length = 0;
    return this.tier;
  }
}

function mean(values: readonly number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Initial tier from device hints. The governor adjusts from there. */
export function startingTier(opts: { coarsePointer: boolean; memoryGb: number | null; cores: number; saveData: boolean }): number {
  if (opts.saveData) return 0;
  if (opts.memoryGb !== null && opts.memoryGb <= 2) return 0;
  if (opts.coarsePointer || opts.cores <= 4) return 2;
  return 3;
}
