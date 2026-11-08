/** Motion primitives. One easing curve is defined here and mirrored once in CSS (`--ease`). */

export const EASE_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_POINTS = [0.16, 1, 0.3, 1] as const;

/** Evaluates a CSS-style cubic Bézier easing (x1, y1, x2, y2) at progress `t` in [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (s: number): number => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number): number => ((ay * s + by) * s + cy) * s;
  const slopeX = (s: number): number => (3 * ax * s + 2 * bx) * s + cx;
  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = sampleX(s) - t;
      if (Math.abs(err) < 1e-6) return sampleY(s);
      const d = slopeX(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 24; i++) {
      const x = sampleX(s);
      if (Math.abs(x - t) < 1e-6) break;
      if (t > x) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return sampleY(s);
  };
}

/** The portal's single easing function, matching `--ease` in CSS. */
export const ease = cubicBezier(...EASE_POINTS);

export interface SpringState {
  x: number;
  v: number;
}

/**
 * Advances a critically damped spring analytically, so it is stable for any `dt`.
 * `omega` is the natural frequency in rad/s: settle time is roughly 4 / omega.
 */
export function stepCritical(s: SpringState, target: number, omega: number, dt: number): void {
  const x = s.x - target;
  const e = Math.exp(-omega * dt);
  const tmp = (s.v + omega * x) * dt;
  s.x = target + (x + tmp) * e;
  s.v = (s.v - omega * tmp) * e;
}

/** A scalar critically damped spring with a target. */
export class Spring {
  readonly state: SpringState;
  target: number;
  omega: number;

  constructor(initial = 0, omega = 10) {
    this.state = { x: initial, v: 0 };
    this.target = initial;
    this.omega = omega;
  }

  get value(): number {
    return this.state.x;
  }

  get velocity(): number {
    return this.state.v;
  }

  set(value: number): void {
    this.state.x = value;
    this.state.v = 0;
    this.target = value;
  }

  step(dt: number): number {
    stepCritical(this.state, this.target, this.omega, Math.min(dt, 0.064));
    return this.state.x;
  }

  settled(eps = 1e-3): boolean {
    return Math.abs(this.state.x - this.target) < eps && Math.abs(this.state.v) < eps;
  }
}

/** A fixed-size group of springs that share one natural frequency. */
export class SpringGroup {
  readonly values: Float32Array;
  readonly targets: Float32Array;
  private readonly velocities: Float32Array;
  omega: number;
  private readonly scratch: SpringState = { x: 0, v: 0 };

  constructor(size: number, omega = 10) {
    this.values = new Float32Array(size);
    this.targets = new Float32Array(size);
    this.velocities = new Float32Array(size);
    this.omega = omega;
  }

  snap(index: number, value: number): void {
    this.values[index] = value;
    this.targets[index] = value;
    this.velocities[index] = 0;
  }

  step(dt: number): void {
    const h = Math.min(dt, 0.064);
    const s = this.scratch;
    for (let i = 0; i < this.values.length; i++) {
      s.x = this.values[i]!;
      s.v = this.velocities[i]!;
      stepCritical(s, this.targets[i]!, this.omega, h);
      this.values[i] = s.x;
      this.velocities[i] = s.v;
    }
  }

  settled(eps = 1e-3): boolean {
    for (let i = 0; i < this.values.length; i++) {
      if (Math.abs(this.values[i]! - this.targets[i]!) > eps) return false;
      if (Math.abs(this.velocities[i]!) > eps) return false;
    }
    return true;
  }
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
