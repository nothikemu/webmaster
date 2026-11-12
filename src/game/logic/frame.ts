/**
 * The Weight Frame. One artificial neuron: it says "class 1" when w1*x + w2*y + b > 0.
 * The player turns the three dials by hand, or lets gradient descent turn them (logistic loss, a few lines of code).
 */
import { rng } from '@/widgets/logic/random';

export interface Thread {
  x: number; // -1 to 1
  y: number;
  label: 0 | 1;
}
export interface Dials {
  w1: number;
  w2: number;
  b: number;
}
export interface FrameRound {
  round: 1 | 2 | 3;
  title: string;
  brief: string;
  threads: Thread[];
  /** A pair of dial settings that sorts every thread, for tests and the hint. */
  answer: Dials;
}

const line: Record<1 | 2 | 3, { f: (x: number, y: number) => number; answer: Dials; title: string; brief: string }> = {
  1: { f: (x) => x - 0.1, answer: { w1: 2, w2: 0, b: -0.2 }, title: 'Left and right', brief: 'The threads on the right are dark. Only the horizontal weight needs to matter.' },
  2: { f: (x, y) => y - x + 0.2, answer: { w1: -2, w2: 2, b: 0.4 }, title: 'The slant', brief: 'The line runs on a diagonal, so both weights matter, with opposite signs.' },
  3: { f: (x, y) => x + y - 0.9, answer: { w1: 2, w2: 2, b: -1.8 }, title: 'Out in the corner', brief: 'The dark threads are bunched in a corner far from the middle. The weights alone cannot reach it. You need the bias.' },
};

function make(round: 1 | 2 | 3): FrameRound {
  const rand = rng(300 + round);
  const threads: Thread[] = [];
  const { f, answer, title, brief } = line[round];
  while (threads.length < 24) {
    const x = Math.round((rand() * 2 - 1) * 100) / 100;
    const y = Math.round((rand() * 2 - 1) * 100) / 100;
    const v = f(x, y);
    if (Math.abs(v) < 0.14) continue; // a clear gap, so a perfect sort exists
    const label: 0 | 1 = v > 0 ? 1 : 0;
    threads.push({ x, y, label });
  }
  // make sure both classes are present
  if (!threads.some((t) => t.label === 0)) threads[0] = { ...threads[0]!, label: 0 };
  return { round, title, brief, threads, answer };
}

export const FRAME_ROUNDS: readonly FrameRound[] = [make(1), make(2), make(3)];

export const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));
export const say = (d: Dials, t: { x: number; y: number }): 0 | 1 => (d.w1 * t.x + d.w2 * t.y + d.b > 0 ? 1 : 0);

export function accuracy(d: Dials, threads: readonly Thread[]): { right: number; total: number; pct: number; wrong: Thread[] } {
  const wrong = threads.filter((t) => say(d, t) !== t.label);
  const total = threads.length;
  return { right: total - wrong.length, total, pct: Math.round(((total - wrong.length) / total) * 100), wrong };
}

/** Mean logistic loss: low when the neuron is right and sure, high when it is wrong and sure. */
export function loss(d: Dials, threads: readonly Thread[]): number {
  let sum = 0;
  for (const t of threads) {
    const p = Math.min(1 - 1e-9, Math.max(1e-9, sigmoid(d.w1 * t.x + d.w2 * t.y + d.b)));
    sum += t.label ? -Math.log(p) : -Math.log(1 - p);
  }
  return sum / threads.length;
}

/** One step of gradient descent: nudge each dial a little in the direction that lowers the loss. */
export function step(d: Dials, threads: readonly Thread[], lr = 0.8): Dials {
  let g1 = 0;
  let g2 = 0;
  let gb = 0;
  for (const t of threads) {
    const e = sigmoid(d.w1 * t.x + d.w2 * t.y + d.b) - t.label;
    g1 += e * t.x;
    g2 += e * t.y;
    gb += e;
  }
  const n = threads.length;
  return { w1: d.w1 - (lr * g1) / n, w2: d.w2 - (lr * g2) / n, b: d.b - (lr * gb) / n };
}

export const clampDial = (v: number): number => Math.max(-6, Math.min(6, Math.round(v * 10) / 10));
