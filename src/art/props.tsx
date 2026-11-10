/**
 * Brush-inked props shared by the scenes. Each is drawn with the ink engine, so they all share one pen.
 * Coordinates are in the scene's own space; (x, y) is generally the base-centre of the object.
 */
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke, Wash } from './Draw';
import { box, crest, cumulus, ell, spline, type Pt } from './ink';

export function Cloud({ x, y, w, h = w * 0.46, seed = 1, fill = C.skyHigh }: { x: number; y: number; w: number; h?: number; seed?: number; fill?: string }) {
  const pts = cumulus(x, y, w, h, seed);
  return (
    <g>
      <Shape pts={pts} fill={fill} w={2.8} seed={seed * 7} wob={1.4} />
      <Hatch pts={[[x - w * 0.42, y + h * 0.12], [x, y + h * 0.04], [x + w * 0.46, y + h * 0.1], [x + w * 0.38, y + h * 0.26], [x - w * 0.3, y + h * 0.28]]} angle={-20} gap={6} w={1.2} opacity={0.5} smooth />
      <Stroke pts={[[x - w * 0.18, y - h * 0.28], [x - w * 0.1, y - h * 0.5], [x + w * 0.06, y - h * 0.44], [x + w * 0.04, y - h * 0.3]]} w={1.8} opacity={0.7} seed={seed + 3} />
      <Stroke pts={[[x + w * 0.2, y - h * 0.2], [x + w * 0.27, y - h * 0.4], [x + w * 0.36, y - h * 0.32]]} w={1.6} opacity={0.6} seed={seed + 4} />
    </g>
  );
}

export function Gull({ x, y, s = 1, seed = 1 }: { x: number; y: number; s?: number; seed?: number }) {
  const m = (p: Pt): Pt => [x + p[0] * s, y + p[1] * s];
  return <Stroke pts={[m([-22, 4]), m([-12, -9]), m([0, 2]), m([12, -10]), m([24, 4])]} w={3.6 * s} seed={seed} taper={0.3} />;
}

export function Pine({ x, y, s = 1, seed = 1 }: { x: number; y: number; s?: number; seed?: number }) {
  const t = (cx: number, by: number, hw: number, h: number): Pt[] => [[x + cx * s, y + (by - h) * s], [x + (cx + hw) * s, y + by * s], [x + (cx - hw) * s, y + by * s]];
  return (
    <g>
      <Shape pts={box(x - 4 * s, y - 6 * s, 8 * s, 20 * s)} fill={C.woodDeep} w={2} />
      <Shape pts={t(0, 8, 30, 38)} fill={C.ink2} w={2.4} seed={seed} hatch={{ angle: -50, gap: 5, w: 1.1 }} hatchColor={C.moss} hatchOpacity={0.7} />
      <Shape pts={t(0, -14, 24, 34)} fill={C.ink2} w={2.4} seed={seed + 1} hatch={{ angle: -50, gap: 5, w: 1.1 }} hatchColor={C.moss} hatchOpacity={0.7} />
      <Shape pts={t(0, -34, 17, 30)} fill={C.ink2} w={2.4} seed={seed + 2} hatch={{ angle: -50, gap: 5, w: 1.1 }} hatchColor={C.moss} hatchOpacity={0.7} />
    </g>
  );
}

/** A curling woodblock-style wave: ink stroke with foam flecks. */
export function Crest({ x, y, s = 40, flip = 1, seed = 1, color = INK }: { x: number; y: number; s?: number; flip?: 1 | -1; seed?: number; color?: string }) {
  const pts = crest(x, y, s, flip);
  return (
    <g>
      <Stroke pts={pts} w={Math.max(2, s * 0.09)} color={color} seed={seed} taper={0.3} />
      <Stroke pts={crest(x + flip * s * 0.12, y + s * 0.2, s * 0.62, flip)} w={Math.max(1.4, s * 0.05)} color={color} seed={seed + 1} taper={0.35} opacity={0.65} />
      <Flecks marks={[[x + flip * s * 0.7, y - s * 0.7, 6, -60], [x + flip * s * 0.86, y - s * 0.52, 5, -30], [x + flip * s * 0.58, y - s * 0.86, 5, -80]]} w={2.2} color={C.seaFoam} seed={seed} />
    </g>
  );
}

/** A scatter of small wave marks across a band of sea. */
export function Ripples({ x0, x1, y0, y1, n = 40, seed = 1, color = C.seaFoam, opacity = 0.75 }: { x0: number; x1: number; y0: number; y1: number; n?: number; seed?: number; color?: string; opacity?: number }) {
  let a = seed * 9301 + 49297;
  const rnd = () => {
    a = (a * 9301 + 49297) % 233280;
    return a / 233280;
  };
  const marks: [number, number, number, number][] = [];
  for (let i = 0; i < n; i++) marks.push([x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 10 + rnd() * 20, -4 + rnd() * 8]);
  return <Flecks marks={marks} w={2.2} color={color} seed={seed} opacity={opacity} />;
}

export function PaperLantern({ x, y, s = 1, color = C.lantern, seed = 1 }: { x: number; y: number; s?: number; color?: string; seed?: number }) {
  return (
    <g>
      <Shape pts={ell(x, y, 13 * s, 17 * s, 9, 0.05, seed)} smooth fill={color} w={2.6} hatch={{ angle: -60, gap: 5, w: 1 }} hatchOpacity={0.45} />
      <Stroke pts={[[x - 12 * s, y - 2 * s], [x, y + 3 * s], [x + 12 * s, y - 2 * s]]} w={1.5} opacity={0.65} />
      <Shape pts={box(x - 6 * s, y - 19 * s, 12 * s, 4 * s)} fill={INK} w={1.6} />
      <Shape pts={box(x - 6 * s, y + 15 * s, 12 * s, 4 * s)} fill={INK} w={1.6} />
      <Stroke pts={[[x, y + 19 * s], [x - 1.5 * s, y + 28 * s]]} w={2} color={C.seal} />
    </g>
  );
}

export function Crate({ x, y, w = 70, h = 56, seed = 1 }: { x: number; y: number; w?: number; h?: number; seed?: number }) {
  const l = x - w / 2;
  const t = y - h;
  return (
    <g>
      <Shape pts={box(l, t, w, h)} fill={C.wood} w={3} seed={seed} />
      <Hatch pts={box(l + w * 0.62, t + 2, w * 0.36, h - 4)} angle={-60} gap={5} w={1.2} opacity={0.5} />
      <Stroke pts={[[l + 2, t + h * 0.34], [x, t + h * 0.36], [l + w - 2, t + h * 0.33]]} w={2} opacity={0.7} seed={seed + 1} />
      <Stroke pts={[[l + 2, t + h * 0.68], [x, t + h * 0.7], [l + w - 2, t + h * 0.67]]} w={2} opacity={0.7} seed={seed + 2} />
      <Stroke pts={[[l + 4, t + 4], [x, y - h / 2], [l + w - 4, y - 4]]} w={2.4} opacity={0.6} smooth={false} seed={seed + 3} />
      <Flecks marks={[[l + 5, t + 6, 3, 90], [l + w - 7, t + 6, 3, 90], [l + 5, y - 9, 3, 90], [l + w - 7, y - 9, 3, 90]]} w={2.4} color={C.woodDeep} />
    </g>
  );
}

export function Barrel({ x, y, w = 56, h = 70, seed = 1, band = C.ink3 }: { x: number; y: number; w?: number; h?: number; seed?: number; band?: string }) {
  const l = x - w / 2;
  return (
    <g>
      <Shape pts={[[l + 4, y - h], [l - 4, y - h * 0.5], [l + 4, y], [l + w - 4, y], [l + w + 4, y - h * 0.5], [l + w - 4, y - h]]} smooth fill={C.wood} w={3} seed={seed} />
      <Hatch pts={[[l + w * 0.55, y - h + 3], [l + w + 2, y - h * 0.5], [l + w - 4, y - 3], [l + w * 0.6, y - 3]]} angle={-70} gap={5} w={1.2} opacity={0.5} smooth />
      <Stroke pts={[[l, y - h * 0.82], [x, y - h * 0.78], [l + w, y - h * 0.82]]} w={4.4} color={band} />
      <Stroke pts={[[l - 3, y - h * 0.3], [x, y - h * 0.26], [l + w + 3, y - h * 0.3]]} w={4.4} color={band} />
      <Shape pts={ell(x, y - h, w * 0.42, 6, 10, 0.04, seed + 2)} smooth fill={C.woodLight} w={2.4} />
    </g>
  );
}

export function TileRoof({ x, y, w, h, fill = C.roofRed, seed = 1, rows = 4 }: { x: number; y: number; w: number; h: number; fill?: string; seed?: number; rows?: number }) {
  const hw = w / 2 + 10;
  const left = spline([[x - hw, y + 6], [x - hw * 0.68, y - h * 0.2], [x - hw * 0.3, y - h * 0.72], [x, y - h]], false, 5);
  const right = spline([[x, y - h], [x + hw * 0.3, y - h * 0.72], [x + hw * 0.68, y - h * 0.2], [x + hw, y + 6]], false, 5);
  const pts: Pt[] = [...left, ...right.slice(1), [x + hw - 8, y + 12], [x, y + 9], [x - hw + 8, y + 12]];
  const tiles: React.ReactNode[] = [];
  for (let r = 1; r <= rows; r++) {
    const f = r / (rows + 1);
    const yy = y - h * f * 0.88;
    const half = hw * (1 - f * 0.86);
    tiles.push(<Stroke key={r} pts={[[x - half, yy + 4], [x, yy + 7], [x + half, yy + 4]]} w={1.7} opacity={0.6} seed={seed * 11 + r} />);
  }
  return (
    <g>
      <Shape pts={pts} fill={fill} w={3.2} seed={seed} />
      {tiles}
      <Hatch pts={[[x + hw * 0.1, y - h * 0.8], [x + hw * 0.7, y - h * 0.18], [x + hw * 0.9, y + 4], [x + hw * 0.2, y + 6]]} angle={-55} gap={5} w={1.3} opacity={0.6} />
      <Shape pts={box(x - hw + 2, y + 6, hw * 2 - 4, 6)} fill={C.ink} w={0} reg={[0, 0]} />
      <Stroke pts={[[x - 5, y - h + 4], [x, y - h - 10], [x + 5, y - h + 4]]} w={3} seed={seed + 9} />
    </g>
  );
}

export function House({ x, y, w = 92, h = 64, roof = C.roofRed, wall = C.bone, lit = true, seed = 1, chimney = false, sign }: { x: number; y: number; w?: number; h?: number; roof?: string; wall?: string; lit?: boolean; seed?: number; chimney?: boolean; sign?: string }) {
  const l = x - w / 2;
  const t = y - h;
  return (
    <g>
      {chimney ? <Shape pts={box(x + w * 0.2, t - 40, 14, 44)} fill={C.hillNear} w={2.6} seed={seed + 40} /> : null}
      <Shape pts={box(l, t, w, h)} fill={wall} w={3} seed={seed} />
      <Hatch pts={box(l + w * 0.64, t + 3, w * 0.34, h - 6)} angle={-55} gap={5} w={1.2} opacity={0.5} />
      <Stroke pts={[[l + 2, t + h * 0.4], [x, t + h * 0.42], [l + w - 2, t + h * 0.4]]} w={2} opacity={0.65} seed={seed + 1} />
      <Stroke pts={[[x, t + 2], [x + 1, y - 2]]} w={2} opacity={0.65} seed={seed + 2} />
      {[l + w * 0.14, l + w * 0.62].map((wx, i) => (
        <g key={i}>
          <Shape pts={box(wx, t + h * 0.12, w * 0.22, h * 0.34)} fill={lit ? C.lantern : C.ink3} w={2.2} seed={seed + 10 + i} />
          {lit ? <Stroke pts={[[wx + w * 0.11, t + h * 0.12], [wx + w * 0.11, t + h * 0.46]]} w={1.4} opacity={0.8} /> : null}
          {lit ? <Stroke pts={[[wx, t + h * 0.29], [wx + w * 0.22, t + h * 0.29]]} w={1.4} opacity={0.8} /> : null}
        </g>
      ))}
      <Shape pts={box(x - w * 0.08, y - h * 0.4, w * 0.16, h * 0.4)} fill={C.woodDeep} w={2.2} seed={seed + 20} />
      <TileRoof x={x} y={t} w={w + 6} h={h * 0.85} fill={roof} seed={seed + 30} rows={3} />
      {sign ? <Shape pts={box(l - 12, t + 8, 14, 22)} fill={sign} w={2} seed={seed + 50} /> : null}
    </g>
  );
}

export function Smoke({ x, y, s = 1, seed = 1, fill = C.bone }: { x: number; y: number; s?: number; seed?: number; fill?: string }) {
  return (
    <g>
      <Shape pts={ell(x, y, 12 * s, 10 * s, 9, 0.1, seed)} smooth fill={fill} w={2.2} />
      <Shape pts={ell(x + 12 * s, y - 24 * s, 17 * s, 14 * s, 9, 0.1, seed + 1)} smooth fill={fill} w={2.4} />
      <Shape pts={ell(x + 30 * s, y - 54 * s, 24 * s, 19 * s, 10, 0.1, seed + 2)} smooth fill={fill} w={2.6} hatch={{ angle: -30, gap: 6, w: 1.1 }} hatchOpacity={0.4} />
      <Stroke pts={[[x + 24 * s, y - 58 * s], [x + 30 * s, y - 68 * s], [x + 40 * s, y - 62 * s]]} w={1.6} opacity={0.6} seed={seed + 3} />
    </g>
  );
}

/** A boat with a patched, wind-bellied sail, a pennant and rigging. */
export function Boat({ x, y, s = 1, seed = 1, hull = C.seal, sail = C.bone }: { x: number; y: number; s?: number; seed?: number; hull?: string; sail?: string }) {
  const m = (p: Pt): Pt => [x + p[0] * s, y + p[1] * s];
  return (
    <g>
      <Wash pts={[m([-66, 26]), m([0, 34]), m([66, 26]), m([40, 40]), m([-40, 40])]} fill={INK} opacity={0.25} />
      <Shape pts={[m([-74, 0]), m([74, -2]), m([58, 28]), m([-52, 28])]} fill={hull} w={3.4 * s} seed={seed} hatch={{ angle: -45, gap: 6 * s, w: 1.2 }} hatchOpacity={0.5} />
      <Stroke pts={[m([-64, 8]), m([0, 11]), m([64, 7])]} w={3 * s} color={C.bone} />
      <Stroke pts={[m([0, -1]), m([1, -128])]} w={5 * s} seed={seed + 1} />
      <Shape pts={[m([6, -122]), m([40, -92]), m([58, -48]), m([54, -6]), m([6, -6])]} smooth fill={sail} w={3 * s} seed={seed + 2} />
      <Hatch pts={[m([30, -96]), m([54, -52]), m([52, -8]), m([28, -8])]} angle={-60} gap={6 * s} w={1.1} opacity={0.4} />
      <Shape pts={[m([-6, -108]), m([-34, -78]), m([-50, -30]), m([-46, -6]), m([-6, -6])]} smooth fill={C.paperLo} w={3 * s} seed={seed + 3} />
      <Shape pts={[m([14, -70]), m([34, -70]), m([34, -48]), m([14, -48])]} fill={C.clothTeal} w={1.8 * s} seed={seed + 4} />
      <Stroke pts={[m([6, -60]), m([30, -58]), m([54, -60])]} w={1.4} opacity={0.6} />
      <Shape pts={[m([2, -126]), m([34, -134]), m([20, -120])]} fill={C.clothRed} w={2.2 * s} seed={seed + 5} />
      <Stroke pts={[m([0, -120]), m([-70, 0])]} w={1.4} smooth={false} opacity={0.7} />
      <Stroke pts={[m([6, -112]), m([70, -2])]} w={1.4} smooth={false} opacity={0.7} />
    </g>
  );
}

/** A plank floor: uneven boards of slightly different tone, grain and nails. */
export function Planks({ pts, rows = 5, seed = 1 }: { pts: [Pt, Pt, Pt, Pt]; rows?: number; seed?: number }) {
  const [tl, tr, br, bl] = pts;
  const out: React.ReactNode[] = [];
  const tones = [C.wood, C.woodLight, C.wood, '#6c4430', C.wood, C.woodLight];
  for (let i = 0; i < rows; i++) {
    const a = i / rows;
    const b = (i + 1) / rows;
    const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    const p1 = lerp(tl, bl, a);
    const p2 = lerp(tr, br, a);
    const p3 = lerp(tr, br, b);
    const p4 = lerp(tl, bl, b);
    out.push(<Shape key={i} pts={[p1, p2, p3, p4]} fill={tones[i % tones.length]!} w={2.4} seed={seed + i} />);
    const mid = lerp(p1, p4, 0.5);
    const midr = lerp(p2, p3, 0.5);
    out.push(<Stroke key={`g${i}`} pts={[lerp(mid, midr, 0.1), lerp(mid, midr, 0.35), lerp(mid, midr, 0.6)]} w={1.4} opacity={0.5} seed={seed + 30 + i} />);
    out.push(<Flecks key={`n${i}`} marks={[[lerp(mid, midr, 0.06)[0], lerp(mid, midr, 0.06)[1] - 2, 3, 90], [lerp(mid, midr, 0.94)[0], lerp(mid, midr, 0.94)[1] - 2, 3, 90]]} w={2.6} color={C.woodDeep} />);
  }
  return <g>{out}</g>;
}

export function Rope({ pts, w = 6, seed = 1 }: { pts: Pt[]; w?: number; seed?: number }) {
  return (
    <g>
      <Stroke pts={pts} w={w + 3} color={INK} seed={seed} taper={0.1} wob={0.5} />
      <Stroke pts={pts} w={w} color={C.straw} seed={seed + 1} taper={0.1} wob={0.5} />
      <Stroke pts={pts} w={1.4} color={C.strawDeep} seed={seed + 2} taper={0.1} wob={0.5} opacity={0.9} />
    </g>
  );
}
