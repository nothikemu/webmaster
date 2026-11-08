import type { Texture } from 'three';
import type { ComputeTier } from '../../core/caps';

/** 0 = deflect, 1 = attract, 2 = orbit. Matches the `mode` argument of every kernel. */
export type SimMode = 0 | 1 | 2;

export interface PointerInput {
  /** World-space pointer on the z = 0 plane. */
  x: number;
  y: number;
  z: number;
  radius: number;
  /** 0 disables the pointer force entirely. */
  strength: number;
  mode: SimMode;
}

export interface StepInput {
  dt: number;
  /** Seconds. Drives the ambient drift; held constant under reduced motion. */
  time: number;
  pointer: PointerInput;
}

/**
 * One interchangeable particle simulation. All backends run the same kernel, so switching tiers
 * changes cost, not behaviour.
 */
export interface SimBackend {
  readonly kind: ComputeTier;
  readonly count: number;
  /** CPU-visible xyz triples (count * 3). Null when positions only exist on the GPU. */
  readonly positions: Float32Array | null;
  /** Position texture for the WebGL2 GPGPU tier, sampled by the vertex shaders. */
  readonly positionTexture: Texture | null;
  /** Side length of the position texture (0 when unused). */
  readonly textureSize: number;
  step(input: StepInput): void;
  reset(): void;
  dispose(): void;
}

/** Layout and tuning constants shared by the topology generator and the scenes. */
export const SIM = {
  springK: 16,
  dampingC: 5.2,
  driftAmp: 0.045,
  pointerDrag: 2.5,
} as const;
