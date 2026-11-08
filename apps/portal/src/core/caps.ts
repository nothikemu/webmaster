/** One-shot capability probe. Every feature the site uses is detected here and nowhere else. */

export interface Caps {
  readonly webgpu: boolean;
  readonly webgl2: boolean;
  readonly webgl2FloatTargets: boolean;
  readonly worker: boolean;
  readonly offscreenCanvas: boolean;
  readonly wasm: boolean;
  readonly wasmSimd: boolean;
  readonly sharedArrayBuffer: boolean;
  readonly crossOriginIsolated: boolean;
  readonly subtleCrypto: boolean;
  readonly reducedMotion: boolean;
  readonly coarsePointer: boolean;
  readonly saveData: boolean;
  readonly cores: number;
  readonly memoryGb: number | null;
}

export type ComputeTier = 'webgpu' | 'webgl2' | 'wasm-worker' | 'wasm-main' | 'ts';
export type RendererPreference = 'auto' | 'webgpu' | 'webgl2' | 'none';

export interface Overrides {
  readonly compute: ComputeTier | null;
  readonly renderer: RendererPreference;
}

/** Smallest valid module that uses a v128 instruction (same probe as wasm-feature-detect). */
const SIMD_PROBE = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15,
  253, 98, 11,
]);

const COMPUTE_TIERS: readonly ComputeTier[] = ['webgpu', 'webgl2', 'wasm-worker', 'wasm-main', 'ts'];

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/**
 * WebGPU is detected by the API's existence only. Requesting an adapter here would delay first
 * paint, and a missing adapter is already handled where it matters: the renderer factory and the
 * compute ladder both fall back to the next tier on failure.
 */
function probeWebGpu(): boolean {
  return typeof (navigator as Navigator & { gpu?: unknown }).gpu === 'object';
}

function probeWebGl2(): { webgl2: boolean; floatTargets: boolean } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { webgl2: false, floatTargets: false };
    const floatTargets = gl.getExtension('EXT_color_buffer_float') !== null;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, floatTargets };
  } catch {
    return { webgl2: false, floatTargets: false };
  }
}

export function readOverrides(search: string): Overrides {
  const params = new URLSearchParams(search);
  const compute = params.get('compute');
  const renderer = params.get('renderer');
  return {
    compute: COMPUTE_TIERS.includes(compute as ComputeTier) ? (compute as ComputeTier) : null,
    renderer:
      renderer === 'webgpu' || renderer === 'webgl2' || renderer === 'none' ? renderer : 'auto',
  };
}

export function probeCaps(): Caps {
  const gl = probeWebGl2();
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const wasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  return Object.freeze({
    webgpu: probeWebGpu(),
    webgl2: gl.webgl2,
    webgl2FloatTargets: gl.floatTargets,
    worker: typeof Worker === 'function',
    offscreenCanvas:
      typeof OffscreenCanvas === 'function' &&
      safe(() => 'transferControlToOffscreen' in HTMLCanvasElement.prototype, false),
    wasm,
    wasmSimd: wasm && safe(() => WebAssembly.validate(SIMD_PROBE), false),
    sharedArrayBuffer: typeof SharedArrayBuffer === 'function',
    crossOriginIsolated: safe(() => globalThis.crossOriginIsolated === true, false),
    subtleCrypto: safe(() => globalThis.isSecureContext && !!globalThis.crypto?.subtle, false),
    reducedMotion: safe(() => matchMedia('(prefers-reduced-motion: reduce)').matches, false),
    coarsePointer: safe(() => matchMedia('(pointer: coarse)').matches, false),
    saveData: nav.connection?.saveData === true,
    cores: navigator.hardwareConcurrency || 2,
    memoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
  });
}

/**
 * Chooses the particle-simulation backend: WebGPU compute, else WebGL2 float-texture GPGPU,
 * else the WASM worker, else WASM on the main thread, else plain TypeScript.
 * `wasmAvailable` is true only when the compiled binary actually loaded.
 */
export function chooseComputeTier(
  caps: Caps,
  wasmAvailable: boolean,
  override: ComputeTier | null = null,
): ComputeTier {
  const usable = (tier: ComputeTier): boolean => {
    switch (tier) {
      case 'webgpu':
        return caps.webgpu;
      case 'webgl2':
        return caps.webgl2 && caps.webgl2FloatTargets;
      case 'wasm-worker':
        return wasmAvailable && caps.worker;
      case 'wasm-main':
        return wasmAvailable;
      case 'ts':
        return true;
    }
  };
  if (override && usable(override)) return override;
  for (const tier of COMPUTE_TIERS) if (usable(tier)) return tier;
  return 'ts';
}
