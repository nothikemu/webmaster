/**
 * Plate I: a digit, read by a machine. A handwritten 7 (a grid of inked pixels) enters at the bottom, climbs through three layers of
 * units, and arrives at the top as ten bars of confidence. The annotations are real HTML text laid over the drawing on wide screens,
 * and become a numbered list under it on narrow ones, so nothing important lives inside the picture.
 */
import { useMemo } from 'react';
import { rng } from '@/widgets/logic/random';
import { type Pt, ell } from '../ink';
import { C } from '../palette';
import { Dots, Loop, Pen, Round, Shade, Wash } from './ink';

const W = 740;
const H = 790;

const DIGIT = [
  '.........',
  '.#######.',
  '.......#.',
  '......#..',
  '......#..',
  '.....#...',
  '....##...',
  '....#....',
  '...##....',
];

const layers = [
  { n: 7, y: 505, dx: 68, c: 300 },
  { n: 6, y: 380, dx: 76, c: 300 },
  { n: 5, y: 255, dx: 86, c: 300 },
];
const nodeX = (li: number, i: number) => layers[li]!.c + (i - (layers[li]!.n - 1) / 2) * layers[li]!.dx;

/** Where the strongest route for this digit runs: input, then one unit per layer, then the bar for 7. */
const ROUTE: [number, number][] = [
  [300, 610],
  [nodeX(0, 3), layers[0]!.y],
  [nodeX(1, 3), layers[1]!.y],
  [nodeX(2, 3), layers[2]!.y],
  [400, 152],
];
const ACTIVE = new Set(['0-3', '1-3', '2-3', '0-4', '1-2', '2-2', '1-4']);

export const HERO_NOTES: { n: number; x: number; y: number; title: string; text: string }[] = [
  { n: 1, x: 536, y: 104, title: 'Output', text: 'A guess for every digit, with its confidence. The tallest bar wins.' },
  { n: 2, x: 536, y: 226, title: 'Units', text: 'Each one adds up what reaches it, then decides how loudly to pass it on.' },
  { n: 3, x: 536, y: 340, title: 'The route', text: 'The strongest path for this digit, traced in red.' },
  { n: 4, x: 536, y: 436, title: 'Weights', text: 'A thicker line means one unit listens harder to another. Learning adjusts these.' },
  { n: 5, x: 536, y: 640, title: 'Input', text: 'The handwritten digit as a grid of pixels, each one a number from light to dark.' },
];

/** The marker each note points at. */
const MARKS: Pt[] = [
  [468, 118],
  [nodeX(2, 4) + 17, layers[2]!.y - 4],
  [(nodeX(1, 3) + nodeX(2, 3)) / 2 + 6, (layers[1]!.y + layers[2]!.y) / 2],
  [(nodeX(0, 5) + nodeX(1, 4)) / 2, (layers[0]!.y + layers[1]!.y) / 2],
  [382, 660],
];

function build() {
  const r = rng(2026);
  const out: JSX.Element[] = [];
  let k = 0;
  const key = () => `h${k++}`;

  // measurement ruler down the left edge, like the margin of a printed plate
  out.push(<Pen key={key()} pts={[[34, 52], [34, 742]]} w={1.3} color={C.graphite2} smooth={false} wob={0.4} opacity={0.7} seed={11} />);
  for (let y = 60; y <= 740; y += 20) out.push(<Pen key={key()} pts={[[34, y], [y % 100 === 0 ? 50 : 43, y]]} w={1.2} color={C.graphite2} smooth={false} wob={0.2} taper={0.3} opacity={0.7} seed={y} />);

  // connections between layers: thickness is the weight, blue pushes toward the answer, grey pushes against it
  const between = (a: Pt[], b: Pt[], li: number) => {
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        const w = 0.5 + Math.pow(r(), 1.7) * 3.4;
        const pos = r() > 0.42;
        const onRoute = (li === 0 && i === 3 && j === 3) || (li === 1 && i === 3 && j === 3) || (li === 2 && i === 3);
        if (onRoute) continue;
        out.push(<Pen key={key()} pts={[a[i]!, b[j]!]} w={w} color={pos ? C.cobalt : C.graphite2} opacity={pos ? 0.55 : 0.5} smooth={false} wob={1.2} taper={0.18} seed={li * 400 + i * 20 + j} />);
      }
    }
  };
  const pts: Pt[][] = layers.map((L, li) => Array.from({ length: L.n }, (_, i) => [nodeX(li, i), L.y] as Pt));
  // the ten output bars sit above the last layer
  const bars: Pt[] = Array.from({ length: 10 }, (_, i) => [300 + (i - 4.5) * 40, 152] as Pt);
  // the fan from the input grid into the first layer
  for (let i = 0; i < pts[0]!.length; i++) {
    for (let s = 0; s < 2; s++) {
      const x = 240 + r() * 120;
      out.push(<Pen key={key()} pts={[[x, 598], pts[0]![i]!]} w={0.5 + r() * 1.4} color={C.graphite2} opacity={0.45} smooth={false} wob={1} taper={0.2} seed={i * 9 + s} />);
    }
  }
  between(pts[0]!, pts[1]!, 0);
  between(pts[1]!, pts[2]!, 1);
  for (let i = 0; i < pts[2]!.length; i++) {
    for (let j = 0; j < bars.length; j++) {
      if (i === 3 && j === 7) continue;
      const w = 0.4 + Math.pow(r(), 2.4) * 1.8;
      out.push(<Pen key={key()} pts={[pts[2]![i]!, [bars[j]![0], 158]]} w={w} color={r() > 0.5 ? C.cobalt : C.graphite2} opacity={0.4} smooth={false} wob={0.9} taper={0.18} seed={2000 + i * 11 + j} />);
    }
  }

  // the strongest route, in vermilion, drawn heavier at the middle
  for (let i = 0; i < ROUTE.length - 1; i++) {
    out.push(<Pen key={key()} pts={[ROUTE[i]!, ROUTE[i + 1]!]} w={4.4} color={C.vermilion} smooth={false} wob={0.8} taper={0.12} seed={77 + i} />);
  }

  // units
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const cx = nodeX(li, i);
      const act = ACTIVE.has(`${li}-${i}`);
      const poly = ell(cx, L.y, 15, 15, 14, 0.05, li * 10 + i + 3);
      out.push(<Wash key={key()} pts={poly} color={act ? C.cobalt : C.boneLo} opacity={act ? 0.3 : 0.9} off={[1.2, 1]} seed={li * 7 + i} />);
      if (act) out.push(<Shade key={key()} pts={poly} spacing={3.6} angle={50} color={C.cobaltLo} opacity={0.75} weight={0.9} seed={li * 5 + i + 1} />);
      out.push(<Round key={key()} cx={cx} cy={L.y} r={15} w={2.4} fill={act ? undefined : C.boneHi} fillOpacity={act ? undefined : 0.0} seed={li * 10 + i + 3} />);
    }
  });

  // output bars: heights are confidences, the seven stands tall
  const heights = [10, 6, 14, 9, 7, 8, 11, 92, 12, 6];
  bars.forEach((b, i) => {
    const h = heights[i]!;
    const x = b[0];
    const poly: Pt[] = [[x - 9, 150], [x - 9, 150 - h], [x + 9, 150 - h], [x + 9, 150]];
    out.push(<Wash key={key()} pts={poly} color={i === 7 ? C.cobalt : C.boneLine} opacity={i === 7 ? 0.35 : 0.9} smooth={false} off={[1.4, 1]} seed={500 + i} />);
    if (i === 7) out.push(<Shade key={key()} pts={poly} spacing={4.2} angle={62} color={C.cobaltLo} opacity={0.7} weight={0.9} seed={43} />);
    out.push(<Loop key={key()} pts={poly} smooth={false} w={i === 7 ? 2.4 : 1.7} seed={500 + i} wob={0.5} />);
  });
  // a baseline for the bars, and a digit under each
  out.push(<Pen key={key()} pts={[[96, 152], [508, 152]]} w={2} smooth={false} wob={0.7} seed={91} />);
  bars.forEach((b, i) => out.push(
    <text key={key()} x={b[0]} y={172} fontSize="12" textAnchor="middle" fill={i === 7 ? C.vermilionLo : C.graphite2} fontFamily="var(--font-mono)" fontWeight={i === 7 ? 600 : 400}>{i}</text>,
  ));

  // input grid: nine by nine pixels, the seven in ink
  const cell = 15;
  const gx = 300 - (9 * cell) / 2;
  const gy = 604;
  const gridPoly: Pt[] = [[gx, gy], [gx + 9 * cell, gy], [gx + 9 * cell, gy + 9 * cell], [gx, gy + 9 * cell]];
  out.push(<Wash key={key()} pts={gridPoly} color={C.boneHi} opacity={1} smooth={false} off={[0, 0]} seed={3} />);
  DIGIT.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const x = gx + rx * cell;
      const y = gy + ry * cell;
      const poly: Pt[] = [[x + 1, y + 1], [x + cell - 1, y + 1], [x + cell - 1, y + cell - 1], [x + 1, y + cell - 1]];
      if (ch === '#') {
        out.push(<Wash key={key()} pts={poly} color={C.ink} opacity={0.92} smooth={false} off={[0.4, 0.4]} seed={rx * 13 + ry} />);
      } else if (r() > 0.55) {
        out.push(<circle key={key()} cx={x + cell / 2} cy={y + cell / 2} r={0.9 + r() * 0.8} fill={C.graphite2} opacity={0.55} />);
      }
    });
  });
  // grid lines, hand-ruled
  for (let i = 0; i <= 9; i++) {
    out.push(<Pen key={key()} pts={[[gx + i * cell, gy], [gx + i * cell, gy + 9 * cell]]} w={0.9} smooth={false} color={C.graphite2} wob={0.5} opacity={0.65} seed={300 + i} />);
    out.push(<Pen key={key()} pts={[[gx, gy + i * cell], [gx + 9 * cell, gy + i * cell]]} w={0.9} smooth={false} color={C.graphite2} wob={0.5} opacity={0.65} seed={330 + i} />);
  }
  out.push(<Loop key={key()} pts={gridPoly} smooth={false} w={2.2} seed={12} wob={0.6} />);
  // a soft cast shadow of stipple under the grid
  out.push(<Dots key={key()} pts={ell(300, 752, 130, 11, 16, 0.03, 8)} count={90} opacity={0.5} seed={5} />);

  // leaders and numbered markers for the annotations
  HERO_NOTES.forEach((nt, i) => {
    const m = MARKS[i]!;
    const mid: Pt = [(m[0] + nt.x) / 2, Math.min(m[1], nt.y) - 10 + (i % 2) * 20];
    out.push(<g key={key()} className="hero-leader"><Pen pts={[m, mid, [nt.x - 10, nt.y]]} w={1.4} color={C.graphite2} wob={0.6} taper={0.3} seed={900 + i} /></g>);
    out.push(<Round key={key()} cx={m[0]} cy={m[1]} r={9} w={1.8} fill={C.boneHi} seed={800 + i} irr={0.05} />);
    out.push(<text key={key()} x={m[0]} y={m[1] + 3.8} fontSize="11" textAnchor="middle" fill={C.ink} fontFamily="var(--font-mono)" fontWeight={600}>{nt.n}</text>);
  });

  // registration marks at the corners
  for (const [x, y] of [[18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18]] as Pt[]) {
    out.push(<Pen key={key()} pts={[[x - 7, y], [x + 7, y]]} w={1.2} smooth={false} wob={0.2} color={C.graphite2} seed={x + y} />);
    out.push(<Pen key={key()} pts={[[x, y - 7], [x, y + 7]]} w={1.2} smooth={false} wob={0.2} color={C.graphite2} seed={x * 3 + y} />);
  }
  return out;
}

export function HeroPlate() {
  const art = useMemo(build, []);
  return (
    <figure className="hero-plate figure">
      <div className="plate hero-plate__frame">
        <div className="hero-plate__stage">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="hero-t hero-d" focusable="false">
            <title id="hero-t">Plate I: a handwritten digit read by a neural network</title>
            <desc id="hero-d">
              A handwritten 7, drawn as a nine-by-nine grid of pixels, enters at the bottom. Lines of different thickness carry it through three layers of units to ten
              bars at the top, one for each digit from 0 to 9. The bar for 7 is far taller than the others. The strongest route is traced in red.
            </desc>
            {art}
          </svg>
          <ol className="callouts">
            {HERO_NOTES.map((nt) => (
              <li key={nt.n} style={{ left: `${(nt.x / W) * 100}%`, top: `${(nt.y / H) * 100}%` }}>
                <span className="callouts__n num">{nt.n}</span>
                <strong>{nt.title}.</strong> {nt.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <figcaption>
        <span className="fig-no">Plate I</span>
        <span>A digit, read by a machine. Nothing in it was told what a 7 looks like: the weights were found from examples.</span>
      </figcaption>
    </figure>
  );
}
