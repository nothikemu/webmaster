import * as Comlink from 'comlink';
import { loadKernels, type WasmSimHandle } from '../core/wasm';
import { stepParticles } from '../gpu/sim/tsSim';
import type { PointerInput, SimMode } from '../gpu/sim/types';
import type { SimWorkerApi } from './comlink';

/**
 * Simulation worker for Module A. Runs the Rust kernel when WebAssembly loads, otherwise the
 * TypeScript reference (identical output). Large frame gaps are split into sub-steps so the
 * integrator stays stable when the main thread is busy.
 */
const MAX_SUBSTEP = 1 / 50;
const MAX_SUBSTEPS = 4;

let wasmSim: WasmSimHandle | null = null;
let rest: Float32Array = new Float32Array(0);
let phase: Float32Array = new Float32Array(0);
let pos: Float32Array = new Float32Array(0);
let vel: Float32Array = new Float32Array(0);
let shared: Float32Array | null = null;
let count = 0;

const pointer: PointerInput = { x: 0, y: 0, z: 0, radius: 1, strength: 0, mode: 0 };

function advance(dt: number, time: number, px: number, py: number, pz: number, radius: number, strength: number, mode: number): void {
  const steps = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(dt / MAX_SUBSTEP)));
  const h = dt / steps;
  for (let k = 0; k < steps; k++) {
    const t = time - dt + h * (k + 1);
    if (wasmSim) {
      wasmSim.step(h, t, px, py, pz, radius, strength, mode);
    } else {
      pointer.x = px;
      pointer.y = py;
      pointer.z = pz;
      pointer.radius = radius;
      pointer.strength = strength;
      pointer.mode = mode as SimMode;
      stepParticles(pos, vel, rest, phase, count, h, t, pointer);
    }
  }
}

function publish(out: Float32Array): void {
  if (wasmSim) wasmSim.read(out);
  else out.set(pos);
}

const api: SimWorkerApi = {
  async init(restIn, phaseIn, sab, allowWasm) {
    wasmSim?.dispose();
    wasmSim = null;
    rest = restIn;
    phase = phaseIn;
    count = Math.floor(rest.length / 3);
    pos = new Float32Array(rest);
    vel = new Float32Array(rest.length);
    shared = sab ? new Float32Array(sab) : null;
    const kernels = await loadKernels(true, allowWasm);
    wasmSim = kernels.createSim(rest, phase);
    if (shared) publish(shared);
    return { tier: wasmSim ? kernels.tier : 'ts' };
  },
  async step(dt, time, px, py, pz, radius, strength, mode) {
    advance(dt, time, px, py, pz, radius, strength, mode);
    if (shared) publish(shared);
  },
  async stepInto(buffer, dt, time, px, py, pz, radius, strength, mode) {
    advance(dt, time, px, py, pz, radius, strength, mode);
    publish(buffer);
    return Comlink.transfer(buffer, [buffer.buffer]);
  },
  async reset() {
    if (wasmSim) wasmSim.reset();
    else {
      pos.set(rest);
      vel.fill(0);
    }
    if (shared) publish(shared);
  },
  dispose() {
    wasmSim?.dispose();
    wasmSim = null;
  },
};

Comlink.expose(api);
