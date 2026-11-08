import * as Comlink from 'comlink';
import { BurstSim, type BurstOptions } from '../core/burst';
import type { OverlayWorkerApi } from './comlink';

/** Renders the badge burst on an OffscreenCanvas. The main thread's master loop sends `tick`. */
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let dpr = 1;
const sim = new BurstSim();

function applySize(): void {
  if (!canvas || !ctx) return;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const api: OverlayWorkerApi = {
  init(c, w, h, ratio) {
    canvas = c;
    ctx = c.getContext('2d');
    width = w;
    height = h;
    dpr = ratio;
    applySize();
  },
  resize(w, h, ratio) {
    width = w;
    height = h;
    dpr = ratio;
    applySize();
  },
  burst(options: BurstOptions) {
    sim.spawn(options);
  },
  async tick(dt) {
    if (!ctx) return false;
    const alive = sim.step(Math.min(dt, 0.05));
    sim.draw(ctx, width, height);
    return alive;
  },
  dispose() {
    ctx?.clearRect(0, 0, width, height);
    canvas = null;
    ctx = null;
  },
};

Comlink.expose(api);
