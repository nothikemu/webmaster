/**
 * More of the world: the mission office, a small plate for each kind of AI tool, and a technical drawing of Kernel.
 * Drawn with the same brush as the rest, in the same grays.
 */
import { memo } from 'react';
import { C, INK } from './palette';
import { At, Flecks, Scene, Shape, Stroke, Tone, Wash } from './Draw';
import { KernelParts } from './Kernel';
import { box, ell, arc } from './ink';
import { Boat, Planks, Ripples } from './props';
import { Anvil, Bell, Books, Cat, CompassRose, GearWheel, InkPot, Lettering, MapSheet, MiniLighthouse, OpenBook, Pennants, Pot, Quill, RolledScroll, Shelf, Table, Telescope, TypeBlock, WallPlanks, WaxSeal, Window } from './kit';
import { PaperLantern } from './props';

// ------------------------------------------------------------------------------------------------ the mission office

/** A contract pinned to the board: a few lines of text, and a wax seal if it is done. */
function Contract({ x, y, r, done, seed, w = 56, h = 70 }: { x: number; y: number; r: number; done: boolean; seed: number; w?: number; h?: number }) {
  return (
    <At x={x} y={y} r={r}>
      <Wash pts={[[-w / 2 + 4, -h / 2 + 5], [w / 2 + 4, -h / 2 + 5], [w / 2 + 4, h / 2 + 5], [-w / 2 + 4, h / 2 + 5]]} fill={INK} opacity={0.28} smooth={false} />
      <Shape pts={box(-w / 2, -h / 2, w, h)} fill={C.paperHi} w={2} seed={seed} />
      <Shape pts={box(-w / 2 + 6, -h / 2 + 8, w * 0.5, 7)} fill={C.ink3} w={0} reg={[0, 0]} />
      <Flecks marks={[[-w / 2 + 6, -h / 2 + 22, w - 14, 0], [-w / 2 + 6, -h / 2 + 30, w - 22, 0], [-w / 2 + 6, -h / 2 + 38, w - 18, 0], [-w / 2 + 6, -h / 2 + 46, w - 30, 0]]} w={1.5} opacity={0.75} seed={seed + 1} />
      {done ? <WaxSeal x={w / 2 - 14} y={h / 2 - 14} r={9} seed={seed + 2} /> : <Stroke pts={[[w / 2 - 22, h / 2 - 10], [w / 2 - 8, h / 2 - 10]]} w={1.6} opacity={0.6} />}
      <Shape pts={ell(0, -h / 2 + 3, 2.8, 2.8, 6, 0.1, seed + 3)} smooth fill={C.ink} w={1.2} stipple={false} />
    </At>
  );
}

export const MissionOffice = memo(function MissionOffice({ done = 3, className }: { done?: number; className?: string }) {
  const sheets: [number, number, number][] = [[238, 98, -3], [306, 90, 2], [376, 100, -2], [446, 92, 3], [262, 176, 2], [336, 170, -3], [412, 176, 2]];
  return (
    <Scene
      w={640}
      h={400}
      className={className}
      label="An illustration of a harbor master's office. A cork board is pinned with mission contracts, some sealed in wax. A string of pins joins them. Beside it is an arched window onto the harbor with a lighthouse, a barometer, and a shelf with a ship model. On the desk lie a chart, a lamp, ink and dividers, and a black cat sleeps beside them. Kernel the robot points at the board."
    >
      <WallPlanks x={0} y={0} w={640} h={316} fill="#a9a7a2" every={52} seed={5} />
      <Window x={34} y={50} w={128} h={166} arch seed={3}>
        <rect y={96} width={128} height={70} fill={C.teal} />
        <Shape pts={[[0, 98], [30, 74], [56, 96]]} fill={C.hillFar} w={2} />
        <MiniLighthouse x={96} y={100} s={0.62} seed={4} />
        <Boat x={46} y={128} s={0.22} seed={5} />
        <Ripples x0={4} x1={124} y0={104} y1={162} n={10} seed={6} />
        <Stroke pts={[[0, 97], [64, 98], [128, 97]]} w={2.6} />
      </Window>
      {/* the board */}
      <Shape pts={box(196, 38, 286, 190)} fill={C.woodLight} w={4} seed={11} />
      <Shape pts={box(208, 50, 262, 166)} fill={C.straw} w={2.6} seed={12} />
      <Tone pts={box(208, 50, 262, 166)} opacity={0.18} />
      {sheets.map(([x, y, r], i) => (
        <Contract key={i} x={x} y={y} r={r} done={i < done} seed={20 + i * 5} />
      ))}
      <Stroke pts={[[238, 68], [306, 60], [376, 66], [446, 60]]} w={1.2} color={C.seal} smooth={false} seed={60} />
      <Stroke pts={[[238, 68], [262, 142], [336, 142], [412, 142], [446, 60]]} w={1.2} color={C.seal} smooth={false} seed={61} />
      {/* the barometer and the shelf */}
      <Shape pts={ell(540, 92, 40, 40, 20, 0.012, 62)} smooth fill={C.paperHi} w={4.4} />
      <Shape pts={ell(540, 92, 33, 33, 18, 0.012, 63)} smooth w={1.2} />
      <Flecks marks={Array.from({ length: 20 }, (_, i) => [540 + Math.cos((i / 20) * 6.283) * 30, 92 + Math.sin((i / 20) * 6.283) * 30, 5, (i / 20) * 360 + 180] as [number, number, number, number])} w={1.4} seed={64} />
      <Stroke pts={[[540, 92], [556, 74]]} w={3} seed={65} />
      <Shape pts={ell(540, 92, 3.6, 3.6, 6, 0.1, 66)} smooth fill={C.ink} w={0} reg={[0, 0]} />
      <Shelf x={500} y={170} w={120} seed={67} />
      <Boat x={540} y={170} s={0.2} seed={68} hull={C.ink3} />
      <Pot x={590} y={170} ink={C.ink2} seed={69} w={20} h={24} label={false} />
      <Books x={560} y={170} n={2} seed={4} h={22} />
      <Planks pts={[[0, 316], [640, 316], [640, 400], [0, 400]]} rows={3} seed={70} />
      <Table x={286} y={352} w={380} h={86} seed={71} />
      <MapSheet x={236} y={274} w={130} h={44} seed={72} />
      <InkPot x={330} y={276} seed={73} />
      <Quill x={332} y={256} r={-64} seed={74} />
      <PaperLantern x={386} y={262} s={0.9} seed={75} />
      {/* dividers, drawn open */}
      <Stroke pts={[[270, 258], [284, 240], [298, 258]]} w={2.4} seed={76} smooth={false} />
      <Shape pts={ell(284, 238, 3, 3, 6, 0.1, 77)} smooth fill={C.strawDeep} w={1.6} />
      <Cat x={452} y={336} pose="loaf" seed={78} />
      <At x={540} y={196} s={0.44}>
        <KernelParts mood="point" hold="none" />
      </At>
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ a plate for each kind of tool

export type ToolKind = 'chat' | 'research' | 'study' | 'coding';

export const ToolPlate = memo(function ToolPlate({ kind, variant = 0, className }: { kind: ToolKind; variant?: number; className?: string }) {
  const v = variant % 4;
  return (
    <Scene w={320} h={130} className={className} fit="xMidYMid slice">
      <rect width={320} height={130} fill={kind === 'coding' ? '#8f8d88' : kind === 'research' ? C.bone : kind === 'study' ? '#c4c2bd' : C.paperLo} />
      <Tone pts={box(0, 0, 320, 130)} opacity={0.1} />
      <Planks pts={[[0, 96], [320, 96], [320, 130], [0, 130]]} rows={2} seed={4} />
      {kind === 'chat' && v === 1 ? (
        <g>
          {/* a tin-can telephone: two cans and a taut string */}
          {[70, 250].map((cx, i) => (
            <g key={cx}>
              <Shape pts={box(cx - 22, 58, 44, 40)} fill={C.hairGrey} w={3} seed={50 + i} hatch={{ angle: -70, gap: 4.5, w: 1 }} hatchOpacity={0.4} />
              <Shape pts={ell(cx, 58, 22, 7, 12, 0.03, 52 + i)} smooth fill={C.ink2} w={2.6} />
              <Stroke pts={[[cx - 20, 72], [cx, 76], [cx + 20, 72]]} w={1.4} opacity={0.6} />
            </g>
          ))}
          <Stroke pts={[[90, 58], [160, 50], [230, 58]]} w={1.8} seed={54} />
          {[0, 1].map((i) => (
            <Stroke key={i} pts={arc(46, 66, 16 + i * 12, 20 + i * 10, 140, 220, 8)} w={2.4 - i * 0.6} seed={56 + i} opacity={0.8 - i * 0.25} />
          ))}
          <Stroke pts={[[96, 98], [88, 118]]} w={4} seed={58} />
        </g>
      ) : null}
      {kind === 'chat' && v === 2 ? (
        <g>
          {/* signal flags on a post */}
          <Stroke pts={[[160, 18], [161, 100]]} w={6} seed={60} smooth={false} />
          <Stroke pts={[[160, 36], [112, 14]]} w={2.6} seed={61} smooth={false} />
          <Stroke pts={[[160, 36], [212, 14]]} w={2.6} seed={62} smooth={false} />
          <Shape pts={[[108, 8], [134, 4], [140, 28], [112, 32]]} fill={C.paperHi} w={2.4} seed={63} />
          <Shape pts={[[108, 8], [134, 4], [112, 32]]} fill={C.ink2} w={0} reg={[0, 0]} />
          <Shape pts={[[190, 4], [216, 8], [212, 32], [186, 28]]} fill={C.ink3} w={2.4} seed={64} />
          <Shape pts={[[190, 4], [216, 8], [186, 28]]} fill={C.paperHi} w={0} reg={[0, 0]} />
          <Pennants pts={[[161, 56], [230, 64], [300, 52]]} n={6} seed={4} size={12} />
          <Shape pts={box(138, 96, 46, 10)} fill={C.woodDeep} w={2.4} seed={65} />
        </g>
      ) : null}
      {kind === 'chat' && v === 3 ? (
        <g>
          {/* a ship's bell, rung */}
          <Stroke pts={[[90, 12], [160, 14], [230, 12]]} w={7} seed={70} />
          <Bell x={160} y={14} s={1.5} seed={71} />
          <Stroke pts={[[160, 92], [166, 112]]} w={2.6} seed={72} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <Stroke pts={arc(160, 64, 52 + i * 14, 40 + i * 10, 200, 250, 8)} w={2.4 - i * 0.5} seed={73 + i} opacity={0.8 - i * 0.2} />
              <Stroke pts={arc(160, 64, 52 + i * 14, 40 + i * 10, -70, -20, 8)} w={2.4 - i * 0.5} seed={76 + i} opacity={0.8 - i * 0.2} />
            </g>
          ))}
        </g>
      ) : null}
      {kind === 'chat' && v === 0 ? (
        <g>
          {/* a speaking horn on a stand, its voice drawn as arcs, and a stack of sealed letters */}
          <Shape pts={[[60, 80], [150, 40], [170, 30], [188, 60], [170, 94], [150, 96]]} fill={C.strawDeep} w={3.6} seed={1} hatch={{ angle: -70, gap: 5, w: 1.1 }} hatchOpacity={0.4} />
          <Shape pts={ell(178, 62, 10, 32, 12, 0.03, 2)} smooth fill={C.ink2} w={3} />
          <Stroke pts={[[56, 82], [44, 88]]} w={5} seed={3} />
          {[0, 1, 2].map((i) => (
            <Stroke key={i} pts={arc(194, 62, 22 + i * 14, 30 + i * 12, -40, 40, 8)} w={2.6 - i * 0.5} seed={5 + i} opacity={0.85 - i * 0.2} />
          ))}
          <Shape pts={[[216, 84], [284, 80], [286, 98], [218, 102]]} fill={C.paperHi} w={2.4} seed={9} />
          <Shape pts={[[224, 70], [288, 66], [290, 82], [226, 86]]} fill={C.bone} w={2.4} seed={10} />
          <WaxSeal x={252} y={92} r={8} seed={11} />
          <Stroke pts={[[110, 96], [100, 118]]} w={4} seed={12} />
          <Stroke pts={[[130, 94], [140, 118]]} w={4} seed={13} />
        </g>
      ) : null}
      {kind === 'research' && v % 2 === 1 ? (
        <g>
          <Telescope x={96} y={118} s={1.15} r={-26} seed={80} />
          <RolledScroll x={226} y={96} seed={81} len={74} band={C.ink3} />
          <CompassRose x={262} y={44} r={30} seed={82} />
          <MapSheet x={196} y={56} w={110} h={50} r={3} seed={83} />
        </g>
      ) : null}
      {kind === 'research' && v % 2 === 0 ? (
        <g>
          <MapSheet x={120} y={70} w={200} h={110} r={-4} seed={20} />
          <Shape pts={ell(212, 62, 36, 36, 20, 0.012, 21)} smooth fill={C.paperHi} fillOpacity={0.55} w={6} ink={C.strawDeep} stipple={false} />
          <Shape pts={ell(212, 62, 36, 36, 20, 0.012, 21)} smooth w={2.2} />
          <Stroke pts={[[238, 88], [268, 122]]} w={9} seed={22} />
          <Stroke pts={[[238, 88], [268, 122]]} w={4.4} color={C.woodLight} seed={23} />
          <Stroke pts={[[196, 50], [210, 44], [224, 52]]} w={1.6} opacity={0.6} />
          <CompassRose x={48} y={46} r={24} seed={24} />
        </g>
      ) : null}
      {kind === 'study' && v % 2 === 1 ? (
        <g>
          <Books x={52} y={96} n={5} seed={7} h={56} />
          <Books x={104} y={96} n={3} seed={9} h={42} />
          <Shape pts={box(210, 62, 16, 34)} fill={C.bone} w={2.6} seed={90} />
          <Shape pts={[[218, 44], [212, 60], [224, 60]]} fill={C.lantern} w={2.2} seed={91} stipple={false} />
          <Flecks marks={[[196, 52, 8, 190], [240, 52, 8, -10], [218, 30, 8, -90], [200, 38, 7, 220], [236, 38, 7, -40]]} w={2} seed={92} />
          <InkPot x={262} y={96} s={1.1} seed={93} />
          <Quill x={264} y={72} r={-70} seed={94} />
        </g>
      ) : null}
      {kind === 'study' && v % 2 === 0 ? (
        <g>
          <OpenBook x={130} y={96} s={1.9} seed={30} cover={C.ink3} />
          <PaperLantern x={238} y={52} s={1.5} seed={31} />
          <Stroke pts={[[238, 0], [238, 26]]} w={2.4} />
          {/* an hourglass */}
          <Shape pts={[[262, 40], [296, 40], [284, 66], [296, 92], [262, 92], [274, 66]]} fill={C.paperHi} fillOpacity={0.6} w={3} seed={32} stipple={false} />
          <Shape pts={[[270, 82], [288, 82], [280, 72]]} fill={C.ink2} w={0} reg={[0, 0]} />
          <Shape pts={box(258, 36, 42, 5)} fill={C.woodDeep} w={2} seed={33} />
          <Shape pts={box(258, 92, 42, 5)} fill={C.woodDeep} w={2} seed={34} />
          <Quill x={40} y={96} s={0.9} r={-30} seed={35} />
        </g>
      ) : null}
      {kind === 'coding' ? (
        <g>
          <GearWheel x={74} y={48} r={34} teeth={10} fill={C.tealLight} seed={40} />
          <GearWheel x={132} y={30} r={20} teeth={8} fill={C.strawDeep} seed={41} rot={0.3} />
          <Anvil x={150} y={100} s={0.95} seed={42} />
          <TypeBlock x={232} y={96} ch="{" seed={43} size={34} fill={C.woodLight} />
          <TypeBlock x={272} y={96} ch="}" seed={44} size={34} fill={C.straw} />
          <TypeBlock x={252} y={60} ch="0" seed={45} size={28} fill={C.hairGrey} />
        </g>
      ) : null}
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Kernel, drawn as a technical plate

const CALL: { n: number; at: [number, number]; to: [number, number]; text: string; side: 'l' | 'r' }[] = [
  { n: 1, at: [320, 112], to: [430, 112], text: 'Woven travelling hat', side: 'r' },
  { n: 2, at: [262, 186], to: [126, 186], text: 'Visor and eyes', side: 'l' },
  { n: 3, at: [254, 246], to: [126, 246], text: 'Chest dial', side: 'l' },
  { n: 4, at: [352, 306], to: [440, 322], text: 'Paper lantern', side: 'r' },
  { n: 5, at: [350, 228], to: [440, 220], text: 'Scarf', side: 'r' },
  { n: 6, at: [236, 316], to: [126, 330], text: 'Boots', side: 'l' },
];

export const KernelSchematic = memo(function KernelSchematic({ className }: { className?: string }) {
  return (
    <Scene
      w={640}
      h={420}
      className={className}
      label="A technical drawing of Kernel the robot, with numbered callouts naming six parts: a woven travelling hat, visor and eyes, a chest dial, a paper lantern, a scarf and boots. A dashed centre line, dimension marks and a title block give it the look of a plate from an engineer's notebook."
    >
      <rect width={640} height={420} fill={C.paperHi} />
      <Tone pts={box(0, 0, 640, 420)} opacity={0.1} />
      {/* construction lines */}
      <Flecks marks={Array.from({ length: 44 }, (_, i) => [262 + Math.cos((i / 44) * 6.283) * 124, 150 + Math.sin((i / 44) * 6.283) * 124, 6, (i / 44) * 360 + 90] as [number, number, number, number])} w={1.2} opacity={0.5} seed={3} />
      <Flecks marks={Array.from({ length: 22 }, (_, i) => [262, 28 + i * 16, 8, 90] as [number, number, number, number])} w={1.2} opacity={0.55} seed={4} />
      {/* dimension marks under the figure */}
      <Stroke pts={[[196, 380], [330, 380]]} w={1.4} smooth={false} seed={5} />
      <Stroke pts={[[196, 372], [196, 388]]} w={1.4} smooth={false} seed={6} />
      <Stroke pts={[[330, 372], [330, 388]]} w={1.4} smooth={false} seed={7} />
      <Lettering x={263} y={398} size={13} fill={INK}>a: one body wide</Lettering>
      <At x={150} y={46} s={1}>
        <KernelParts mood="idle" hold="lantern" />
      </At>
      {CALL.map((c) => {
        const toSide = c.side === 'r' ? 1 : -1;
        return (
          <g key={c.n}>
            <Stroke pts={[c.at, [c.to[0] - 14 * toSide, c.to[1]]]} w={1.6} smooth={false} seed={30 + c.n} />
            <Shape pts={ell(c.at[0], c.at[1], 3.4, 3.4, 6, 0.1, c.n)} smooth fill={C.ink} w={0} reg={[0, 0]} stipple={false} />
            <Shape pts={ell(c.to[0], c.to[1], 13, 13, 12, 0.04, 50 + c.n)} smooth fill={C.paperHi} w={2.6} stipple={false} />
            <text x={c.to[0]} y={c.to[1] + 5.5} textAnchor="middle" fontFamily="'Dela Gothic One', sans-serif" fontSize={15} fill={INK}>
              {c.n}
            </text>
            <Lettering x={c.to[0] + 22 * toSide} y={c.to[1] + 5} size={15} anchor={c.side === 'r' ? 'start' : 'end'} fill={INK}>
              {c.text}
            </Lettering>
          </g>
        );
      })}
      {/* the title block */}
      <Shape pts={box(440, 352, 188, 56)} fill={C.paperHi} w={3} seed={70} stipple={false} />
      <Stroke pts={[[440, 374], [628, 374]]} w={1.6} smooth={false} seed={71} />
      <Stroke pts={[[540, 374], [540, 408]]} w={1.6} smooth={false} seed={72} />
      <Lettering x={534} y={369} size={18} anchor="end" fill={INK}>
        KERNEL
      </Lettering>
      <Lettering x={456} y={392} size={12} anchor="start" fill={INK}>
        GUIDE UNIT
      </Lettering>
      <Lettering x={554} y={388} size={11} anchor="start" fill={INK}>
        SHEET 1 OF 1
      </Lettering>
      <Lettering x={554} y={400} size={10} anchor="start" fill={C.ink3}>
        NOT TO SCALE
      </Lettering>
      <Cat x={78} y={400} pose="loaf" seed={80} s={0.9} />
    </Scene>
  );
});
