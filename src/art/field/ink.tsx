/**
 * Small drawing helpers shared by every illustration in the field guide. They wrap the ink engine in `../ink` so that a
 * picture is written as plain points and comes out as a pen drawing: lines that swell and thin, wander a little, and lift at each end.
 * Everything is deterministic (seeded), so a drawing never changes between renders.
 */
import type { ReactNode } from 'react';
import { type Pt, ell, hatchD, ringD, spline, stippleD, strokeD, wobble } from '../ink';

const seedOf = (pts: readonly Pt[], salt = 0): number => {
  let h = 2166136261 ^ salt;
  for (const p of pts) {
    h ^= Math.round(p[0] * 7 + p[1] * 13);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** An open pen line through points. */
export function Pen({ pts, w = 2.2, color = '#17181d', smooth = true, taper = 0.22, wob = 0.8, opacity, seed }: { pts: readonly Pt[]; w?: number; color?: string; smooth?: boolean; taper?: number; wob?: number; opacity?: number; seed?: number }) {
  const sd = seed ?? seedOf(pts);
  const base = smooth ? spline(pts, false, 7) : (pts as Pt[]);
  return <path d={strokeD(wobble(base, wob, sd), w, sd, taper)} fill={color} fillOpacity={opacity} />;
}

/** A closed pen outline (a ring that never quite meets itself). */
export function Loop({ pts, w = 2.2, color = '#17181d', fill, fillOpacity, wob = 0.8, seed, smooth = true }: { pts: readonly Pt[]; w?: number; color?: string; fill?: string; fillOpacity?: number; wob?: number; seed?: number; smooth?: boolean }) {
  const sd = seed ?? seedOf(pts, 7);
  const poly = wobble(smooth ? spline(pts, true, 7) : (pts as Pt[]), wob, sd, true);
  const d = 'M' + poly.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
  return (
    <g>
      {fill ? <path d={d} fill={fill} fillOpacity={fillOpacity} /> : null}
      <path d={ringD(poly, w, sd)} fill={color} />
    </g>
  );
}

/** A hand-inked circle or ellipse. */
export function Round({ cx, cy, r, ry, w = 2.2, color = '#17181d', fill, fillOpacity, seed = 1, irr = 0.04 }: { cx: number; cy: number; r: number; ry?: number; w?: number; color?: string; fill?: string; fillOpacity?: number; seed?: number; irr?: number }) {
  const poly = ell(cx, cy, r, ry ?? r, Math.max(10, Math.round(r / 2.4)), irr, seed);
  return <Loop pts={poly} w={w} color={color} fill={fill} fillOpacity={fillOpacity} seed={seed} wob={Math.min(0.9, r * 0.05)} />;
}

/** Cross-hatching clipped to a polygon, for shadow. */
export function Shade({ pts, color = '#17181d', opacity = 0.7, spacing = 5, angle = 52, seed, smooth = false, weight = 0.9, cross = false }: { pts: readonly Pt[]; color?: string; opacity?: number; spacing?: number; angle?: number; seed?: number; smooth?: boolean; weight?: number; cross?: boolean }) {
  const sd = seed ?? seedOf(pts, 3);
  const poly = smooth ? spline(pts, true, 6) : (pts as Pt[]);
  return <path d={hatchD(poly, { seed: sd, gap: spacing, angle, w: weight, cross })} fill={color} fillOpacity={opacity} />;
}

/** Stippling inside a polygon: darker toward the lower edge. */
export function Dots({ pts, color = '#17181d', opacity = 0.65, count = 60, seed, smooth = false }: { pts: readonly Pt[]; color?: string; opacity?: number; count?: number; seed?: number; smooth?: boolean }) {
  const sd = seed ?? seedOf(pts, 5);
  const poly = smooth ? spline(pts, true, 6) : (pts as Pt[]);
  return <path d={stippleD(poly, sd, count)} fill={color} fillOpacity={opacity} />;
}

/** A flat colour wash behind the line work, a little off register like a hand-printed plate. */
export function Wash({ pts, color, opacity = 0.35, smooth = true, off = [1.4, 1.1], seed }: { pts: readonly Pt[]; color: string; opacity?: number; smooth?: boolean; off?: [number, number]; seed?: number }) {
  const sd = seed ?? seedOf(pts, 9);
  const poly = wobble(smooth ? spline(pts, true, 6) : (pts as Pt[]), 1.1, sd, true);
  const d = 'M' + poly.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
  return <path d={d} fill={color} fillOpacity={opacity} transform={`translate(${off[0]} ${off[1]})`} />;
}

/** Handwritten-style label drawn as live text (kept as text so it is searchable and translatable). */
export function Note({ x, y, children, size = 12, anchor = 'start', color = '#44454d', rotate = 0, serif = false }: { x: number; y: number; children: ReactNode; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; rotate?: number; serif?: boolean }) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={color} fontFamily={serif ? "var(--font-serif)" : "var(--font-mono)"} fontStyle={serif ? "italic" : undefined} letterSpacing={serif ? undefined : "0.06em"} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}>
      {children}
    </text>
  );
}
