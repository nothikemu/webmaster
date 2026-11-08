import { useEffect, type ReactNode } from 'react';
import { BurstSim } from '../core/burst';
import type { Caps } from '../core/caps';
import type { MasterLoop } from '../core/loop';
import { MODULE_IDS, type ModuleId } from '../content/types';
import { useServices } from '../core/services';
import { Comlink, connectOverlayWorker, type OverlayWorkerApi, type WorkerConnection } from '../workers/comlink';

type Done = (modules: readonly ModuleId[]) => void;

/**
 * Draws the badge-unlock particle burst on a full-screen overlay. The physics (velocity, gravity,
 * drag, fade, varied palette) runs in a Web Worker on an OffscreenCanvas when available, and on
 * the main thread otherwise; both use the same BurstSim so the animation is identical. The master
 * loop drives every frame and the subscription ends the moment all particles have expired.
 */
class BurstController {
  readonly #canvas: HTMLCanvasElement;
  readonly #loop: MasterLoop;
  readonly #onDone: Done;
  readonly #pending = new Set<ModuleId>();
  #worker: WorkerConnection<OverlayWorkerApi> | null = null;
  #ctx: CanvasRenderingContext2D | null = null;
  readonly #sim = new BurstSim();
  #sub: ReturnType<MasterLoop['subscribe']> | null = null;
  #busy = false;
  #w = 0;
  #h = 0;
  #dpr = 1;

  constructor(canvas: HTMLCanvasElement, loop: MasterLoop, caps: Caps, onDone: Done) {
    this.#canvas = canvas;
    this.#loop = loop;
    this.#onDone = onDone;
    this.#measure();
    if (caps.offscreenCanvas && caps.worker) {
      try {
        const off = canvas.transferControlToOffscreen();
        this.#worker = connectOverlayWorker();
        this.#worker.api.init(Comlink.transfer(off, [off]), this.#w, this.#h, this.#dpr);
      } catch {
        this.#worker?.terminate();
        this.#worker = null;
      }
    }
    if (!this.#worker) {
      this.#ctx = canvas.getContext('2d');
      this.#apply();
    }
  }

  #measure(): void {
    this.#w = window.innerWidth;
    this.#h = window.innerHeight;
    this.#dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  #apply(): void {
    if (!this.#ctx) return;
    this.#canvas.width = Math.round(this.#w * this.#dpr);
    this.#canvas.height = Math.round(this.#h * this.#dpr);
    this.#ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
  }

  resize(): void {
    this.#measure();
    if (this.#worker) void this.#worker.api.resize(this.#w, this.#h, this.#dpr);
    else this.#apply();
  }

  fire(x: number, y: number, module: ModuleId): void {
    this.#pending.add(module);
    const options = { x, y, seed: (Date.now() & 0xffffff) ^ (module.length * 7919) };
    if (this.#worker) void this.#worker.api.burst(options);
    else this.#sim.spawn(options);
    if (this.#sub) return;
    this.#sub = this.#loop.subscribe((f) => {
      if (this.#worker) {
        if (this.#busy) return;
        this.#busy = true;
        void this.#worker.api.tick(f.dt).then((alive) => {
          this.#busy = false;
          if (!alive) this.#finish();
        });
        return;
      }
      const alive = this.#sim.step(f.dt);
      if (this.#ctx) this.#sim.draw(this.#ctx, this.#w, this.#h);
      if (!alive) this.#finish();
    });
  }

  #finish(): void {
    this.#sub?.dispose();
    this.#sub = null;
    const done = [...this.#pending];
    this.#pending.clear();
    this.#onDone(done);
  }

  dispose(): void {
    this.#sub?.dispose();
    this.#sub = null;
    if (this.#worker) {
      this.#worker.api.dispose();
      this.#worker.terminate();
    }
  }
}

/** Mounts the overlay once and wires it to the badge machines' `burst` events. */
export function BurstOverlay(): ReactNode {
  const { loop, caps, actor } = useServices();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.className = 'burst-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const controller = new BurstController(canvas, loop, caps, (modules) => {
      for (const module of modules) actor.send({ type: 'BADGE_DONE', module });
    });
    const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const subs = MODULE_IDS.map((id) => {
      const ref = actor.getSnapshot().context.badges[id];
      return ref.on('burst', () => {
        if (reducedQuery.matches) {
          actor.send({ type: 'BADGE_DONE', module: id });
          return;
        }
        const anchor = document.querySelector<HTMLElement>(`[data-badge="${id}"]`);
        const r = anchor?.getBoundingClientRect();
        const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
        const y = r ? r.top + r.height / 2 : window.innerHeight / 2.4;
        controller.fire(x, y, id);
      });
    });
    const onResize = (): void => controller.resize();
    addEventListener('resize', onResize, { passive: true });
    return () => {
      removeEventListener('resize', onResize);
      for (const s of subs) s.unsubscribe();
      controller.dispose();
      canvas.remove();
    };
  }, [loop, caps, actor]);

  return null;
}
