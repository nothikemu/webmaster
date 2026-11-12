/**
 * The Loom House, the Foundry and the Beacon: near layers (floor, furniture, stations, characters).
 * Every object that can be used stands at the x given in rooms.ts.
 */
import { memo } from 'react';
import { C, INK } from '@/art/palette';
import { At, Dry, Flecks, Shape, Stroke, Tone, Wash } from '@/art/Draw';
import { box, ell } from '@/art/ink';
import { Barrel } from '@/art/props';
import { Anvil, InkPot, Lettering, OpenBook, Quill, Table, Telescope, WallTool, WaxSeal } from '@/art/kit';
import { Brannock, Sedge, Wren } from '@/art/Cast';
import { Door, Floor, Lamp, Litter, Paper, Rafters, RoomSvg, WALL_BASE } from './parts';

const FEET = 520;

/** A character from the cast, standing with their feet on the floor line at x. */
export function Stand({ x, s = 0.68, children }: { x: number; s?: number; children: React.ReactNode }) {
  return (
    <At x={x - 105 * s} y={FEET - 290 * s} s={s}>
      {children}
    </At>
  );
}

function ExitDoor({ label }: { label: string }) {
  return (
    <g>
      <Door x={120} base={WALL_BASE + 8} w={140} h={236} light seed={7} />
      <Lettering x={120} y={WALL_BASE - 262} size={15} fill={INK}>{label}</Lettering>
    </g>
  );
}

function Moth({ x, y, s = 1, seed = 1, dots = false }: { x: number; y: number; s?: number; seed?: number; dots?: boolean }) {
  return (
    <At x={x} y={y} s={s}>
      <Shape pts={ell(-9, -1, 10, 6, 8, 0.05, seed)} smooth fill={C.paperHi} w={1.5} stipple={false} />
      <Shape pts={ell(9, -1, 10, 6, 8, 0.05, seed + 1)} smooth fill={C.paperHi} w={1.5} stipple={false} />
      <Stroke pts={[[0, -8], [0, 9]]} w={2.6} />
      {dots ? <Flecks marks={[[-13, -1, 2, 0], [-7, 2, 2, 0], [8, -2, 2, 0], [12, 1, 2, 0]]} w={2.6} /> : null}
    </At>
  );
}

// ----------------------------------------------------------------------------------------------------- Loom House
export const LoomNear = memo(function LoomNear() {
  const W = 1900;
  return (
    <RoomSvg w={W}>
      <Floor w={W} fill={C.straw} seed={11} />
      <Rafters w={W} from={610} every={1250} seed={12} />
      <ExitDoor label="QUAY" />
      {/* the warp loom, with a card of rules pinned to it */}
      <At x={430} y={0}>
        <Wash pts={[[-90, 470], [90, 470], [110, 500], [-110, 500]]} fill={INK} opacity={0.25} />
        <Stroke pts={[[-82, 120], [-82, 490]]} w={16} color={C.woodDeep} seed={21} taper={0.02} />
        <Stroke pts={[[82, 120], [82, 490]]} w={16} color={C.woodDeep} seed={22} taper={0.02} />
        <Stroke pts={[[-90, 130], [90, 130]]} w={14} color={C.wood} seed={23} taper={0} />
        <Stroke pts={[[-90, 470], [90, 470]]} w={14} color={C.wood} seed={24} taper={0} />
        <path d={Array.from({ length: 14 }, (_, i) => `M${-68 + i * 10.5} 138V464`).join('')} stroke={INK} strokeWidth="1.5" opacity="0.7" fill="none" />
        <Shape pts={box(-70, 380, 140, 84)} fill={C.clothOchre} w={0} reg={[0, 0]} />
        <Tone pts={box(-70, 380, 140, 84)} opacity={0.5} />
        <Stroke pts={[[-70, 380], [0, 372], [70, 380]]} w={3} seed={25} />
        <Stroke pts={[[-86, 250], [86, 250]]} w={7} color={C.woodLight} seed={26} taper={0} />
        <Paper x={-22} y={176} w={48} h={62} lines={4} seed={27} r={-4} />
        <Shape pts={ell(2, 178, 3, 3, 6, 0.1, 28)} smooth fill={C.seal} w={0} reg={[0, 0]} />
      </At>
      {/* the curator's cabinet, with moths pinned under glass */}
      <At x={780} y={0}>
        <Wash pts={[[-96, 486], [96, 486], [112, 504], [-112, 504]]} fill={INK} opacity={0.25} />
        <Shape pts={box(-86, 236, 172, 252)} fill={C.wood} w={3.4} seed={31} hatch={{ angle: -60, gap: 6, w: 1.1 }} hatchOpacity={0.3} />
        <Shape pts={box(-70, 252, 140, 92)} fill={C.ink3} w={2.8} seed={32} />
        <Shape pts={box(-66, 256, 132, 84)} fill={C.paperHi} w={0} reg={[0, 0]} />
        {[[-40, 280, false], [-6, 274, true], [28, 282, false], [48, 304, true], [-44, 316, true], [14, 318, false]].map(([mx, my, d], i) => (
          <Moth key={i} x={mx as number} y={my as number} s={0.9} seed={40 + i} dots={d as boolean} />
        ))}
        <Stroke pts={[[-66, 256], [66, 340]]} w={1.6} color={C.paperHi} opacity={0.7} smooth={false} />
        {[0, 1, 2].map((r) => [-1, 1].map((c) => (
          <g key={`${r}${c}`}>
            <Shape pts={box(c < 0 ? -80 : 4, 354 + r * 44, 76, 38)} fill={C.woodLight} w={2.4} seed={50 + r * 2 + (c < 0 ? 0 : 1)} />
            <Shape pts={ell(c < 0 ? -42 : 42, 372 + r * 44, 5, 5, 7, 0.1, 60 + r)} smooth fill={C.ink3} w={1.6} />
            <Shape pts={box(c < 0 ? -58 : 26, 360 + r * 44, 32, 9)} fill={C.paperHi} w={1.2} seed={70 + r} />
          </g>
        )))}
        <Shape pts={box(-96, 228, 192, 12)} fill={C.woodLight} w={3} seed={80} />
      </At>
      <Lamp x={780} y={52} drop={120} r={170} seed={90} />
      <Stand x={1090}>
        <Wren />
      </Stand>
      {/* knotted weights hanging from the rafters */}
      {[1226, 1262, 1294, 1328, 1364].map((cx, i) => {
        const len = 150 + ((i * 53) % 110);
        return (
          <g key={cx}>
            <Stroke pts={[[cx, 56], [cx + 1, 56 + len]]} w={3} smooth={false} seed={100 + i} />
            {[0.3, 0.55, 0.78].map((f, k) => <Shape key={k} pts={ell(cx, 56 + len * f, 4.4, 4.4, 7, 0.1, 110 + i + k)} smooth fill={C.ink3} w={1.4} stipple={false} />)}
            <Shape pts={ell(cx, 62 + len + 14, 13, 17, 9, 0.08, 120 + i)} smooth fill={C.hillNear} w={2.6} hatch={{ angle: -50, gap: 4, w: 1 }} hatchOpacity={0.5} />
          </g>
        );
      })}
      {/* the weight frame, with three dials */}
      <At x={1540} y={0}>
        <Wash pts={[[-110, 486], [110, 486], [124, 504], [-124, 504]]} fill={INK} opacity={0.25} />
        <Stroke pts={[[-96, 190], [-96, 490]]} w={16} color={C.woodDeep} seed={131} taper={0.02} />
        <Stroke pts={[[96, 190], [96, 490]]} w={16} color={C.woodDeep} seed={132} taper={0.02} />
        <Stroke pts={[[-104, 200], [104, 200]]} w={14} color={C.wood} seed={133} taper={0} />
        <path d={Array.from({ length: 11 }, (_, i) => `M${-80 + i * 16} 208V${330 + ((i * 37) % 90)}`).join('')} stroke={INK} strokeWidth="1.6" opacity="0.75" fill="none" />
        {Array.from({ length: 11 }, (_, i) => <Shape key={i} pts={ell(-80 + i * 16, 336 + ((i * 37) % 90), 4.6, 4.6, 7, 0.1, 140 + i)} smooth fill={i % 2 ? C.lantern : C.ink3} w={1.4} stipple={false} />)}
        <Shape pts={box(-72, 258, 144, 66)} fill={C.ink3} w={3} seed={150} />
        {[-44, 0, 44].map((dx, i) => (
          <g key={i}>
            <Shape pts={ell(dx, 291, 18, 18, 12, 0.03, 151 + i)} smooth fill={C.paperHi} w={2.2} />
            <Stroke pts={[[dx, 291], [dx + [8, -10, 12][i]!, 291 - [12, 10, -6][i]!]]} w={2.6} smooth={false} seed={155 + i} />
            <Flecks marks={[[dx - 14, 291, 3, 180], [dx, 275, 3, 270], [dx + 14, 291, 3, 0]]} w={1.6} />
          </g>
        ))}
        <Shape pts={box(-104, 470, 208, 22)} fill={C.wood} w={2.8} seed={160} />
      </At>
      <Lamp x={1540} y={52} drop={90} r={150} seed={161} />
      {/* a bench with the test cloth folded under it */}
      <At x={1780} y={0}>
        <Shape pts={box(-92, 424, 184, 14)} fill={C.woodLight} w={2.8} seed={171} />
        <Shape pts={box(-84, 438, 10, 52)} fill={C.wood} w={2.4} seed={172} /><Shape pts={box(74, 438, 10, 52)} fill={C.wood} w={2.4} seed={173} />
        {[0, 1, 2].map((i) => <Shape key={i} pts={[[-60 + i * 4, 484 - i * 10], [60 - i * 3, 484 - i * 10], [58 - i * 3, 474 - i * 10], [-58 + i * 4, 474 - i * 10]]} fill={[C.clothOchre, C.bone, C.clothTeal][i]!} w={2} seed={174 + i} hatch={{ angle: -55, gap: 4, w: 0.9 }} hatchOpacity={0.4} />)}
      </At>
      <Litter w={W} y={548} seed={5} n={70} />
    </RoomSvg>
  );
});

// ----------------------------------------------------------------------------------------------------- Foundry
export const FoundryNear = memo(function FoundryNear() {
  const W = 1900;
  return (
    <RoomSvg w={W}>
      <Floor w={W} fill={C.sky3} seed={21} seams={110} />
      <Rafters w={W} from={620} every={1180} seed={22} fill={C.ink2} />
      <ExitDoor label="QUAY" />
      {/* tools on the wall and a toolbox beneath */}
      <Stroke pts={[[330, 190], [510, 190]]} w={7} color={C.woodDeep} seed={201} taper={0} />
      {(['hammer', 'tongs', 'saw', 'wrench'] as const).map((k, i) => <WallTool key={k} x={350 + i * 52} y={192} kind={k} seed={210 + i} />)}
      <At x={420} y={0}>
        <Shape pts={box(-62, 454, 124, 36)} fill={C.ink3} w={3} seed={221} hatch={{ angle: -55, gap: 5, w: 1 }} hatchOpacity={0.45} />
        <Shape pts={[[-66, 454], [66, 454], [78, 430], [-54, 424]]} fill={C.hillNear} w={2.8} seed={222} />
        <Stroke pts={[[-30, 454], [-34, 430]]} w={5} color={C.wood} seed={223} /><Stroke pts={[[10, 454], [16, 424]]} w={5} color={C.wood} seed={224} />
        <Paper x={-12} y={452} w={34} h={26} lines={2} seed={225} r={-6} />
      </At>
      {/* the anvil and the order board */}
      <At x={740} y={0}>
        <Shape pts={box(-120, 100, 240, 170)} fill={C.straw} w={4} seed={231} />
        <Tone pts={box(-120, 100, 240, 40)} opacity={0.2} />
        {[[-80, 124, -6], [-20, 130, 4], [40, 120, -3], [86, 134, 6], [-56, 196, 5], [30, 200, -6]].map(([px, py, r], i) => <Paper key={i} x={px as number} y={py as number} w={46} h={58} lines={3} seed={232 + i} r={r as number} />)}
        <Shape pts={[[-38, 488], [-30, 440], [30, 440], [38, 488]]} fill={C.wood} w={3} seed={240} hatch={{ angle: -55, gap: 5, w: 1 }} hatchOpacity={0.45} />
        <Anvil x={0} y={440} s={1.9} seed={241} />
        <Flecks marks={[[-70, 360, 12, -100], [70, 352, 14, -70], [0, 340, 16, -90], [-40, 372, 10, -130], [48, 378, 10, -40]]} w={2.8} seed={242} />
      </At>
      <Lamp x={740} y={52} drop={50} r={140} seed={243} />
      <Stand x={1060}>
        <Brannock />
      </Stand>
      {/* the forge, and five molds hanging before it */}
      <At x={1270} y={0}>
        <Shape pts={[[-26, 70], [26, 70], [26, 250], [-26, 250]]} fill={C.hillNear} w={3} seed={251} hatch={{ angle: -55, gap: 6, w: 1.1 }} hatchOpacity={0.4} />
        <Shape pts={[[-110, 300], [-26, 240], [26, 240], [110, 300]]} fill={C.ink3} w={3.4} seed={252} hatch={{ angle: -55, gap: 5, w: 1.2 }} hatchOpacity={0.5} />
        <Shape pts={box(-100, 298, 200, 192)} fill={C.hillNear} w={3.4} seed={253} hatch={{ angle: 90, gap: 14, w: 1.2 }} hatchOpacity={0.35} />
        <Shape pts={[[-62, 488], [-62, 400], [-30, 360], [30, 360], [62, 400], [62, 488]]} smooth fill={C.ink} w={3} seed={254} />
        <circle cx={0} cy={440} r={96} fill="url(#glow)" opacity="0.7" style={{ mixBlendMode: 'screen' }} />
        <Shape pts={[[-44, 488], [-40, 430], [-10, 410], [0, 440], [14, 408], [40, 432], [44, 488]]} smooth fill={C.lantern} w={0} reg={[0, 0]} />
        <Flecks marks={[[-30, 420, 18, -100], [0, 400, 22, -88], [30, 424, 18, -80]]} w={3} seed={255} />
        <Stroke pts={[[-92, 150], [92, 150]]} w={7} color={C.woodDeep} seed={256} taper={0} />
        {[-72, -36, 0, 36, 72].map((dx, i) => (
          <g key={dx}>
            <Stroke pts={[[dx, 150], [dx, 176]]} w={2} smooth={false} seed={260 + i} />
            <Shape pts={[[dx - 12, 176], [dx + 12, 176], [dx + 16 - (i % 2) * 6, 214], [dx - 16 + (i % 2) * 6, 214]]} fill={C.straw} w={2.4} seed={265 + i} hatch={{ angle: -55, gap: 4, w: 1 }} hatchOpacity={0.4} />
            <Shape pts={ell(dx, 195, 4.4, 4.4, 7, 0.1, 270 + i)} smooth fill={C.ink} w={0} reg={[0, 0]} />
          </g>
        ))}
      </At>
      {/* the weld bench */}
      <At x={1520} y={0}>
        <Table x={0} y={490} w={250} h={96} seed={281} fill={C.sky3} />
        <Shape pts={box(-84, 398, 130, 10)} fill={C.ink3} w={2.6} seed={282} />
        <Stroke pts={[[-80, 399], [-30, 396], [40, 399]]} w={3.4} color={C.lantern} seed={283} />
        <Flecks marks={[[-60, 392, 14, -100], [-20, 388, 16, -80], [10, 390, 12, -120], [30, 392, 14, -60], [-40, 380, 10, -90]]} w={2.6} seed={284} />
        <Shape pts={[[-90, 402], [-80, 402], [-80, 420], [-90, 420]]} fill={C.ink2} w={1.8} seed={285} /><Shape pts={[[44, 402], [52, 402], [52, 420], [44, 420]]} fill={C.ink2} w={1.8} seed={286} />
        <Stroke pts={[[88, 490], [88, 330]]} w={7} color={C.ink3} seed={287} taper={0.02} />
        <Shape pts={ell(88, 318, 26, 26, 12, 0.03, 288)} smooth fill={C.paperHi} w={3} />
        <Flecks marks={[[88, 296, 6, 270], [110, 318, 6, 0], [66, 318, 6, 180], [100, 300, 5, 315], [76, 300, 5, 225]]} w={2} />
        <Stroke pts={[[88, 318], [100, 304]]} w={3} smooth={false} seed={289} />
        <Shape pts={[[-110, 250], [-80, 250], [-76, 290], [-114, 290]]} fill={C.ink3} w={2.6} seed={290} />
        <Shape pts={box(-102, 262, 18, 6)} fill={C.lantern} w={0} reg={[0, 0]} />
      </At>
      <Lamp x={1520} y={52} drop={90} r={150} seed={291} />
      {/* barrels, and a cracked weld leaning behind them */}
      <At x={1780} y={0}>
        <Shape pts={[[-40, 488], [-30, 392], [40, 380], [50, 488]]} fill={C.sky3} w={3} seed={301} hatch={{ angle: -55, gap: 5, w: 1 }} hatchOpacity={0.4} />
        <Stroke pts={[[-26, 400], [-10, 428], [-22, 440], [4, 470]]} w={3.4} seed={302} smooth={false} />
        <Stroke pts={[[-8, 408], [10, 430], [2, 444]]} w={2} seed={303} smooth={false} opacity={0.7} />
      </At>
      <Barrel x={1730} y={512} seed={310} />
      <Barrel x={1820} y={516} w={50} h={64} seed={311} />
      <Litter w={W} y={548} seed={6} n={90} />
    </RoomSvg>
  );
});

// ----------------------------------------------------------------------------------------------------- Beacon
export const BeaconNear = memo(function BeaconNear() {
  const W = 1900;
  return (
    <RoomSvg w={W}>
      <Floor w={W} fill={C.paperLo} seed={31} seams={160} />
      <ExitDoor label="QUAY" />
      {/* a covered lens on a stool, and a telescope at the window */}
      <At x={430} y={0}>
        <Shape pts={[[-34, 488], [-28, 410], [28, 410], [34, 488]]} fill={C.wood} w={3} seed={401} hatch={{ angle: -55, gap: 5, w: 1 }} hatchOpacity={0.45} />
        <Shape pts={ell(0, 366, 46, 52, 12, 0.03, 402)} smooth fill={C.bone} w={3} hatch={{ angle: -60, gap: 5, w: 1.1 }} hatchOpacity={0.4} />
        <Stroke pts={[[-30, 340], [-18, 380], [-24, 412]]} w={1.8} seed={403} opacity={0.6} /><Stroke pts={[[8, 330], [14, 376], [8, 412]]} w={1.8} seed={404} opacity={0.6} /><Stroke pts={[[30, 350], [34, 388]]} w={1.8} seed={405} opacity={0.6} />
        <Shape pts={[[-48, 408], [48, 408], [52, 420], [-52, 420]]} fill={C.bone} w={2.4} seed={406} />
      </At>
      <At x={620} y={0}>
        <Stroke pts={[[0, 400], [-40, 488]]} w={7} color={C.woodDeep} seed={411} taper={0.02} /><Stroke pts={[[0, 400], [40, 488]]} w={7} color={C.woodDeep} seed={412} taper={0.02} /><Stroke pts={[[0, 400], [0, 488]]} w={7} color={C.woodDeep} seed={413} taper={0.02} />
        <Telescope x={0} y={400} s={1.6} r={-24} seed={414} />
      </At>
      {/* the balance of the audit */}
      <At x={760} y={0}>
        <Shape pts={[[-64, 488], [-44, 466], [44, 466], [64, 488]]} fill={C.ink3} w={3} seed={421} />
        <Stroke pts={[[0, 466], [0, 200]]} w={14} color={C.ink3} seed={422} taper={0.02} />
        <Shape pts={ell(0, 196, 18, 18, 10, 0.03, 423)} smooth fill={C.ochre} w={2.6} />
        <Stroke pts={[[-128, 214], [0, 202], [128, 190]]} w={9} color={C.ink3} seed={424} taper={0.02} />
        {[[-128, 214], [128, 190]].map(([px, py], i) => (
          <g key={i}>
            <Stroke pts={[[px!, py!], [px! - 40, py! + 112]]} w={1.8} smooth={false} seed={425 + i} /><Stroke pts={[[px!, py!], [px! + 40, py! + 112]]} w={1.8} smooth={false} seed={427 + i} />
            <Shape pts={[[px! - 52, py! + 112], [px! + 52, py! + 112], [px! + 38, py! + 128], [px! - 38, py! + 128]]} fill={C.ochre} w={2.8} seed={429 + i} />
            {Array.from({ length: i === 0 ? 3 : 7 }, (_, k) => <Shape key={k} pts={ell(px! - 30 + k * 10 + (i === 0 ? 10 : 0), py! + 104, 4.4, 4.4, 7, 0.1, 440 + k + i * 9)} smooth fill={i === 0 ? C.ink : C.paperHi} w={1.4} stipple={false} />)}
          </g>
        ))}
      </At>
      <Lamp x={760} y={52} drop={60} r={140} seed={451} />
      <Stand x={1070}>
        <Sedge />
      </Stand>
      {/* the desk, with a letter and its seal */}
      <At x={1300} y={0}>
        <Table x={0} y={488} w={230} h={96} seed={461} fill={C.woodLight} />
        <Shape pts={box(-80, 418, 160, 56)} fill={C.wood} w={2.6} seed={462} />
        <Shape pts={ell(0, 446, 5, 5, 7, 0.1, 463)} smooth fill={C.lantern} w={1.6} />
        <Paper x={-62} y={366} w={64} h={36} lines={3} seed={464} r={-4} />
        <WaxSeal x={-22} y={398} s={0.8} seed={465} />
        <InkPot x={46} y={394} s={0.9} seed={466} />
        <Quill x={74} y={388} s={0.9} seed={467} r={-70} />
      </At>
      <Lamp x={1300} y={52} drop={100} r={150} seed={468} />
      {/* the log chest */}
      <At x={1560} y={0}>
        <Shape pts={box(-60, 440, 120, 48)} fill={C.wood} w={3.2} seed={471} hatch={{ angle: 90, gap: 12, w: 1.2 }} hatchOpacity={0.35} />
        <Shape pts={[[-62, 440], [-54, 408], [54, 408], [62, 440]]} smooth fill={C.woodLight} w={3.2} seed={472} />
        <Stroke pts={[[-30, 410], [-30, 488]]} w={7} color={C.ink3} seed={473} smooth={false} /><Stroke pts={[[30, 410], [30, 488]]} w={7} color={C.ink3} seed={474} smooth={false} />
        <Shape pts={box(-8, 436, 16, 18)} fill={C.ochre} w={2.2} seed={475} /><Stroke pts={[[0, 436], [0, 426]]} w={3} smooth={false} seed={476} />
        <OpenBook x={-2} y={412} s={0.8} seed={477} />
      </At>
      {/* the great lamp, dark */}
      <At x={1790} y={0}>
        <Shape pts={[[-50, 488], [-34, 410], [34, 410], [50, 488]]} fill={C.ink3} w={3} seed={481} />
        <Shape pts={ell(0, 300, 98, 112, 18, 0.02, 482)} smooth fill={C.paperHi} w={3.4} hatch={{ angle: -45, gap: 5, w: 1.1 }} hatchOpacity={0.4} />
        {[0.78, 0.56, 0.34].map((k, i) => <Shape key={i} pts={ell(0, 300, 98 * k, 112 * k, 16, 0.02, 485 + i)} smooth w={2} />)}
        <path d={Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `M0 300L${(Math.cos(a) * 98).toFixed(1)} ${(300 + Math.sin(a) * 112).toFixed(1)}`; }).join('')} stroke={INK} strokeWidth="1.5" opacity="0.55" fill="none" />
        <Shape pts={ell(0, 300, 22, 24, 10, 0.03, 490)} smooth fill={C.ink3} w={2.6} />
        <Shape pts={box(-110, 412, 220, 12)} fill={C.ink3} w={2.8} seed={491} />
      </At>
      <Dry pts={[[1500, 150], [1640, 186], [1780, 150]]} w={8} color={C.paperHi} opacity={0.4} seed={495} />
      <Litter w={W} y={548} seed={7} n={60} />
    </RoomSvg>
  );
});
