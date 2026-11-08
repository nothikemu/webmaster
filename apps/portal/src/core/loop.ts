/**
 * The one and only requestAnimationFrame loop. Every animated thing (particle fields, springs,
 * number tweens, tilting badges) subscribes here. Subscribers tied to an element are paused
 * while it is off-screen, and the whole loop stops when the tab is hidden or nothing is active.
 */

export interface Frame {
  /** Seconds since the loop first started. */
  time: number;
  /** Seconds since the previous frame, clamped to avoid spiral-of-death steps. */
  dt: number;
  /** Unclamped seconds since the previous frame (capped at 1 s). Use for UI tweens, not simulation. */
  rawDt: number;
  frame: number;
}

export type FrameCallback = (frame: Frame) => void;
export type FrameTimeObserver = (dtMs: number, nowMs: number) => void;

export interface LoopHandle {
  setActive(active: boolean): void;
  dispose(): void;
}

export interface SubscribeOptions {
  /** When set, the callback only runs while this element intersects the viewport. */
  element?: Element | null;
  /** Marks heavy work (GPU scenes). Only frames that ran a heavy subscriber feed the observers. */
  heavy?: boolean;
  active?: boolean;
}

interface Sub {
  cb: FrameCallback;
  active: boolean;
  visible: boolean;
  heavy: boolean;
  element: Element | null;
}

const MAX_DT = 0.05;
const HEARTBEAT_EVERY = 30;

export class MasterLoop {
  readonly #subs = new Set<Sub>();
  readonly #observers = new Set<FrameTimeObserver>();
  readonly #io: IntersectionObserver | null;
  readonly #byElement = new Map<Element, Set<Sub>>();
  readonly #nativeRaf: (cb: FrameRequestCallback) => number;
  readonly #nativeCaf: (id: number) => void;
  /** One-shot callbacks requested by libraries through `requestFrame`; run on the next master frame. */
  #queue = new Map<number, FrameRequestCallback>();
  #queueId = 0;
  #raf = 0;
  #last = 0;
  #time = 0;
  #frame = 0;
  #running = false;

  constructor() {
    // Captured now, before anything can replace the globals, so the loop always reaches the real one.
    this.#nativeRaf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame.bind(globalThis) : () => 0;
    this.#nativeCaf = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame.bind(globalThis) : () => undefined;
    this.#io =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver((entries) => {
            for (const e of entries) {
              const subs = this.#byElement.get(e.target);
              if (subs) for (const s of subs) s.visible = e.isIntersecting;
            }
            this.#wake();
          })
        : null;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.#halt();
        else this.#wake();
      });
    }
  }

  subscribe(cb: FrameCallback, options: SubscribeOptions = {}): LoopHandle {
    const element = options.element ?? null;
    const sub: Sub = {
      cb,
      active: options.active ?? true,
      visible: element === null || this.#io === null,
      heavy: options.heavy ?? false,
      element,
    };
    this.#subs.add(sub);
    if (element && this.#io) {
      let set = this.#byElement.get(element);
      if (!set) {
        set = new Set();
        this.#byElement.set(element, set);
        this.#io.observe(element);
      }
      set.add(sub);
    }
    this.#wake();
    return {
      setActive: (active) => {
        sub.active = active;
        if (active) this.#wake();
      },
      dispose: () => {
        this.#subs.delete(sub);
        if (element && this.#io) {
          const set = this.#byElement.get(element);
          set?.delete(sub);
          if (set && set.size === 0) {
            this.#byElement.delete(element);
            this.#io.unobserve(element);
          }
        }
      },
    };
  }

  /** Observes the frame time of frames that ran at least one heavy subscriber. */
  observe(observer: FrameTimeObserver): () => void {
    this.#observers.add(observer);
    return () => void this.#observers.delete(observer);
  }

  /**
   * requestAnimationFrame-compatible one-shot request, served by the next master frame. Code
   * that insists on calling requestAnimationFrame can be pointed here so the page still has exactly
   * one native animation-frame loop.
   */
  requestFrame(cb: FrameRequestCallback): number {
    const id = ++this.#queueId;
    this.#queue.set(id, cb);
    this.#wake();
    return id;
  }

  cancelFrame(id: number): void {
    this.#queue.delete(id);
  }

  /** Call after changing state that a paused subscriber should react to. */
  wake(): void {
    this.#wake();
  }

  get frameCount(): number {
    return this.#frame;
  }

  #runnable(): boolean {
    if (this.#queue.size > 0) return true;
    for (const s of this.#subs) if (s.active && s.visible) return true;
    return false;
  }

  #wake(): void {
    if (this.#running || (typeof document !== 'undefined' && document.hidden)) return;
    if (!this.#runnable()) return;
    this.#running = true;
    this.#last = 0;
    this.#raf = this.#nativeRaf(this.#tick);
  }

  #halt(): void {
    this.#running = false;
    this.#nativeCaf(this.#raf);
  }

  readonly #tick = (now: number): void => {
    if (!this.#running) return;
    const dtRaw = this.#last === 0 ? 1 / 60 : (now - this.#last) / 1000;
    this.#last = now;
    const dt = Math.min(MAX_DT, Math.max(0, dtRaw));
    this.#time += dt;
    this.#frame += 1;
    const frame: Frame = { time: this.#time, dt, rawDt: Math.min(1, Math.max(0, dtRaw)), frame: this.#frame };
    let heavy = false;
    for (const s of this.#subs) {
      if (!s.active || !s.visible) continue;
      if (s.heavy) heavy = true;
      s.cb(frame);
    }
    if (this.#queue.size > 0) {
      const due = this.#queue;
      this.#queue = new Map();
      for (const cb of due.values()) cb(now);
    }
    if (heavy) for (const o of this.#observers) o(dtRaw * 1000, now);
    if (this.#frame % HEARTBEAT_EVERY === 0) document.documentElement.dataset.frame = String(this.#frame);
    if (this.#runnable()) this.#raf = this.#nativeRaf(this.#tick);
    else this.#running = false;
  };
}
