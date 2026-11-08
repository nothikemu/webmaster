import * as Comlink from 'comlink';
import type { BurstOptions } from '../core/burst';

export interface SimWorkerApi {
  init(
    rest: Float32Array,
    phase: Float32Array,
    shared: SharedArrayBuffer | null,
    allowWasm: boolean,
  ): Promise<{ tier: string }>;
  /** Shared-memory path: positions are written into the SharedArrayBuffer given to `init`. */
  step(dt: number, time: number, px: number, py: number, pz: number, radius: number, strength: number, mode: number): Promise<void>;
  /** Transfer path: the buffer is filled and handed back (ping-pong). */
  stepInto(
    buffer: Float32Array,
    dt: number,
    time: number,
    px: number,
    py: number,
    pz: number,
    radius: number,
    strength: number,
    mode: number,
  ): Promise<Float32Array>;
  reset(): Promise<void>;
  dispose(): void;
}

export interface OverlayWorkerApi {
  init(canvas: OffscreenCanvas, width: number, height: number, dpr: number): void;
  resize(width: number, height: number, dpr: number): void;
  burst(options: BurstOptions): void;
  /** Advances and draws one frame. Resolves false once every particle has expired. */
  tick(dt: number): Promise<boolean>;
  dispose(): void;
}

export interface WorkerConnection<T> {
  worker: Worker;
  api: Comlink.Remote<T>;
  terminate(): void;
}

function connect<T>(worker: Worker): WorkerConnection<T> {
  return {
    worker,
    api: Comlink.wrap<T>(worker),
    terminate: () => worker.terminate(),
  };
}

export function connectSimWorker(): WorkerConnection<SimWorkerApi> {
  return connect<SimWorkerApi>(new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' }));
}

export function connectOverlayWorker(): WorkerConnection<OverlayWorkerApi> {
  return connect<OverlayWorkerApi>(new Worker(new URL('./overlay.worker.ts', import.meta.url), { type: 'module' }));
}

export { Comlink };
