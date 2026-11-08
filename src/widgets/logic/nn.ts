/**
 * Lesson U3: a real neural network. 2 inputs -> H tanh hidden units -> 1 sigmoid output, trained by
 * full-batch gradient descent with backpropagation. About sixty lines, no libraries.
 */
import { rng } from './random';

export type DatasetId = 'blobs' | 'ring' | 'corners';
export interface Sample {
  x: number;
  y: number;
  label: 0 | 1;
}

export const DATASETS: { id: DatasetId; label: string; hard: boolean }[] = [
  { id: 'blobs', label: 'Two blobs', hard: false },
  { id: 'ring', label: 'Ring', hard: true },
  { id: 'corners', label: 'Corners', hard: true },
];

/** Points live in [-1, 1] x [-1, 1]. */
export function makeData(id: DatasetId, n = 80, seed = 7): Sample[] {
  const r = rng(seed + id.length);
  const out: Sample[] = [];
  while (out.length < n) {
    const x = r() * 2 - 1;
    const y = r() * 2 - 1;
    if (id === 'blobs') {
      const label: 0 | 1 = out.length % 2 === 0 ? 0 : 1;
      const cx = label ? 0.5 : -0.5;
      out.push({ x: Math.max(-1, Math.min(1, cx + (x * 0.4))), y: Math.max(-1, Math.min(1, y * 0.7)), label });
    } else if (id === 'ring') {
      const d = Math.hypot(x, y);
      if (d > 0.55 && d < 0.7) continue; // keep a clear gap between classes
      out.push({ x, y, label: d < 0.6 ? 1 : 0 });
    } else {
      if (Math.abs(x) < 0.08 || Math.abs(y) < 0.08) continue;
      out.push({ x, y, label: x * y > 0 ? 1 : 0 });
    }
  }
  return out;
}

export class Net {
  w1: number[][]; // [hidden][2]
  b1: number[];
  w2: number[];
  b2 = 0;
  epochs = 0;

  constructor(
    public hidden: number,
    seed = 3,
  ) {
    const r = rng(seed * 101 + hidden);
    const init = () => (r() * 2 - 1) * 1.2;
    this.w1 = Array.from({ length: hidden }, () => [init(), init()]);
    this.b1 = Array.from({ length: hidden }, () => init() * 0.3);
    this.w2 = Array.from({ length: hidden }, () => init());
  }

  predict(x: number, y: number): number {
    let z = this.b2;
    for (let j = 0; j < this.hidden; j++) {
      z += this.w2[j]! * Math.tanh(this.w1[j]![0]! * x + this.w1[j]![1]! * y + this.b1[j]!);
    }
    return 1 / (1 + Math.exp(-z));
  }

  /** One pass over all data: compute the average gradient and nudge every weight against it. */
  step(data: readonly Sample[], lr = 0.8): void {
    const H = this.hidden;
    const gw1 = Array.from({ length: H }, () => [0, 0]);
    const gb1 = new Array<number>(H).fill(0);
    const gw2 = new Array<number>(H).fill(0);
    let gb2 = 0;
    for (const s of data) {
      const h = this.w1.map((w, j) => Math.tanh(w[0]! * s.x + w[1]! * s.y + this.b1[j]!));
      let z = this.b2;
      for (let j = 0; j < H; j++) z += this.w2[j]! * h[j]!;
      const o = 1 / (1 + Math.exp(-z));
      const dz2 = o - s.label; // derivative of the loss with respect to the output's input
      gb2 += dz2;
      for (let j = 0; j < H; j++) {
        gw2[j]! += dz2 * h[j]!;
        const dz1 = dz2 * this.w2[j]! * (1 - h[j]! * h[j]!);
        gw1[j]![0]! += dz1 * s.x;
        gw1[j]![1]! += dz1 * s.y;
        gb1[j]! += dz1;
      }
    }
    const n = data.length;
    this.b2 -= (lr * gb2) / n;
    for (let j = 0; j < H; j++) {
      this.w2[j]! -= (lr * gw2[j]!) / n;
      this.b1[j]! -= (lr * gb1[j]!) / n;
      this.w1[j]![0]! -= (lr * gw1[j]![0]!) / n;
      this.w1[j]![1]! -= (lr * gw1[j]![1]!) / n;
    }
    this.epochs += 1;
  }

  train(data: readonly Sample[], epochs: number): void {
    for (let i = 0; i < epochs; i++) this.step(data);
  }

  loss(data: readonly Sample[]): number {
    const eps = 1e-9;
    return data.reduce((sum, s) => {
      const o = this.predict(s.x, s.y);
      return sum - (s.label ? Math.log(o + eps) : Math.log(1 - o + eps));
    }, 0) / data.length;
  }

  accuracy(data: readonly Sample[]): number {
    const right = data.filter((s) => (this.predict(s.x, s.y) >= 0.5 ? 1 : 0) === s.label).length;
    return Math.round((right / data.length) * 100);
  }
}
