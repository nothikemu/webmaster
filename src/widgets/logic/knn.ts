/**
 * Lesson U2: teach a model with labeled examples. A 3-nearest-neighbors classifier on two features
 * (size and sweetness, each 0-100) plus a hidden test set drawn from a fixed rule the player has to discover.
 */
import { rng } from './random';

export interface Pt {
  x: number;
  y: number;
  ripe: boolean;
}

/** The hidden truth: a fruit is ripe when it is big enough and sweet enough. */
export const isRipe = (size: number, sweet: number): boolean => size > 40 && sweet > 55;

/** Twelve fixed hidden test fruits, across the whole plane. */
export const TEST_SET: readonly Pt[] = (() => {
  const r = rng(2027);
  const pts: Pt[] = [];
  const grid: [number, number][] = [
    [20, 20], [20, 80], [80, 20], [80, 80], [55, 65], [65, 90],
    [30, 60], [60, 30], [45, 58], [90, 62], [35, 40], [75, 75],
  ];
  for (const [gx, gy] of grid) {
    const x = Math.min(98, Math.max(2, gx + (r() - 0.5) * 8));
    const y = Math.min(98, Math.max(2, gy + (r() - 0.5) * 8));
    pts.push({ x, y, ripe: isRipe(x, y) });
  }
  return pts;
})();

export function predict(train: readonly Pt[], x: number, y: number, k = 3): boolean | null {
  if (train.length === 0) return null;
  const near = [...train]
    .map((p) => ({ p, d: (p.x - x) ** 2 + (p.y - y) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, Math.min(k, train.length));
  const votes = near.filter((n) => n.p.ripe).length;
  return votes * 2 > near.length;
}

export function testAccuracy(train: readonly Pt[]): { right: number; total: number; pct: number; wrong: Pt[] } {
  const wrong = TEST_SET.filter((t) => predict(train, t.x, t.y) !== t.ripe);
  const right = TEST_SET.length - wrong.length;
  return { right, total: TEST_SET.length, pct: Math.round((right / TEST_SET.length) * 100), wrong };
}

/** Eight examples spread across the whole plane, labeled correctly. */
export function variedExamples(seed: number): Pt[] {
  const r = rng(seed);
  return Array.from({ length: 8 }, () => {
    const x = 5 + r() * 90;
    const y = 5 + r() * 90;
    return { x, y, ripe: isRipe(x, y) };
  });
}

/** Eight examples that all come from one orchard where the fruit is small. */
export function narrowExamples(seed: number): Pt[] {
  const r = rng(seed);
  return Array.from({ length: 8 }, () => {
    const x = 5 + r() * 30;
    const y = 5 + r() * 90;
    return { x, y, ripe: isRipe(x, y) };
  });
}
