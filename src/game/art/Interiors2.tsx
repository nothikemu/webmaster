/** The Archive, the Trial Hall and the Harbor Office: near layers. */
import { memo } from 'react';
import { C, INK } from '@/art/palette';
import { At, Dry, Flecks, Hatch, Shape, Stroke, Tone, Wash } from '@/art/Draw';
import { box, ell } from '@/art/ink';
import { Books, Lettering, Ladder, OpenBook, RolledScroll, Table } from '@/art/kit';
import { Door, Floor, Lamp, Litter, Paper, RoomSvg, WALL_BASE } from './parts';

const ExitDoor = ({ label = 'QUAY' }: { label?: string }) => (
  <g>
    <Door x={120} base={WALL_BASE + 8} w={140} h={236} light seed={7} />
    <Lettering x={120} y={WALL_BASE - 262} size={15} fill={INK}>{label}</Lettering>
  </g>
);

/** A stone pillar that runs from floor to ceiling, in front of the wall. */
function Pillar({ x, h = 470, w = 44, seed = 1 }: { x: number; h?: number; w?: number; seed?: number }) {
  return (
    <g>
      <Wash pts={[[x + w / 2, 480], [x + w + 24, 486], [x + w + 24, 500], [x + w / 2, 500]]} fill={INK} opacity={0.25} smooth={false} />
      <Shape pts={box(x - w / 2, 488 - h, w, h)} fill={C.bone} w={3} seed={seed} hatch={{ angle: 90, gap: 6, w: 1.1 }} hatchOpacity={0.4} />
      <Hatch pts={box(x + w * 0.1, 488 - h, w * 0.4, h)} angle={-60} gap={5} w={1.1} opacity={0.5} seed={seed + 1} />
      <Shape pts={box(x - w / 2 - 8, 488 - h - 6, w + 16, 16)} fill={C.paperLo} w={2.6} seed={seed + 2} />
      <Shape pts={box(x - w / 2 - 8, 478, w + 16, 16)} fill={C.paperLo} w={2.6} seed={seed + 3} />
    </g>
  );
}

// ----------------------------------------------------------------------------------------------------- Archive
export const ArchiveNear = memo(function ArchiveNear() {
  const W = 1800;
  return (
    <RoomSvg w={W}>
      <Floor w={W} fill={C.paperLo} seed={41} seams={170} />
      <ExitDoor />
      <Pillar x={640} seed={501} />
      <Pillar x={1350} seed={505} />
      {/* a filing cabinet marked 1997, with a chess knight on top */}
      <At x={440} y={0}>
        <Wash pts={[[-60, 486], [60, 486], [74, 502], [-74, 502]]} fill={INK} opacity={0.25} />
        <Shape pts={box(-52, 290, 104, 198)} fill={C.ink3} w={3.2} seed={511} hatch={{ angle: -55, gap: 5, w: 1.1 }} hatchOpacity={0.4} />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <Shape pts={box(-46, 298 + i * 46, 92, 40)} fill={C.straw} w={2.4} seed={512 + i} />
            <Shape pts={box(-22, 308 + i * 46, 44, 12)} fill={C.paperHi} w={1.4} seed={516 + i} />
            <Shape pts={ell(0, 330 + i * 46, 4, 4, 7, 0.1, 520 + i)} smooth fill={C.ink} w={0} reg={[0, 0]} />
          </g>
        ))}
        <Lettering x={0} y={324} size={9} fill={INK}>1997</Lettering>
        <Shape pts={[[-18, 290], [-18, 276], [-8, 262], [-10, 244], [2, 236], [14, 244], [12, 258], [20, 268], [20, 290]]} smooth fill={C.ink} w={2.4} seed={525} />
        <Paper x={22} y={262} w={40} h={28} lines={3} seed={526} r={6} />
      </At>
      <Lamp x={440} y={52} drop={90} r={140} seed={527} />
      {/* the timeline table, with seven cards standing on it */}
      <At x={850} y={0}>
        <Table x={0} y={488} w={400} h={104} seed={531} fill={C.woodLight} />
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i}>
            <Shape pts={[[-174 + i * 58, 384], [-134 + i * 58, 384], [-130 + i * 58, 346], [-170 + i * 58, 346]]} fill={C.paperHi} w={2} seed={535 + i} />
            <Stroke pts={[[-164 + i * 58, 356], [-140 + i * 58, 356]]} w={1.4} smooth={false} /><Stroke pts={[[-164 + i * 58, 364], [-146 + i * 58, 364]]} w={1.4} smooth={false} /><Stroke pts={[[-164 + i * 58, 372], [-142 + i * 58, 372]]} w={1.4} smooth={false} />
          </g>
        ))}
        <Shape pts={box(-186, 386, 372, 5)} fill={C.ink3} w={0} reg={[0, 0]} />
      </At>
      <Lamp x={850} y={52} drop={150} r={190} seed={545} />
      {/* ledger shelves, a ladder, and a typed strip sticking out of one book */}
      <At x={1180} y={0}>
        <Shape pts={box(-84, 150, 168, 338)} fill={C.wood} w={3.4} seed={551} />
        <Shape pts={box(-74, 160, 148, 318)} fill={C.ink2} w={0} reg={[0, 0]} />
        {[0, 1, 2, 3, 4].map((r) => (
          <g key={r}>
            <Books x={-70} y={206 + r * 66} n={8} seed={560 + r} h={48} />
            <Shape pts={box(-76, 206 + r * 66, 152, 6)} fill={C.woodLight} w={2} seed={570 + r} />
          </g>
        ))}
        <Paper x={20} y={278} w={22} h={60} lines={4} seed={580} r={4} />
        <Ladder x1={90} y1={150} x2={134} y2={488} width={22} rungs={9} seed={581} />
      </At>
      {/* the display case with the chip plate */}
      <At x={1450} y={0}>
        <Shape pts={box(-52, 392, 104, 96)} fill={C.wood} w={3} seed={591} hatch={{ angle: -55, gap: 5, w: 1 }} hatchOpacity={0.4} />
        <Shape pts={box(-56, 296, 112, 96)} fill={C.paperHi} w={3} seed={592} fillOpacity={0.35} stipple={false} />
        <Shape pts={box(-30, 332, 60, 40)} fill={C.ink3} w={2.4} seed={593} />
        <path d={Array.from({ length: 5 }, (_, i) => `M${-22 + i * 11} 338V366M-26 ${342 + i * 7}H26`).join('')} stroke={C.lantern} strokeWidth="1.4" opacity="0.8" fill="none" />
        <Stroke pts={[[-56, 300], [56, 388]]} w={1.4} color={C.paperHi} opacity={0.7} smooth={false} />
        <circle cx={0} cy={330} r={90} fill="url(#glow)" opacity="0.4" style={{ mixBlendMode: 'screen' }} />
      </At>
      {/* the Codex shelves */}
      <At x={1700} y={0}>
        <Shape pts={box(-84, 110, 168, 378)} fill={C.wood} w={3.6} seed={601} />
        {[0, 1, 2, 3, 4].map((r) => (
          <g key={r}>
            <Books x={-76} y={176 + r * 68} n={9} seed={610 + r} h={52} />
            <Shape pts={box(-80, 176 + r * 68, 160, 7)} fill={C.woodLight} w={2} seed={620 + r} />
          </g>
        ))}
        <Lettering x={0} y={130} size={14} fill={C.paperHi}>CODEX</Lettering>
      </At>
      <Litter w={W} y={548} seed={8} n={60} />
    </RoomSvg>
  );
});

// ----------------------------------------------------------------------------------------------------- Trial Hall
export const HallNear = memo(function HallNear() {
  const W = 1800;
  return (
    <RoomSvg w={W}>
      <Floor w={W} fill={C.straw} seed={51} seams={200} />
      <ExitDoor />
      <Pillar x={730} seed={701} />
      <Pillar x={1400} seed={705} />
      {/* the case-file wall: six folders in frames, and a desk */}
      <At x={520} y={0}>
        <Shape pts={box(-132, 120, 264, 216)} fill={C.ink3} w={3.6} seed={711} />
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const cx = -100 + (i % 3) * 78;
          const cy = 140 + Math.floor(i / 3) * 98;
          return (
            <g key={i}>
              <Shape pts={box(cx, cy, 64, 84)} fill={C.paperHi} w={2.4} seed={715 + i} />
              <Shape pts={box(cx + 4, cy + 4, 56, 12)} fill={C.ink3} w={0} reg={[0, 0]} />
              <Lettering x={cx + 32} y={cy + 14} size={8} fill={C.paperHi}>{`CASE ${i + 1}`}</Lettering>
              <Flecks marks={[[cx + 8, cy + 30, 40, 0], [cx + 8, cy + 42, 34, 0], [cx + 8, cy + 54, 40, 0]]} w={1.4} seed={725 + i} opacity={0.7} />
            </g>
          );
        })}
        <Table x={0} y={488} w={220} h={100} seed={731} fill={C.woodLight} />
        <OpenBook x={-30} y={394} s={0.9} seed={732} />
      </At>
      <Lamp x={520} y={52} drop={50} r={150} seed={733} />
      {/* the judge's bench */}
      <At x={880} y={0}>
        <Shape pts={box(-100, 330, 200, 158)} fill={C.wood} w={3.6} seed={741} hatch={{ angle: 90, gap: 12, w: 1.3 }} hatchOpacity={0.35} />
        <Shape pts={box(-108, 318, 216, 16)} fill={C.woodLight} w={3} seed={742} />
        <Shape pts={ell(0, 410, 26, 26, 12, 0.03, 743)} smooth fill={C.straw} w={2.8} />
        <Stroke pts={[[-14, 410], [14, 410]]} w={2.4} smooth={false} /><Stroke pts={[[0, 394], [0, 426]]} w={2.4} smooth={false} />
        <Paper x={-30} y={294} w={56} h={26} lines={2} seed={744} r={-3} />
        <Shape pts={box(46, 304, 28, 14)} fill={C.wood} w={2.2} seed={745} /><Stroke pts={[[60, 304], [60, 288]]} w={4} color={C.woodDeep} smooth={false} seed={746} />
      </At>
      <Lamp x={880} y={52} drop={90} r={160} seed={747} />
      {/* the witness stand */}
      <At x={1190} y={0}>
        <Shape pts={box(-60, 406, 120, 82)} fill={C.wood} w={3.2} seed={751} />
        <Shape pts={box(-66, 392, 132, 16)} fill={C.woodLight} w={2.8} seed={752} />
        {[-48, -24, 0, 24, 48].map((dx, i) => <Stroke key={dx} pts={[[dx, 392], [dx, 352]]} w={5} color={C.woodDeep} seed={753 + i} taper={0} />)}
        <Stroke pts={[[-56, 352], [56, 352]]} w={8} color={C.woodDeep} seed={758} taper={0} />
        <Paper x={-8} y={474} w={30} h={20} lines={2} seed={759} r={-8} />
      </At>
      {/* the examination door */}
      <At x={1560} y={0}>
        <Wash pts={[[-140, 486], [140, 486], [160, 504], [-160, 504]]} fill={INK} opacity={0.25} />
        <Door x={0} base={WALL_BASE + 4} w={240} h={320} seed={761} />
        <Shape pts={ell(0, 220, 30, 30, 12, 0.03, 762)} smooth fill={C.bone} w={3} />
        <Stroke pts={[[-18, 220], [18, 220]]} w={2.4} smooth={false} /><Stroke pts={[[0, 202], [0, 238]]} w={2.4} smooth={false} />
        {[-166, 166].map((dx, i) => <Lamp key={dx} x={dx} y={170} drop={60} r={110} s={0.9} seed={765 + i} />)}
        <Lettering x={0} y={150} size={14} fill={INK}>EXAMINATION</Lettering>
      </At>
      <Litter w={W} y={548} seed={9} n={60} />
    </RoomSvg>
  );
});

// ----------------------------------------------------------------------------------------------------- Harbor Office
export const OfficeNear = memo(function OfficeNear() {
  const W = 1500;
  return (
    <RoomSvg w={W}>
      <Floor w={W} fill={C.straw} seed={61} seams={120} />
      <ExitDoor />
      {/* the mission board */}
      <At x={360} y={0}>
        <Shape pts={box(-130, 110, 260, 216)} fill={C.wood} w={4} seed={801} />
        <Shape pts={box(-118, 122, 236, 192)} fill={C.clothOchre} w={0} reg={[0, 0]} />
        <Tone pts={box(-118, 122, 236, 192)} opacity={0.35} />
        {[[-100, 134, -5], [-40, 140, 4], [20, 132, -3], [72, 146, 6], [-92, 214, 3], [-26, 226, -6], [34, 218, 5], [84, 232, -4]].map(([px, py, r], i) => <Paper key={i} x={px as number} y={py as number} w={44} h={58} lines={3} seed={810 + i} r={r as number} />)}
        <Shape pts={box(-60, 488 - 30, 120, 30)} fill={C.wood} w={2.6} seed={820} />
      </At>
      <Lamp x={360} y={52} drop={50} r={150} seed={821} />
      <Paper x={578} y={308} w={30} h={42} lines={3} seed={822} r={-5} />
      <Stroke pts={[[590, 120], [591, 488]]} w={14} color={C.woodDeep} seed={823} taper={0.02} />
      <Shape pts={ell(594, 312, 3, 3, 6, 0.1, 824)} smooth fill={C.seal} w={0} reg={[0, 0]} />
      {/* the logbook on its lectern */}
      <At x={830} y={0}>
        <Stroke pts={[[0, 488], [0, 334]]} w={14} color={C.woodDeep} seed={831} taper={0.02} />
        <Shape pts={box(-30, 478, 60, 12)} fill={C.wood} w={2.6} seed={832} />
        <Shape pts={[[-70, 336], [70, 336], [58, 306], [-58, 306]]} fill={C.woodLight} w={3} seed={833} />
        <OpenBook x={0} y={322} s={1.3} seed={834} />
      </At>
      <Lamp x={830} y={52} drop={100} r={140} seed={835} />
      {/* the codex cabinet, pigeonholes with scrolls */}
      <At x={1060} y={0}>
        <Shape pts={box(-84, 190, 168, 298)} fill={C.wood} w={3.4} seed={841} />
        {[0, 1, 2].map((r) => [0, 1].map((c) => (
          <g key={`${r}${c}`}>
            <Shape pts={box(-74 + c * 80, 202 + r * 94, 68, 82)} fill={C.ink2} w={2} seed={845 + r * 2 + c} />
            <RolledScroll x={-70 + c * 80 + 10} y={248 + r * 94} s={0.9} seed={850 + r} len={46} r={-8} />
          </g>
        )))}
        <Lettering x={0} y={178} size={13} fill={INK}>CODEX</Lettering>
      </At>
      {/* the chart table */}
      <At x={1290} y={0}>
        <Table x={0} y={488} w={240} h={102} seed={861} fill={C.woodLight} />
        <Shape pts={[[-100, 386], [100, 386], [92, 372], [-92, 372]]} fill={C.paperHi} w={2.4} seed={862} />
        <Stroke pts={[[-80, 380], [-30, 374], [10, 380], [60, 374]]} w={1.6} seed={863} opacity={0.7} />
        <Dry pts={[[-80, 378], [0, 376], [80, 378]]} w={4} color={C.ink3} opacity={0.4} seed={864} />
      </At>
      <Lamp x={1290} y={52} drop={90} r={150} seed={865} />
      <Litter w={W} y={548} seed={10} n={50} />
    </RoomSvg>
  );
});
