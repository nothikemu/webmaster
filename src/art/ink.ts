/**
 * The ink engine. This is what separates the artwork from ordinary vector shapes.
 *
 * A hand-inked line is never one width, never perfectly straight, and never closes exactly where it started.
 * So every outline here is a filled brush-stroke polygon whose width swells and thins with simulated pen pressure,
 * whose path wanders slightly (low-frequency wobble), and which lifts off the page with a taper at each end.
 * Closed shapes are drawn as two overlapping strokes. Straight edges are drawn one stroke at a time and overshoot
 * their corners. Shading is jittered hatching, computed by scanline against the shape itself.
 *
 * Everything is deterministic (seeded), so the drawings never change between renders.
 */
import { rng } from '@/widgets/logic/random';

export type Pt = [number, number];

const R = (n: number) => Math.round(n * 10) / 10;
const TAU = Math.PI * 2;

export function hash(pts: readonly Pt[]): number {
  let h = 2166136261;
  for (const p of pts) {
    h ^= Math.round(p[0] * 7 + p[1] * 13);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Catmull-Rom spline through the points, sampled into a polyline. */
export function spline(pts: readonly Pt[], closed: boolean, steps = 6): Pt[] {
  const n = pts.length;
  if (n < 3) return pts.map((p) => [p[0], p[1]] as Pt);
  const g = (i: number): Pt => (closed ? pts[((i % n) + n) % n]! : pts[Math.max(0, Math.min(n - 1, i))]!);
  const out: Pt[] = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push([pts[n - 1]![0], pts[n - 1]![1]]);
  return out;
}

/** Add points along straight edges so wobble can bend them. Corners are kept. */
export function densify(pts: readonly Pt[], step: number, closed: boolean): Pt[] {
  const out: Pt[] = [];
  const n = pts.length;
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let s = 0; s < k; s++) out.push([a[0] + ((b[0] - a[0]) * s) / k, a[1] + ((b[1] - a[1]) * s) / k]);
  }
  if (!closed) out.push([pts[n - 1]![0], pts[n - 1]![1]]);
  return out;
}

function normals(poly: readonly Pt[], closed: boolean): Pt[] {
  const n = poly.length;
  return poly.map((_, i) => {
    const a = poly[closed ? (i - 1 + n) % n : Math.max(0, i - 1)]!;
    const b = poly[closed ? (i + 1) % n : Math.min(n - 1, i + 1)]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l] as Pt;
  });
}

/** Push each point sideways by smooth, layered noise so lines wander like a hand does. */
export function wobble(poly: readonly Pt[], amp: number, seed: number, closed = false, wl = 46): Pt[] {
  if (amp <= 0) return poly.map((p) => [p[0], p[1]] as Pt);
  const r = rng(seed ^ 0x9e37);
  const p1 = r() * TAU;
  const p2 = r() * TAU;
  const p3 = r() * TAU;
  const nm = normals(poly, closed);
  let s = 0;
  return poly.map((p, i) => {
    if (i) s += Math.hypot(p[0] - poly[i - 1]![0], p[1] - poly[i - 1]![1]);
    const d = amp * (0.55 * Math.sin((s / wl) * TAU + p1) + 0.3 * Math.sin((s / (wl * 0.41)) * TAU + p2) + 0.15 * Math.sin((s / (wl * 0.17)) * TAU + p3));
    return [p[0] + nm[i]![0] * d, p[1] + nm[i]![1] * d] as Pt;
  });
}

const join = (pts: readonly Pt[]) => pts.map((p) => `${R(p[0])} ${R(p[1])}`).join('L');

/** A single brush stroke: a polygon around the path whose width swells, thins and tapers at both ends. */
export function strokeD(poly: readonly Pt[], w: number, seed: number, taper = 0.2, variation = 0.32): string {
  const n = poly.length;
  if (n < 2) return '';
  const r = rng(seed);
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1]! + Math.hypot(poly[i]![0] - poly[i - 1]![0], poly[i]![1] - poly[i - 1]![1]));
  const total = L[n - 1] || 1;
  const nm = normals(poly, false);
  const ph1 = r() * TAU;
  const ph2 = r() * TAU;
  const f1 = total / (26 + r() * 30);
  const f2 = total / (9 + r() * 9);
  const left: Pt[] = [];
  const right: Pt[] = [];
  const tp = Math.min(0.5, Math.max(0.02, taper));
  for (let i = 0; i < n; i++) {
    const t = L[i]! / total;
    const e = Math.min(1, t / tp, (1 - t) / tp);
    const env = 0.16 + 0.84 * Math.sin((Math.max(0, e) * Math.PI) / 2);
    const noise = 1 + variation * (0.6 * Math.sin(t * f1 * TAU + ph1) + 0.4 * Math.sin(t * f2 * TAU + ph2));
    const hw = Math.max(0.2, (w * env * noise) / 2);
    const p = poly[i]!;
    left.push([p[0] + nm[i]![0] * hw, p[1] + nm[i]![1] * hw]);
    right.push([p[0] - nm[i]![0] * hw, p[1] - nm[i]![1] * hw]);
  }
  return `M${join(left)}L${join(right.reverse())}Z`;
}

/** Outline of a closed shape as two overlapping strokes, like a pen that is lifted and put back down. */
export function ringD(poly: readonly Pt[], w: number, seed: number): string {
  const n = poly.length;
  if (n < 6) return strokeD([...poly, poly[0]!], w, seed);
  const r = rng(seed);
  const start = Math.floor(r() * n);
  const rot: Pt[] = [...poly.slice(start), ...poly.slice(0, start)];
  rot.push(rot[0]!);
  const cut = Math.floor(n * (0.46 + r() * 0.1));
  const over = Math.max(2, Math.floor(n * 0.05));
  return strokeD(rot.slice(0, cut + over), w, seed + 1, 0.2) + strokeD(rot.slice(cut - over), w, seed + 2, 0.2);
}

/** Outline of a polygon with straight sides: each side is its own stroke and overshoots its corners a little. */
export function edgesD(pts: readonly Pt[], closed: boolean, w: number, seed: number, wob = 0.7, over = 3): string {
  const r = rng(seed);
  const n = pts.length;
  const m = closed ? n : n - 1;
  let d = '';
  for (let i = 0; i < m; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % n]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    const e0 = (r() - 0.25) * over;
    const e1 = (r() - 0.25) * over;
    const A: Pt = [a[0] - ux * e0, a[1] - uy * e0];
    const B: Pt = [b[0] + ux * e1, b[1] + uy * e1];
    const seg = wobble(densify([A, B], 9, false), wob, seed + i * 17, false, 34);
    d += strokeD(seg, w * (0.8 + 0.4 * r()), seed + i * 5, 0.22);
  }
  return d;
}

export interface HatchOpts {
  angle?: number;
  gap?: number;
  w?: number;
  /** Space kept clear of the shape's edge. */
  inset?: number;
  /** Probability that a hatch line is drawn at all (below 1 gives a broken, sketchy look). */
  density?: number;
  cross?: boolean;
  seed?: number;
}

/** Hatching clipped to the polygon by scanline, each line a short tapered stroke with its own jitter. */
export function hatchD(poly: readonly Pt[], o: HatchOpts = {}): string {
  const { angle = -35, gap = 7, w = 1.6, inset = 2, density = 1, seed = 1 } = o;
  const run = (ang: number, sd: number): string => {
    const r = rng(sd);
    const a = (ang * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const rot = (p: Pt): Pt => [p[0] * cos + p[1] * sin, -p[0] * sin + p[1] * cos];
    const unrot = (p: Pt): Pt => [p[0] * cos - p[1] * sin, p[0] * sin + p[1] * cos];
    const rp = poly.map(rot);
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of rp) {
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
    let d = '';
    for (let y = minY + gap * 0.5 + r() * gap * 0.4; y < maxY; y += gap * (0.8 + 0.45 * r())) {
      const xs: number[] = [];
      for (let i = 0; i < rp.length; i++) {
        const p = rp[i]!;
        const q = rp[(i + 1) % rp.length]!;
        if ((p[1] <= y && q[1] > y) || (q[1] <= y && p[1] > y)) xs.push(p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0]));
      }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const x0 = xs[k]! + inset + r() * 3.5;
        const x1 = xs[k + 1]! - inset - r() * 3.5;
        if (x1 - x0 < 5 || r() > density) continue;
        const seg: Pt[] = [];
        const steps = Math.max(2, Math.round((x1 - x0) / 14));
        for (let s = 0; s <= steps; s++) seg.push(unrot([x0 + ((x1 - x0) * s) / steps, y + (r() - 0.5) * 1.6]));
        d += strokeD(seg, w * (0.7 + 0.6 * r()), sd + Math.floor(y), 0.42, 0.25);
      }
    }
    return d;
  };
  return run(angle, seed * 31 + 7) + (o.cross ? run(angle + 70, seed * 53 + 11) : '');
}

/** An irregular ellipse as a point list. */
export function ell(cx: number, cy: number, rx: number, ry: number, n = 14, irr = 0.05, seed = 1): Pt[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * TAU;
    const k = 1 + (r() - 0.5) * 2 * irr;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as Pt;
  });
}

export const box = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

/** A cumulus cloud outline: the union of overlapping ellipses on top (so the cusps between bumps are crisp and the ends are round), a gently wavy flat underside. */
export function cumulus(cx: number, cy: number, w: number, h: number, seed = 1): Pt[] {
  const r = rng(seed);
  const n = Math.max(3, Math.round(w / 90) + 1);
  const base = cy + h * 0.26;
  const radii = Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    return h * (0.28 + 0.6 * Math.sin(Math.PI * (0.08 + 0.84 * t))) * (0.72 + 0.56 * r());
  });
  // place the bumps side by side, each overlapping the last, then stretch the row to the requested width
  const xs: number[] = [radii[0]!];
  for (let i = 1; i < n; i++) xs.push(xs[i - 1]! + (radii[i - 1]! + radii[i]!) * 0.62);
  const span = xs[n - 1]! + radii[n - 1]! + 0;
  const k = w / span;
  const x0 = cx - w / 2;
  const bumps = radii.map((rad, i) => ({ x: x0 + xs[i]! * k, y: base - rad * 0.5, rx: rad * k, ry: rad }));
  const top: Pt[] = [];
  for (let x = x0; x <= x0 + w; x += 4) {
    let y = base;
    for (const c of bumps) {
      const u = (x - c.x) / c.rx;
      if (Math.abs(u) < 1) y = Math.min(y, c.y - c.ry * Math.sqrt(1 - u * u));
    }
    top.push([x, y]);
  }
  const under: Pt[] = [];
  for (let i = 5; i >= 0; i--) under.push([x0 + (i / 5) * w + (r() - 0.5) * 6, base + 3 + 4 * Math.sin(i * 1.9 + seed)]);
  return [...top, ...under];
}

/** A curling wave crest in the manner of woodblock prints. Returns the centerline, for use as a stroke. */
export function crest(x: number, y: number, s: number, flip = 1): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const a = t * Math.PI * 1.55;
    const rad = s * (1 - t * 0.62);
    pts.push([x + flip * (-Math.cos(a) * rad + t * s * 0.9), y - Math.sin(a) * rad * 0.9 + t * t * s * 0.1]);
  }
  return pts;
}

/**
 * A dry-brush stroke: several thin bristle strokes side by side, each starting and stopping on its own,
 * so the mark breaks up at the ends like a brush running out of paint.
 */
export function dryD(poly: readonly Pt[], w: number, seed: number, bristles = 5, ragged = 0.6): string {
  const n = poly.length;
  if (n < 3) return '';
  const r = rng(seed ^ 0x51ed);
  const nm = normals(poly, false);
  let d = '';
  for (let b = 0; b < bristles; b++) {
    const off = (bristles === 1 ? 0 : b / (bristles - 1) - 0.5) * w * (0.82 + r() * 0.3);
    const a = Math.floor(r() * n * 0.3 * ragged);
    const z = n - Math.floor(r() * n * 0.36 * ragged);
    if (z - a < 3) continue;
    const seg: Pt[] = [];
    for (let i = a; i < z; i++) seg.push([poly[i]![0] + nm[i]![0] * off, poly[i]![1] + nm[i]![1] * off]);
    d += strokeD(seg, (w / bristles) * (0.7 + r() * 0.9), seed + b * 13, 0.3, 0.45);
  }
  return d;
}

/** Ink spatter: a scatter of small blots, denser near the centre, with a few large ones. */
export function spatterD(cx: number, cy: number, radius: number, count: number, seed: number): string {
  const r = rng(seed ^ 0x77aa);
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = r() * TAU;
    const dist = radius * Math.pow(r(), 1.6);
    const size = 0.5 + Math.pow(r(), 3.2) * 2.8;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    const pts: string[] = [];
    for (let k = 0; k < 6; k++) {
      const t = (k / 6) * TAU;
      const q = size * (0.72 + r() * 0.56);
      pts.push(`${R(x + Math.cos(t) * q)} ${R(y + Math.sin(t) * q * 0.9)}`);
    }
    d += `M${pts.join('L')}Z`;
  }
  return d;
}

/** A regular polygon or star as a point list. `inner` below 1 pulls every second point in, making a star. */
export function star(cx: number, cy: number, radius: number, points: number, inner = 1, rot = -Math.PI / 2): Pt[] {
  const n = inner === 1 ? points : points * 2;
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * TAU;
    const k = inner !== 1 && i % 2 ? radius * inner : radius;
    return [cx + Math.cos(a) * k, cy + Math.sin(a) * k] as Pt;
  });
}

/** A toothed gear outline. */
export function gear(cx: number, cy: number, radius: number, teeth: number, depth = 0.2, rot = 0): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = rot + (i / teeth) * TAU;
    const step = TAU / teeth;
    const ri = radius * (1 - depth);
    pts.push([cx + Math.cos(a0) * ri, cy + Math.sin(a0) * ri]);
    pts.push([cx + Math.cos(a0 + step * 0.18) * radius, cy + Math.sin(a0 + step * 0.18) * radius]);
    pts.push([cx + Math.cos(a0 + step * 0.5) * radius, cy + Math.sin(a0 + step * 0.5) * radius]);
    pts.push([cx + Math.cos(a0 + step * 0.68) * ri, cy + Math.sin(a0 + step * 0.68) * ri]);
  }
  return pts;
}

/** A circular arc as a polyline, angles in degrees (0 = east, 90 = south). */
export function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 14): Pt[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
  });
}

export const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
