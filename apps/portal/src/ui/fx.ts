/**
 * The motion layer. It adds life to the page without being required by it: every effect is an
 * enhancement of markup that already works, and the whole layer is off under reduced motion.
 *
 *  - Reveals: elements marked data-reveal rise in as they enter the viewport, staggered when several
 *    arrive together.
 *  - Light: the pointer's position is written to --px/--py on the root (a slow parallax for the
 *    atmosphere) and, per pane, to --mx/--my (the spotlight that follows the pointer).
 *  - Magnetism: buttons lean a few pixels toward a nearby pointer.
 *  - Scroll: --sy (pixels) and --sp (0 to 1) on the root, and data-scrolled once the page has moved.
 *
 * Writes are batched into one requestAnimationFrame per event burst. Touch devices get reveals and
 * scroll values only; there is no pointer to follow.
 */

const REDUCED = '(prefers-reduced-motion: reduce)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const MAGNET_REACH = 64; // px beyond the button's edge where the pull begins
const MAGNET_MAX = 7; // px of travel at the edge of the button

function revealAll(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal]')) el.classList.add('in');
}

function run(pointerFx: boolean): () => void {
  const root = document.documentElement;
  const cleanups: Array<() => void> = [];

  // ---- reveals ------------------------------------------------------------------------------------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top ||
              a.boundingClientRect.left - b.boundingClientRect.left,
          );
        arriving.forEach((e, k) => {
          const el = e.target as HTMLElement;
          el.style.setProperty('--rd', `${Math.min(k, 7) * 80}ms`);
          el.classList.add('in');
          io.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -7% 0px', threshold: 0.06 },
    );
    const scan = (): void => {
      for (const el of document.querySelectorAll<HTMLElement>(
        '[data-reveal]:not(.in):not([data-watched])',
      )) {
        el.dataset.watched = '';
        io.observe(el);
      }
    };
    scan();
    let scanQueued = false;
    const mo = new MutationObserver(() => {
      if (scanQueued) return;
      scanQueued = true;
      requestAnimationFrame(() => {
        scanQueued = false;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      io.disconnect();
      mo.disconnect();
    });
  } else {
    revealAll();
  }
  const onPrint = (): void => revealAll();
  addEventListener('beforeprint', onPrint);
  cleanups.push(() => removeEventListener('beforeprint', onPrint));

  // ---- scroll -------------------------------------------------------------------------------------
  let scrollQueued = false;
  const writeScroll = (): void => {
    scrollQueued = false;
    const y = Math.round(scrollY);
    const max = Math.max(1, root.scrollHeight - innerHeight);
    root.style.setProperty('--sy', String(y));
    root.style.setProperty('--sp', Math.min(1, y / max).toFixed(3));
    root.dataset.scrolled = y > 12 ? 'true' : 'false';
  };
  const onScroll = (): void => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(writeScroll);
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  writeScroll();
  cleanups.push(() => {
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    root.style.removeProperty('--sy');
    root.style.removeProperty('--sp');
    delete root.dataset.scrolled;
  });

  // ---- pointer: light and magnetism ----------------------------------------------------------------
  if (pointerFx) {
    let x = 0;
    let y = 0;
    let target: Element | null = null;
    let queued = false;
    const magnets = new Map<HTMLElement, [number, number]>();

    const write = (): void => {
      queued = false;
      root.style.setProperty('--px', ((x / innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty('--py', ((y / innerHeight) * 2 - 1).toFixed(3));

      const pane = target?.closest<HTMLElement>('.glass, .panel');
      if (pane) {
        const r = pane.getBoundingClientRect();
        pane.style.setProperty('--mx', `${Math.round(x - r.left)}px`);
        pane.style.setProperty('--my', `${Math.round(y - r.top)}px`);
      }

      // Magnetism: read every button's box first, then write, so the frame does one layout.
      const buttons = document.querySelectorAll<HTMLElement>('.btn:not(:disabled), .magnetic');
      const reads: Array<[HTMLElement, DOMRect]> = [];
      for (const b of buttons) {
        const r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        reads.push([b, r]);
      }
      const active = new Set<HTMLElement>();
      for (const [b, r] of reads) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const outX = Math.max(0, Math.abs(dx) - r.width / 2);
        const outY = Math.max(0, Math.abs(dy) - r.height / 2);
        if (Math.hypot(outX, outY) > MAGNET_REACH) continue;
        const tx = Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dx * 0.12));
        const ty = Math.max(-MAGNET_MAX, Math.min(MAGNET_MAX, dy * 0.2));
        const prev = magnets.get(b);
        if (!prev || Math.abs(prev[0] - tx) > 0.2 || Math.abs(prev[1] - ty) > 0.2) {
          b.style.setProperty('--tx', `${tx.toFixed(1)}px`);
          b.style.setProperty('--ty', `${ty.toFixed(1)}px`);
          magnets.set(b, [tx, ty]);
        }
        active.add(b);
      }
      for (const b of [...magnets.keys()]) {
        if (active.has(b)) continue;
        b.style.removeProperty('--tx');
        b.style.removeProperty('--ty');
        magnets.delete(b);
      }
    };
    const onMove = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      x = e.clientX;
      y = e.clientY;
      target = e.target instanceof Element ? e.target : null;
      if (!queued) {
        queued = true;
        requestAnimationFrame(write);
      }
    };
    const onLeave = (): void => {
      root.style.setProperty('--px', '0');
      root.style.setProperty('--py', '0');
      for (const b of magnets.keys()) {
        b.style.removeProperty('--tx');
        b.style.removeProperty('--ty');
      }
      magnets.clear();
    };
    addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      onLeave();
    });
  }

  return () => {
    for (const c of cleanups.splice(0)) c();
  };
}

/** Starts the motion layer and keeps it in step with the reduced-motion preference. Returns the stop function. */
export function startFx(): () => void {
  const root = document.documentElement;
  let reduce: MediaQueryList;
  let fine: MediaQueryList;
  try {
    reduce = matchMedia(REDUCED);
    fine = matchMedia(FINE_POINTER);
  } catch {
    root.dataset.fx = 'off';
    return () => undefined;
  }
  let stop: (() => void) | null = null;
  const apply = (): void => {
    stop?.();
    stop = null;
    if (reduce.matches) {
      root.dataset.fx = 'off';
      revealAll();
      return;
    }
    root.dataset.fx = 'on';
    stop = run(fine.matches);
  };
  apply();
  reduce.addEventListener('change', apply);
  fine.addEventListener('change', apply);
  return () => {
    reduce.removeEventListener('change', apply);
    fine.removeEventListener('change', apply);
    stop?.();
    delete root.dataset.fx;
  };
}
