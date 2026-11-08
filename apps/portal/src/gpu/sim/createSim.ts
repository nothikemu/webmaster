import type { Caps, ComputeTier } from '../../core/caps';
import type { Kernels } from '../../core/wasm';
import type { WebGLRenderer } from 'three';
import type { RendererKind } from '../rendererFactory';
import { GpgpuSim } from './gpgpuSim';
import { TsSim } from './tsSim';
import type { SimBackend } from './types';
import { WasmMainSim } from './wasmSim';
import { WebGpuSim } from './webgpuSim';
import { WorkerSim } from './workerSim';

const ORDER: readonly ComputeTier[] = ['webgpu', 'webgl2', 'wasm-worker', 'wasm-main', 'ts'];

export interface CreateSimOptions {
  rest: Float32Array;
  phase: Float32Array;
  caps: Caps;
  kernels: Kernels;
  /** The tier to try first (from capability probing or a URL override). */
  tier: ComputeTier;
  renderer: { kind: RendererKind; webgl: WebGLRenderer | null };
  /** Returns a decrypted shader asset by name. */
  asset(name: string): string;
}

/**
 * Builds the first simulation backend that starts, beginning at the requested tier and falling
 * through to the next one on any failure. The TypeScript backend cannot fail.
 */
export async function createSimulation(opts: CreateSimOptions): Promise<SimBackend> {
  const start = Math.max(0, ORDER.indexOf(opts.tier));
  for (const tier of ORDER.slice(start)) {
    try {
      switch (tier) {
        case 'webgpu': {
          if (!opts.caps.webgpu) break;
          return await WebGpuSim.create(opts.rest, opts.phase, opts.asset('wgsl/particles.compute.wgsl'));
        }
        case 'webgl2': {
          if (opts.renderer.kind !== 'webgl2' || !opts.renderer.webgl || !opts.caps.webgl2FloatTargets) break;
          return new GpgpuSim(opts.renderer.webgl, opts.rest, opts.phase, {
            kernel: opts.asset('glsl/kernel.glsl'),
            vert: opts.asset('glsl/gpgpu.vert.glsl'),
            vel: opts.asset('glsl/gpgpu_vel.frag.glsl'),
            pos: opts.asset('glsl/gpgpu_pos.frag.glsl'),
          });
        }
        case 'wasm-worker': {
          if (!opts.caps.worker) break;
          const shared = opts.caps.sharedArrayBuffer && opts.caps.crossOriginIsolated;
          return await WorkerSim.create(opts.rest, opts.phase, shared, opts.kernels.tier !== 'ts');
        }
        case 'wasm-main': {
          const handle = opts.kernels.createSim(opts.rest, opts.phase);
          if (!handle) break;
          return new WasmMainSim(handle, opts.rest);
        }
        case 'ts':
          return new TsSim(opts.rest, opts.phase);
      }
    } catch (err) {
      console.warn(`[sim] ${tier} backend failed, trying the next tier`, err);
    }
  }
  return new TsSim(opts.rest, opts.phase);
}
