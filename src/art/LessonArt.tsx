import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Shape, Stroke, Wash } from './Draw';
import { box, ell, type Pt } from './ink';
import { KernelParts, type Mood } from './Kernel';
import { Cloud, Crest, Gull, PaperLantern, Planks, Ripples } from './props';
import type { PathId } from '@/content/types';

const gearPts = (cx: number, cy: number, r: number, teeth: number): Pt[] => {
  const pts: Pt[] = [];
  const step = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const rad = i % 2 ? r * 0.8 : r;
    for (const off of [-0.3, 0.3]) pts.push([cx + Math.cos(i * step + step * off) * rad, cy + Math.sin(i * step + step * off) * rad]);
  }
  return pts;
};

/** A beam balance with a post, chains and two pans. `tilt` raises the right side when positive. */
function Balance({ tilt = 0, left, right }: { tilt?: number; left: JSX.Element; right: JSX.Element }) {
  const yl = -128 + tilt;
  const yr = -128 - tilt;
  return (
    <g>
      <Shape pts={[[-30, 0], [30, 0], [18, -16], [-18, -16]]} fill={C.woodDeep} w={2.8} />
      <Stroke pts={[[0, -16], [0, -126]]} w={8} color={INK} />
      <Stroke pts={[[0, -16], [0, -126]]} w={4} color={C.woodLight} />
      <Stroke pts={[[-104, yl], [0, -128], [104, yr]]} w={6} color={INK} />
      <Shape pts={ell(0, -130, 7, 7, 7, 0.1, 601)} smooth fill={C.seal} w={2.4} />
      {[[-104, yl], [104, yr]].map(([x, y], i) => (
        <g key={i}>
          <Stroke pts={[[x!, y!], [x! - 22, y! + 52]]} w={1.8} />
          <Stroke pts={[[x!, y!], [x! + 22, y! + 52]]} w={1.8} />
          <Shape pts={[[x! - 30, y! + 52], [x! + 30, y! + 52], [x! + 22, y! + 66], [x! - 22, y! + 66]]} smooth fill={C.straw} w={2.8} seed={610 + i} />
        </g>
      ))}
      <g transform={`translate(-104 ${yl + 52})`}>{left}</g>
      <g transform={`translate(104 ${yr + 52})`}>{right}</g>
    </g>
  );
}

const Fruit = ({ x, y, col, seed, r = 10 }: { x: number; y: number; col: string; seed: number; r?: number }) => (
  <g>
    <Shape pts={ell(x, y, r, r, 9, 0.06, seed)} smooth fill={col} w={2.4} hatch={{ angle: -50, gap: 4, w: 1 }} hatchOpacity={0.4} />
    <Stroke pts={[[x, y - r], [x + 2, y - r - 6]]} w={2} color={C.moss} />
  </g>
);

const Scroll = ({ x, y, w = 40, h = 52, seed = 1, lines = 4 }: { x: number; y: number; w?: number; h?: number; seed?: number; lines?: number }) => (
  <g>
    <Shape pts={box(x - w / 2, y - h, w, h)} fill={C.bone} w={2.6} seed={seed} />
    <Shape pts={ell(x - w / 2, y - h / 2, 5, h / 2 + 2, 8, 0.04, seed + 1)} smooth fill={C.paperLo} w={2.4} />
    <Flecks marks={Array.from({ length: lines }, (_, i) => [x - w / 2 + 8, y - h + 10 + i * ((h - 16) / lines), w - 18, 0] as [number, number, number, number])} w={2} opacity={0.8} seed={seed} />
  </g>
);

const VIGNETTES: Record<string, () => JSX.Element> = {
  u1: () => (
    <Balance
      tilt={6}
      left={<Scroll x={0} y={-8} w={34} h={44} seed={620} lines={5} />}
      right={
        <g>
          <Fruit x={-10} y={-10} col={C.clothRed} seed={621} />
          <Fruit x={10} y={-12} col={C.clothOchre} seed={622} />
          <Fruit x={0} y={-26} col={C.clothTeal} seed={623} />
        </g>
      }
    />
  ),
  u2: () => (
    <g>
      <Shape pts={[[-170, 0], [-60, 0], [-64, -64], [-166, -64]]} fill={C.wood} w={3.2} hatch={{ angle: -60, gap: 6, w: 1.2 }} hatchOpacity={0.45} />
      <Shape pts={[[-150, -70], [-76, -70], [-72, -56], [-154, -56]]} fill={C.woodLight} w={2.6} />
      {[[-146, C.clothRed], [-122, C.clothRed], [-98, C.clothRed], [-134, C.clothRed], [-110, C.clothRed]].map(([x, c], i) => (
        <Fruit key={i} x={x as number} y={-76 - (i % 2) * 12} col={c as string} seed={630 + i} r={11} />
      ))}
      <Shape pts={[[-40, 0], [70, 0], [66, -64], [-44, -64]]} fill={C.wood} w={3.2} hatch={{ angle: -60, gap: 6, w: 1.2 }} hatchOpacity={0.45} />
      {[[-26, 0], [-2, 4], [22, 0], [46, 4], [-14, -14]].map(([x, y], i) => (
        <g key={i}>
          <Shape pts={box((x as number) - 10, (y as number) - 88, 20, 20)} fill={C.clothTeal} w={2.4} seed={640 + i} />
        </g>
      ))}
      <Shape pts={[[100, 0], [104, -150], [210, -154], [206, -4]]} fill={C.ink2} w={4} />
      <Stroke pts={[[110, -138], [200, -142]]} w={2} color={C.bone} opacity={0.5} />
      {[[124, -112, 0], [144, -96, 0], [132, -78, 0], [160, -122, 1], [178, -104, 1], [168, -84, 1], [186, -70, 1]].map(([x, y, k], i) =>
        k ? <Shape key={i} pts={box((x as number) - 5, (y as number) - 5, 10, 10)} fill={C.bone} w={1.4} seed={650 + i} /> : <Shape key={i} pts={ell(x as number, y as number, 5.5, 5.5, 6, 0.1, 650 + i)} smooth fill={C.lantern} w={1.4} />,
      )}
      <Stroke pts={[[112, -64], [200, -66]]} w={3} color={C.bone} opacity={0.7} />
    </g>
  ),
  u3: () => (
    <g>
      <Shape pts={box(-150, -150, 300, 14)} fill={C.wood} w={3} />
      <Shape pts={box(-150, -14, 300, 14)} fill={C.wood} w={3} />
      <Shape pts={box(-156, -150, 12, 150)} fill={C.woodDeep} w={3} />
      <Shape pts={box(144, -150, 12, 150)} fill={C.woodDeep} w={3} />
      {(() => {
        const cols = [[-100, 2], [0, 4], [100, 3]] as const;
        const nodes: Pt[][] = cols.map(([x, n]) => Array.from({ length: n }, (_, i) => [x, -136 + ((i + 0.5) * 120) / n] as Pt));
        const lines: JSX.Element[] = [];
        nodes.slice(0, -1).forEach((a, ai) => a.forEach((p, i) => nodes[ai + 1]!.forEach((q, j) => lines.push(<Stroke key={`${ai}${i}${j}`} pts={[p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 2], q]} w={1.6 + ((i + j) % 3)} color={C.indigo} seed={660 + ai * 9 + i * 3 + j} />))));
        return (
          <g>
            {lines}
            {nodes.flat().map((p, i) => (
              <Shape key={i} pts={ell(p[0], p[1], 10, 10, 8, 0.08, 670 + i)} smooth fill={i % 3 ? C.bone : C.lantern} w={2.8} />
            ))}
          </g>
        );
      })()}
      <Stroke pts={[[170, -90], [190, -90], [196, -66], [186, -50]]} w={6} color={INK} />
      <Shape pts={ell(190, -44, 10, 10, 8, 0.08, 690)} smooth fill={C.woodLight} w={2.6} />
    </g>
  ),
  u4: () => (
    <g>
      <Shape pts={[[-170, 0], [170, 0], [160, -22], [-160, -22]]} fill={C.bone} w={3} />
      <Shape pts={ell(-170, -11, 9, 16, 8, 0.05, 700)} smooth fill={C.paperLo} w={2.8} />
      <Shape pts={ell(170, -11, 9, 16, 8, 0.05, 701)} smooth fill={C.paperLo} w={2.8} />
      {['the', 'harbor', 'at', 'dawn', 'is', '…'].map((_, i) => (
        <g key={i}>
          <Shape pts={box(-150 + i * 54, -16 - (i % 2) * 3, 46, 14)} fill={i === 5 ? C.lantern : C.paper} w={1.8} seed={710 + i} />
          <Flecks marks={[[-144 + i * 54, -9 - (i % 2) * 3, 30, 0]]} w={2.4} opacity={0.8} />
        </g>
      ))}
      <Stroke pts={[[110, -90], [140, -36], [148, -20]]} w={4} color={INK} />
      <Shape pts={[[96, -120], [112, -92], [118, -110], [128, -98]]} fill={C.bone} w={2.2} />
      <Shape pts={[[150, -30], [182, -30], [180, -4], [152, -4]]} smooth fill={C.ink2} w={2.8} />
      <Flecks marks={[[-120, -40, 10, -80], [-60, -46, 10, -70], [20, -42, 10, -90]]} w={2.4} />
    </g>
  ),
  u5: () => (
    <g>
      <Stroke pts={[[-176, -60], [-80, -48], [0, -64], [90, -50], [180, -60]]} w={4} color={INK} />
      {Array.from({ length: 11 }, (_, i) => {
        const x = -164 + i * 33;
        const out = i < 6;
        return <Shape key={i} pts={ell(x, -56 + Math.sin(i * 0.9) * 6, 12, 12, 9, 0.08, 720 + i)} smooth fill={out ? C.paperLo : [C.lantern, C.clothTeal, C.clothRed, C.bone, C.clothOchre][i % 5]!} w={2.6} hatch={out ? { angle: 45, gap: 4, w: 1.2 } : false} hatchOpacity={0.5} />;
      })}
      <Shape pts={box(40, -110, 150, 110)} w={5} fill={C.woodLight} fillOpacity={0.0} ink={C.woodDeep} seed={730} />
      <Stroke pts={[[40, -110], [190, -110]]} w={9} color={C.woodDeep} />
      <Stroke pts={[[40, 0], [190, 0]]} w={9} color={C.woodDeep} />
    </g>
  ),
  t1: () => (
    <g>
      <Shape pts={box(-170, -170, 340, 170)} fill={C.woodLight} w={4} hatch={{ angle: -80, gap: 8, w: 1.2 }} hatchOpacity={0.35} />
      {[[-120, 'wrench'], [-40, 'saw'], [40, 'brush'], [120, 'lens']].map(([x, k], i) => (
        <g key={i} transform={`translate(${x} -88)`}>
          {k === 'wrench' ? <Shape pts={[[-8, -50], [10, -50], [14, -34], [4, -26], [4, 36], [-4, 36], [-4, -26], [-14, -34]]} smooth fill={C.ink3} w={3} /> : null}
          {k === 'saw' ? (
            <g>
              <Shape pts={[[-30, -20], [32, -30], [34, -4], [-30, 6]]} fill={C.bone} w={2.8} />
              <Flecks marks={[[-26, 6, 56, -9]]} w={3} />
              <Shape pts={ell(-38, -8, 10, 14, 8, 0.05, 750)} smooth fill={C.woodDeep} w={2.6} />
            </g>
          ) : null}
          {k === 'brush' ? (
            <g>
              <Stroke pts={[[0, 44], [0, -10]]} w={8} color={INK} />
              <Stroke pts={[[0, 44], [0, -10]]} w={4} color={C.woodLight} />
              <Shape pts={[[-9, -10], [9, -10], [11, -42], [0, -50], [-11, -42]]} smooth fill={C.clothRed} w={2.6} />
            </g>
          ) : null}
          {k === 'lens' ? (
            <g>
              <Shape pts={ell(0, -14, 24, 24, 12, 0.03, 751)} smooth fill={C.tealLight} fillOpacity={0.6} w={4.2} />
              <Stroke pts={[[16, 6], [30, 44]]} w={8} color={INK} />
            </g>
          ) : null}
          <Shape pts={box(-14, 52, 28, 14)} fill={C.bone} w={1.8} seed={760 + i} />
        </g>
      ))}
    </g>
  ),
  t2: () => (
    <g>
      <Scroll x={0} y={-6} w={190} h={140} seed={770} lines={0} />
      {[C.clothRed, C.clothOchre, C.clothTeal, C.indigo, C.moss].map((c, i) => (
        <g key={i}>
          <Stroke pts={[[-80 + i * 40, -126], [-80 + i * 40, -22]]} w={12} color={INK} seed={780 + i} />
          <Stroke pts={[[-80 + i * 40, -126], [-80 + i * 40, -22]]} w={7} color={c} seed={790 + i} />
          <Flecks marks={[[-96 + i * 40, -110 + (i % 2) * 6, 32, 0]]} w={2.2} opacity={0.7} />
        </g>
      ))}
      <Shape pts={ell(0, -140, 9, 9, 8, 0.08, 800)} smooth fill={C.seal} w={2.6} />
    </g>
  ),
  t3: () => (
    <g>
      <Shape pts={ell(0, -76, 84, 66, 18, 0.03, 810)} smooth w={0} reg={[0, 0]} fill={C.paperLo} fillOpacity={0.5} />
      <Stroke pts={[[-80, -50], [-70, -110], [-10, -140], [60, -124], [86, -70]]} w={9} color={C.seal} taper={0.12} />
      <Shape pts={[[76, -84], [100, -66], [80, -52]]} fill={C.seal} w={2.8} />
      <Stroke pts={[[80, -40], [60, -4], [-20, 6], [-76, -22]]} w={9} color={C.clothTeal} taper={0.12} />
      <Shape pts={[[-86, -28], [-64, -34], [-70, -10]]} fill={C.clothTeal} w={2.8} />
      <Shape pts={[[-18, -64], [30, -88], [38, -80], [-8, -52]]} fill={C.straw} w={2.8} />
      <Shape pts={[[-18, -64], [-8, -52], [-26, -50]]} fill={INK} w={1.4} />
    </g>
  ),
  t4: () => (
    <g>
      <Shape pts={[[-110, 0], [80, 0], [84, -150], [-106, -154]]} fill={C.bone} w={3.4} />
      <Flecks marks={[[-90, -128, 120, 0], [-90, -108, 90, 0], [-90, -88, 110, 0], [-90, -68, 70, 0], [-90, -48, 100, 0]]} w={2.6} opacity={0.85} />
      <Shape pts={[[-96, -108], [-88, -100], [-70, -122]]} w={3} ink={'#2c6b35'} open fill={undefined} />
      <Stroke pts={[[-92, -62], [-76, -46]]} w={4} color={C.roofRed} />
      <Stroke pts={[[-76, -62], [-92, -46]]} w={4} color={C.roofRed} />
      <Shape pts={ell(60, -78, 44, 44, 14, 0.03, 820)} smooth fill={C.tealLight} fillOpacity={0.55} w={5.4} />
      <Stroke pts={[[40, -96], [54, -108]]} w={3} color={C.bone} />
      <Stroke pts={[[92, -46], [130, 2]]} w={11} color={INK} />
      <Stroke pts={[[92, -46], [130, 2]]} w={5.4} color={C.woodLight} />
    </g>
  ),
  t5: () => (
    <g>
      {[[-90, -4, C.clothRed, 180], [-84, -34, C.indigo, 164], [-96, -62, C.clothOchre, 176], [-88, -90, C.clothTeal, 160]].map(([x, y, col, w], i) => (
        <g key={i}>
          <Shape pts={box((x as number) - (w as number) / 2, (y as number) - 28, w as number, 28)} fill={col as string} w={3} seed={830 + i} />
          <Stroke pts={[[(x as number) - (w as number) / 2 + 8, (y as number) - 20], [(x as number) + (w as number) / 2 - 8, (y as number) - 20]]} w={2.6} color={C.bone} />
          <Shape pts={box((x as number) - (w as number) / 2 + 2, (y as number) - 6, (w as number) - 4, 6)} fill={C.bone} w={1.6} seed={840 + i} />
        </g>
      ))}
      <PaperLantern x={80} y={-80} s={2} seed={850} />
      <Shape pts={box(60, -30, 40, 30)} fill={C.wood} w={3} />
      <Stroke pts={[[112, -10], [150, -150]]} w={4} color={INK} />
      <Shape pts={[[146, -150], [160, -172], [158, -140]]} fill={C.bone} w={2.4} />
      <Shape pts={[[130, -32], [170, -32], [166, -4], [134, -4]]} smooth fill={C.clothTeal} w={3} />
    </g>
  ),
  r1: () => (
    <Balance
      tilt={-26}
      left={<Shape pts={[[-18, -4], [-8, -34], [12, -36], [22, -4]]} smooth fill={C.hillNear} w={3} hatch={{ angle: -50, gap: 5, w: 1.2 }} hatchOpacity={0.5} />}
      right={
        <g>
          <Stroke pts={[[-14, 0], [16, -34]]} w={7} color={INK} />
          <Stroke pts={[[-14, 0], [16, -34]]} w={3.4} color={C.woodLight} />
          <Shape pts={[[10, -42], [28, -30], [20, -24], [6, -36]]} fill={C.woodLight} w={2.4} />
        </g>
      }
    />
  ),
  r2: () => (
    <g>
      <Shape pts={[[-130, -4], [-4, -20], [-6, -118], [-132, -104]]} fill={C.bone} w={3.4} />
      <Shape pts={[[130, -4], [4, -20], [6, -118], [132, -104]]} fill={C.bone} w={3.4} />
      <Stroke pts={[[0, -20], [0, -118]]} w={4} />
      <Flecks marks={[[-116, -86, 90, -6], [-116, -66, 70, -6], [-116, -46, 84, -6]]} w={2.6} opacity={0.85} />
      <Shape pts={[[14, -106], [118, -92], [120, -34], [16, -34]]} w={2.6} fill={undefined} ink={C.roofRed} />
      <Flecks marks={[[26, -84, 70, 8], [26, -64, 56, 8], [26, -46, 62, 8]]} w={2.4} color={C.roofRed} opacity={0.6} />
      <Stroke pts={[[50, -150], [64, -166], [82, -156], [78, -140], [66, -132]]} w={6} color={C.seal} />
      <Shape pts={ell(66, -122, 4, 4, 6, 0.1, 860)} smooth fill={C.seal} w={0} reg={[0, 0]} />
      <Flecks marks={[[-30, -150, 12, -110], [-8, -158, 12, -90], [14, -152, 12, -70]]} w={3} />
    </g>
  ),
  r3: () => (
    <g>
      <Shape pts={ell(-70, -96, 56, 62, 16, 0.02, 870)} smooth fill={C.tealLight} fillOpacity={0.45} w={6} />
      <Stroke pts={[[-70, -34], [-70, 6]]} w={12} color={INK} />
      <Stroke pts={[[-70, -34], [-70, 6]]} w={6.4} color={C.woodLight} />
      <Stroke pts={[[-100, -120], [-84, -134]]} w={3.4} color={C.bone} />
      <Flecks marks={[[-96, -96, 54, 6], [-92, -80, 44, 3], [-96, -64, 50, 5]]} w={2.6} color={C.bone} opacity={0.7} />
      <PaperLantern x={50} y={-70} s={2} seed={880} />
      <Stroke pts={[[50, -120], [50, -150]]} w={2.6} />
      <Shape pts={ell(140, -62, 26, 34, 12, 0.05, 881)} smooth w={3} fill={undefined} ink={C.roofRed} />
      <Flecks marks={[[126, -80, 24, 0], [126, -62, 20, 0], [126, -44, 22, 0]]} w={2.2} color={C.roofRed} opacity={0.6} />
      <Stroke pts={[[140, -28], [140, -4]]} w={2.6} color={C.roofRed} opacity={0.6} />
    </g>
  ),
  r4: () => (
    <g>
      <Shape pts={[[-110, 0], [110, 0], [110, -84], [-110, -84]]} fill={C.wood} w={4} hatch={{ angle: -70, gap: 7, w: 1.3 }} hatchOpacity={0.45} />
      <Shape pts={[[-114, -84], [-100, -128], [100, -128], [114, -84]]} smooth fill={C.woodLight} w={4} />
      <Stroke pts={[[-110, -50], [0, -46], [110, -50]]} w={7} color={C.ink3} />
      <Stroke pts={[[-60, -128], [-60, 0]]} w={7} color={C.ink3} />
      <Stroke pts={[[60, -128], [60, 0]]} w={7} color={C.ink3} />
      <Shape pts={box(-22, -78, 44, 40)} fill={C.lantern} w={3.6} />
      <Shape pts={ell(0, -62, 6, 6, 7, 0.05, 890)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Stroke pts={[[0, -58], [0, -46]]} w={4} />
      <Stroke pts={[[-22, -78], [-22, -96], [0, -108], [22, -96], [22, -78]]} w={6} color={INK} />
      <Stroke pts={[[-110, -20], [-150, 4], [-170, -8]]} w={6} color={C.ink3} />
      <Shape pts={ell(-170, -8, 10, 10, 8, 0.05, 891)} smooth fill={C.lantern} w={2.6} />
    </g>
  ),
  r5: () => (
    <g>
      <Shape pts={[[-150, 0], [110, 0], [110, -22], [-150, -22]]} fill={C.bone} w={3} />
      <Flecks marks={[[-134, -14, 100, 0], [-134, -8, 80, 0]]} w={2.2} opacity={0.7} />
      <Shape pts={ell(-40, -26, 34, 12, 14, 0.04, 900)} smooth fill={C.seal} w={3.2} hatch={{ angle: -45, gap: 5, w: 1.1 }} hatchOpacity={0.45} />
      <Stroke pts={[[-40, -34], [-40, -110]]} w={16} color={INK} />
      <Stroke pts={[[-40, -34], [-40, -110]]} w={9} color={C.woodLight} />
      <Shape pts={ell(-40, -116, 22, 12, 12, 0.05, 901)} smooth fill={C.woodLight} w={3.2} />
      <Shape pts={[[50, 0], [96, 0], [92, -44], [54, -44]]} smooth fill={C.ink2} w={3.2} />
      <Stroke pts={[[110, -38], [150, -150]]} w={4} color={INK} />
      <Shape pts={[[146, -150], [164, -176], [160, -140]]} fill={C.bone} w={2.4} />
    </g>
  ),
};


export const LESSON_ALT: Record<string, string> = {
  u1: 'A hand-inked balance scale: a scroll of written rules on one pan and a handful of fruit, the examples, on the other. Kernel the robot studies it.',
  u2: 'Hand-inked crates of round and square fruit beside a chalkboard scattered with dots, as Kernel the robot looks on.',
  u3: 'A hand-inked wooden frame of knots joined by threads in three columns, a small network, with a crank at the side and Kernel studying it.',
  u4: 'A hand-inked scroll unrolling with word blocks laid out like a sentence, a quill and an ink pot, with Kernel the robot cheering.',
  u5: 'A hand-inked string of beads, the tokens, with the earliest beads crossed out and a wooden frame around the last few, and Kernel looking alarmed.',
  t1: 'A hand-inked pegboard of tools: a wrench, a saw, a brush and a magnifying lens, each with a tag, and Kernel the robot beside it.',
  t2: 'A hand-inked scroll with five colored ribbons hanging from it, one for each part of a prompt, and Kernel the robot thinking.',
  t3: 'A hand-inked loop of two arrows chasing each other around a pencil, for refining again and again, with Kernel cheering.',
  t4: 'A hand-inked document with a green tick and two red crosses, and a large magnifying glass checking it, with Kernel looking alert.',
  t5: 'A hand-inked stack of colorful books beside a paper lantern, a quill and a small pot, with Kernel the robot at ease.',
  r1: 'A hand-inked balance scale tipped heavily to one side: a stone on the low pan, an oar on the high pan, with Kernel thinking.',
  r2: 'A hand-inked open book whose right page is only a dashed outline, with red question marks rising from it and Kernel looking alarmed.',
  r3: 'A hand-inked hand mirror reflecting a streaked picture, beside a paper lantern and a dashed-outline copy of it, with Kernel alert.',
  r4: 'A hand-inked wooden chest wrapped in chains with a big padlock, and a small gold key on a string, with Kernel thinking.',
  r5: 'A hand-inked wax seal stamp pressed on a ledger beside an ink pot and a quill, with Kernel cheering.',
};

const MOODS: Record<string, Mood> = { u1: 'think', u2: 'idle', u3: 'think', u4: 'cheer', u5: 'alert', t1: 'idle', t2: 'think', t3: 'cheer', t4: 'alert', t5: 'idle', r1: 'think', r2: 'alert', r3: 'alert', r4: 'think', r5: 'cheer' };

/** A different background composition for every lesson: the seed moves and varies the furniture. */
function Backdrop({ path, n }: { path: PathId; n: number }) {
  const sx = (a: number, b: number, k = 1) => a + ((n * 53 * k) % 100) * ((b - a) / 100);
  if (path === 'understand') {
    return (
      <g>
        <rect width="640" height="260" fill="#d9d2c0" />
        {[0, 1, 2, 3].map((i) => (
          <Stroke key={i} pts={[[sx(40, 600, i + 1) - i * 20 + i * 150, 0], [sx(40, 600, i + 1) - i * 20 + i * 150 + 1, 100], [sx(40, 600, i + 1) - i * 20 + i * 150, 214]]} w={9} color={C.woodDeep} seed={950 + i} />
        ))}
        <Stroke pts={[[0, 20], [320, 28], [640, 18]]} w={12} color={C.woodDeep} seed={960} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <g key={i}>
            <Stroke pts={[[sx(20, 620, i + 2) * 0 + 40 + ((i * 97 + n * 41) % 560), 26], [40 + ((i * 97 + n * 41) % 560), 44]]} w={2.4} />
            <Shape pts={box(32 + ((i * 97 + n * 41) % 560), 44, 16, 48 + (i % 3) * 10)} smooth fill={[C.clothRed, C.clothOchre, C.clothTeal, C.indigo][(i + n) % 4]!} w={2.4} seed={970 + i} />
          </g>
        ))}
        {(() => {
          const x = sx(30, 330);
          const arch: Pt[] = [[x, 214], [x, 112], [x + 8, 86], [x + 22, 70], [x + 38, 64], [x + 54, 70], [x + 68, 86], [x + 76, 112], [x + 76, 214]];
          return (
            <g>
              <Shape pts={arch} fill={C.sky1} w={3.8} />
              <Shape pts={[[x + 2, 214], [x + 2, 176], [x + 24, 158], [x + 44, 172], [x + 74, 150], [x + 74, 214]]} fill={C.hillFar} w={2.4} hatch={{ angle: -55, gap: 6, w: 1.1 }} hatchOpacity={0.5} />
              <Shape pts={ell(x + 40, 118, 15, 15, 12, 0.02, 980)} smooth fill={C.sun} w={2.4} />
              <Stroke pts={[[x + 38, 64], [x + 38, 214]]} w={3} />
            </g>
          );
        })()}
      </g>
    );
  }
  if (path === 'use') {
    return (
      <g>
        <rect width="640" height="260" fill="#c9b78f" />
        {Array.from({ length: 16 }, (_, i) => (
          <Stroke key={i} pts={[[i * 42, 0], [i * 42 + 1, 100], [i * 42 - 1, 214]]} w={2.2} opacity={0.5} seed={990 + i} wob={1} />
        ))}
        <Shape pts={gearPts(sx(60, 260), 74, 54, 10)} fill={C.teal} w={3.6} hatch={{ angle: -50, gap: 7, w: 1.2 }} hatchOpacity={0.4} />
        <Shape pts={ell(sx(60, 260), 74, 18, 18, 12, 0.02, 1000)} smooth fill={C.bone} w={3} />
        <Shape pts={gearPts(sx(400, 590, 2), 56, 38, 8)} fill={C.tealDeep} w={3.4} />
        <Shape pts={ell(sx(400, 590, 2), 56, 12, 12, 10, 0.03, 1001)} smooth fill={C.bone} w={2.6} />
        <Shape pts={gearPts(sx(300, 440, 3), 120, 28, 7)} fill={C.lantern} w={3} />
        <Stroke pts={[[sx(120, 560, 4), 0], [sx(120, 560, 4), 60]]} w={3} />
        <PaperLantern x={sx(120, 560, 4)} y={84} s={1.1} seed={1002} />
      </g>
    );
  }
  return (
    <g>
      <rect width="640" height="260" fill="#f0d9a8" />
      <rect y="70" width="640" height="100" fill={C.sky2} opacity="0.8" />
      <Flecks marks={[[10, 30, 140, 0], [300, 20, 130, 1], [60, 120, 150, 0], [440, 130, 160, 1]]} w={3.6} color={C.skyHigh} opacity={0.7} seed={1010} />
      <Shape pts={ell(sx(70, 560), 96, 40, 40, 16, 0.015, 1011)} smooth fill={C.sun} w={3} hatch={{ angle: -35, gap: 9, w: 1.3, density: 0.8 }} hatchColor={C.roofRed} hatchOpacity={0.5} />
      <Cloud x={sx(100, 540, 2)} y={50} w={170} seed={1012 + n} fill={C.paperHi} />
      <Gull x={sx(80, 560, 3)} y={130} s={0.8} seed={n} />
      <Gull x={sx(80, 560, 3) + 40} y={150} s={0.6} seed={n + 1} />
      <rect y="170" width="640" height="90" fill={C.teal} />
      <Ripples x0={0} x1={640} y0={180} y1={254} n={26} seed={n + 3} />
      <Stroke pts={[[0, 171], [320, 173], [640, 171]]} w={5} />
      <Crest x={sx(60, 540, 5)} y={236} s={40} seed={n + 4} flip={n % 2 ? 1 : -1} />
    </g>
  );
}

/** A bespoke hand-inked illustration for each lesson: its own vignette, its own backdrop composition, and Kernel acting it out. */
export const LessonArt = memo(function LessonArt({ lessonId, path, index, className, label }: { lessonId: string; path: PathId; index: number; className?: string; label: string }) {
  const V = VIGNETTES[lessonId];
  return (
    <svg className={className} viewBox="0 0 640 260" preserveAspectRatio="xMaxYMid slice" role="img" aria-label={label} focusable="false">
      <g filter="url(#rough)">
        <Backdrop path={path} n={index + 1} />
        <Planks pts={[[0, 214], [640, 214], [640, 260], [0, 260]]} rows={2} seed={1100 + index} />
        <Wash pts={[[40, 214], [330, 220], [620, 214], [600, 232], [330, 236], [60, 232]]} fill={INK} opacity={0.22} />
        <g transform="translate(300 216) scale(1)">{V ? <V /> : null}</g>
        <g transform={`translate(${468 + (index % 3) * 6} ${80 + (index % 2) * 4}) scale(${0.5 - (index % 3) * 0.02})`}>
          <KernelParts mood={MOODS[lessonId] ?? 'idle'} />
        </g>
      </g>
      <rect width="640" height="260" filter="url(#grain)" opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
});
