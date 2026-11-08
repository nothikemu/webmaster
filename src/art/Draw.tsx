import { INK } from './palette';
import { type HatchOpts, type Pt, densify, edgesD, hash, hatchD, ringD, spline, strokeD, wobble } from './ink';

const pathOf = (poly: readonly Pt[], closed: boolean) => `M${poly.map((p) => `${Math.round(p[0] * 10) / 10} ${Math.round(p[1] * 10) / 10}`).join('L')}${closed ? 'Z' : ''}`;

export interface ShapeProps {
  pts: readonly Pt[];
  fill?: string;
  fillOpacity?: number;
  /** Smooth (organic) shapes use a spline. Others keep their corners and are drawn side by side. */
  smooth?: boolean;
  open?: boolean;
  /** Ink line weight. 0 draws no outline. */
  w?: number;
  seed?: number;
  hatch?: HatchOpts | false;
  hatchColor?: string;
  hatchOpacity?: number;
  wob?: number;
  /** Colour sits slightly off the line, like a hand-registered print. */
  reg?: [number, number];
  ink?: string;
}

/** A coloured, hatched, hand-inked shape. */
export function Shape({ pts, fill, fillOpacity, smooth = false, open = false, w = 3, seed, hatch = false, hatchColor, hatchOpacity, wob = 0.9, reg = [1.5, 1.1], ink = INK }: ShapeProps) {
  const sd = seed ?? hash(pts);
  const closed = !open;
  const poly = wobble(smooth ? spline(pts, closed, 6) : densify(pts, 11, closed), wob, sd, closed);
  return (
    <g>
      {fill ? <path d={pathOf(poly, closed)} fill={fill} fillOpacity={fillOpacity} transform={`translate(${reg[0]} ${reg[1]})`} /> : null}
      {hatch ? <path d={hatchD(poly, { ...hatch, seed: sd })} fill={hatchColor ?? ink} fillOpacity={hatchOpacity} /> : null}
      {w > 0 ? <path d={smooth ? (closed ? ringD(poly, w, sd) : strokeD(poly, w, sd)) : edgesD(pts, closed, w, sd)} fill={ink} /> : null}
    </g>
  );
}

/** A flat shadow or wash with no outline. */
export function Wash({ pts, fill, opacity = 0.3, smooth = true, seed }: { pts: readonly Pt[]; fill: string; opacity?: number; smooth?: boolean; seed?: number }) {
  return <Shape pts={pts} fill={fill} fillOpacity={opacity} smooth={smooth} w={0} reg={[0, 0]} wob={1.2} seed={seed} />;
}

/** A single open brush stroke. */
export function Stroke({ pts, w = 2.6, seed, smooth = true, color = INK, taper = 0.2, wob = 0.7, opacity }: { pts: readonly Pt[]; w?: number; seed?: number; smooth?: boolean; color?: string; taper?: number; wob?: number; opacity?: number }) {
  const sd = seed ?? hash(pts);
  const base = smooth ? spline(pts, false, 6) : densify(pts, 9, false);
  return <path d={strokeD(wobble(base, wob, sd), w, sd, taper)} fill={color} fillOpacity={opacity} />;
}

/** Hatching laid over a region, for shadow. */
export function Hatch({ pts, color = INK, opacity = 0.85, smooth = false, ...o }: { pts: readonly Pt[]; color?: string; opacity?: number; smooth?: boolean } & HatchOpts) {
  const sd = o.seed ?? hash(pts);
  const poly = smooth ? spline(pts, true, 5) : densify(pts, 14, true);
  return <path d={hatchD(poly, { ...o, seed: sd })} fill={color} fillOpacity={opacity} />;
}

/** Many short strokes at once, for foliage, fur, grass, spray: each is given as [x, y, length, angleDegrees]. */
export function Flecks({ marks, w = 1.8, color = INK, seed = 3, opacity }: { marks: readonly (readonly [number, number, number, number])[]; w?: number; color?: string; seed?: number; opacity?: number }) {
  let d = '';
  marks.forEach(([x, y, len, ang], i) => {
    const a = (ang * Math.PI) / 180;
    const mid: Pt = [x + (Math.cos(a) * len) / 2 + Math.sin(a) * 1.5, y + (Math.sin(a) * len) / 2 - Math.cos(a) * 1.5];
    d += strokeD(spline([[x, y], mid, [x + Math.cos(a) * len, y + Math.sin(a) * len]], false, 4), w, seed + i, 0.4, 0.2);
  });
  return <path d={d} fill={color} fillOpacity={opacity} />;
}
