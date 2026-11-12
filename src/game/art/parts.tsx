/**
 * Shared pieces for the game's rooms: the SVG frame, stonework, floors, lamps, doors.
 * Walls and floors are drawn as a few long strokes rather than hundreds of shapes, so the wide rooms stay light.
 */
import type { ReactNode } from 'react';
import { C, INK } from '@/art/palette';
import { Dry, Finish, Flecks, Hatch, Shape, Stroke, Tone, Wash } from '@/art/Draw';
import { box, ell, hash } from '@/art/ink';
import { PaperLantern } from '@/art/props';
import { ROOM_HEIGHT } from '../data';

export const H = ROOM_HEIGHT;
/** Where the back wall meets the floor. */
export const WALL_BASE = 488;

/** A wide, roughened, halftoned drawing that stretches to the size of its room. */
export function RoomSvg({ w, children }: { w: number; children: ReactNode }) {
  return (
    <svg className="room__art" viewBox={`0 0 ${w} ${H}`} preserveAspectRatio="xMinYMin slice" aria-hidden="true" focusable="false">
      <g filter="url(#rough)">{children}</g>
      <Finish w={w} h={H} />
      <rect width={w} height={H} filter="url(#grain)" opacity="0.4" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

const jig = (seed: number, k: number) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

/** A wall of dressed stone: courses and staggered joints as single long strokes, with shade at the edges. */
export function Stonework({ x = 0, y = 0, w, h, fill = C.paperLo, course = 46, block = 110, seed = 1 }: { x?: number; y?: number; w: number; h: number; fill?: string; course?: number; block?: number; seed?: number }) {
  let d = '';
  const rows = Math.ceil(h / course);
  for (let r = 0; r <= rows; r++) {
    const yy = y + r * course;
    if (yy > y + h) break;
    d += `M${x} ${yy + jig(seed, r) * 2}L${x + w} ${yy + jig(seed, r + 40) * 2}`;
    const off = (r % 2) * (block / 2);
    for (let cx = x + off + block * (0.4 + jig(seed, r + 7) * 0.6); cx < x + w; cx += block * (0.8 + jig(seed, Math.round(cx)) * 0.5)) {
      d += `M${cx.toFixed(1)} ${yy}L${(cx + jig(seed, Math.round(cx) + 3) * 3).toFixed(1)} ${Math.min(y + h, yy + course)}`;
    }
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} />
      <Wash pts={ell(x + w * 0.2, y + h * 0.3, w * 0.12, h * 0.25, 10, 0.2, seed)} fill={C.paperHi} opacity={0.35} />
      <Wash pts={ell(x + w * 0.7, y + h * 0.6, w * 0.15, h * 0.2, 10, 0.2, seed + 1)} fill={C.ink3} opacity={0.14} />
      <path d={d} fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
      <Hatch pts={box(x, y + h * 0.7, w, h * 0.3)} angle={-60} gap={7} w={1.1} opacity={0.3} seed={seed + 2} />
      <Tone pts={box(x, y, w, h * 0.22)} opacity={0.22} />
    </g>
  );
}

/** A floor in light perspective: boards running away from the viewer, with light and shade. */
export function Floor({ w, y0 = WALL_BASE, fill = C.straw, seed = 1, seams = 130 }: { w: number; y0?: number; fill?: string; seed?: number; seams?: number }) {
  let d = '';
  const ys = [y0 + 24, y0 + 56, y0 + 94];
  ys.forEach((yy, i) => (d += `M0 ${yy + jig(seed, i) * 3}L${w} ${yy + jig(seed, i + 9) * 3}`));
  [0, 1, 2, 3].forEach((band) => {
    const top = band === 0 ? y0 : ys[band - 1]!;
    const bot = ys[band] ?? H;
    const sw = seams * (1 + band * 0.55);
    for (let cx = (band % 2) * sw * 0.5 + jig(seed, band) * sw; cx < w; cx += sw * (0.85 + jig(seed, Math.round(cx) + band) * 0.3)) d += `M${cx.toFixed(1)} ${top}L${cx.toFixed(1)} ${bot}`;
  });
  return (
    <g>
      <rect y={y0} width={w} height={H - y0} fill={fill} />
      <path d={d} fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
      <Hatch pts={box(0, y0, w, 22)} angle={-45} gap={5} w={1.2} opacity={0.5} seed={seed} />
      <Dry pts={[[w * 0.05, y0 + 40], [w * 0.4, y0 + 36], [w * 0.7, y0 + 42]]} w={14} color={C.paperHi} opacity={0.55} seed={seed + 3} bristles={5} />
      <Dry pts={[[w * 0.4, y0 + 78], [w * 0.75, y0 + 74], [w, y0 + 80]]} w={12} color={C.ink3} opacity={0.25} seed={seed + 4} bristles={4} />
      <Stroke pts={[[0, y0], [w / 2, y0 + 1.5], [w, y0]]} w={4} wob={1} seed={seed + 5} />
    </g>
  );
}

/** A hanging lamp with its pool of light. */
export function Lamp({ x, y, drop = 90, r = 150, s = 1.2, seed = 1 }: { x: number; y: number; drop?: number; r?: number; s?: number; seed?: number }) {
  return (
    <g>
      <circle cx={x} cy={y + drop} r={r} fill="url(#glow)" opacity="0.55" style={{ mixBlendMode: 'screen' }} />
      <Stroke pts={[[x, y], [x + 1, y + drop - 20 * s]]} w={2.4} smooth={false} seed={seed} />
      <PaperLantern x={x} y={y + drop} s={s} seed={seed + 1} />
    </g>
  );
}

/** A plank door in a stone frame, with strap hinges. (x, base) is the middle of the sill. */
export function Door({ x, base, w = 120, h = 200, arch = true, light = false, seed = 1 }: { x: number; base: number; w?: number; h?: number; arch?: boolean; light?: boolean; seed?: number }) {
  const l = x - w / 2;
  const t = base - h;
  const open: [number, number][] = arch ? [[l, base], [l, t + w * 0.45], [l + w * 0.14, t + w * 0.12], [x, t], [l + w * 0.86, t + w * 0.12], [l + w, t + w * 0.45], [l + w, base]] : [[l, base], [l, t], [l + w, t], [l + w, base]];
  return (
    <g>
      <Shape pts={open.map(([a, b]) => [a - 14 * Math.sign(a - x), b - (b < base ? 12 : 0)] as [number, number])} smooth={false} fill={light ? C.ink3 : C.paperHi} w={3} seed={seed} hatch={light ? { angle: -50, gap: 6, w: 1.2 } : false} hatchOpacity={0.5} />
      <Shape pts={open} fill={light ? C.lantern : C.woodDeep} w={3.2} seed={seed + 1} hatch={light ? false : { angle: 90, gap: 14, w: 1.6 }} hatchOpacity={0.5} />
      {light ? <circle cx={x} cy={base - h * 0.4} r={w * 1.1} fill="url(#glow)" opacity="0.5" style={{ mixBlendMode: 'screen' }} /> : null}
      {!light ? (
        <>
          <Stroke pts={[[l + 4, t + h * 0.3], [l + w - 4, t + h * 0.3]]} w={5} color={C.ink} smooth={false} seed={seed + 2} />
          <Stroke pts={[[l + 4, t + h * 0.72], [l + w - 4, t + h * 0.72]]} w={5} color={C.ink} smooth={false} seed={seed + 3} />
          <Shape pts={ell(x + w * 0.3, base - h * 0.45, 5, 5, 7, 0.1, seed + 4)} smooth fill={C.lantern} w={1.6} />
        </>
      ) : null}
    </g>
  );
}

/** A crossbeam with posts, to hold up the top of a room. */
export function Rafters({ w, y = 52, from = 40, every = 520, seed = 1, fill = C.woodDeep }: { w: number; y?: number; from?: number; every?: number; seed?: number; fill?: string }) {
  const posts: ReactNode[] = [];
  for (let x = from; x < w; x += every) {
    posts.push(
      <g key={x}>
        <Stroke pts={[[x, y], [x + 1, WALL_BASE]]} w={26} color={fill} seed={seed + x} taper={0.02} wob={0.8} />
        <Stroke pts={[[x - 8, y], [x - 7, WALL_BASE]]} w={3} color={C.woodLight} seed={seed + x + 1} opacity={0.5} />
        <Stroke pts={[[x, y + 90], [x + 80, y]]} w={16} color={fill} seed={seed + x + 2} taper={0.04} />
        <Stroke pts={[[x, y + 90], [x - 80, y]]} w={16} color={fill} seed={seed + x + 3} taper={0.04} />
      </g>,
    );
  }
  return (
    <g>
      <Stroke pts={[[0, y], [w / 2, y + 2], [w, y]]} w={34} color={fill} seed={seed} taper={0} wob={0.6} />
      <Stroke pts={[[0, y - 14], [w / 2, y - 12], [w, y - 14]]} w={3} color={C.woodLight} seed={seed + 7} opacity={0.5} />
      {posts}
    </g>
  );
}

/** Dust and spatter on the floor, so empty ground is not empty. */
export function Litter({ w, y = 560, seed = 1, n = 60 }: { w: number; y?: number; seed?: number; n?: number }) {
  const marks: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) marks.push([jig(seed, i) * w, y + jig(seed, i + 100) * 34, 3 + jig(seed, i + 200) * 9, jig(seed, i + 300) * 360]);
  return <Flecks marks={marks} w={1.6} seed={seed} opacity={0.45} />;
}

/** A framed or pinned paper: a note, a card, a slip. */
export function Paper({ x, y, w = 60, h = 78, lines = 4, seed = 1, r = 0 }: { x: number; y: number; w?: number; h?: number; lines?: number; seed?: number; r?: number }) {
  const rows: [number, number, number, number][] = [];
  for (let i = 0; i < lines; i++) rows.push([8, 14 + i * ((h - 24) / Math.max(1, lines)), w - 16 - jig(seed, i) * 14, 0]);
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <Wash pts={[[4, 6], [w + 4, 6], [w + 4, h + 6], [4, h + 6]]} fill={INK} opacity={0.22} smooth={false} />
      <Shape pts={box(0, 0, w, h)} fill={C.paperHi} w={2.2} seed={seed} />
      <Flecks marks={rows} w={1.5} seed={seed + 3} opacity={0.75} />
    </g>
  );
}

export const seedOf = hash;
