/**
 * The back walls of the interiors. They sit on a slower layer than the furniture, so walking past a room slides
 * the props over the wall and the room gains depth. Each wall has its own windows and fittings.
 */
import { memo, type ReactNode } from 'react';
import { C } from '@/art/palette';
import { At, Dry, Flecks, Hatch, Shape, Stroke, Tone, Wash } from '@/art/Draw';
import { box, ell } from '@/art/ink';
import { Boat, Ripples } from '@/art/props';
import { Banner, CompassRose, GearWheel, MapSheet, Plaster, Shelf, Window } from '@/art/kit';
import type { RoomId } from '../data';
import { ROOMS } from '../rooms';
import { H, RoomSvg, Stonework, WALL_BASE } from './parts';

const farWidth = (id: RoomId) => ROOMS[id].width * 0.5 + 1700;

/** What you see through a window: a strip of sky and sea, with a boat. */
function View({ w, h, night = false, seed = 1 }: { w: number; h: number; night?: boolean; seed?: number }) {
  return (
    <g>
      <rect width={w} height={h} fill={night ? C.ink2 : C.sky1} />
      {night ? <Flecks marks={Array.from({ length: 9 }, (_, i) => [(i * 37) % w, ((i * 53) % (h * 0.5)) + 4, 3, i * 40] as [number, number, number, number])} w={2.6} color={C.lantern} seed={seed} /> : <Dry pts={[[0, h * 0.2], [w * 0.5, h * 0.18], [w, h * 0.22]]} w={h * 0.08} color={C.skyHigh} opacity={0.8} seed={seed} bristles={5} />}
      <rect y={h * 0.58} width={w} height={h * 0.42} fill={night ? C.tealDeep : C.teal} />
      <Ripples x0={0} x1={w} y0={h * 0.62} y1={h * 0.95} n={Math.max(4, Math.round(w / 12))} seed={seed + 1} />
      <Stroke pts={[[0, h * 0.58], [w, h * 0.58]]} w={3} smooth={false} seed={seed + 2} />
      {w > 90 ? <Boat x={w * 0.6} y={h * 0.74} s={0.28} seed={seed + 3} /> : null}
    </g>
  );
}

function Bay({ x, y, w, h, arch = true, night = false, seed = 1 }: { x: number; y: number; w: number; h: number; arch?: boolean; night?: boolean; seed?: number }) {
  return (
    <g>
      <Window x={x} y={y} w={w} h={h} arch={arch} seed={seed}>
        <View w={w} h={h} night={night} seed={seed} />
      </Window>
      {!night ? (
        <path d={`M${x + w * 0.1} ${y + h} L${x + w * 1.1} ${WALL_BASE} L${x + w * 1.5} ${WALL_BASE} L${x + w * 0.5} ${y + h}Z`} fill="url(#glow)" opacity="0.28" style={{ mixBlendMode: 'screen' }} />
      ) : null}
    </g>
  );
}

const row = (from: number, to: number, step: number): number[] => {
  const out: number[] = [];
  for (let x = from; x < to; x += step) out.push(x);
  return out;
};

function Wall({ id, children, base }: { id: RoomId; children: ReactNode; base: ReactNode }) {
  const W = farWidth(id);
  return (
    <RoomSvg w={W}>
      {base}
      {children}
      <Shape pts={box(0, WALL_BASE - 14, W, 22)} fill={C.ink3} w={0} reg={[0, 0]} />
      <Hatch pts={box(0, WALL_BASE - 40, W, 28)} angle={-50} gap={6} w={1.2} opacity={0.35} />
      <Stroke pts={[[0, WALL_BASE - 14], [W / 2, WALL_BASE - 13], [W, WALL_BASE - 14]]} w={4} seed={3} />
      <rect y={WALL_BASE + 8} width={W} height={H - WALL_BASE} fill={C.paperLo} />
    </RoomSvg>
  );
}

export const LoomFar = memo(function LoomFar() {
  const W = farWidth('loom');
  return (
    <Wall id="loom" base={<Plaster x={0} y={0} w={W} h={WALL_BASE} fill="#d2d0cb" seed={3} />}>
      {row(160, W - 200, 430).map((x, i) => (
        <g key={x}>
          <Bay x={x} y={120} w={130} h={230} seed={10 + i} />
          <Banner x={x + 230} y={100} w={58} h={200} fill={i % 2 ? C.ink3 : C.clothOchre} seed={20 + i}>
            <Tone pts={box(8, 24, 42, 150)} opacity={0.45} />
            <Stroke pts={[[29, 28], [29, 170]]} w={2} color={C.lantern} smooth={false} />
          </Banner>
        </g>
      ))}
      {row(300, W - 200, 860).map((x, i) => <Shelf key={x} x={x} y={380} w={190} seed={30 + i} />)}
      <Dry pts={[[0, 70], [W / 2, 62], [W, 72]]} w={30} color={C.paperHi} opacity={0.4} seed={9} bristles={7} />
    </Wall>
  );
});

export const FoundryFar = memo(function FoundryFar() {
  const W = farWidth('foundry');
  return (
    <Wall id="foundry" base={<Stonework x={0} y={0} w={W} h={WALL_BASE} fill={C.ink3} course={52} block={120} seed={41} />}>
      <Wash pts={ell(W * 0.55, 380, W * 0.2, 120, 12, 0.1, 5)} fill={C.lantern} opacity={0.18} />
      {row(120, W - 200, 520).map((x, i) => (
        <g key={x}>
          <Bay x={x} y={96} w={86} h={120} arch={false} night seed={50 + i} />
          <At x={x + 260} y={250}><GearWheel x={0} y={0} r={74} teeth={14} fill={C.ink2} seed={60 + i} rot={i * 9} /></At>
          <Stroke pts={[[x + 400, 0], [x + 402, 150]]} w={4} color={C.sky3} seed={70 + i} smooth={false} />
          <Stroke pts={[[x + 400, 150], [x + 412, 190], [x + 400, 230]]} w={6} color={C.sky3} seed={75 + i} />
        </g>
      ))}
      <Dry pts={[[0, 420], [W / 2, 410], [W, 424]]} w={40} color={C.lantern} opacity={0.14} seed={8} bristles={7} />
    </Wall>
  );
});

export const BeaconFar = memo(function BeaconFar() {
  const W = farWidth('beacon');
  return (
    <Wall id="beacon" base={<Stonework x={0} y={0} w={W} h={WALL_BASE} fill={C.paperLo} course={48} block={110} seed={81} />}>
      {row(140, W - 200, 400).map((x, i) => (
        <g key={x}>
          <Bay x={x} y={70} w={74} h={300} night seed={90 + i} />
          <path d={`M${x + 37} 200 L${x + 460} 140 L${x + 460} 260Z`} fill="url(#glow)" opacity="0.2" style={{ mixBlendMode: 'screen' }} />
        </g>
      ))}
      {row(330, W - 300, 800).map((x, i) => (
        <g key={x}>
          <MapSheet x={x} y={150} s={1.2} w={140} h={100} seed={100 + i} r={-3} />
          <CompassRose x={x + 200} y={200} r={46} seed={105 + i} />
        </g>
      ))}
    </Wall>
  );
});

export const ArchiveFar = memo(function ArchiveFar() {
  const W = farWidth('archive');
  return (
    <Wall id="archive" base={<Stonework x={0} y={0} w={W} h={WALL_BASE} fill={C.paperHi} course={54} block={130} seed={121} />}>
      {row(110, W - 160, 340).map((x, i) => (
        <g key={x}>
          <Shape pts={[[x, 400], [x, 220], [x + 20, 160], [x + 90, 128], [x + 160, 160], [x + 180, 220], [x + 180, 400]]} smooth fill={C.ink2} w={3.4} seed={130 + i} />
          {[0, 1, 2].map((r) => (
            <Flecks key={r} marks={Array.from({ length: 9 }, (_, k) => [x + 14 + k * 17, 252 + r * 44, 30, 90] as [number, number, number, number])} w={9} color={[C.paperLo, C.straw, C.sky3][r]!} seed={140 + r + i} />
          ))}
          <path d={`M${x + 20} 128 L${x + 300} 480 L${x + 380} 480 L${x + 120} 128Z`} fill="url(#glow)" opacity="0.18" style={{ mixBlendMode: 'screen' }} />
        </g>
      ))}
      <Dry pts={[[0, 80], [W / 2, 72], [W, 82]]} w={30} color={C.paperHi} opacity={0.5} seed={11} bristles={7} />
    </Wall>
  );
});

export const HallFar = memo(function HallFar() {
  const W = farWidth('hall');
  return (
    <Wall id="hall" base={<Plaster x={0} y={0} w={W} h={WALL_BASE} fill={C.paperLo} seed={151} />}>
      {row(0, W, 190).map((x, i) => (
        <g key={x}>
          <Shape pts={box(x + 20, 30, 150, 110)} fill={C.paperHi} w={2.4} seed={160 + i} />
          <Shape pts={box(x + 34, 44, 122, 82)} fill={C.paperLo} w={2} seed={170 + i} />
        </g>
      ))}
      {row(180, W - 200, 470).map((x, i) => (
        <g key={x}>
          <Bay x={x} y={170} w={110} h={240} seed={180 + i} />
          <Banner x={x + 210} y={170} w={60} h={190} fill={C.ink3} seed={190 + i}>
            <Shape pts={ell(30, 60, 14, 14, 9, 0.05, 195 + i)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
          </Banner>
        </g>
      ))}
    </Wall>
  );
});

export const OfficeFar = memo(function OfficeFar() {
  const W = farWidth('office');
  return (
    <Wall id="office" base={<Plaster x={0} y={0} w={W} h={WALL_BASE} fill="#b5b3ad" seed={201} />}>
      {row(60, W, 22).map((x) => <Stroke key={x} pts={[[x, 0], [x + 1, WALL_BASE]]} w={1.5} opacity={0.18} smooth={false} seed={x} />)}
      {row(200, W - 300, 560).map((x, i) => (
        <g key={x}>
          <MapSheet x={x} y={110} s={2.1} w={160} h={110} seed={210 + i} />
          <Bay x={x + 420} y={110} w={120} h={210} seed={220 + i} />
          <Shelf x={x + 80} y={380} w={220} seed={230 + i} />
        </g>
      ))}
    </Wall>
  );
});

export const FAR: Record<Exclude<RoomId, 'quay'>, React.ComponentType> = { loom: LoomFar, foundry: FoundryFar, beacon: BeaconFar, archive: ArchiveFar, hall: HallFar, office: OfficeFar };
