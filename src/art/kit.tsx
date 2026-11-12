/**
 * The prop kit: the furniture of the harbor. Rooms, shelves, tools, paper, small creatures and townsfolk.
 * Every piece is drawn with the brush engine in local coordinates and placed with x, y and s (scale),
 * where (x, y) is the middle of the piece's base unless a comment says otherwise.
 */
import type { ReactNode } from 'react';
import { C, INK } from './palette';
import { At, Flecks, Hatch, Shape, Stroke, Wash } from './Draw';
import { arc, box, ell, gear, lerp, star, type Pt } from './ink';

interface Place {
  x?: number;
  y?: number;
  s?: number;
  seed?: number;
}

const FONT = "'Barlow Condensed', 'Arial Narrow', sans-serif";

/** Lettering inside a drawing: condensed capitals, like paint on a signboard. Purely pictorial; scenes carry their own description. */
export function Lettering({ x, y, size = 16, fill = INK, children, anchor = 'middle', r = 0, spacing = 0.08 }: { x: number; y: number; size?: number; fill?: string; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; r?: number; spacing?: number }) {
  return (
    <text x={x} y={y} fontFamily={FONT} fontWeight={700} fontSize={size} fill={fill} textAnchor={anchor} letterSpacing={`${spacing}em`} transform={r ? `rotate(${r} ${x} ${y})` : undefined}>
      {children}
    </text>
  );
}

// ---------------------------------------------------------------- rooms

/** A wall of upright boards: uneven seams, a few knots, nail heads, and a band of shadow under the ceiling. */
export function WallPlanks({ x, y, w, h, fill = '#a9a7a2', every = 46, seed = 1, shade = true }: { x: number; y: number; w: number; h: number; fill?: string; every?: number; seed?: number; shade?: boolean }) {
  const n = Math.ceil(w / every);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      {Array.from({ length: n + 1 }, (_, i) => {
        const px = x + i * every + ((i * 37 + seed * 11) % 9) - 4;
        return <Stroke key={i} pts={[[px, y], [px + ((i * 13) % 5) - 2, y + h / 2], [px - 1, y + h]]} w={1.8 + (i % 3) * 0.5} opacity={0.5} seed={seed * 100 + i} wob={1} />;
      })}
      {Array.from({ length: Math.max(2, Math.round(n / 3)) }, (_, i) => {
        const kx = x + 14 + ((i * 197 + seed * 61) % Math.max(1, w - 28));
        const ky = y + 24 + ((i * 89 + seed * 17) % Math.max(1, h - 48));
        return (
          <g key={`k${i}`}>
            <Shape pts={ell(kx, ky, 4.5, 6.5, 8, 0.12, seed + i)} smooth w={1.3} />
            <Stroke pts={[[kx - 9, ky - 4], [kx, ky - 10], [kx + 9, ky - 4]]} w={1.1} opacity={0.5} />
            <Stroke pts={[[kx - 9, ky + 4], [kx, ky + 10], [kx + 9, ky + 4]]} w={1.1} opacity={0.5} />
          </g>
        );
      })}
      <Flecks marks={Array.from({ length: n }, (_, i) => [x + i * every + every / 2, y + 7, 2.4, 90] as [number, number, number, number])} w={2.4} color={C.woodDeep} opacity={0.7} />
      {shade ? <Hatch pts={box(x, y, w, Math.min(26, h * 0.16))} angle={-70} gap={5} w={1.2} opacity={0.35} /> : null}
    </g>
  );
}

/** A plastered wall: flat colour, damp stains, a crack or two, and scrubbed patches of hatching. */
export function Plaster({ x, y, w, h, fill = C.bone, seed = 1 }: { x: number; y: number; w: number; h: number; fill?: string; seed?: number }) {
  const sx = (k: number) => x + ((k * 173 + seed * 59) % Math.max(1, w));
  const sy = (k: number) => y + ((k * 97 + seed * 31) % Math.max(1, h));
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      <Wash pts={ell(sx(1), sy(1), w * 0.16, h * 0.2, 10, 0.2, seed)} fill={C.paperLo} opacity={0.45} />
      <Wash pts={ell(sx(2), sy(3), w * 0.12, h * 0.14, 10, 0.2, seed + 1)} fill={C.paperLo} opacity={0.35} />
      <Stroke pts={[[sx(3), y], [sx(3) + 8, y + h * 0.2], [sx(3) - 4, y + h * 0.34], [sx(3) + 10, y + h * 0.5]]} w={1.3} opacity={0.55} smooth={false} seed={seed + 2} />
      <Hatch pts={box(x, y, w * 0.2, h * 0.3)} angle={-55} gap={6} w={1.1} opacity={0.3} seed={seed + 3} />
      <Hatch pts={box(x + w * 0.74, y + h * 0.6, w * 0.26, h * 0.4)} angle={-55} gap={6} w={1.1} opacity={0.3} seed={seed + 4} />
    </g>
  );
}

/** A timber: dark outline, wood face, a line of grain. */
export function Beam({ pts, w = 12, fill = C.woodDeep, seed = 1 }: { pts: Pt[]; w?: number; fill?: string; seed?: number }) {
  return (
    <g>
      <Stroke pts={pts} w={w + 4} color={INK} seed={seed} taper={0.04} wob={0.8} />
      <Stroke pts={pts} w={w} color={fill} seed={seed + 1} taper={0.04} wob={0.8} />
      <Stroke pts={pts} w={1.2} color={C.woodLight} seed={seed + 2} taper={0.2} wob={1.4} opacity={0.7} />
    </g>
  );
}

/** A wall shelf: a plank on two brackets, with the shadow it throws. (x, y) is the left end of the top face. */
export function Shelf({ x, y, w, seed = 1 }: { x: number; y: number; w: number; seed?: number }) {
  return (
    <g>
      <Hatch pts={box(x + 6, y + 9, w - 12, 12)} angle={-60} gap={4.5} w={1.1} opacity={0.4} seed={seed} />
      <Shape pts={[[x + 16, y + 8], [x + 30, y + 8], [x + 18, y + 24]]} fill={C.woodDeep} w={2} seed={seed + 1} />
      <Shape pts={[[x + w - 30, y + 8], [x + w - 16, y + 8], [x + w - 18, y + 24]]} fill={C.woodDeep} w={2} seed={seed + 2} />
      <Shape pts={box(x, y, w, 9)} fill={C.woodLight} w={2.6} seed={seed + 3} />
      <Stroke pts={[[x + 8, y + 4.5], [x + w / 2, y + 5.5], [x + w - 8, y + 4]]} w={1.1} opacity={0.5} />
    </g>
  );
}

/** A window with a view. Children are drawn inside the opening, before the glazing bars. Local origin is the top-left of the opening. */
export function Window({ x, y, w, h, sky = C.sky1, seed = 1, children, arch = false }: { x: number; y: number; w: number; h: number; sky?: string; seed?: number; children?: ReactNode; arch?: boolean }) {
  const open: Pt[] = arch ? [[0, h], [0, h * 0.34], [w * 0.12, h * 0.12], [w * 0.5, 0], [w * 0.88, h * 0.12], [w, h * 0.34], [w, h]] : box(0, 0, w, h);
  return (
    <At x={x} y={y}>
      <Shape pts={open} fill={sky} w={0} reg={[0, 0]} wob={0.3} />
      {children}
      <Hatch pts={box(0, 0, w, h * 0.22)} angle={-65} gap={5} w={1.1} opacity={0.3} seed={seed} />
      <Stroke pts={[[w / 2, arch ? 2 : 0], [w / 2 + 1, h]]} w={3.6} seed={seed + 1} />
      <Stroke pts={[[0, h * 0.5], [w, h * 0.5 + 1]]} w={3.2} seed={seed + 2} />
      <Shape pts={open} w={5} seed={seed + 3} ink={C.woodDeep} />
      <Shape pts={open} w={2} seed={seed + 4} />
      <Shape pts={box(-8, h, w + 16, 9)} fill={C.woodLight} w={2.6} seed={seed + 5} />
    </At>
  );
}

/** A plain work table. */
export function Table({ x = 0, y = 0, w = 200, h = 70, seed = 1, fill = C.woodLight }: Place & { w?: number; h?: number; fill?: string }) {
  return (
    <At x={x} y={y}>
      <Wash pts={[[-w / 2 + 6, 0], [w / 2 - 6, 0], [w / 2 - 20, 9], [-w / 2 + 20, 9]]} fill={INK} opacity={0.22} />
      <Shape pts={box(-w / 2 + 12, -h + 20, 11, h - 20)} fill={C.wood} w={2.6} seed={seed} />
      <Shape pts={box(w / 2 - 23, -h + 20, 11, h - 20)} fill={C.wood} w={2.6} seed={seed + 1} />
      <Stroke pts={[[-w / 2 + 18, -h * 0.36], [0, -h * 0.34], [w / 2 - 18, -h * 0.36]]} w={5} color={C.woodDeep} seed={seed + 2} />
      <Shape pts={box(-w / 2 + 8, -h + 10, w - 16, 12)} fill={C.wood} w={2.4} seed={seed + 3} />
      <Hatch pts={box(-w / 2 + 10, -h + 11, w - 20, 10)} angle={-65} gap={5} w={1.1} opacity={0.45} seed={seed + 4} />
      <Shape pts={box(-w / 2, -h, w, 11)} fill={fill} w={3} seed={seed + 5} />
      <Stroke pts={[[-w / 2 + 10, -h + 5], [0, -h + 6.5], [w / 2 - 10, -h + 5]]} w={1.1} opacity={0.5} />
    </At>
  );
}

export function Stool({ x = 0, y = 0, s = 1, seed = 1 }: Place) {
  return (
    <At x={x} y={y} s={s}>
      <Stroke pts={[[-13, -24], [-18, 0]]} w={5} color={C.woodDeep} seed={seed} />
      <Stroke pts={[[13, -24], [18, 0]]} w={5} color={C.woodDeep} seed={seed + 1} />
      <Stroke pts={[[-15, -10], [15, -10]]} w={3} color={C.woodDeep} seed={seed + 2} />
      <Shape pts={box(-20, -30, 40, 8)} fill={C.woodLight} w={2.6} seed={seed + 3} />
    </At>
  );
}

export function Ladder({ x1, y1, x2, y2, width = 26, rungs = 7, seed = 1 }: { x1: number; y1: number; x2: number; y2: number; width?: number; rungs?: number; seed?: number }) {
  const a: Pt = [x1, y1];
  const b: Pt = [x2, y2];
  const a2: Pt = [x1 + width, y1];
  const b2: Pt = [x2 + width, y2];
  return (
    <g>
      {Array.from({ length: rungs }, (_, i) => {
        const t = (i + 0.7) / (rungs + 0.4);
        return <Stroke key={i} pts={[lerp(a, b, t), lerp(a2, b2, t)]} w={3.4} color={C.woodDeep} seed={seed + i} smooth={false} />;
      })}
      <Beam pts={[a, b]} w={5} fill={C.woodLight} seed={seed + 20} />
      <Beam pts={[a2, b2]} w={5} fill={C.woodLight} seed={seed + 21} />
    </g>
  );
}

// ---------------------------------------------------------------- paper, books and ink

/** A hanging scroll with rollers, a few lines of writing and a seal. (x, y) is the middle of the top roller. */
export function HangingScroll({ x = 0, y = 0, w = 70, h = 110, seed = 1, fill = C.paperHi, lines = 5, mark = C.seal, children }: Place & { w?: number; h?: number; fill?: string; lines?: number; mark?: string | false; children?: ReactNode }) {
  return (
    <At x={x} y={y}>
      <Stroke pts={[[-w * 0.3, 0], [0, -16], [w * 0.3, 0]]} w={1.8} seed={seed} />
      <Shape pts={[[-w / 2, 0], [w / 2, 1], [w / 2 - 2, h], [-w / 2 + 2, h - 1]]} fill={fill} w={2.6} seed={seed + 1} />
      <Hatch pts={[[w * 0.22, 4], [w / 2 - 3, 4], [w / 2 - 4, h - 4], [w * 0.28, h - 4]]} angle={-65} gap={5} w={1} opacity={0.28} seed={seed + 2} />
      {children ?? <Flecks marks={Array.from({ length: lines }, (_, i) => [-w * 0.34, 16 + (i * (h - 46)) / Math.max(1, lines - 1), w * (0.42 + ((i * 7 + seed) % 4) * 0.07), 1] as [number, number, number, number])} w={2} opacity={0.75} seed={seed + 3} />}
      {mark ? <Shape pts={ell(w * 0.24, h - 16, 6, 6, 7, 0.14, seed + 4)} smooth fill={mark} w={1.6} /> : null}
      <Stroke pts={[[-w / 2 - 6, 0], [w / 2 + 6, 1]]} w={7} color={INK} seed={seed + 5} taper={0.05} />
      <Stroke pts={[[-w / 2 - 5, 0], [w / 2 + 5, 1]]} w={3.4} color={C.woodLight} seed={seed + 6} taper={0.05} />
      <Stroke pts={[[-w / 2 - 5, h], [w / 2 + 5, h - 1]]} w={7} color={INK} seed={seed + 7} taper={0.05} />
      <Stroke pts={[[-w / 2 - 4, h], [w / 2 + 4, h - 1]]} w={3.4} color={C.woodLight} seed={seed + 8} taper={0.05} />
    </At>
  );
}

/** A rolled scroll lying on its side, tied with a ribbon. */
export function RolledScroll({ x = 0, y = 0, s = 1, seed = 1, len = 56, band = C.seal, r = 0 }: Place & { len?: number; band?: string; r?: number }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <Shape pts={box(-len / 2, -16, len, 16)} fill={C.paperHi} w={2.4} seed={seed} />
      <Hatch pts={box(-len / 2 + 2, -7, len - 4, 6)} angle={0} gap={3} w={0.9} opacity={0.35} seed={seed + 1} />
      <Shape pts={ell(len / 2, -8, 4.5, 8, 9, 0.04, seed + 2)} smooth fill={C.bone} w={2.2} />
      <Stroke pts={arc(len / 2, -8, 2, 4.4, -60, 250, 8)} w={1.2} seed={seed + 3} />
      <Shape pts={box(-5, -17, 10, 18)} fill={band} w={1.8} seed={seed + 4} />
    </At>
  );
}

/** The end of a scroll seen in its pigeonhole, with a paper tag in the colour of its path. */
export function ScrollEnd({ x = 0, y = 0, r = 12, seed = 1, tag = C.seal }: Place & { r?: number; tag?: string }) {
  return (
    <At x={x} y={y}>
      <Shape pts={ell(0, 0, r, r, 12, 0.05, seed)} smooth fill={C.paperHi} w={2.4} />
      <Stroke pts={arc(0, 0, r * 0.62, r * 0.62, -40, 290, 12)} w={1.2} seed={seed + 1} opacity={0.75} />
      <Stroke pts={arc(0.6, 0.4, r * 0.3, r * 0.3, 20, 330, 9)} w={1.1} seed={seed + 2} opacity={0.75} />
      <Stroke pts={[[r * 0.5, r * 0.6], [r * 0.7, r + 7]]} w={1.4} seed={seed + 3} />
      <Shape pts={[[r * 0.3, r + 5], [r * 1.25, r + 4], [r * 1.3, r + 17], [r * 0.35, r + 18]]} fill={tag} w={1.6} seed={seed + 4} />
    </At>
  );
}

const SPINES = [C.clothRed, C.indigo, C.clothTeal, C.clothOchre, C.woodDeep, C.bone, C.roofRed, C.tealDeep];

/** A row of books standing on a shelf, each a different height, width and lean. (x, y) is the left end of the base. */
export function Books({ x, y, n = 6, seed = 1, h = 44 }: { x: number; y: number; n?: number; seed?: number; h?: number }) {
  const out: ReactNode[] = [];
  let cx = x;
  for (let i = 0; i < n; i++) {
    const w = 9 + ((i * 7 + seed * 3) % 9);
    const bh = h * (0.72 + ((i * 11 + seed * 5) % 28) / 100);
    const lean = (i * 5 + seed) % 7 === 0 ? 5 : 0;
    const col = SPINES[(i * 3 + seed) % SPINES.length]!;
    out.push(
      <g key={i}>
        <Shape pts={[[cx + lean, y - bh], [cx + w + lean, y - bh + 1], [cx + w, y], [cx, y]]} fill={col} w={2} seed={seed * 31 + i} />
        <Stroke pts={[[cx + 1 + lean * 0.8, y - bh * 0.78], [cx + w - 1 + lean * 0.8, y - bh * 0.78]]} w={1.6} color={col === C.bone ? C.seal : C.lantern} smooth={false} />
        <Stroke pts={[[cx + 1 + lean * 0.3, y - bh * 0.22], [cx + w - 1 + lean * 0.3, y - bh * 0.22]]} w={1.3} color={col === C.bone ? C.seal : C.lantern} smooth={false} opacity={0.8} />
      </g>,
    );
    cx += w + 1.5 + lean * 0.4;
  }
  return <g>{out}</g>;
}

/** A book lying open, pages lifted a little at the fold. */
export function OpenBook({ x = 0, y = 0, s = 1, seed = 1, cover = C.clothRed }: Place & { cover?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={[[-44, -8], [0, -2], [44, -8], [46, 2], [0, 8], [-46, 2]]} fill={cover} w={2.6} seed={seed} />
      <Shape pts={[[-41, -12], [-20, -17], [0, -9], [0, 3], [-41, -2]]} smooth fill={C.paperHi} w={2.2} seed={seed + 1} />
      <Shape pts={[[41, -12], [20, -17], [0, -9], [0, 3], [41, -2]]} smooth fill={C.paperHi} w={2.2} seed={seed + 2} />
      <Flecks marks={[[-36, -10, 26, -8], [-36, -6, 22, -8], [-36, -2, 26, -6], [8, -12, 26, 6], [8, -8, 20, 6], [8, -4, 26, 6]]} w={1.3} opacity={0.7} seed={seed + 3} />
      <Stroke pts={[[2, -8], [8, 6], [5, 16]]} w={2.6} color={C.seal} seed={seed + 4} />
    </At>
  );
}

/** A pot of ink or paint, with its colour pooled at the rim and a drip down the side. */
export function Pot({ x = 0, y = 0, s = 1, seed = 1, w = 30, h = 32, ink = C.indigo, body = C.bone, label = true }: Place & { w?: number; h?: number; ink?: string; body?: string; label?: boolean }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={[[-w / 2 + 2, -h], [-w / 2 - 2, -h * 0.5], [-w / 2 + 3, 0], [w / 2 - 3, 0], [w / 2 + 2, -h * 0.5], [w / 2 - 2, -h]]} smooth fill={body} w={2.6} seed={seed} />
      <Hatch pts={[[w * 0.12, -h + 4], [w / 2, -h * 0.5], [w / 2 - 4, -2], [w * 0.16, -2]]} angle={-65} gap={4.5} w={1.1} opacity={0.5} seed={seed + 1} smooth />
      {label ? <Shape pts={box(-w * 0.3, -h * 0.62, w * 0.46, h * 0.3)} fill={C.paperHi} w={1.5} seed={seed + 2} /> : null}
      {label ? <Flecks marks={[[-w * 0.24, -h * 0.5, w * 0.3, 0], [-w * 0.24, -h * 0.4, w * 0.2, 0]]} w={1.1} opacity={0.7} /> : null}
      <Shape pts={ell(0, -h, w / 2 - 1, 4.6, 10, 0.05, seed + 3)} smooth fill={ink} w={2.2} />
      <Stroke pts={[[w * 0.3, -h + 1], [w * 0.36, -h * 0.66], [w * 0.33, -h * 0.5]]} w={3} color={ink} seed={seed + 4} taper={0.3} />
    </At>
  );
}

/** A brush. The local x axis runs along the handle towards the bristles; `r` turns it. */
export function Brush({ x = 0, y = 0, s = 1, seed = 1, len = 64, r = -90, tip = INK }: Place & { len?: number; r?: number; tip?: string }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <Stroke pts={[[0, 0], [len * 0.72, 0]]} w={6} color={INK} seed={seed} taper={0.08} smooth={false} />
      <Stroke pts={[[1, 0], [len * 0.72, 0]]} w={3} color={C.woodLight} seed={seed + 1} taper={0.08} smooth={false} />
      <Shape pts={box(len * 0.7, -3.6, 8, 7.2)} fill={C.lantern} w={1.6} seed={seed + 2} />
      <Shape pts={[[len * 0.7 + 8, -4.4], [len * 0.7 + 20, -2.4], [len, 0], [len * 0.7 + 20, 2.4], [len * 0.7 + 8, 4.4]]} smooth fill={tip} w={0} reg={[0, 0]} />
    </At>
  );
}

/** A quill pen. The local x axis runs from the nib up the shaft. */
export function Quill({ x = 0, y = 0, s = 1, seed = 1, r = -60, fill = C.bone }: Place & { r?: number; fill?: string }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <Shape pts={[[16, -1], [28, -10], [48, -13], [66, -8], [72, -2], [58, 4], [36, 6], [20, 3]]} smooth fill={fill} w={2.2} seed={seed} />
      <Flecks marks={[[30, -8, 8, 60], [40, -10, 9, 62], [50, -10, 9, 64], [60, -7, 8, 66], [34, 3, 7, -50], [46, 3, 7, -52]]} w={1.1} opacity={0.6} seed={seed + 1} />
      <Stroke pts={[[0, 0], [30, -2], [70, -4]]} w={2.2} seed={seed + 2} />
      <Shape pts={[[-1, -1.6], [8, -2.2], [8, 1.8], [-1, 1.2]]} fill={INK} w={0} reg={[0, 0]} />
    </At>
  );
}

export function InkPot({ x = 0, y = 0, s = 1, seed = 1 }: Place) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={[[-13, -17], [-18, -7], [-14, 0], [14, 0], [18, -7], [13, -17]]} smooth fill={C.ink2} w={2.6} seed={seed} />
      <Stroke pts={[[-12, -11], [-13, -5]]} w={2} color={C.bone} opacity={0.7} />
      <Shape pts={box(-8, -23, 16, 7)} fill={C.ink3} w={2} seed={seed + 1} />
      <Shape pts={ell(0, -23, 8, 2.8, 8, 0.05, seed + 2)} smooth fill={INK} w={1.6} />
    </At>
  );
}

/** A sheet of chart paper with a coast, a dotted route and an X. (x, y) is its middle. */
export function MapSheet({ x = 0, y = 0, s = 1, seed = 1, w = 120, h = 84, r = 0 }: Place & { w?: number; h?: number; r?: number }) {
  return (
    <At x={x} y={y} s={s} r={r}>
      <Shape pts={[[-w / 2, -h / 2 + 2], [w / 2 - 2, -h / 2], [w / 2, h / 2 - 3], [-w / 2 + 3, h / 2]]} fill={C.paperHi} w={2.4} seed={seed} />
      <Shape pts={[[-w * 0.42, -h * 0.3], [-w * 0.2, -h * 0.38], [-w * 0.04, -h * 0.2], [-w * 0.14, h * 0.04], [-w * 0.36, h * 0.02]]} smooth fill={C.paperLo} w={1.6} seed={seed + 1} hatch={{ angle: -50, gap: 4.5, w: 0.9 }} hatchOpacity={0.4} />
      <Shape pts={[[w * 0.12, -h * 0.02], [w * 0.36, -h * 0.12], [w * 0.4, h * 0.18], [w * 0.2, h * 0.3]]} smooth fill={C.paperLo} w={1.6} seed={seed + 2} hatch={{ angle: -50, gap: 4.5, w: 0.9 }} hatchOpacity={0.4} />
      <Flecks marks={Array.from({ length: 7 }, (_, i) => [-w * 0.1 + i * w * 0.045, -h * 0.02 + Math.sin(i * 0.9) * 5 + i * 1.6, 4, 20] as [number, number, number, number])} w={1.6} color={C.seal} seed={seed + 3} />
      <Flecks marks={[[w * 0.22, h * 0.1, 8, 45], [w * 0.22 + 5.6, h * 0.1, 8, 135]]} w={2.2} color={C.seal} seed={seed + 4} />
      <Stroke pts={[[0, -h / 2 + 2], [1, h / 2 - 2]]} w={1} opacity={0.4} smooth={false} />
      <Shape pts={star(-w * 0.3, h * 0.28, 8, 4, 0.35)} fill={INK} w={0} reg={[0, 0]} wob={0.2} />
    </At>
  );
}

/** A wax seal: an uneven red disc with a pressed ring and a wave across it. */
export function WaxSeal({ x = 0, y = 0, s = 1, seed = 1, r = 16, fill = C.seal }: Place & { r?: number; fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={ell(0, 0, r, r, 13, 0.13, seed)} smooth fill={fill} w={2.6} hatch={{ angle: -40, gap: 5, w: 1, density: 0.7 }} hatchColor={C.roofRed} hatchOpacity={0.6} />
      <Stroke pts={[...arc(0, 0, r * 0.66, r * 0.66, 0, 360, 16)]} w={1.5} color={C.bone} seed={seed + 1} opacity={0.9} />
      <Stroke pts={[[-r * 0.4, 1], [-r * 0.14, -r * 0.2], [r * 0.1, 1], [r * 0.4, -r * 0.16]]} w={2.2} color={C.bone} seed={seed + 2} />
    </At>
  );
}

/** A stamp: turned wooden handle, red block. */
export function SealStamp({ x = 0, y = 0, s = 1, seed = 1 }: Place) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={box(-15, -12, 30, 12)} fill={C.seal} w={2.6} seed={seed} hatch={{ angle: -60, gap: 4.5, w: 1 }} hatchOpacity={0.5} />
      <Shape pts={[[-8, -12], [-11, -26], [-6, -40], [6, -40], [11, -26], [8, -12]]} smooth fill={C.woodLight} w={2.6} seed={seed + 1} />
      <Shape pts={ell(0, -42, 9, 6, 9, 0.05, seed + 2)} smooth fill={C.wood} w={2.4} />
      <Stroke pts={[[-9, -24], [0, -22], [9, -24]]} w={1.3} opacity={0.6} />
    </At>
  );
}

// ---------------------------------------------------------------- signs and cloth

export interface SignBoard {
  /** Height above the foot of the post. */
  at: number;
  dir: 1 | -1;
  w?: number;
  fill?: string;
  text?: string;
  ink?: string;
}

/** A signpost with pointed boards. */
export function Signpost({ x = 0, y = 0, s = 1, seed = 1, h = 150, boards }: Place & { h?: number; boards: SignBoard[] }) {
  return (
    <At x={x} y={y} s={s}>
      <Wash pts={ell(0, 1, 22, 5, 9, 0.05, seed)} fill={INK} opacity={0.22} />
      <Beam pts={[[0, 0], [1, -h * 0.5], [-1, -h]]} w={8} fill={C.wood} seed={seed + 1} />
      <Shape pts={[[-7, -h + 2], [0, -h - 9], [7, -h + 2]]} fill={C.woodDeep} w={2} seed={seed + 2} />
      {boards.map((b, i) => {
        const w = b.w ?? 86;
        const d = b.dir;
        const yy = -b.at;
        const tilt = ((i * 7 + seed) % 5) - 2;
        return (
          <g key={i} transform={`rotate(${tilt} 0 ${yy})`}>
            <Shape pts={[[-10 * d, yy - 12], [w * d, yy - 12], [(w + 15) * d, yy], [w * d, yy + 12], [-10 * d, yy + 12]]} fill={b.fill ?? C.bone} w={2.8} seed={seed + 10 + i} />
            <Hatch pts={[[(w - 22) * d, yy + 2], [w * d, yy + 2], [w * d, yy + 11], [(w - 22) * d, yy + 11]]} angle={-60} gap={4} w={1} opacity={0.35} seed={seed + 20 + i} />
            <Flecks marks={[[-3 * d, yy - 6, 2.4, 90], [-3 * d, yy + 6, 2.4, 90]]} w={2.4} color={C.woodDeep} />
            {b.text ? (
              <Lettering x={(w / 2 - 2) * d} y={yy + 5} size={14} fill={b.ink ?? INK}>
                {b.text}
              </Lettering>
            ) : null}
          </g>
        );
      })}
    </At>
  );
}

/** A string of small flags hung along a line. */
export function Pennants({ pts, n = 9, seed = 1, colors = [C.clothRed, C.clothOchre, C.clothTeal, C.indigo, C.bone], size = 15 }: { pts: Pt[]; n?: number; seed?: number; colors?: string[]; size?: number }) {
  const at = (t: number): Pt => {
    const f = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    return lerp(pts[i]!, pts[i + 1]!, f - i);
  };
  return (
    <g>
      <Stroke pts={pts} w={2} seed={seed} />
      {Array.from({ length: n }, (_, i) => {
        const p = at((i + 0.5) / n);
        const sw = ((i * 5 + seed) % 5) - 2;
        return <Shape key={i} pts={[[p[0] - size * 0.46, p[1] + 1], [p[0] + size * 0.46, p[1] + 1], [p[0] + sw, p[1] + size]]} fill={colors[(i + seed) % colors.length]!} w={1.7} seed={seed * 13 + i} />;
      })}
    </g>
  );
}

/** A tall cloth banner on a crossbar, with a round device. Children are drawn in the device, in a 40 x 40 box centred on (0, 0). (x, y) is the middle of the crossbar. */
export function Banner({ x = 0, y = 0, s = 1, seed = 1, w = 56, h = 120, fill = C.indigo, children }: Place & { w?: number; h?: number; fill?: string; children?: ReactNode }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={[[-w / 2, 0], [w / 2, 1], [w / 2 - 1, h], [0, h - 16], [-w / 2 + 1, h - 1]]} fill={fill} w={2.8} seed={seed} />
      <Hatch pts={[[w * 0.14, 4], [w / 2 - 2, 4], [w / 2 - 3, h - 6], [w * 0.14, h - 20]]} angle={-62} gap={5} w={1.1} opacity={0.5} seed={seed + 1} />
      <Stroke pts={[[-w / 2 + 5, 12], [0, 15], [w / 2 - 5, 12]]} w={2.6} color={C.lantern} seed={seed + 2} />
      <Shape pts={ell(0, h * 0.44, w * 0.32, w * 0.32, 12, 0.04, seed + 3)} smooth fill={C.bone} w={2.2} />
      <g transform={`translate(0 ${h * 0.44}) scale(${(w * 0.32) / 20})`}>{children}</g>
      <Stroke pts={[[-w / 2 - 8, 0], [w / 2 + 8, 1]]} w={6.4} color={INK} seed={seed + 4} taper={0.05} />
      <Stroke pts={[[-w / 2 - 7, 0], [w / 2 + 7, 1]]} w={3} color={C.woodLight} seed={seed + 5} taper={0.05} />
    </At>
  );
}

/** A bell on its yoke. (x, y) is where it hangs from. */
export function Bell({ x = 0, y = 0, s = 1, seed = 1, fill = C.lantern }: Place & { fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Stroke pts={[[0, 0], [0, 10]]} w={3} seed={seed} />
      <Shape pts={[[-18, 46], [-15, 28], [-9, 15], [0, 10], [9, 15], [15, 28], [18, 46]]} smooth open fill={fill} w={0} reg={[0, 0]} />
      <Shape pts={[[-18, 46], [-15, 28], [-9, 15], [0, 10], [9, 15], [15, 28], [18, 46], [0, 49]]} smooth fill={fill} w={3} seed={seed + 1} hatch={{ angle: -60, gap: 5, w: 1.1 }} hatchOpacity={0.4} />
      <Stroke pts={[[-20, 46], [0, 50], [20, 46]]} w={3.4} seed={seed + 2} />
      <Shape pts={ell(0, 54, 4.5, 4.5, 7, 0.08, seed + 3)} smooth fill={INK} w={0} reg={[0, 0]} />
    </At>
  );
}

// ---------------------------------------------------------------- instruments and tools

/** An eight-point compass rose with a red north. */
export function CompassRose({ x = 0, y = 0, s = 1, seed = 1, r = 40, ring = true }: Place & { r?: number; ring?: boolean }) {
  return (
    <At x={x} y={y} s={s}>
      {ring ? <Shape pts={ell(0, 0, r, r, 22, 0.012, seed)} smooth w={2.2} /> : null}
      {ring ? <Shape pts={ell(0, 0, r * 0.78, r * 0.78, 20, 0.012, seed + 1)} smooth w={1.2} /> : null}
      {ring ? <Flecks marks={Array.from({ length: 16 }, (_, i) => [Math.cos((i / 16) * 6.283) * r * 0.8, Math.sin((i / 16) * 6.283) * r * 0.8, r * 0.16, (i / 16) * 360] as [number, number, number, number])} w={1.3} seed={seed + 2} /> : null}
      <Shape pts={star(0, 0, r * 0.62, 4, 0.3, Math.PI / 4)} fill={C.paperLo} w={1.6} seed={seed + 3} />
      <Shape pts={star(0, 0, r * 0.94, 4, 0.2)} fill={C.bone} w={2.2} seed={seed + 4} />
      <Shape pts={[[0, -r * 0.94], [r * 0.13, -r * 0.13], [0, 0], [-r * 0.13, -r * 0.13]]} fill={C.seal} w={1.6} seed={seed + 5} />
      <Shape pts={[[0, r * 0.94], [r * 0.13, r * 0.13], [0, 0]]} fill={INK} w={0} reg={[0, 0]} wob={0.2} />
      <Shape pts={[[r * 0.94, 0], [r * 0.13, -r * 0.13], [0, 0]]} fill={INK} w={0} reg={[0, 0]} wob={0.2} />
      <Shape pts={ell(0, 0, r * 0.07, r * 0.07, 6, 0.1, seed + 6)} smooth fill={C.lantern} w={1.4} />
    </At>
  );
}

/** A brass spyglass on a three-legged stand. (x, y) is the foot of the stand; `r` tilts the glass. */
export function Telescope({ x = 0, y = 0, s = 1, seed = 1, r = -18 }: Place & { r?: number }) {
  return (
    <At x={x} y={y} s={s}>
      <Stroke pts={[[0, -62], [-26, 0]]} w={5} color={C.woodDeep} seed={seed} />
      <Stroke pts={[[0, -62], [24, 0]]} w={5} color={C.woodDeep} seed={seed + 1} />
      <Stroke pts={[[0, -62], [2, -4]]} w={4.4} color={C.wood} seed={seed + 2} />
      <g transform={`translate(0 -66) rotate(${r})`}>
        <Shape pts={box(-48, -7, 34, 14)} fill={C.strawDeep} w={2.6} seed={seed + 3} />
        <Shape pts={box(-14, -9.5, 40, 19)} fill={C.straw} w={2.8} seed={seed + 4} hatch={{ angle: -70, gap: 4.5, w: 1 }} hatchOpacity={0.4} />
        <Shape pts={box(26, -12, 36, 24)} fill={C.lantern} w={3} seed={seed + 5} />
        <Shape pts={ell(62, 0, 4, 12, 9, 0.03, seed + 6)} smooth fill={C.tealLight} w={2.2} />
        <Stroke pts={[[-14, -10], [-14, 10]]} w={3} />
        <Stroke pts={[[26, -12], [26, 12]]} w={3} />
      </g>
      <Shape pts={ell(0, -64, 6, 6, 8, 0.06, seed + 7)} smooth fill={C.ink3} w={2.2} />
    </At>
  );
}

export function GearWheel({ x = 0, y = 0, r = 30, teeth = 9, fill = C.teal, seed = 1, rot = 0 }: Place & { r?: number; teeth?: number; fill?: string; rot?: number }) {
  return (
    <g>
      <Shape pts={gear(x, y, r, teeth, 0.2, rot)} fill={fill} w={3.2} seed={seed} hatch={{ angle: -50, gap: 6, w: 1.2 }} hatchOpacity={0.4} />
      <Shape pts={ell(x, y, r * 0.3, r * 0.3, 10, 0.03, seed + 1)} smooth fill={C.bone} w={2.6} />
      <Shape pts={ell(x, y, r * 0.08, r * 0.08, 6, 0.1, seed + 2)} smooth fill={INK} w={0} reg={[0, 0]} />
    </g>
  );
}

/** An anvil on its block. */
export function Anvil({ x = 0, y = 0, s = 1, seed = 1 }: Place) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={box(-24, -22, 48, 22)} fill={C.wood} w={3} seed={seed} hatch={{ angle: -60, gap: 5, w: 1.1 }} hatchOpacity={0.45} />
      <Stroke pts={[[-22, -11], [0, -9], [22, -11]]} w={1.6} opacity={0.6} />
      <Shape pts={[[-40, -52], [34, -52], [52, -45], [34, -39], [14, -36], [18, -22], [-20, -22], [-16, -36], [-34, -39]]} fill={C.ink3} w={3.2} seed={seed + 1} hatch={{ angle: -45, gap: 5, w: 1.1 }} hatchColor={C.bone} hatchOpacity={0.3} />
      <Stroke pts={[[-34, -49], [0, -48.5], [38, -47]]} w={1.8} color={C.bone} opacity={0.65} />
    </At>
  );
}

/** Tools as they hang on a workshop wall. (x, y) is the nail each hangs from. */
export function WallTool({ x = 0, y = 0, s = 1, seed = 1, kind }: Place & { kind: 'hammer' | 'tongs' | 'saw' | 'wrench' | 'square' }) {
  let art: ReactNode = null;
  if (kind === 'hammer') {
    art = (
      <>
        <Stroke pts={[[0, 6], [1, 56]]} w={6.4} color={INK} taper={0.04} />
        <Stroke pts={[[0, 6], [1, 56]]} w={3} color={C.woodLight} taper={0.04} />
        <Shape pts={[[-16, 0], [12, -1], [18, 5], [12, 12], [-16, 12]]} fill={C.ink3} w={2.4} seed={seed} />
      </>
    );
  } else if (kind === 'tongs') {
    art = (
      <>
        <Stroke pts={[[-5, 0], [3, 30], [-6, 62]]} w={3.8} color={C.ink3} seed={seed} />
        <Stroke pts={[[5, 0], [-3, 30], [6, 62]]} w={3.8} color={C.ink3} seed={seed + 1} />
        <Shape pts={ell(0, 30, 3, 3, 6, 0.1, seed + 2)} smooth fill={C.bone} w={1.4} />
      </>
    );
  } else if (kind === 'saw') {
    art = (
      <>
        <Shape pts={[[-6, 0], [10, 2], [16, 60], [-2, 46]]} fill={C.hairGrey} w={2.2} seed={seed} />
        <Flecks marks={Array.from({ length: 8 }, (_, i) => [11 + i * 0.7, 8 + i * 6.4, 4, 30] as [number, number, number, number])} w={1.4} />
        <Shape pts={[[-12, -14], [12, -14], [12, 4], [-10, 4]]} fill={C.woodLight} w={2.4} seed={seed + 1} />
        <Shape pts={ell(0, -5, 5, 4, 7, 0.1, seed + 2)} smooth fill={C.woodDeep} w={1.4} />
      </>
    );
  } else if (kind === 'wrench') {
    art = (
      <>
        <Stroke pts={[[0, 8], [1, 52]]} w={7} color={INK} taper={0.04} />
        <Stroke pts={[[0, 8], [1, 52]]} w={3.6} color={C.hairGrey} taper={0.04} />
        <Shape pts={[[-10, -6], [-4, -6], [-4, 2], [4, 2], [4, -6], [10, -6], [11, 8], [0, 14], [-11, 8]]} fill={C.hairGrey} w={2.2} seed={seed} />
      </>
    );
  } else {
    art = (
      <>
        <Shape pts={[[-4, 0], [4, 0], [4, 44], [34, 44], [34, 52], [-4, 52]]} fill={C.straw} w={2.2} seed={seed} />
        <Flecks marks={[[4, 10, 3, 0], [4, 20, 5, 0], [4, 30, 3, 0], [14, 44, 3, -90], [24, 44, 5, -90]]} w={1.2} />
      </>
    );
  }
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={ell(0, -3, 2.2, 2.2, 6, 0.1, seed + 9)} smooth fill={INK} w={0} reg={[0, 0]} />
      {art}
    </At>
  );
}

export function Anchor({ x = 0, y = 0, s = 1, seed = 1, fill = C.ink3 }: Place & { fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={ell(0, -70, 7, 7, 9, 0.05, seed)} smooth w={3.4} ink={fill} />
      <Stroke pts={[[0, -63], [0, 0]]} w={6.4} color={fill} seed={seed + 1} />
      <Stroke pts={[[-17, -50], [17, -50]]} w={5} color={fill} seed={seed + 2} />
      <Stroke pts={arc(0, -22, 28, 26, 0, 180, 12)} w={6.4} color={fill} seed={seed + 3} />
      <Shape pts={[[-34, -30], [-24, -18], [-36, -14]]} fill={fill} w={0} reg={[0, 0]} />
      <Shape pts={[[34, -30], [24, -18], [36, -14]]} fill={fill} w={0} reg={[0, 0]} />
    </At>
  );
}

/** A printer's wooden type block with one letter. */
export function TypeBlock({ x = 0, y = 0, s = 1, seed = 1, ch, fill = C.woodLight, size = 26 }: Place & { ch: string; fill?: string; size?: number }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={[[-size / 2, -size], [size / 2, -size + 1], [size / 2, 0], [-size / 2, 0]]} fill={fill} w={2.4} seed={seed} />
      <Shape pts={[[size / 2, -size + 1], [size / 2 + 7, -size - 5], [size / 2 + 7, -6], [size / 2, 0]]} fill={C.wood} w={2} seed={seed + 1} hatch={{ angle: -60, gap: 3.5, w: 0.9 }} hatchOpacity={0.5} />
      <Shape pts={[[-size / 2, -size], [-size / 2 + 7, -size - 6], [size / 2 + 7, -size - 5], [size / 2, -size + 1]]} fill={C.straw} w={2} seed={seed + 2} />
      <text x={0} y={-size * 0.2} fontFamily="'Dela Gothic One', sans-serif" fontSize={size * 0.72} fill={INK} textAnchor="middle">
        {ch}
      </text>
    </At>
  );
}

// ---------------------------------------------------------------- outdoors

/** The low red sun of the harbor, hatched, with a ring of loose rays. */
export function Sun({ x, y, r = 60, seed = 1, rays = 18 }: { x: number; y: number; r?: number; seed?: number; rays?: number }) {
  return (
    <g>
      <Flecks
        marks={Array.from({ length: rays }, (_, i) => {
          const a = (i / rays) * Math.PI * 2 + 0.09 * Math.sin(i * 2.3 + seed);
          const r0 = r * 1.22 + (i % 3) * r * 0.05;
          return [x + Math.cos(a) * r0, y + Math.sin(a) * r0, r * 0.14 + (i % 4) * r * 0.04, (a * 180) / Math.PI] as [number, number, number, number];
        })}
        w={Math.max(1.6, r * 0.05)}
        color={C.sun}
        opacity={0.75}
        seed={seed}
      />
      <Shape pts={ell(x, y, r, r, 22, 0.014, seed + 1)} smooth fill={C.sun} w={Math.max(2.4, r * 0.05)} hatch={{ angle: -35, gap: Math.max(5, r * 0.11), w: 1.4, density: 0.8 }} hatchColor={C.roofRed} hatchOpacity={0.6} />
    </g>
  );
}

/** A small lighthouse for middle distances and window views. (x, y) is the foot of the tower. */
export function MiniLighthouse({ x = 0, y = 0, s = 1, seed = 1, lit = true }: Place & { lit?: boolean }) {
  return (
    <At x={x} y={y} s={s}>
      {lit ? <Hatch pts={[[-2, -86], [-130, -112], [-130, -62]]} color={C.lantern} angle={8} gap={5} w={2} opacity={0.9} seed={seed} /> : null}
      <Shape pts={[[-15, 0], [15, 0], [9, -72], [-9, -72]]} fill={C.bone} w={2.8} seed={seed + 1} />
      <Shape pts={[[-13.6, -18], [13.6, -18], [12, -36], [-12, -36]]} fill={C.seal} w={2} seed={seed + 2} />
      <Shape pts={[[-10.6, -52], [10.6, -52], [9.4, -68], [-9.4, -68]]} fill={C.seal} w={2} seed={seed + 3} />
      <Hatch pts={[[4, -70], [9, -70], [15, -2], [8, -2]]} angle={-60} gap={4} w={1} opacity={0.45} seed={seed + 4} />
      <Shape pts={box(-14, -77, 28, 6)} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={box(-9, -94, 18, 17)} fill={lit ? C.lantern : C.paperLo} w={2.4} seed={seed + 5} />
      <Stroke pts={[[0, -94], [0, -77]]} w={1.2} opacity={0.8} />
      <Shape pts={[[-13, -94], [0, -108], [13, -94]]} fill={C.seal} w={2.4} seed={seed + 6} />
      <Stroke pts={[[0, -108], [0, -116]]} w={2.4} />
    </At>
  );
}

/** A humpbacked footbridge between two banks. */
export function Bridge({ x1, x2, y, rise = 26, seed = 1 }: { x1: number; x2: number; y: number; rise?: number; seed?: number }) {
  const n = 12;
  const deck: Pt[] = Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return [x1 + (x2 - x1) * t, y - Math.sin(t * Math.PI) * rise] as Pt;
  });
  const rail: Pt[] = deck.map((p) => [p[0], p[1] - 15]);
  return (
    <g>
      <Shape pts={[...deck, [x2, y + 7], ...deck.slice().reverse().map((p): Pt => [p[0], p[1] + 9]), [x1, y + 7]]} smooth={false} fill={C.wood} w={0} reg={[0, 0]} wob={0.3} />
      <Stroke pts={deck} w={5} seed={seed} />
      <Stroke pts={deck.map((p): Pt => [p[0], p[1] + 9])} w={3} seed={seed + 1} />
      {deck.filter((_, i) => i % 2 === 0).map((p, i) => (
        <Stroke key={i} pts={[[p[0], p[1] + 2], [p[0], p[1] - 17]]} w={3.4} color={C.woodDeep} seed={seed + 10 + i} smooth={false} />
      ))}
      <Stroke pts={rail} w={3.6} color={C.seal} seed={seed + 2} />
      <Stroke pts={[[x1 + (x2 - x1) * 0.3, y - rise * 0.6], [x1 + (x2 - x1) * 0.3, y + 16]]} w={4} color={C.woodDeep} seed={seed + 3} />
      <Stroke pts={[[x1 + (x2 - x1) * 0.7, y - rise * 0.6], [x1 + (x2 - x1) * 0.7, y + 16]]} w={4} color={C.woodDeep} seed={seed + 4} />
    </g>
  );
}

/** A paper kite with a ribboned tail and its string. (x, y) is the kite; (tx, ty) is the hand holding it. */
export function Kite({ x, y, tx, ty, s = 1, seed = 1, fill = C.clothRed }: { x: number; y: number; tx: number; ty: number; s?: number; seed?: number; fill?: string }) {
  return (
    <g>
      <Stroke pts={[[x, y + 16 * s], [(x + tx) / 2 - 20, (y + ty) / 2 + 26], [tx, ty]]} w={1.1} seed={seed} opacity={0.8} />
      <Stroke pts={[[x, y + 20 * s], [x - 10 * s, y + 36 * s], [x + 4 * s, y + 50 * s], [x - 8 * s, y + 66 * s]]} w={1.6} seed={seed + 1} />
      <Flecks marks={[[x - 9 * s, y + 34 * s, 8 * s, 20], [x + 3 * s, y + 48 * s, 8 * s, 160], [x - 7 * s, y + 62 * s, 8 * s, 20]]} w={3} color={C.lantern} seed={seed + 2} />
      <Shape pts={[[x, y - 22 * s], [x + 15 * s, y], [x, y + 20 * s], [x - 15 * s, y]]} fill={fill} w={2.2} seed={seed + 3} />
      <Stroke pts={[[x, y - 21 * s], [x, y + 19 * s]]} w={1.2} opacity={0.8} smooth={false} />
      <Stroke pts={[[x - 14 * s, y], [x + 14 * s, y]]} w={1.2} opacity={0.8} smooth={false} />
    </g>
  );
}

/** A market stall with a striped awning and a counter of fruit. */
export function Stall({ x = 0, y = 0, s = 1, seed = 1, a = C.clothRed, b = C.bone }: Place & { a?: string; b?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Stroke pts={[[-38, 0], [-38, -62]]} w={4.4} color={C.woodDeep} seed={seed} />
      <Stroke pts={[[38, 0], [38, -62]]} w={4.4} color={C.woodDeep} seed={seed + 1} />
      {Array.from({ length: 6 }, (_, i) => (
        <Shape key={i} pts={[[-46 + i * 15.4, -62], [-46 + (i + 1) * 15.4, -62], [-50 + (i + 1) * 16.6, -44], [-50 + i * 16.6, -44]]} fill={i % 2 ? b : a} w={1.8} seed={seed + 10 + i} />
      ))}
      <Stroke pts={[[-50, -44], [-25, -40], [0, -44], [25, -40], [50, -44]]} w={2.4} seed={seed + 2} />
      <Shape pts={box(-42, -26, 84, 26)} fill={C.wood} w={2.6} seed={seed + 3} hatch={{ angle: -60, gap: 5, w: 1 }} hatchOpacity={0.4} />
      {[[-28, C.clothRed], [-14, C.clothOchre], [0, C.clothRed], [14, C.moss], [28, C.clothOchre]].map(([fx, col], i) => (
        <Shape key={i} pts={ell(fx as number, -30, 6.5, 5.5, 7, 0.1, seed + 20 + i)} smooth fill={col as string} w={1.6} />
      ))}
    </At>
  );
}

/** A woven basket, heaped with fish or fruit. */
export function Basket({ x = 0, y = 0, s = 1, seed = 1, load = 'fish' }: Place & { load?: 'fish' | 'fruit' | 'none' }) {
  return (
    <At x={x} y={y} s={s}>
      {load === 'fish'
        ? [[-8, -24, 20], [4, -27, -10], [10, -22, 30]].map(([fx, fy, a], i) => (
            <g key={i} transform={`rotate(${a} ${fx} ${fy})`}>
              <Shape pts={ell(fx!, fy!, 11, 4.4, 8, 0.06, seed + i)} smooth fill={C.tealLight} w={1.8} />
              <Shape pts={[[fx! + 9, fy!], [fx! + 17, fy! - 5], [fx! + 17, fy! + 5]]} fill={C.tealLight} w={1.6} />
              <Shape pts={ell(fx! - 6, fy! - 1, 1.1, 1.1, 5, 0.1, 1)} smooth fill={INK} w={0} reg={[0, 0]} />
            </g>
          ))
        : load === 'fruit'
          ? [[-9, -23, C.clothRed], [1, -27, C.clothOchre], [10, -23, C.clothRed], [-1, -21, C.moss]].map(([fx, fy, col], i) => <Shape key={i} pts={ell(fx as number, fy as number, 6.5, 6, 7, 0.1, seed + i)} smooth fill={col as string} w={1.6} />)
          : null}
      <Shape pts={[[-20, -20], [20, -20], [15, 0], [-15, 0]]} smooth fill={C.straw} w={2.6} seed={seed + 5} hatch={{ angle: 40, gap: 4.5, w: 1, cross: true }} hatchOpacity={0.5} />
      <Stroke pts={[[-21, -20], [0, -17], [21, -20]]} w={3.4} color={C.strawDeep} seed={seed + 6} />
    </At>
  );
}

/** A rowing boat with a pair of oars shipped. */
export function Rowboat({ x = 0, y = 0, s = 1, seed = 1, fill = C.wood }: Place & { fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Wash pts={[[-40, 6], [0, 11], [42, 6], [28, 14], [-28, 14]]} fill={INK} opacity={0.25} />
      <Shape pts={[[-46, -14], [-34, 4], [32, 5], [48, -16], [34, -11], [-30, -10]]} smooth fill={fill} w={3} seed={seed} hatch={{ angle: -50, gap: 5, w: 1.1 }} hatchOpacity={0.5} />
      <Stroke pts={[[-40, -4], [0, 0], [42, -6]]} w={1.6} color={C.bone} seed={seed + 1} opacity={0.9} />
      <Stroke pts={[[-14, -11], [-12, 0]]} w={2.6} color={C.woodDeep} />
      <Stroke pts={[[12, -11], [14, 0]]} w={2.6} color={C.woodDeep} />
      <Flecks marks={[[-52, 8, 12, 4], [40, 9, 14, -4], [-20, 14, 10, 0]]} w={2} color={C.seaFoam} seed={seed + 2} />
    </At>
  );
}

/** A marker buoy with a pennant. */
export function Buoy({ x = 0, y = 0, s = 1, seed = 1, fill = C.seal }: Place & { fill?: string }) {
  return (
    <At x={x} y={y} s={s}>
      <Stroke pts={[[0, -22], [1, -62]]} w={3} seed={seed} />
      <Shape pts={[[2, -62], [24, -56], [2, -48]]} fill={C.lantern} w={2} seed={seed + 1} />
      <Shape pts={[[-15, -2], [-11, -24], [11, -24], [15, -2], [0, 4]]} smooth fill={fill} w={2.8} seed={seed + 2} />
      <Stroke pts={[[-13, -13], [0, -10], [13, -13]]} w={5} color={C.bone} seed={seed + 3} />
      <Flecks marks={[[-26, 2, 12, 4], [14, 3, 14, -4]]} w={2} color={C.seaFoam} seed={seed + 4} />
    </At>
  );
}

// ---------------------------------------------------------------- creatures and people

/**
 * Bobbin, the harbor cat. She is somewhere in most of the pictures.
 * `sit` is upright with the tail curled; `loaf` is asleep; `walk` is mid-stride.
 */
export function Cat({ x = 0, y = 0, s = 1, seed = 1, pose = 'sit', flip = false }: Place & { pose?: 'sit' | 'loaf' | 'walk'; flip?: boolean }) {
  if (pose === 'loaf') {
    return (
      <At x={x} y={y} s={s} flip={flip}>
        <Shape pts={ell(2, -10, 23, 11, 12, 0.05, seed)} smooth fill={INK} w={0} reg={[0, 0]} />
        <Shape pts={ell(-17, -15, 9.5, 8.5, 10, 0.05, seed + 1)} smooth fill={INK} w={0} reg={[0, 0]} />
        <Shape pts={[[-25, -20], [-23, -30], [-17, -23]]} fill={INK} w={0} reg={[0, 0]} />
        <Shape pts={[[-13, -23], [-8, -29], [-9, -19]]} fill={INK} w={0} reg={[0, 0]} />
        <Stroke pts={[[24, -6], [14, 1], [-6, 2]]} w={5.4} seed={seed + 2} />
        <Stroke pts={[[-22, -15], [-19, -13], [-16, -15]]} w={1.3} color={C.bone} />
        <Stroke pts={[[-14, -15], [-11, -13], [-8, -15]]} w={1.3} color={C.bone} />
        <Flecks marks={[[4, -17, 8, 10], [12, -15, 7, 20]]} w={1.1} color={C.ink3} />
      </At>
    );
  }
  if (pose === 'walk') {
    return (
      <At x={x} y={y} s={s} flip={flip}>
        <Stroke pts={[[20, -22], [34, -30], [38, -44]]} w={4.4} seed={seed} />
        <Shape pts={ell(2, -20, 22, 9, 12, 0.05, seed + 1)} smooth fill={INK} w={0} reg={[0, 0]} />
        <Stroke pts={[[-12, -16], [-16, 0]]} w={4.4} />
        <Stroke pts={[[-4, -16], [-2, 0]]} w={4.4} />
        <Stroke pts={[[12, -16], [10, 0]]} w={4.4} />
        <Stroke pts={[[18, -16], [22, 0]]} w={4.4} />
        <Shape pts={ell(-20, -27, 9, 8, 10, 0.05, seed + 2)} smooth fill={INK} w={0} reg={[0, 0]} />
        <Shape pts={[[-28, -31], [-26, -41], [-20, -34]]} fill={INK} w={0} reg={[0, 0]} />
        <Shape pts={[[-16, -34], [-11, -40], [-12, -30]]} fill={INK} w={0} reg={[0, 0]} />
        <Shape pts={ell(-23, -27, 1.8, 2.2, 6, 0.1, 1)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
        <Shape pts={ell(-16, -27, 1.8, 2.2, 6, 0.1, 2)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
      </At>
    );
  }
  return (
    <At x={x} y={y} s={s} flip={flip}>
      <Stroke pts={[[10, -3], [24, -4], [29, -16], [24, -25]]} w={5} seed={seed} />
      <Shape pts={[[-12, 0], [-14, -16], [-8, -29], [4, -31], [12, -20], [14, 0]]} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(-2, -37, 10.5, 9.5, 10, 0.05, seed + 1)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={[[-12, -42], [-10, -54], [-3, -45]]} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={[[1, -46], [8, -53], [8, -41]]} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(-6, -38, 2.4, 2.8, 6, 0.1, 1)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
      <Shape pts={ell(2, -38, 2.4, 2.8, 6, 0.1, 2)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
      <Stroke pts={[[-6, -40.4], [-6, -35.6]]} w={1} smooth={false} />
      <Stroke pts={[[2, -40.4], [2, -35.6]]} w={1} smooth={false} />
      <Flecks marks={[[-12, -34, 9, 190], [8, -34, 9, -10], [-1, -24, 6, 80], [3, -22, 5, 80]]} w={1} color={C.bone} opacity={0.8} />
    </At>
  );
}

export type FigureKind = 'walk' | 'pole' | 'crate' | 'rod' | 'lantern' | 'kite' | 'sit';

/** One of the townsfolk, small enough for a middle distance: robe, head, hat, and the thing they carry. About 44 units tall. */
export function Figure({ x = 0, y = 0, s = 1, seed = 1, kind = 'walk', cloth = C.clothTeal, skin = C.skinTan, hat = true, flip = false }: Place & { kind?: FigureKind; cloth?: string; skin?: string; hat?: boolean; flip?: boolean }) {
  const sit = kind === 'sit';
  const top = sit ? -18 : -26;
  return (
    <At x={x} y={y} s={s} flip={flip}>
      <Wash pts={ell(0, 1, 12, 3, 8, 0.05, seed)} fill={INK} opacity={0.25} />
      {kind === 'pole' ? (
        <g>
          <Stroke pts={[[-24, top + 3], [0, top + 1], [24, top + 4]]} w={2.2} seed={seed + 1} />
          {[-24, 24].map((bx, i) => (
            <g key={bx}>
              <Stroke pts={[[bx, top + 3], [bx, top + 14]]} w={1.2} />
              <Shape pts={[[bx - 6, top + 14], [bx + 6, top + 14], [bx + 4.5, top + 23], [bx - 4.5, top + 23]]} smooth fill={C.straw} w={1.6} seed={seed + 2 + i} />
            </g>
          ))}
        </g>
      ) : null}
      {kind === 'rod' ? (
        <g>
          <Stroke pts={[[5, top + 8], [18, top - 12], [34, top - 26]]} w={1.8} seed={seed + 1} />
          <Stroke pts={[[34, top - 26], [36, top], [35, 6]]} w={0.9} opacity={0.8} />
        </g>
      ) : null}
      <Shape pts={sit ? [[-8, top], [-12, 0], [12, 0], [8, top]] : [[-7, top], [-10.5, 0], [10.5, 0], [7, top]]} smooth fill={cloth} w={2.2} seed={seed + 4} />
      <Hatch pts={[[2, top + 2], [7, top + 2], [10, -1], [3, -1]]} angle={-60} gap={3.6} w={0.9} opacity={0.5} seed={seed + 5} />
      {kind === 'crate' ? <Shape pts={box(4, top + 4, 13, 11)} fill={C.wood} w={1.8} seed={seed + 6} /> : null}
      {kind === 'lantern' ? (
        <g>
          <Stroke pts={[[7, top + 8], [15, top + 12]]} w={2} />
          <Shape pts={ell(16, top + 20, 4.5, 6, 7, 0.06, seed + 6)} smooth fill={C.lantern} w={1.5} />
        </g>
      ) : null}
      {kind === 'kite' ? <Stroke pts={[[6, top + 6], [14, top - 4]]} w={2.2} /> : null}
      <Shape pts={ell(0, top - 6, 6, 6.5, 8, 0.06, seed + 7)} smooth fill={skin} w={1.9} />
      {hat ? <Shape pts={[[-13, top - 8], [0, top - 18], [13, top - 8], [0, top - 5.5]]} fill={C.straw} w={1.9} seed={seed + 8} /> : <Shape pts={[[-6.5, top - 9], [0, top - 14], [6.5, top - 9]]} smooth open w={2.6} seed={seed + 8} />}
    </At>
  );
}
