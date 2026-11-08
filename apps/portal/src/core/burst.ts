/**
 * Physics for the badge-unlock particle burst. Pure and deterministic (seeded), so the overlay
 * worker (OffscreenCanvas) and the main-thread fallback produce the same animation.
 * Each particle has velocity, gravity, exponential drag and a fade; the simulation reports when
 * every particle has expired so the render loop can stop.
 */

export interface BurstOptions {
  x: number;
  y: number;
  seed: number;
  count?: number;
}

export const BURST_PALETTE: readonly string[] = ['#ff4655', '#ece8e1', '#e0a020', '#2e9db9', '#0f1923', '#ff4655'];

export const BURST_GRAVITY = 900;
export const BURST_DRAG = 2.2;
const MIN_LIFE = 0.7;
const MAX_LIFE = 1.6;

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Small fast PRNG (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class BurstSim {
  #x = new Float32Array(0);
  #y = new Float32Array(0);
  #vx = new Float32Array(0);
  #vy = new Float32Array(0);
  #life = new Float32Array(0);
  #maxLife = new Float32Array(0);
  #size = new Float32Array(0);
  #color = new Uint8Array(0);
  #alive = 0;

  get alive(): number {
    return this.#alive;
  }

  spawn({ x, y, seed, count = 140 }: BurstOptions): void {
    const rand = rng(seed);
    const n = Math.max(1, Math.min(400, Math.floor(count)));
    this.#x = new Float32Array(n).fill(x);
    this.#y = new Float32Array(n).fill(y);
    this.#vx = new Float32Array(n);
    this.#vy = new Float32Array(n);
    this.#life = new Float32Array(n);
    this.#maxLife = new Float32Array(n);
    this.#size = new Float32Array(n);
    this.#color = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const angle = rand() * Math.PI * 2;
      const speed = 220 + rand() * 520;
      this.#vx[i] = Math.cos(angle) * speed;
      this.#vy[i] = Math.sin(angle) * speed - 180;
      this.#maxLife[i] = MIN_LIFE + rand() * (MAX_LIFE - MIN_LIFE);
      this.#life[i] = this.#maxLife[i]!;
      this.#size[i] = 1.2 + rand() * 2.6;
      this.#color[i] = Math.floor(rand() * BURST_PALETTE.length);
    }
    this.#alive = n;
  }

  /** Advances by `dt` seconds. Returns true while any particle is still alive. */
  step(dt: number): boolean {
    const drag = Math.exp(-BURST_DRAG * dt);
    let alive = 0;
    for (let i = 0; i < this.#life.length; i++) {
      if (this.#life[i]! <= 0) continue;
      this.#life[i] = this.#life[i]! - dt;
      if (this.#life[i]! <= 0) continue;
      this.#vy[i] = this.#vy[i]! + BURST_GRAVITY * dt;
      this.#vx[i] = this.#vx[i]! * drag;
      this.#vy[i] = this.#vy[i]! * drag;
      this.#x[i] = this.#x[i]! + this.#vx[i]! * dt;
      this.#y[i] = this.#y[i]! + this.#vy[i]! * dt;
      alive++;
    }
    this.#alive = alive;
    return alive > 0;
  }

  draw(ctx: Ctx2D, width: number, height: number): void {
    ctx.clearRect(0, 0, width, height);
    if (this.#alive === 0) return;
    for (let i = 0; i < this.#life.length; i++) {
      const life = this.#life[i]!;
      if (life <= 0) continue;
      const t = life / this.#maxLife[i]!;
      ctx.globalAlpha = Math.min(1, t * t * 1.4);
      ctx.fillStyle = BURST_PALETTE[this.#color[i]!]!;
      // Flat squares, like cut paper, not glowing points.
      const side = this.#size[i]! * (1.1 + t * 1.2);
      ctx.fillRect(this.#x[i]! - side / 2, this.#y[i]! - side / 2, side, side);
    }
    ctx.globalAlpha = 1;
  }
}
