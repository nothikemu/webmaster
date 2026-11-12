/**
 * The chart of Tideweight: the three places as a sea chart, with a route through fifteen stops.
 * The paper, coasts and landmarks are drawn once. The stops on top are real links whose look follows the player's progress,
 * so the chart is navigation and progress display at the same time. Nothing on it is locked.
 */
import { memo } from 'react';
import { Link } from '@/router';
import { C, INK, HUE, type PathHueName } from './palette';
import { Dry, Finish, Flecks, Hatch, Shape, Stroke, Wash } from './Draw';
import { box, ell, spline, type Pt } from './ink';
import { Boat, Crest, Gull, Pine, Smoke, TileRoof } from './props';
import { CompassRose, Lettering, MiniLighthouse } from './kit';

const W = 1200;
const H = 600;

export interface ChartStop {
  id: string;
  path: PathHueName;
  /** 1 to 5 inside its path. */
  n: number;
  title: string;
  to: string;
  state: 'new' | 'started' | 'done';
  next: boolean;
}

/** Where each stop sits on the chart, and which side its name goes on. */
const SPOT: Record<string, { at: Pt; side: 'l' | 'r' | 't' | 'b' }> = {
  u1: { at: [150, 500], side: 'b' },
  u2: { at: [104, 366], side: 'b' },
  u3: { at: [150, 232], side: 'r' },
  u4: { at: [290, 150], side: 't' },
  u5: { at: [410, 252], side: 'b' },
  t1: { at: [500, 372], side: 'l' },
  t2: { at: [560, 492], side: 'l' },
  t3: { at: [706, 512], side: 'r' },
  t4: { at: [770, 420], side: 'r' },
  t5: { at: [716, 300], side: 'l' },
  r1: { at: [822, 212], side: 'l' },
  r2: { at: [930, 300], side: 'b' },
  r3: { at: [1050, 352], side: 'b' },
  r4: { at: [1112, 246], side: 'l' },
  r5: { at: [1010, 168], side: 'l' },
};
const SEAL_AT: Pt = [1038, 104];

/** A gently bowed line between two stops, as points. */
function leg(a: Pt, b: Pt, bow: number): Pt[] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return spline([a, [mx - (dy / l) * bow, my + (dx / l) * bow], b], false, 10);
}

/** Dashes along a line, leaving a gap around each stop. */
function dashes(pts: Pt[], gap = 24): [number, number, number, number][] {
  const out: [number, number, number, number][] = [];
  let run = 0;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  let next = gap;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1]!;
    const q = pts[i]!;
    const seg = Math.hypot(q[0] - p[0], q[1] - p[1]);
    while (next <= run + seg) {
      const t = (next - run) / seg;
      if (next > gap * 0.9 && next < total - gap) out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, 9, (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI]);
      next += 17;
    }
    run += seg;
  }
  return out;
}

/** Everything on the chart that never changes. */
const ChartPaper = memo(function ChartPaper() {
  return (
    <g filter="url(#rough)">
      <rect width={W} height={H} fill={C.paperHi} />
      <Wash pts={box(0, 0, W, H)} fill={C.tealLight} opacity={0.18} smooth={false} />
      {/* rhumb lines from the rose */}
      {[200, 220, 236, 252, 270, 292, 316].map((a, i) => (
        <Stroke key={a} pts={[[1040, 520], [1040 + Math.cos((a * Math.PI) / 180) * 1000, 520 + Math.sin((a * Math.PI) / 180) * 1000]]} w={1} opacity={0.2} smooth={false} seed={900 + i} wob={0.3} />
      ))}
      <Dry pts={[[20, 566], [300, 558], [640, 570], [900, 560]]} w={26} color={C.tealLight} opacity={0.35} bristles={8} seed={3} />
      <Dry pts={[[420, 60], [640, 52], [800, 64]]} w={20} color={C.tealLight} opacity={0.3} bristles={6} seed={4} />
      <Flecks
        marks={Array.from({ length: 70 }, (_, i) => [30 + ((i * 197) % 1150), 36 + ((i * 131) % 540), 10 + ((i * 7) % 9), (i % 5) - 2] as [number, number, number, number])}
        w={1.5}
        color={C.teal}
        opacity={0.4}
        seed={5}
      />

      {/* ---- the Loom isle ---- */}
      <Shape pts={[[70, 300], [110, 196], [210, 150], [330, 178], [392, 268], [372, 380], [286, 452], [170, 450], [94, 396]]} smooth fill={C.paperLo} w={3.6} seed={11} />
      <Hatch pts={[[250, 420], [330, 400], [376, 300], [390, 270], [372, 380], [286, 452]]} angle={-50} gap={7} w={1.2} opacity={0.5} smooth seed={12} />
      <Shape pts={[[92, 300], [128, 214], [212, 174], [318, 198], [368, 272], [350, 368], [278, 430], [176, 428], [112, 384]]} smooth w={1.2} seed={13} />
      <Flecks marks={[[140, 300, 18, -60], [158, 300, 18, -120], [300, 330, 16, -60], [316, 330, 16, -120], [196, 390, 14, -60], [210, 390, 14, -120]]} w={2.2} seed={14} />
      <Pine x={176} y={300} s={0.5} seed={3} />
      <Pine x={320} y={262} s={0.46} seed={4} />
      <Pine x={300} y={404} s={0.42} seed={5} />
      {/* the Loom House */}
      <g>
        <Shape pts={box(200, 290, 84, 44)} fill={C.bone} w={2.8} seed={20} />
        <TileRoof x={242} y={290} w={96} h={40} fill={C.roofIndigo} seed={21} rows={3} />
        <TileRoof x={242} y={262} w={50} h={24} fill={C.indigo} seed={22} rows={2} />
        {[214, 228, 242, 256, 270].map((tx, i) => (
          <Stroke key={tx} pts={[[242, 250], [tx, 336]]} w={2.2} color={C.indigo} smooth={false} seed={23 + i} />
        ))}
        <Shape pts={ell(242, 248, 5, 5, 7, 0.1, 29)} smooth fill={C.seal} w={1.8} />
        <Shape pts={box(234, 312, 16, 22)} fill={C.woodDeep} w={2} seed={30} />
      </g>

      {/* ---- the Foundry docks ---- */}
      <Shape pts={[[452, 600], [470, 500], [540, 430], [640, 404], [740, 436], [800, 510], [820, 600]]} smooth fill={C.paperLo} w={3.6} seed={41} />
      <Hatch pts={[[720, 440], [800, 512], [816, 596], [760, 596], [740, 500]]} angle={-50} gap={7} w={1.2} opacity={0.5} smooth seed={42} />
      <Shape pts={[[476, 600], [492, 512], [552, 452], [638, 428], [726, 456], [778, 520], [796, 600]]} smooth w={1.2} seed={43} />
      {/* piers */}
      <Stroke pts={[[560, 440], [520, 380], [504, 340]]} w={7} color={C.wood} seed={44} />
      <Stroke pts={[[700, 420], [716, 356], [712, 320]]} w={7} color={C.wood} seed={45} />
      <Flecks marks={[[530, 398, 12, 30], [516, 368, 12, 30], [706, 392, 12, -10], [712, 352, 12, -10]]} w={1.6} seed={46} />
      {/* the Foundry */}
      <g>
        <Shape pts={box(592, 470, 86, 44)} fill={C.bone} w={2.8} seed={50} />
        <Shape pts={box(604, 484, 26, 30)} fill={C.ink2} w={2.2} seed={51} />
        <Wash pts={box(608, 494, 18, 20)} fill={C.ochre} opacity={0.9} smooth={false} />
        <TileRoof x={635} y={470} w={96} h={30} fill={C.tealDeep} seed={52} rows={2} />
        <Shape pts={box(656, 428, 14, 44)} fill={C.hillNear} w={2.2} seed={53} />
        <Smoke x={664} y={420} s={0.5} seed={54} />
        <Stroke pts={[[700, 514], [700, 430]]} w={4.4} seed={55} />
        <Stroke pts={[[700, 434], [742, 446]]} w={4.4} seed={56} />
        <Stroke pts={[[736, 444], [736, 470]]} w={1.6} />
        <Shape pts={box(728, 470, 16, 13)} fill={C.wood} w={1.8} seed={57} />
      </g>

      {/* ---- the Beacon headland ---- */}
      <Shape pts={[[1200, 40], [1100, 44], [1000, 96], [952, 190], [984, 290], [1070, 330], [1160, 300], [1200, 290]]} smooth fill={C.paperLo} w={3.6} seed={61} />
      <Hatch pts={[[960, 200], [988, 286], [1068, 324], [1100, 300], [1010, 250]]} angle={-50} gap={7} w={1.2} opacity={0.5} smooth seed={62} />
      <Shape pts={[[1200, 64], [1108, 66], [1018, 112], [976, 190], [1004, 274], [1072, 306], [1150, 282], [1200, 270]]} smooth w={1.2} seed={63} />
      <Flecks marks={[[1040, 210, 16, -60], [1056, 210, 16, -120], [1136, 190, 14, -60], [1150, 190, 14, -120]]} w={2.2} seed={64} />
      <Pine x={1160} y={240} s={0.44} seed={8} />
      <MiniLighthouse x={1112} y={180} s={0.86} seed={65} lit={false} />

      {/* ---- small craft, a whale and gulls ---- */}
      <Boat x={420} y={110} s={0.26} seed={3} />
      <Boat x={910} y={560} s={0.28} seed={7} hull={C.clothTeal} />
      <Crest x={596} y={150} s={26} seed={2} />
      <Crest x={330} y={540} s={28} seed={6} />
      <Gull x={560} y={236} s={0.5} seed={1} />
      <Gull x={596} y={254} s={0.36} seed={2} />
      <Stroke pts={[[640, 196], [664, 182], [690, 184], [706, 196]]} w={4.4} seed={70} />
      <Shape pts={[[706, 196], [716, 178], [708, 164], [722, 172], [730, 158], [732, 176], [722, 194]]} smooth fill={INK} w={0} reg={[0, 0]} />
      <Flecks marks={[[656, 170, 9, -100], [664, 166, 11, -80], [672, 170, 9, -60]]} w={1.8} color={C.teal} seed={71} />

      {/* ---- the rose, the scale and the title ---- */}
      <CompassRose x={1040} y={500} r={62} seed={80} />
      <Lettering x={1040} y={424} size={16}>N</Lettering>
      <Stroke pts={[[60, 566], [220, 566]]} w={2.4} smooth={false} seed={81} />
      <Flecks marks={[[60, 566, 9, -90], [100, 566, 6, -90], [140, 566, 9, -90], [180, 566, 6, -90], [220, 566, 9, -90]]} w={2} seed={82} />
      <Lettering x={140} y={588} size={13}>ONE STOP, ABOUT TEN MINUTES</Lettering>
      <Shape pts={[[40, 34], [356, 30], [372, 56], [356, 84], [40, 88], [24, 60]]} fill={C.bone} w={3} seed={83} />
      <Shape pts={[[50, 42], [348, 38], [360, 56], [348, 76], [50, 80], [38, 60]]} w={1.2} seed={84} />
      <Lettering x={198} y={58} size={21} spacing={0.12}>THE CHART OF TIDEWEIGHT</Lettering>
      <Lettering x={198} y={76} size={12} fill={C.ink3} spacing={0.14}>THREE PLACES · FIFTEEN STOPS · ALL OPEN</Lettering>

      {/* place names */}
      <Lettering x={262} y={376} size={19} fill={C.indigo} spacing={0.12}>THE LOOM HOUSE</Lettering>
      <Lettering x={636} y={566} size={19} fill={C.tealDeep} spacing={0.12}>THE FOUNDRY DOCKS</Lettering>
      <Lettering x={1104} y={306} size={19} fill={HUE.responsible.deep} spacing={0.12}>THE BEACON</Lettering>

      {/* the neat line round the sheet */}
      <Shape pts={box(8, 8, W - 16, H - 16)} w={3.4} seed={90} />
      <Shape pts={box(16, 16, W - 32, H - 32)} w={1.2} seed={91} />
    </g>
  );
});

const HUE_INK: Record<PathHueName, string> = { understand: C.indigo, use: C.tealDeep, responsible: HUE.responsible.deep };
const HUE_FILL: Record<PathHueName, string> = { understand: C.indigo, use: C.teal, responsible: C.ochre };

function StopMark({ stop }: { stop: ChartStop }) {
  const spot = SPOT[stop.id];
  if (!spot) return null;
  const [x, y] = spot.at;
  const done = stop.state === 'done';
  const started = stop.state === 'started';
  const tx = spot.side === 'l' ? x - 27 : spot.side === 'r' ? x + 27 : x;
  const ty = spot.side === 't' ? y - 29 : spot.side === 'b' ? y + 41 : y + 5;
  const anchor = spot.side === 'l' ? 'end' : spot.side === 'r' ? 'start' : 'middle';
  const status = done ? 'Finished' : started ? 'In progress' : 'Not started';
  return (
    <Link to={stop.to} className="chart-stop">
      <circle cx={x} cy={y} r={26} fill="transparent" />
      <g transform={`translate(4 5)`}>
        <Shape pts={ell(x, y, 19, 19, 14, 0.03, x + y)} smooth fill={INK} w={0} reg={[0, 0]} />
      </g>
      <Shape pts={ell(x, y, 19, 19, 14, 0.03, x + y)} smooth fill={done ? HUE_FILL[stop.path] : C.paperHi} w={3.4} seed={x * 3 + y} hatch={done ? { angle: -50, gap: 5, w: 1.1 } : false} hatchOpacity={0.35} />
      {started ? <Shape pts={ell(x, y, 13, 13, 12, 0.03, x + y + 1)} smooth w={2.4} ink={HUE_INK[stop.path]} seed={x + 2 * y} /> : null}
      {done ? (
        <Stroke pts={[[x - 9, y], [x - 3, y + 7], [x + 10, y - 8]]} w={4.4} color={stop.path === 'responsible' ? INK : C.bone} seed={x + y + 2} />
      ) : (
        <text x={x} y={y + 7} textAnchor="middle" fontFamily="'Dela Gothic One', sans-serif" fontSize={19} fill={INK}>
          {stop.n}
        </text>
      )}
      {stop.next ? (
        <g>
          <Stroke pts={[[x + 13, y - 14], [x + 14, y - 50]]} w={3.4} seed={x + y + 3} smooth={false} />
          <Shape pts={[[x + 15, y - 50], [x + 42, y - 43], [x + 15, y - 34]]} fill={C.seal} w={2.4} seed={x + y + 4} />
        </g>
      ) : null}
      <text className="chart-stop__name" x={tx} y={ty} textAnchor={anchor}>
        {stop.title}
      </text>
      {/* read out, not shown: the picture already shows the state */}
      <text className="svg-sr" x={x} y={y}>
        {`. ${status}${stop.next ? ', up next' : ''}.`}
      </text>
    </Link>
  );
}

interface ChartProps {
  stops: ChartStop[];
  /** Whether the final certification has been passed. */
  certified: boolean;
  certTo: string;
  className?: string;
}

/** The chart, with its stops. */
export function ChartMap({ stops, certified, certTo, className }: ChartProps) {
  const order = stops.filter((s) => SPOT[s.id]);
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} role="group" aria-label="The chart of Tideweight: fifteen lesson stops in three places, and the final seal at the lighthouse." focusable="false">
      <ChartPaper />
      {/* the route: dashed until both ends are finished, then inked solid in the path's colour */}
      {order.map((s, i) => {
        const a = SPOT[s.id]!.at;
        const nextStop = order[i + 1];
        const b = nextStop ? SPOT[nextStop.id]!.at : SEAL_AT;
        const pts = leg(a, b, i % 2 ? 18 : -18);
        const sailed = s.state === 'done' && (nextStop ? nextStop.state === 'done' : certified);
        return sailed ? <Stroke key={s.id} pts={pts} w={4.6} color={HUE_INK[s.path]} seed={i + 400} taper={0.1} /> : <Flecks key={s.id} marks={dashes(pts)} w={3} color={INK} seed={i + 500} opacity={0.8} />;
      })}
      {order.map((s) => (
        <StopMark key={s.id} stop={s} />
      ))}
      {/* the seal at the light */}
      <Link to={certTo} className="chart-stop">
        <circle cx={SEAL_AT[0]} cy={SEAL_AT[1]} r={28} fill="transparent" />
        <Shape pts={ell(SEAL_AT[0], SEAL_AT[1], 21, 21, 13, 0.12, 77)} smooth fill={certified ? C.seal : C.paperHi} w={3.4} hatch={certified ? { angle: -40, gap: 5, w: 1 } : false} hatchColor={C.roofRed} hatchOpacity={0.6} />
        <Shape pts={ell(SEAL_AT[0], SEAL_AT[1], 14, 14, 12, 0.04, 78)} smooth w={1.6} ink={certified ? C.bone : INK} />
        <Stroke pts={[[SEAL_AT[0] - 8, SEAL_AT[1] + 1], [SEAL_AT[0] - 3, SEAL_AT[1] - 4], [SEAL_AT[0] + 2, SEAL_AT[1] + 1], [SEAL_AT[0] + 8, SEAL_AT[1] - 3]]} w={2.6} color={certified ? C.bone : INK} seed={79} />
        <text className="chart-stop__name" x={SEAL_AT[0] - 30} y={SEAL_AT[1] + 6} textAnchor="end">
          Final certification
        </text>
        <text className="svg-sr" x={SEAL_AT[0]} y={SEAL_AT[1]}>
          {certified ? '. Passed.' : '. Not passed yet.'}
        </text>
      </Link>
      <Finish w={W} h={H} />
      <rect width={W} height={H} filter="url(#paint)" opacity="0.2" style={{ mixBlendMode: 'multiply', pointerEvents: 'none' }} />
      <rect width={W} height={H} filter="url(#grain)" opacity="0.45" style={{ mixBlendMode: 'multiply', pointerEvents: 'none' }} />
    </svg>
  );
}

/** One stop on its own, for the key under the chart. */
export function StopKey({ kind, className }: { kind: 'new' | 'started' | 'done' | 'next'; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 56 56" aria-hidden="true" focusable="false">
      <Shape pts={ell(26, 32, 19, 19, 14, 0.03, 58)} smooth fill={kind === 'done' ? C.indigo : C.paperHi} w={3.4} seed={174} hatch={kind === 'done' ? { angle: -50, gap: 5, w: 1.1 } : false} hatchOpacity={0.35} />
      {kind === 'started' ? <Shape pts={ell(26, 32, 13, 13, 12, 0.03, 59)} smooth w={2.4} ink={C.indigo} /> : null}
      {kind === 'done' ? <Stroke pts={[[17, 32], [23, 39], [36, 24]]} w={4.4} color={C.bone} seed={60} /> : null}
      {kind === 'next' ? (
        <g>
          <Stroke pts={[[38, 20], [39, 2]]} w={3} smooth={false} />
          <Shape pts={[[40, 2], [55, 7], [40, 13]]} fill={C.seal} w={2} />
        </g>
      ) : null}
    </svg>
  );
}
