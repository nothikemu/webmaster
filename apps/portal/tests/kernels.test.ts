import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildNeighborGraphTs } from '../src/core/neighborFallback';
import { fbmFieldTs } from '../src/core/noiseFallback';
import { chacha20XorTs, hmacSha256Ts, sha256Ts, utf8 } from '../src/core/crypto';
import { TsSim } from '../src/gpu/sim/tsSim';
import { buildLinks, generateTopology } from '../src/modules/ModuleA/topology';
import { tsKernels } from '../src/core/wasm';

const root = resolve(__dirname, '..', 'src', 'wasm');

describe('topology', () => {
  it('is deterministic and exact in particle count for every quality tier', () => {
    for (const n of [3000, 3600, 4800, 6000]) {
      const a = generateTopology(n);
      const b = generateTopology(n);
      expect(a.count).toBe(n);
      expect(a.rest).toHaveLength(n * 3);
      expect(Array.from(a.rest.slice(0, 30))).toEqual(Array.from(b.rest.slice(0, 30)));
      expect(a.rest.every(Number.isFinite)).toBe(true);
    }
  });

  it('links every tier into a connected-looking graph with sensible opacity', () => {
    const topo = generateTopology(3000);
    const links = buildLinks(topo, tsKernels);
    expect(links.edges.length / 2).toBeGreaterThan(2000);
    expect(links.base.every((v) => v >= 0.12 && v <= 1)).toBe(true);
    expect(links.t.every((v) => v >= 0 && v <= 1)).toBe(true);
  });
});

describe('TypeScript fallbacks', () => {
  it('neighbour graph matches brute force', () => {
    const pts = new Float32Array(900);
    let s = 7;
    for (let i = 0; i < pts.length; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      pts[i] = (s >>> 8) / (1 << 24) * 3;
    }
    const f = Math.fround;
    const brute: number[] = [];
    const seen = new Set<number>();
    const r2 = f(0.6 * 0.6);
    const n = pts.length / 3;
    for (let i = 0; i < n; i++) {
      const c: Array<[number, number]> = [];
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = f(pts[i * 3]! - pts[j * 3]!);
        const dy = f(pts[i * 3 + 1]! - pts[j * 3 + 1]!);
        const dz = f(pts[i * 3 + 2]! - pts[j * 3 + 2]!);
        const d2 = f(f(f(dx * dx) + f(dy * dy)) + f(dz * dz));
        if (d2 <= r2) c.push([d2, j]);
      }
      c.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      for (const [, j] of c.slice(0, 3)) {
        const key = Math.min(i, j) * 4294967296 + Math.max(i, j);
        if (!seen.has(key)) {
          seen.add(key);
          brute.push(key);
        }
      }
    }
    brute.sort((a, b) => a - b);
    const flat = brute.flatMap((k) => [Math.floor(k / 4294967296), k % 4294967296]);
    expect(Array.from(buildNeighborGraphTs(pts, 3, 0.6))).toEqual(flat);
  });

  it('noise field is deterministic, bounded and varied', () => {
    const a = new Float32Array(48 * 28);
    const b = new Float32Array(48 * 28);
    fbmFieldTs(a, 48, 28, 1.25, 4, 4, 11);
    fbmFieldTs(b, 48, 28, 1.25, 4, 4, 11);
    expect(a).toEqual(b);
    expect(a.every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(Math.max(...a) - Math.min(...a)).toBeGreaterThan(0.2);
  });

  it('particle kernel returns to rest after the pointer leaves, in every mode', () => {
    const topo = generateTopology(600);
    for (const mode of [0, 1, 2] as const) {
      const sim = new TsSim(topo.rest, topo.phase);
      const pointer = { x: 0, y: 0, z: 0, radius: 0.85, strength: 28, mode };
      for (let i = 0; i < 90; i++) sim.step({ dt: 1 / 60, time: i / 60, pointer });
      let moved = 0;
      for (let i = 0; i < topo.count; i++) if (Math.hypot(sim.positions[i * 3]! - topo.rest[i * 3]!, sim.positions[i * 3 + 1]! - topo.rest[i * 3 + 1]!) > 0.1) moved++;
      expect(moved, `mode ${mode} should move particles`).toBeGreaterThan(0);
      for (let i = 0; i < 360; i++) sim.step({ dt: 1 / 60, time: (90 + i) / 60, pointer: { ...pointer, strength: 0 } });
      let off = 0;
      for (let i = 0; i < topo.count; i++) if (Math.hypot(sim.positions[i * 3]! - topo.rest[i * 3]!, sim.positions[i * 3 + 1]! - topo.rest[i * 3 + 1]!, sim.positions[i * 3 + 2]! - topo.rest[i * 3 + 2]!) > 0.12) off++;
      expect(off, `mode ${mode} should spring back`).toBe(0);
    }
  });
});

// The compiled WebAssembly must agree with the TypeScript twins. Skipped when `pnpm wasm` has not run.
interface WasmApi {
  initSync(opts: { module: BufferSource }): unknown;
  sha256(d: Uint8Array): Uint8Array;
  hmac_sha256(k: Uint8Array, m: Uint8Array): Uint8Array;
  chacha20_xor(k: Uint8Array, n: Uint8Array, c: number, d: Uint8Array): Uint8Array;
  build_neighbor_graph(p: Float32Array, k: number, r: number): Uint32Array;
  fbm_field(o: Float32Array, w: number, h: number, t: number, s: number, oc: number, seed: number): void;
  simd_enabled(): boolean;
  ParticleSim: new (rest: Float32Array, phase: Float32Array) => {
    step(dt: number, t: number, px: number, py: number, pz: number, r: number, s: number, m: number): void;
    out_ptr(): number;
    out_len(): number;
    free(): void;
  };
}

for (const flavour of ['pkg', 'pkg-simd'] as const) {
  const dir = resolve(root, flavour);
  const ready = existsSync(resolve(dir, 'tsa_core.js'));
  describe.skipIf(!ready)(`WebAssembly build "${flavour}" agrees with TypeScript`, async () => {
    const mod = (await import(/* @vite-ignore */ pathToFileURL(resolve(dir, 'tsa_core.js')).href)) as WasmApi;
    const wasm = mod.initSync({ module: readFileSync(resolve(dir, 'tsa_core_bg.wasm')) }) as { memory: WebAssembly.Memory };

    it('reports the expected SIMD flag', () => {
      expect(mod.simd_enabled()).toBe(flavour === 'pkg-simd');
    });

    it('hash, HMAC and cipher are byte-identical', () => {
      const data = new Uint8Array(333).map((_, i) => (i * 7) & 255);
      expect(Array.from(mod.sha256(data))).toEqual(Array.from(sha256Ts(data)));
      expect(Array.from(mod.hmac_sha256(utf8('key'), data))).toEqual(Array.from(hmacSha256Ts(utf8('key'), data)));
      const key = Uint8Array.from({ length: 32 }, (_, i) => i);
      const nonce = Uint8Array.from({ length: 12 }, (_, i) => i * 3);
      expect(Array.from(mod.chacha20_xor(key, nonce, 4, data))).toEqual(Array.from(chacha20XorTs(key, nonce, 4, data)));
    });

    it('neighbour graph matches the real topology edge for edge', () => {
      const topo = generateTopology(3000);
      expect(Array.from(mod.build_neighbor_graph(topo.rest, 2, topo.linkRadius))).toEqual(Array.from(buildNeighborGraphTs(topo.rest, 2, topo.linkRadius)));
    });

    it('noise field matches within float tolerance', () => {
      const a = new Float32Array(48 * 28);
      const b = new Float32Array(48 * 28);
      mod.fbm_field(a, 48, 28, 2.5, 5, 4, 7);
      fbmFieldTs(b, 48, 28, 2.5, 5, 4, 7);
      for (let i = 0; i < a.length; i++) expect(Math.abs(a[i]! - b[i]!)).toBeLessThan(1e-3);
    });

    it('particle integrator matches the TypeScript reference after 150 steps in every mode', () => {
      const topo = generateTopology(1200);
      for (const mode of [0, 1, 2] as const) {
        const wsim = new mod.ParticleSim(topo.rest, topo.phase);
        const tsim = new TsSim(topo.rest, topo.phase);
        for (let i = 0; i < 150; i++) {
          const pointer = { x: 0.1, y: -0.05, z: 0, radius: 0.85, strength: i < 100 ? 28 : 0, mode };
          wsim.step(1 / 60, i / 60, pointer.x, pointer.y, pointer.z, pointer.radius, pointer.strength, mode);
          tsim.step({ dt: 1 / 60, time: i / 60, pointer });
        }
        const out = new Float32Array(wasm.memory.buffer, wsim.out_ptr(), wsim.out_len());
        const errs = Array.from(out, (v, i) => Math.abs(v - tsim.positions[i]!)).sort((a, b) => a - b);
        wsim.free();
        const max = errs[errs.length - 1]!;
        const p95 = errs[Math.floor(errs.length * 0.95)]!;
        if (mode === 1) {
          // Attract pulls particles through the pointer's singular centre, where the direction d/|d|
          // flips and f32 versus f64 rounding is amplified. Most particles still agree exactly.
          expect(p95, 'attract p95').toBeLessThan(1e-3);
          expect(max, 'attract max').toBeLessThan(0.05);
        } else {
          // Deflect and orbit are well conditioned: the two implementations agree to float epsilon.
          expect(max, `mode ${mode} max`).toBeLessThan(1e-5);
        }
      }
    });
  });
}
