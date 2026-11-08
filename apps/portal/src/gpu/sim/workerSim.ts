import { Comlink } from '../../workers/comlink';
import { connectSimWorker, type WorkerConnection, type SimWorkerApi } from '../../workers/comlink';
import type { SimBackend, StepInput } from './types';

/**
 * Main-thread side of the simulation worker. One step is in flight at a time; frames that arrive
 * meanwhile accumulate into the next step's dt. Positions come back either through a
 * SharedArrayBuffer (cross-origin isolated pages) or by ping-ponging two transferable buffers.
 */
export class WorkerSim implements SimBackend {
  readonly kind = 'wasm-worker' as const;
  readonly positionTexture = null;
  readonly textureSize = 0;
  readonly count: number;
  positions: Float32Array;
  readonly sharedMemory: boolean;
  readonly innerTier: string;

  readonly #conn: WorkerConnection<SimWorkerApi>;
  #spare: Float32Array | null;
  #busy = false;
  #pendingDt = 0;
  #disposed = false;

  private constructor(conn: WorkerConnection<SimWorkerApi>, count: number, positions: Float32Array, spare: Float32Array | null, shared: boolean, innerTier: string) {
    this.#conn = conn;
    this.count = count;
    this.positions = positions;
    this.#spare = spare;
    this.sharedMemory = shared;
    this.innerTier = innerTier;
  }

  /** Spawns the worker and waits for it to load its kernels. Rejects if the worker cannot start. */
  static async create(rest: Float32Array, phase: Float32Array, useShared: boolean, allowWasm: boolean): Promise<WorkerSim> {
    const conn = connectSimWorker();
    try {
      const count = Math.floor(rest.length / 3);
      const shared = useShared && typeof SharedArrayBuffer === 'function';
      const sab = shared ? new SharedArrayBuffer(rest.byteLength) : null;
      const restCopy = new Float32Array(rest);
      const phaseCopy = new Float32Array(phase);
      const info = await conn.api.init(Comlink.transfer(restCopy, [restCopy.buffer]), Comlink.transfer(phaseCopy, [phaseCopy.buffer]), sab, allowWasm);
      const first = sab ? new Float32Array(sab) : new Float32Array(rest);
      return new WorkerSim(conn, count, first, sab ? null : new Float32Array(rest.length), shared, info.tier);
    } catch (err) {
      conn.terminate();
      throw err;
    }
  }

  step({ dt, time, pointer: p }: StepInput): void {
    if (this.#disposed) return;
    this.#pendingDt += dt;
    if (this.#busy) return;
    const sendDt = this.#pendingDt;
    this.#pendingDt = 0;
    this.#busy = true;
    if (this.sharedMemory) {
      void this.#conn.api
        .step(sendDt, time, p.x, p.y, p.z, p.radius, p.strength, p.mode)
        .catch(() => undefined)
        .finally(() => {
          this.#busy = false;
        });
      return;
    }
    const spare = this.#spare;
    if (!spare) {
      this.#busy = false;
      return;
    }
    this.#spare = null;
    void this.#conn.api
      .stepInto(Comlink.transfer(spare, [spare.buffer]), sendDt, time, p.x, p.y, p.z, p.radius, p.strength, p.mode)
      .then((filled) => {
        this.#spare = this.positions;
        this.positions = filled;
      })
      .catch(() => undefined)
      .finally(() => {
        this.#busy = false;
      });
  }

  reset(): void {
    void this.#conn.api.reset();
  }

  dispose(): void {
    this.#disposed = true;
    this.#conn.api.dispose();
    this.#conn.terminate();
  }
}
