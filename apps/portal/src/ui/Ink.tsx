import type { ReactNode } from 'react';

/**
 * A small ink engine, so the drawings read as pen and brush work and not as vector geometry.
 *
 *   brush()   one stroke as a filled outline whose width swells and tapers like a brush, with the line
 *             wandering a little off the path, as a hand does
 *   blob()    a closed shape through points, its outline wobbling slightly
 *   hatch()   short parallel strokes of uneven length and gap, for shade, the way manga is shaded
 *   InkDefs   the filters shared by the drawings: a slight wobble, and a dry-ink grain for large blacks
 *
 * Everything is seeded, so a drawing is the same on every render and on the server.
 */
export type P = [number, number];

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number): string => n.toFixed(1);

/** Catmull-Rom through the points, `per` samples between each pair. */
function spline(pts: P[], per: number, closed = false): P[] {
  const out: P[] = [];
  const n = pts.length;
  const at = (i: number): P =>
    closed ? pts[((i % n) + n) % n]! : pts[Math.max(0, Math.min(n - 1, i))]!;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let k = 0; k < per; k++) {
      const t = k / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  if (!closed) out.push(pts[n - 1]!);
  return out;
}

interface BrushOpts {
  /** Peak width. */
  w?: number;
  seed?: number;
  /** How far the line wanders off the path. */
  wobble?: number;
  /** Fraction of the stroke over which the ends taper. */
  taper?: number;
}

/** One brush stroke along the points, as the `d` of a filled path. */
export function brush(
  pts: P[],
  { w = 3, seed = 1, wobble = 0.7, taper = 0.3 }: BrushOpts = {},
): string {
  const r = rng(seed);
  const s = spline(pts, 9);
  const n = s.length;
  const ph = r() * 6.28;
  const ph2 = r() * 6.28;
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = s[Math.max(0, i - 1)]!;
    const b = s[Math.min(n - 1, i + 1)]!;
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const nx = -dy;
    const ny = dx;
    const t = i / (n - 1);
    const end = Math.min(1, t / taper, (1 - t) / taper);
    const press = 0.78 + 0.22 * Math.sin(t * 9 + ph) + 0.12 * Math.sin(t * 23 + ph2);
    const hw = Math.max(0.15, (w / 2) * Math.pow(Math.max(0, end), 0.7) * press);
    const off = wobble * (Math.sin(t * 7.3 + ph) * 0.6 + Math.sin(t * 17 + ph2) * 0.4);
    const cx = s[i]![0] + nx * off;
    const cy = s[i]![1] + ny * off;
    left.push([cx + nx * hw, cy + ny * hw]);
    right.push([cx - nx * hw, cy - ny * hw]);
  }
  const all = [...left, ...right.reverse()];
  return `M${all.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
}

/** A closed shape through the points, its outline wobbling a little. */
export function blob(
  pts: P[],
  { seed = 1, rough = 1.2 }: { seed?: number; rough?: number } = {},
): string {
  const r = rng(seed);
  const j: P[] = pts.map(([x, y]) => [x + (r() - 0.5) * rough * 2, y + (r() - 0.5) * rough * 2]);
  const s = spline(j, 8, true);
  return `M${s.map((p) => `${f(p[0])} ${f(p[1])}`).join('L')}Z`;
}

/** An angular closed shape: straight edges, each corner nudged a little. */
export function poly(
  pts: P[],
  { seed = 1, rough = 1 }: { seed?: number; rough?: number } = {},
): string {
  const r = rng(seed);
  return `M${pts.map(([x, y]) => `${f(x + (r() - 0.5) * rough * 2)} ${f(y + (r() - 0.5) * rough * 2)}`).join('L')}Z`;
}

/** Parallel strokes across a box, of uneven length and gap, at an angle. */
export function hatch(
  box: { x: number; y: number; w: number; h: number },
  angle: number,
  gap: number,
  { seed = 1, width = 1.4, cover = 0.85 }: { seed?: number; width?: number; cover?: number } = {},
): string {
  const r = rng(seed);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const R = Math.hypot(box.w, box.h) / 2 + 4;
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const vx = -uy;
  const vy = ux;
  const parts: string[] = [];
  for (let o = -R; o <= R; o += gap * (0.8 + r() * 0.4)) {
    const from = -R + r() * R * (1 - cover);
    const to = R - r() * R * (1 - cover);
    const p0: P = [cx + vx * o + ux * from, cy + vy * o + uy * from];
    const p1: P = [cx + vx * o + ux * to, cy + vy * o + uy * to];
    parts.push(
      brush(
        [p0, [(p0[0] + p1[0]) / 2 + (r() - 0.5) * 2, (p0[1] + p1[1]) / 2 + (r() - 0.5) * 2], p1],
        { w: width * (0.7 + r() * 0.6), seed: Math.floor(r() * 1e6), wobble: 0.5, taper: 0.4 },
      ),
    );
  }
  return parts.join('');
}

/** The filters the drawings share. Put once inside each drawing's <defs>. */
export function InkDefs(): ReactNode {
  return (
    <>
      {/* A slight wobble, so a line is never perfectly straight. */}
      <filter id="ink-rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.028 0.04"
          numOctaves="2"
          seed="4"
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="3.2"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      {/* Dry ink: a fine speckle of paper showing through large blacks. */}
      <filter id="ink-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="9" result="g" />
        <feColorMatrix
          in="g"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -9 5.1"
          result="speck"
        />
        <feComposite in="SourceGraphic" in2="speck" operator="in" />
      </filter>
    </>
  );
}
