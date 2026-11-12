/**
 * The Quay: a long stone walk along the harbor with six buildings on it, one per door.
 * QuayFar is the sea, sky and headland (moves at half speed). QuayNear is the ground and the buildings.
 */
import { memo } from 'react';
import { C } from '@/art/palette';
import { At, Dry, Flecks, Hatch, Shape, Stroke } from '@/art/Draw';
import { box, ell } from '@/art/ink';
import { Barrel, Boat, Cloud, Crate, Gull, Pine, Ripples, Rope, Smoke, TileRoof } from '@/art/props';
import { Banner, Basket, Cat, GearWheel, Lettering, MiniLighthouse, Pot, Rowboat, Stall, Sun } from '@/art/kit';
import { QUAY_WIDTH } from '../data';
import { Door, Floor, Lamp, Litter, RoomSvg, Stonework, H } from './parts';

const GROUND = 500;

export const QuayFar = memo(function QuayFar() {
  const W = QUAY_WIDTH * 0.5 + 1700;
  return (
    <RoomSvg w={W}>
      <rect width={W} height={H} fill={C.sky1} />
      <rect y={170} width={W} height={150} fill={C.sky2} />
      <rect y={300} width={W} height={90} fill={C.sky3} />
      {[0.04, 0.2, 0.37, 0.55, 0.72, 0.9].map((f, i) => (
        <Dry key={i} pts={[[W * f, 60 + (i % 3) * 40], [W * f + 280, 52 + (i % 3) * 40], [W * f + 560, 66 + (i % 3) * 40]]} w={22} color={C.skyHigh} opacity={0.75} seed={i + 1} bristles={6} />
      ))}
      <Sun x={W * 0.62} y={150} r={74} seed={4} />
      {[0.1, 0.33, 0.5, 0.8].map((f, i) => (
        <Cloud key={i} x={W * f} y={90 + i * 26} w={230 + i * 30} seed={i + 5} />
      ))}
      {/* headland and the far light */}
      <Shape pts={[[0, 392], [260, 330], [520, 360], [820, 318], [1180, 372], [1500, 340], [1900, 380], [2300, 330], [2700, 366], [3100, 326], [W, 372], [W, 420], [0, 420]]} smooth fill={C.hillFar} w={3} seed={9} hatch={{ angle: -55, gap: 8, w: 1 }} hatchOpacity={0.3} />
      <MiniLighthouse x={W * 0.3} y={344} s={1.4} seed={12} />
      <MiniLighthouse x={W * 0.78} y={340} s={1.2} seed={13} />
      {[0.12, 0.14, 0.52, 0.55, 0.9].map((f, i) => (
        <Pine key={i} x={W * f} y={372} s={0.9} seed={i + 20} />
      ))}
      {/* sea */}
      <rect y={398} width={W} height={H - 398} fill={C.teal} />
      <rect y={480} width={W} height={H - 480} fill={C.tealDeep} />
      <Dry pts={[[W * 0.05, 430], [W * 0.3, 424], [W * 0.5, 432]]} w={26} color={C.tealLight} opacity={0.5} seed={14} bristles={6} />
      <Dry pts={[[W * 0.55, 450], [W * 0.8, 444], [W * 0.98, 452]]} w={22} color={C.tealLight} opacity={0.45} seed={15} bristles={5} />
      <Ripples x0={0} x1={W} y0={404} y1={470} n={Math.round(W / 30)} seed={16} />
      <Stroke pts={[[0, 398], [W / 2, 399.4], [W, 398]]} w={4} wob={1.1} seed={17} />
      {[0.18, 0.46, 0.7, 0.93].map((f, i) => (
        <Boat key={i} x={W * f} y={430 + (i % 2) * 22} s={0.55 + (i % 3) * 0.1} seed={i + 30} />
      ))}
      {[0.28, 0.6, 0.84].map((f, i) => (
        <Gull key={i} x={W * f} y={130 + i * 28} s={1.1} seed={i + 40} />
      ))}
    </RoomSvg>
  );
});

function LampPost({ x, seed }: { x: number; seed: number }) {
  return (
    <g>
      <circle cx={x} cy={GROUND - 150} r={130} fill="url(#glow)" opacity="0.5" style={{ mixBlendMode: 'screen' }} />
      <Stroke pts={[[x, GROUND + 18], [x, GROUND - 150]]} w={9} color={C.ink3} seed={seed} taper={0.02} />
      <Shape pts={box(x - 16, GROUND + 6, 32, 14)} fill={C.ink3} w={2.4} seed={seed + 1} />
      <Shape pts={[[x - 14, GROUND - 156], [x + 14, GROUND - 156], [x + 18, GROUND - 186], [x - 18, GROUND - 186]]} fill={C.lantern} w={2.6} seed={seed + 2} />
      <Shape pts={[[x - 22, GROUND - 186], [x + 22, GROUND - 186], [x, GROUND - 204]]} fill={C.ink} w={2} seed={seed + 3} />
    </g>
  );
}

/** Loom House: timber-framed plaster under a tile roof, with a loom for a sign. */
function LoomHouse({ x }: { x: number }) {
  return (
    <g>
      <Shape pts={box(x - 190, 250, 380, GROUND - 250)} fill={C.bone} w={3.2} seed={101} />
      <Hatch pts={box(x + 100, 254, 86, GROUND - 258)} angle={-55} gap={6} w={1.2} opacity={0.5} />
      {[-190, -100, 0, 100, 188].map((dx, i) => (
        <Stroke key={i} pts={[[x + dx, 250], [x + dx + 1, GROUND]]} w={9} color={C.woodDeep} seed={102 + i} taper={0.02} />
      ))}
      <Stroke pts={[[x - 190, 340], [x, 342], [x + 190, 340]]} w={9} color={C.woodDeep} seed={110} taper={0.02} />
      <Stroke pts={[[x - 190, 250], [x - 100, 340]]} w={6} color={C.woodDeep} seed={111} />
      <Stroke pts={[[x + 190, 250], [x + 100, 340]]} w={6} color={C.woodDeep} seed={112} />
      <TileRoof x={x} y={250} w={410} h={110} fill={C.roofIndigo} seed={113} rows={4} />
      {[-130, 130].map((dx, i) => (
        <g key={i}>
          <Shape pts={box(x + dx - 30, 278, 60, 50)} fill={C.lantern} w={2.6} seed={120 + i} />
          <Stroke pts={[[x + dx, 278], [x + dx, 328]]} w={1.6} opacity={0.8} />
          <Stroke pts={[[x + dx - 30, 303], [x + dx + 30, 303]]} w={1.6} opacity={0.8} />
          <Pot x={x + dx} y={344} s={0.8} seed={125 + i} />
        </g>
      ))}
      <Door x={x} base={GROUND} w={120} h={170} seed={130} />
      {/* the hanging sign: a loom frame */}
      <Stroke pts={[[x - 190, 360], [x - 250, 360]]} w={6} color={C.woodDeep} smooth={false} seed={131} />
      <At x={x - 256} y={380}>
        <Shape pts={box(-28, 0, 56, 62)} fill={C.paperHi} w={2.6} seed={132} />
        <Stroke pts={[[-18, 6], [-18, 56]]} w={1.4} /><Stroke pts={[[-8, 6], [-8, 56]]} w={1.4} /><Stroke pts={[[2, 6], [2, 56]]} w={1.4} /><Stroke pts={[[12, 6], [12, 56]]} w={1.4} /><Stroke pts={[[22, 6], [22, 56]]} w={1.4} />
        <Stroke pts={[[-28, 22], [28, 22]]} w={4} color={C.seal} smooth={false} /><Stroke pts={[[-28, 38], [28, 38]]} w={4} color={C.seal} smooth={false} />
      </At>
      <Lettering x={x} y={236} size={22} fill={C.paperHi}>LOOM HOUSE</Lettering>
    </g>
  );
}

/** Foundry: heavy stone, a chimney that smokes, a fire you can see in the door. */
function Foundry({ x }: { x: number }) {
  return (
    <g>
      <Shape pts={box(x + 120, 70, 56, 200)} fill={C.hillNear} w={3} seed={201} hatch={{ angle: -55, gap: 6, w: 1.2 }} hatchOpacity={0.4} />
      <Smoke x={x + 148} y={50} s={1.3} seed={202} />
      <Smoke x={x + 160} y={-10} s={1} seed={203} fill={C.paperLo} />
      <Stonework x={x - 230} y={250} w={460} h={GROUND - 250} fill={C.paperLo} course={44} block={92} seed={204} />
      <Shape pts={[[x - 246, 256], [x + 246, 256], [x + 214, 214], [x - 214, 214]]} fill={C.ink3} w={3.4} seed={205} hatch={{ angle: -55, gap: 5, w: 1.3 }} hatchOpacity={0.55} />
      <Shape pts={box(x - 232, 250, 464, 8)} fill={C.ink} w={0} reg={[0, 0]} />
      <circle cx={x} cy={GROUND - 90} r={150} fill="url(#glow)" opacity="0.4" style={{ mixBlendMode: 'screen' }} />
      <Door x={x} base={GROUND} w={190} h={210} seed={206} />
      <Shape pts={[[x - 76, GROUND - 4], [x + 76, GROUND - 4], [x + 60, GROUND - 90], [x - 60, GROUND - 90]]} fill={C.lantern} w={0} reg={[0, 0]} fillOpacity={0.9} />
      <Flecks marks={[[x - 40, GROUND - 40, 14, -60], [x, GROUND - 60, 18, -90], [x + 38, GROUND - 36, 14, -120]]} w={3} seed={207} />
      <GearWheel x={x - 150} y={330} r={42} teeth={10} fill={C.ink3} seed={208} />
      <GearWheel x={x - 108} y={370} r={24} teeth={7} fill={C.teal} seed={209} rot={12} />
      <Lettering x={x + 100} y={246} size={20} fill={C.paperHi}>FOUNDRY</Lettering>
      <Barrel x={x - 270} y={GROUND + 8} seed={210} />
      <Barrel x={x - 322} y={GROUND + 14} w={50} h={62} seed={211} />
      <Crate x={x + 276} y={GROUND + 10} w={74} h={58} seed={212} />
    </g>
  );
}

/** The Beacon: a banded tower with a lit lamp room, and a keeper's cottage at its foot. */
function Beacon({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x + 20} 118 L${x + 1100} 40 L${x + 1100} 190 Z`} fill="url(#glow)" opacity="0.28" style={{ mixBlendMode: 'screen' }} />
      <path d={`M${x - 20} 118 L${x - 1100} 40 L${x - 1100} 190 Z`} fill="url(#glow)" opacity="0.28" style={{ mixBlendMode: 'screen' }} />
      <Shape pts={[[x - 76, GROUND], [x - 38, 170], [x + 38, 170], [x + 76, GROUND]]} fill={C.bone} w={3.4} seed={301} />
      {[0, 1, 2, 3].map((i) => {
        const t0 = 170 + i * 82;
        const t1 = t0 + 41;
        const wa = 38 + (t0 - 170) * 0.115;
        const wb = 38 + (t1 - 170) * 0.115;
        return <Shape key={i} pts={[[x - wa, t0], [x + wa, t0], [x + wb, t1], [x - wb, t1]]} fill={C.ink3} w={0} reg={[0, 0]} />;
      })}
      <Hatch pts={[[x + 10, 172], [x + 38, 172], [x + 76, GROUND - 2], [x + 20, GROUND - 2]]} angle={-60} gap={5} w={1.3} opacity={0.55} />
      <Shape pts={box(x - 52, 150, 104, 20)} fill={C.ink3} w={2.8} seed={302} />
      <Stroke pts={[[x - 56, 150], [x + 56, 150]]} w={4} seed={303} smooth={false} />
      <Shape pts={box(x - 30, 90, 60, 60)} fill={C.lantern} w={3} seed={304} />
      <circle cx={x} cy={120} r={90} fill="url(#glow)" opacity="0.7" style={{ mixBlendMode: 'screen' }} />
      {[-10, 10].map((dx) => <Stroke key={dx} pts={[[x + dx, 90], [x + dx, 150]]} w={2} seed={305 + dx} smooth={false} />)}
      <Shape pts={[[x - 38, 90], [x + 38, 90], [x, 52]]} fill={C.ink} w={2.6} seed={306} />
      <Stroke pts={[[x, 52], [x, 34]]} w={3} seed={307} smooth={false} />
      <Door x={x} base={GROUND} w={64} h={110} seed={308} />
      {[260, 340, 420].map((yy, i) => <Shape key={i} pts={box(x - 8, yy, 16, 26)} fill={C.ink3} w={1.8} seed={310 + i} />)}
      {/* keeper's cottage */}
      <Shape pts={box(x - 190, GROUND - 78, 100, 78)} fill={C.bone} w={3} seed={320} hatch={{ angle: -55, gap: 6, w: 1.1 }} hatchOpacity={0.35} />
      <TileRoof x={x - 140} y={GROUND - 78} w={108} h={46} fill={C.roofRed} seed={321} rows={2} />
      <Shape pts={box(x - 168, GROUND - 56, 22, 24)} fill={C.lantern} w={2} seed={322} />
      {/* rocks */}
      <Shape pts={[[x + 90, GROUND + 6], [x + 130, GROUND - 38], [x + 190, GROUND - 24], [x + 230, GROUND + 6]]} smooth fill={C.hillNear} w={3} seed={330} hatch={{ angle: -55, gap: 6, w: 1.1 }} hatchOpacity={0.45} />
      <Lettering x={x} y={GROUND - 128} size={18} fill={C.ink}>BEACON</Lettering>
    </g>
  );
}

/** Archive: a stone facade with a pediment and four columns. */
function Archive({ x }: { x: number }) {
  return (
    <g>
      <Stonework x={x - 200} y={246} w={400} h={GROUND - 246} fill={C.paperHi} course={50} block={120} seed={401} />
      <Shape pts={[[x - 226, 250], [x + 226, 250], [x, 160]]} fill={C.paperLo} w={3.4} seed={402} hatch={{ angle: -55, gap: 6, w: 1.2 }} hatchOpacity={0.4} />
      <Shape pts={ell(x, 222, 18, 18, 10, 0.04, 403)} smooth fill={C.ink3} w={2.4} />
      <Stroke pts={[[x, 212], [x, 232]]} w={2} color={C.lantern} smooth={false} /><Stroke pts={[[x - 9, 222], [x + 9, 222]]} w={2} color={C.lantern} smooth={false} />
      {[-170, -60, 60, 170].map((dx, i) => (
        <g key={i}>
          <Shape pts={box(x + dx - 16, 254, 32, GROUND - 254)} fill={C.bone} w={3} seed={410 + i} hatch={{ angle: 90, gap: 6, w: 1.1 }} hatchOpacity={0.4} />
          <Shape pts={box(x + dx - 22, 246, 44, 12)} fill={C.paperLo} w={2.4} seed={415 + i} />
          <Shape pts={box(x + dx - 22, GROUND - 8, 44, 12)} fill={C.paperLo} w={2.4} seed={420 + i} />
        </g>
      ))}
      <Door x={x} base={GROUND} w={110} h={170} seed={425} />
      {[0, 1, 2].map((i) => <Shape key={i} pts={box(x - 230 + i * 4, GROUND + i * 7 - 6, 460 - i * 8, 8)} fill={C.paperLo} w={2.2} seed={430 + i} />)}
      <Lettering x={x} y={290} size={20} fill={C.ink}>THE ARCHIVE</Lettering>
    </g>
  );
}

/** Trial Hall: broad brick, a clock tower, banners and a wide stair. */
function TrialHall({ x }: { x: number }) {
  return (
    <g>
      <Shape pts={box(x - 44, 90, 88, 170)} fill={C.hillNear} w={3} seed={501} hatch={{ angle: -55, gap: 6, w: 1.2 }} hatchOpacity={0.4} />
      <Shape pts={[[x - 54, 92], [x + 54, 92], [x, 40]]} fill={C.ink} w={2.6} seed={502} />
      <Shape pts={ell(x, 146, 28, 28, 12, 0.03, 503)} smooth fill={C.lantern} w={3} />
      <Stroke pts={[[x, 146], [x, 126]]} w={2.6} smooth={false} /><Stroke pts={[[x, 146], [x + 14, 152]]} w={2.6} smooth={false} />
      <Stonework x={x - 250} y={240} w={500} h={GROUND - 240} fill={C.paperLo} course={42} block={80} seed={504} />
      <Shape pts={box(x - 262, 232, 524, 18)} fill={C.ink3} w={3} seed={505} />
      {[-190, 190].map((dx, i) => (
        <g key={i}>
          <Banner x={x + dx} y={262} w={46} h={120} fill={C.ink3} seed={510 + i}>
            <Shape pts={ell(23, 44, 12, 12, 9, 0.05, 512 + i)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
          </Banner>
          <Lamp x={x + dx + 70} y={246} drop={70} r={90} s={0.9} seed={514 + i} />
        </g>
      ))}
      <Door x={x} base={GROUND} w={160} h={190} seed={520} />
      <Shape pts={ell(x, 300, 22, 22, 10, 0.04, 521)} smooth fill={C.bone} w={2.8} />
      <Stroke pts={[[x - 14, 300], [x + 14, 300]]} w={2} smooth={false} /><Stroke pts={[[x, 288], [x, 312]]} w={2} smooth={false} />
      {[0, 1, 2, 3].map((i) => <Shape key={i} pts={box(x - 250 + i * 14, GROUND + i * 7 - 6, 500 - i * 28, 8)} fill={C.paperLo} w={2.2} seed={530 + i} />)}
      <Lettering x={x} y={268} size={17} fill={C.paperHi}>TRIAL HALL</Lettering>
    </g>
  );
}

/** Harbor Office: a small timber cabin with a flag and a lit window. */
function Office({ x }: { x: number }) {
  return (
    <g>
      <Stroke pts={[[x + 100, 150], [x + 100, 340]]} w={6} color={C.woodDeep} seed={601} taper={0.02} />
      <Shape pts={[[x + 104, 154], [x + 168, 164], [x + 104, 186]]} fill={C.ink} w={2.4} seed={602} />
      <Shape pts={box(x + 70, 270, 40, 70)} fill={C.hillNear} w={3} seed={603} />
      <Smoke x={x + 90} y={252} s={0.8} seed={604} />
      <Shape pts={box(x - 130, 330, 260, GROUND - 330)} fill={C.straw} w={3.2} seed={605} hatch={{ angle: 90, gap: 12, w: 1.4 }} hatchOpacity={0.35} />
      <Hatch pts={box(x + 60, 334, 66, GROUND - 338)} angle={-55} gap={6} w={1.2} opacity={0.5} />
      <TileRoof x={x} y={330} w={270} h={80} fill={C.roofRed} seed={606} rows={3} />
      <Shape pts={box(x - 108, 366, 70, 56)} fill={C.lantern} w={2.6} seed={607} />
      <circle cx={x - 73} cy={394} r={80} fill="url(#glow)" opacity="0.5" style={{ mixBlendMode: 'screen' }} />
      <Stroke pts={[[x - 73, 366], [x - 73, 422]]} w={1.6} opacity={0.8} /><Stroke pts={[[x - 108, 394], [x - 38, 394]]} w={1.6} opacity={0.8} />
      <Door x={x + 38} base={GROUND} w={78} h={124} seed={608} />
      <Shape pts={box(x - 120, GROUND - 18, 110, 8)} fill={C.wood} w={2.2} seed={609} />
      <Shape pts={box(x - 110, GROUND - 10, 8, 14)} fill={C.woodDeep} w={1.8} seed={610} /><Shape pts={box(x - 24, GROUND - 10, 8, 14)} fill={C.woodDeep} w={1.8} seed={611} />
      <Lettering x={x} y={322} size={14} fill={C.ink}>HARBOR OFFICE</Lettering>
    </g>
  );
}

export const QuayNear = memo(function QuayNear() {
  const W = QUAY_WIDTH;
  return (
    <RoomSvg w={W}>
      {/* quay paving and kerb */}
      <Floor w={W} y0={GROUND - 6} fill={C.paperLo} seed={7} seams={150} />
      <Shape pts={box(0, 574, W, 26)} fill={C.ink3} w={3.4} seed={8} hatch={{ angle: -45, gap: 6, w: 1.2 }} hatchOpacity={0.55} />
      {Array.from({ length: Math.floor(W / 420) }, (_, i) => 200 + i * 420).map((bx, i) => (
        <g key={bx}>
          <Shape pts={[[bx - 11, 574], [bx - 8, 550], [bx + 8, 550], [bx + 11, 574]]} fill={C.ink2} w={2.4} seed={9 + i} />
          <Rope pts={[[bx, 556], [bx + 210, 580], [bx + 420, 556]]} w={4} seed={20 + i} />
        </g>
      ))}
      <LoomHouse x={460} />
      <Foundry x={1060} />
      <Beacon x={1660} />
      <Archive x={2260} />
      <TrialHall x={2860} />
      <Office x={3380} />
      {/* the gaps between the buildings */}
      <LampPost x={250} seed={40} />
      <LampPost x={2540} seed={41} />
      <LampPost x={3150} seed={42} />
      <At x={170} y={GROUND + 8}><Cat pose="sit" seed={44} /></At>
      <Crate x={118} y={GROUND + 10} w={88} h={64} seed={45} />
      <Barrel x={60} y={GROUND + 14} seed={46} />
      <Basket x={400 - 30} y={GROUND + 16} load="fish" seed={47} />
      {/* crates, with a torn corner of chart between them */}
      <Crate x={690} y={GROUND + 10} w={80} h={62} seed={48} />
      <Crate x={716} y={GROUND - 54} w={60} h={50} seed={49} />
      <Shape pts={[[704, GROUND + 4], [726, GROUND - 10], [740, GROUND + 6]]} fill={C.paperHi} w={1.6} seed={50} hatch={{ angle: -40, gap: 4, w: 0.8 }} hatchOpacity={0.5} />
      <Crate x={758} y={GROUND + 12} w={66} h={52} seed={51} />
      {/* the old signal post */}
      <Stroke pts={[[1380, GROUND + 12], [1381, GROUND - 190]]} w={14} color={C.woodDeep} seed={52} taper={0.02} />
      <Stroke pts={[[1344, GROUND - 160], [1418, GROUND - 168]]} w={9} color={C.woodDeep} seed={53} taper={0.02} />
      <Shape pts={box(1330, GROUND - 156, 14, 24)} fill={C.ink3} w={2} seed={54} /><Shape pts={box(1416, GROUND - 164, 14, 24)} fill={C.lantern} w={2} seed={55} />
      <Shape pts={[[1362, GROUND + 6], [1370, GROUND - 14], [1384, GROUND - 14], [1392, GROUND + 6]]} fill={C.paperHi} w={2} seed={56} />
      <Shape pts={box(1371, GROUND - 24, 12, 10)} fill={C.ink3} w={1.6} seed={57} />
      <Rowboat x={1860} y={GROUND + 16} seed={58} />
      <Barrel x={1990} y={GROUND + 12} seed={59} />
      <Stall x={2560} y={GROUND + 10} s={0.9} seed={60} />
      <Barrel x={2688} y={GROUND + 12} w={50} h={60} seed={61} />
      <Crate x={3140} y={GROUND + 10} w={76} h={58} seed={62} />
      <Litter w={W} y={556} seed={3} n={110} />
    </RoomSvg>
  );
});
