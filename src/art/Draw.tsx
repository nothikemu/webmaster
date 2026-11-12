import { INK } from './palette';
import { useId, useMemo, type ReactNode } from 'react';
import { type HatchOpts, type Pt, deckleEdge, densify, dryD, edgesD, hash, hatchD, luminance, ringD, spatterD, spline, stippleD, strokeD, wobble } from './ink';

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
  /** Stippled shading on the shadow side. On by default for medium and light filled shapes; pass false to turn it off. */
  stipple?: boolean;
}

/** A coloured, hatched, brush-inked shape. */
export function Shape({ pts, fill, fillOpacity, smooth = false, open = false, w = 3, seed, hatch = false, hatchColor, hatchOpacity, wob = 0.9, reg = [1.5, 1.1], ink = INK, stipple = true }: ShapeProps) {
  const sd = seed ?? hash(pts);
  const closed = !open;
  const stippleOn = stipple && !!fill && closed && w > 0 && (fillOpacity === undefined || fillOpacity >= 0.8) && luminance(fill) >= 0.2;
  const poly = wobble(smooth ? spline(pts, closed, 6) : densify(pts, 11, closed), wob, sd, closed);
  return (
    <g>
      {fill ? <path d={pathOf(poly, closed)} fill={fill} fillOpacity={fillOpacity} transform={`translate(${reg[0]} ${reg[1]})`} /> : null}
      {hatch ? <path d={hatchD(poly, { ...hatch, seed: sd })} fill={hatchColor ?? ink} fillOpacity={hatchOpacity} /> : null}
      {stippleOn ? <path d={stippleD(poly, sd)} fill={ink} fillOpacity={0.5} /> : null}
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

/** A dry-brush mark: broken bristle lines, for sky streaks, sheen on water, light across a floor. */
export function Dry({ pts, w = 12, seed, color = INK, opacity, bristles = 5, ragged = 0.6, smooth = true }: { pts: readonly Pt[]; w?: number; seed?: number; color?: string; opacity?: number; bristles?: number; ragged?: number; smooth?: boolean }) {
  const sd = seed ?? hash(pts);
  const base = smooth ? spline(pts, false, 7) : densify(pts, 8, false);
  return <path d={dryD(wobble(base, 0.8, sd), w, sd, bristles, ragged)} fill={color} fillOpacity={opacity} />;
}

/** Flecks of ink thrown off a loaded brush. */
export function Spatter({ x, y, r = 30, n = 14, seed = 5, color = INK, opacity }: { x: number; y: number; r?: number; n?: number; seed?: number; color?: string; opacity?: number }) {
  return <path d={spatterD(x, y, r, n, seed)} fill={color} fillOpacity={opacity} />;
}

/** Screentone dots laid over a region, the manga way of shading without a gradient. */
export function Tone({ pts, opacity = 0.35, smooth = false, coarse = false }: { pts: readonly Pt[]; opacity?: number; smooth?: boolean; coarse?: boolean }) {
  const poly = smooth ? spline(pts, true, 5) : pts;
  return <path d={pathOf(poly, true)} fill={`url(#${coarse ? 'tone' : 'tone-fine'})`} opacity={opacity} />;
}

/** Place a drawing at a point, optionally scaled, turned or mirrored. Local coordinates start at that point. */
export function At({ x = 0, y = 0, s = 1, r = 0, flip = false, children }: { x?: number; y?: number; s?: number; r?: number; flip?: boolean; children: ReactNode }) {
  return <g transform={`translate(${x} ${y})${r ? ` rotate(${r})` : ''} scale(${flip ? -s : s} ${s})`}>{children}</g>;
}

/** The last two layers of a finished scene: the halftone screen, then the edge darkening. Paint and grain go on after these. */
export function Finish({ w, h }: { w: number; h: number }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect width={w} height={h} fill="url(#screen)" opacity="0.13" style={{ mixBlendMode: 'multiply' }} />
      <rect width={w} height={h} fill="url(#vignette)" />
    </g>
  );
}

/**
 * The frame every illustration shares: a slightly roughened drawing, then the halftone screen, the edge darkening and two paper layers.
 * Give it the class "plate" and it is cut like a print: the picture is clipped to a ragged edge, drawn round with an inked
 * line, and left transparent beyond it, so the page shows a hand-cut shape instead of a box.
 */
export function Scene({ w, h, className, label, fit = 'xMidYMid slice', children }: { w: number; h: number; className?: string; label?: string; fit?: string; children: ReactNode }) {
  const id = useId().replace(/:/g, '');
  const deckle = !!className && className.split(' ').includes('plate');
  const edge = useMemo(() => (deckle ? deckleEdge(w, h, 4, 3) : null), [deckle, w, h]);
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={fit} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      {edge ? (
        <defs>
          <clipPath id={`dk${id}`}>
            <path d={pathOf(edge, true)} />
          </clipPath>
        </defs>
      ) : null}
      <g clipPath={edge ? `url(#dk${id})` : undefined}>
        <g filter="url(#rough)">{children}</g>
        <Finish w={w} h={h} />
        <rect width={w} height={h} filter="url(#paint)" opacity="0.36" style={{ mixBlendMode: 'multiply' }} />
        <rect width={w} height={h} filter="url(#grain)" opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
      </g>
      {edge ? <Shape pts={edge} w={3.6} seed={w + h} wob={0.4} /> : null}
    </svg>
  );
}
