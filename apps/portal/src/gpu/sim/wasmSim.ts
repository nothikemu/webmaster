import type { WasmSimHandle } from '../../core/wasm';
import type { SimBackend, StepInput } from './types';

/** The Rust kernel running on the main thread. Cheapest WASM path: no messaging, no copies in flight. */
export class WasmMainSim implements SimBackend {
  readonly kind = 'wasm-main' as const;
  readonly positionTexture = null;
  readonly textureSize = 0;
  readonly positions: Float32Array;
  readonly count: number;
  readonly #handle: WasmSimHandle;

  constructor(handle: WasmSimHandle, rest: Float32Array) {
    this.#handle = handle;
    this.count = Math.floor(rest.length / 3);
    this.positions = new Float32Array(rest);
  }

  step({ dt, time, pointer: p }: StepInput): void {
    this.#handle.step(dt, time, p.x, p.y, p.z, p.radius, p.strength, p.mode);
    this.#handle.read(this.positions);
  }

  reset(): void {
    this.#handle.reset();
    this.#handle.read(this.positions);
  }

  dispose(): void {
    this.#handle.dispose();
  }
}
