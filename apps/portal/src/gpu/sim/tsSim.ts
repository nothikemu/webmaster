import type { PointerInput, SimBackend, StepInput } from './types';
import { SIM } from './types';

/**
 * Reference implementation of the particle kernel in plain TypeScript. It is the last-resort
 * backend and the definition the Rust, WGSL and GLSL versions are tested against.
 * Arrays are xyz triples; `phase` holds one drift phase per particle.
 */
export function stepParticles(
  pos: Float32Array,
  vel: Float32Array,
  rest: Float32Array,
  phase: Float32Array,
  count: number,
  dt: number,
  time: number,
  pointer: PointerInput,
): void {
  const { springK: K, dampingC: C, driftAmp: A, pointerDrag: DRAG } = SIM;
  const { x: px, y: py, z: pz, radius, strength, mode } = pointer;
  const r2 = radius * radius;
  for (let i = 0; i < count; i++) {
    const b = i * 3;
    const ph = phase[i]!;
    const tx = rest[b]! + A * Math.sin(time * 0.45 + ph);
    const ty = rest[b + 1]! + A * Math.sin(time * 0.37 + ph * 1.7 + 1.3);
    const tz = rest[b + 2]! + A * Math.sin(time * 0.29 + ph * 0.9 + 2.1);
    const x = pos[b]!;
    const y = pos[b + 1]!;
    const z = pos[b + 2]!;
    let vx = vel[b]!;
    let vy = vel[b + 1]!;
    let vz = vel[b + 2]!;
    let ax = 0;
    let ay = 0;
    let az = 0;
    const dx = x - px;
    const dy = y - py;
    const dz = z - pz;
    const d2 = dx * dx + dy * dy + dz * dz;
    if (strength !== 0 && d2 < r2 && d2 > 1e-8) {
      const dist = Math.sqrt(d2);
      let w = 1 - dist / radius;
      w = w * w * (3 - 2 * w);
      const nx = dx / dist;
      const ny = dy / dist;
      const nz = dz / dist;
      const s = strength * w;
      if (mode === 0) {
        ax = nx * s;
        ay = ny * s;
        az = nz * s;
      } else if (mode === 1) {
        const s9 = s * 0.9;
        ax = -nx * s9;
        ay = -ny * s9;
        az = -nz * s9;
      } else {
        const tl = Math.sqrt(nx * nx + ny * ny);
        const tx2 = tl > 1e-6 ? -ny / tl : 0;
        const ty2 = tl > 1e-6 ? nx / tl : 0;
        ax = tx2 * (s * 1.1) - nx * (s * 0.55);
        ay = ty2 * (s * 1.1) - ny * (s * 0.55);
        az = -nz * (s * 0.55);
      }
      if (mode !== 0) {
        const dk = w * DRAG;
        ax -= vx * dk;
        ay -= vy * dk;
        az -= vz * dk;
      }
    }
    vx += (K * (tx - x) - C * vx + ax) * dt;
    vy += (K * (ty - y) - C * vy + ay) * dt;
    vz += (K * (tz - z) - C * vz + az) * dt;
    vel[b] = vx;
    vel[b + 1] = vy;
    vel[b + 2] = vz;
    pos[b] = x + vx * dt;
    pos[b + 1] = y + vy * dt;
    pos[b + 2] = z + vz * dt;
  }
}

export class TsSim implements SimBackend {
  readonly kind = 'ts' as const;
  readonly positionTexture = null;
  readonly textureSize = 0;
  readonly positions: Float32Array;
  readonly count: number;
  readonly #vel: Float32Array;
  readonly #rest: Float32Array;
  readonly #phase: Float32Array;

  constructor(rest: Float32Array, phase: Float32Array) {
    this.count = Math.floor(rest.length / 3);
    this.#rest = rest;
    this.#phase = phase;
    this.positions = new Float32Array(rest);
    this.#vel = new Float32Array(rest.length);
  }

  step({ dt, time, pointer }: StepInput): void {
    stepParticles(this.positions, this.#vel, this.#rest, this.#phase, this.count, dt, time, pointer);
  }

  reset(): void {
    this.positions.set(this.#rest);
    this.#vel.fill(0);
  }

  dispose(): void {
    /* nothing to release */
  }
}
