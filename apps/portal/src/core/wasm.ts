/**
 * Loads the Rust kernels (scalar or SIMD128 build) and wraps them with TypeScript twins.
 * `pkg` and `pkg-simd` are produced by `pnpm wasm`; if they are absent the glob below is empty
 * and every kernel silently uses its TypeScript implementation.
 */
import { chacha20XorTs, hmacSha256Ts, sha256Ts } from './crypto';
import { fbmFieldTs } from './noiseFallback';
import { buildNeighborGraphTs } from './neighborFallback';

export interface WasmParticleSim {
  step(
    dt: number,
    time: number,
    px: number,
    py: number,
    pz: number,
    radius: number,
    strength: number,
    mode: number,
  ): void;
  reset(): void;
  count(): number;
  out_ptr(): number;
  out_len(): number;
  free(): void;
}

interface WasmModule {
  default(input?: { module_or_path: string | URL | WebAssembly.Module }): Promise<{
    memory: WebAssembly.Memory;
  }>;
  version(): string;
  simd_enabled(): boolean;
  sha256(data: Uint8Array): Uint8Array;
  hmac_sha256(key: Uint8Array, message: Uint8Array): Uint8Array;
  chacha20_xor(key: Uint8Array, nonce: Uint8Array, counter: number, data: Uint8Array): Uint8Array;
  build_neighbor_graph(positions: Float32Array, k: number, radius: number): Uint32Array;
  fbm_field(out: Float32Array, w: number, h: number, t: number, scale: number, octaves: number, seed: number): void;
  ParticleSim: new (rest: Float32Array, phase: Float32Array) => WasmParticleSim;
}

const scalarModules = import.meta.glob<WasmModule>('../wasm/pkg/tsa_core.js');
const scalarUrls = import.meta.glob<string>('../wasm/pkg/tsa_core_bg.wasm', {
  query: '?url',
  import: 'default',
});
const simdModules = import.meta.glob<WasmModule>('../wasm/pkg-simd/tsa_core.js');
const simdUrls = import.meta.glob<string>('../wasm/pkg-simd/tsa_core_bg.wasm', {
  query: '?url',
  import: 'default',
});

export type KernelTier = 'wasm-simd' | 'wasm' | 'ts';

export interface Kernels {
  readonly tier: KernelTier;
  readonly wasmUrl: string | null;
  sha256(data: Uint8Array): Uint8Array;
  hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array;
  chacha20Xor(key: Uint8Array, nonce: Uint8Array, counter: number, data: Uint8Array): Uint8Array;
  buildNeighborGraph(positions: Float32Array, k: number, radius: number): Uint32Array;
  fbmField(out: Float32Array, w: number, h: number, t: number, scale: number, octaves: number, seed: number): void;
  /** Creates a WASM particle simulation, or null when WebAssembly is not in use. */
  createSim(rest: Float32Array, phase: Float32Array): WasmSimHandle | null;
}

export interface WasmSimHandle {
  step(dt: number, time: number, px: number, py: number, pz: number, radius: number, strength: number, mode: number): void;
  /** Copies the current stride-3 positions into `out`. */
  read(out: Float32Array): void;
  reset(): void;
  dispose(): void;
}

export const tsKernels: Kernels = Object.freeze({
  tier: 'ts' as const,
  wasmUrl: null,
  sha256: sha256Ts,
  hmacSha256: hmacSha256Ts,
  chacha20Xor: chacha20XorTs,
  buildNeighborGraph: buildNeighborGraphTs,
  fbmField: fbmFieldTs,
  createSim: () => null,
});

function first<T>(table: Record<string, () => Promise<T>>): (() => Promise<T>) | null {
  const key = Object.keys(table)[0];
  return key ? table[key]! : null;
}

/**
 * Loads WebAssembly kernels. Resolves to the TypeScript kernels if the packages are missing,
 * fail to instantiate, or fail the self-test (so a broken binary can never corrupt state).
 */
export async function loadKernels(preferSimd: boolean, allowWasm = true): Promise<Kernels> {
  if (!allowWasm || typeof WebAssembly !== 'object') return tsKernels;
  const attempts: Array<{ simd: boolean; mod: (() => Promise<WasmModule>) | null; url: (() => Promise<string>) | null }> = [];
  if (preferSimd) attempts.push({ simd: true, mod: first(simdModules), url: first(simdUrls) });
  attempts.push({ simd: false, mod: first(scalarModules), url: first(scalarUrls) });
  for (const attempt of attempts) {
    if (!attempt.mod || !attempt.url) continue;
    try {
      const [mod, url] = await Promise.all([attempt.mod(), attempt.url()]);
      const exports = await mod.default({ module_or_path: url });
      const kernels = wrap(mod, exports.memory, attempt.simd && mod.simd_enabled(), url);
      if (selfTest(kernels)) return kernels;
    } catch (err) {
      // Not fatal: try the next build, then fall back to the TypeScript kernels.
      console.warn(`[kernels] ${attempt.simd ? 'SIMD' : 'scalar'} WebAssembly build unavailable`, err);
    }
  }
  return tsKernels;
}

function wrap(mod: WasmModule, memory: WebAssembly.Memory, simd: boolean, url: string): Kernels {
  return Object.freeze({
    tier: simd ? ('wasm-simd' as const) : ('wasm' as const),
    wasmUrl: url,
    sha256: (data: Uint8Array) => mod.sha256(data),
    hmacSha256: (key: Uint8Array, message: Uint8Array) => mod.hmac_sha256(key, message),
    chacha20Xor: (key: Uint8Array, nonce: Uint8Array, counter: number, data: Uint8Array) =>
      mod.chacha20_xor(key, nonce, counter, data),
    buildNeighborGraph: (positions: Float32Array, k: number, radius: number) =>
      mod.build_neighbor_graph(positions, k, radius),
    fbmField: (out: Float32Array, w: number, h: number, t: number, scale: number, octaves: number, seed: number) =>
      mod.fbm_field(out, w, h, t, scale, octaves, seed),
    createSim: (rest: Float32Array, phase: Float32Array): WasmSimHandle => {
      const sim = new mod.ParticleSim(rest, phase);
      return {
        step: (dt, time, px, py, pz, radius, strength, mode) =>
          sim.step(dt, time, px, py, pz, radius, strength, mode),
        read: (out) => out.set(new Float32Array(memory.buffer, sim.out_ptr(), sim.out_len())),
        reset: () => sim.reset(),
        dispose: () => sim.free(),
      };
    },
  });
}

/** SHA-256("abc") must match before a WebAssembly binary is trusted with state signing. */
function selfTest(k: Kernels): boolean {
  const digest = k.sha256(new Uint8Array([97, 98, 99]));
  return digest.length === 32 && digest[0] === 0xba && digest[1] === 0x78 && digest[31] === 0xad;
}
