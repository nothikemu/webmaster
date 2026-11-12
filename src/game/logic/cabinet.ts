/**
 * The Curator's Cabinet. A supervised-learning toy: unlabeled moths sit on a plane of (wingspan, pattern).
 * The player pays a label budget to learn what some of them are, a 1-nearest-neighbor model does the rest,
 * and a hidden test set shows how well that went. Round 3 hides a coverage gap on purpose.
 *
 * This is a teaching model. It is deliberately the simplest classifier there is, so the player can see every decision it makes.
 */
import { rng } from '@/widgets/logic/random';

export interface Moth {
  id: number;
  x: number; // wingspan, 0-100
  y: number; // pattern density, 0-100
  /** 1 = silk-eater, 0 = pollinator. Hidden until the player pays to look. */
  kind: 0 | 1;
}

export interface CabinetRound {
  round: 1 | 2 | 3;
  title: string;
  brief: string;
  budget: number;
  target: number;
  pool: Moth[];
  test: Moth[];
  /** Round 3 only: specimens from the part of the plane the first pool never covered. */
  scouts?: Moth[];
  scoutBudget?: number;
}

type Rule = (x: number, y: number) => 0 | 1;
const RULES: Record<1 | 2 | 3, { rule: Rule; margin: (x: number, y: number) => number }> = {
  1: { rule: (x, y) => (x + y > 100 ? 1 : 0), margin: (x, y) => Math.abs(x + y - 100) / Math.SQRT2 },
  2: { rule: (x, y) => ((x > 50) !== (y > 50) ? 1 : 0), margin: (x, y) => Math.min(Math.abs(x - 50), Math.abs(y - 50)) },
  // In the eastern meadow the relationship is reversed, so a model shown only the west is confidently wrong there.
  3: { rule: (x, y) => ((x <= 50) === (y > 45) ? 1 : 0), margin: (x, y) => Math.min(Math.abs(x - 50), Math.abs(y - 45)) },
};

/** Scatter n moths, keeping each at least `sep` away from the others (and from `avoid`) so no two can sit on top of each other. */
function scatter(n: number, seed: number, r: 1 | 2 | 3, xr: [number, number], startId: number, minMargin: number, sep = 0, avoid: readonly Moth[] = []): Moth[] {
  const rand = rng(seed);
  const out: Moth[] = [];
  let tries = 0;
  while (out.length < n) {
    tries += 1;
    const x = Math.round((xr[0] + rand() * (xr[1] - xr[0])) * 10) / 10;
    const y = Math.round((3 + rand() * 94) * 10) / 10;
    if (RULES[r].margin(x, y) < minMargin) continue;
    const gap = tries > 4000 ? sep / 2 : sep;
    if ([...out, ...avoid].some((m) => (m.x - x) ** 2 + (m.y - y) ** 2 < gap * gap)) continue;
    out.push({ id: startId + out.length, x, y, kind: RULES[r].rule(x, y) });
  }
  return out;
}

const build = (round: 1 | 2 | 3): CabinetRound => {
  const base = { 1: { budget: 4, target: 90, title: 'The diagonal', brief: 'Two kinds of moth, and the line between them is a slant. Find where the model needs to be told.' }, 2: { budget: 6, target: 90, title: 'Two of each', brief: 'Each kind lives in two places. A model that only meets one of them will never guess the other.' }, 3: { budget: 4, target: 90, title: 'The narrow collection', brief: 'Every specimen on this shelf came from the western meadow. Label what you can, then see how the model does everywhere else.' } }[round];
  const west = round === 3;
  const pool = scatter(28, 10 + round, round, west ? [3, 45] : [3, 97], 0, 0, 9);
  return {
    round,
    ...base,
    pool,
    test: scatter(40, 90 + round, round, [3, 97], 1000, 5),
    ...(west ? { scouts: scatter(16, 77, round, [52, 97], 500, 0, 9, pool), scoutBudget: 4 } : {}),
  };
};

export const CABINET_ROUNDS: readonly CabinetRound[] = [build(1), build(2), build(3)];

export function predict(labeled: readonly Moth[], x: number, y: number): 0 | 1 | null {
  let best: Moth | null = null;
  let bd = Infinity;
  for (const m of labeled) {
    const d = (m.x - x) ** 2 + (m.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = m;
    }
  }
  return best ? best.kind : null;
}

export interface Report {
  right: number;
  total: number;
  pct: number;
  missed: Moth[];
  pass: boolean;
}

export function evaluate(labeled: readonly Moth[], round: CabinetRound): Report {
  const missed = round.test.filter((t) => predict(labeled, t.x, t.y) !== t.kind);
  const total = round.test.length;
  const right = total - missed.length;
  const pct = Math.round((right / total) * 100);
  return { right, total, pct, missed, pass: labeled.length >= 2 && pct >= round.target };
}

/** Which side of the plane the misses are on, for the explanation. */
export function missSide(report: Report): 'east' | 'west' | 'mixed' {
  if (!report.missed.length) return 'mixed';
  const east = report.missed.filter((m) => m.x > 50).length;
  if (east >= report.missed.length * 0.75) return 'east';
  if (east <= report.missed.length * 0.25) return 'west';
  return 'mixed';
}
