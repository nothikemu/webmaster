import type { MasterLoop } from './loop';
import { QualityGovernor, type QualityTier } from './quality';

/** Connects the governor to the master loop's frame times and lets React subscribe to tier changes. */
export class QualityService {
  readonly #governor: QualityGovernor;
  readonly #listeners = new Set<() => void>();

  constructor(loop: MasterLoop, startTier: number, maxTier = 3) {
    this.#governor = new QualityGovernor(startTier, maxTier);
    loop.observe((dtMs, now) => {
      if (this.#governor.push(dtMs, now)) for (const l of this.#listeners) l();
    });
  }

  get tier(): QualityTier {
    return this.#governor.tier;
  }

  /** Forces a tier, for the quality override and tests. */
  force(tier: number): void {
    this.#governor.set(tier, performance.now());
    for (const l of this.#listeners) l();
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => void this.#listeners.delete(listener);
  };

  readonly getSnapshot = (): QualityTier => this.#governor.tier;
}
