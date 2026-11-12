import { memo } from 'react';
import { C, INK } from './palette';
import { Dry, Flecks, Scene, Shape, Stroke, Wash } from './Draw';
import { box, ell } from './ink';
import { Planks } from './props';
import { Books, CompassRose, Quill, RolledScroll, ScrollEnd, SealStamp, Signpost, Telescope, WaxSeal } from './kit';

export type SpotKind = 'lab' | 'atlas' | 'scenarios' | 'codex' | 'certification';

const WALL: Record<SpotKind, string> = { lab: '#a9a7a2', atlas: C.bone, scenarios: C.sky2, codex: '#d2d0cb', certification: C.paperLo };

const LABEL: Record<SpotKind, string> = {
  lab: 'Three painted wooden blocks on a workbench, each marked for one part of a prompt.',
  atlas: 'A brass telescope on a stand beside a compass rose.',
  scenarios: 'A signpost with three boards pointing different ways.',
  codex: 'Scrolls in pigeonholes above a row of books.',
  certification: 'A red wax seal on a sheet of paper, with a stamp and a quill.',
};

/** Small spot illustrations for the home page: one object from each place, on a strip of its own wall and floor. 240 x 150. */
export const Spot = memo(function Spot({ kind, className, decorative = false }: { kind: SpotKind; className?: string; decorative?: boolean }) {
  return (
    <Scene w={240} h={150} className={className} label={decorative ? undefined : LABEL[kind]}>
      <rect width={240} height={150} fill={WALL[kind]} />
      {kind === 'scenarios' ? (
        <g>
          <rect y={96} width={240} height={54} fill={C.hillNear} />
          <Shape pts={ell(180, 74, 34, 34, 16, 0.02, 3)} smooth fill={C.sun} w={2.6} hatch={{ angle: -35, gap: 7, w: 1.2, density: 0.8 }} hatchColor={C.roofRed} hatchOpacity={0.6} />
          <Stroke pts={[[0, 97], [120, 99], [240, 97]]} w={3.4} />
          <Dry pts={[[90, 150], [110, 124], [150, 104]]} w={16} color={C.paperLo} opacity={0.8} bristles={6} seed={4} />
          <Signpost
            x={92}
            y={140}
            s={0.82}
            h={132}
            seed={5}
            boards={[
              { at: 116, dir: 1, fill: C.bone, w: 62 },
              { at: 88, dir: -1, fill: C.lantern, w: 56 },
              { at: 60, dir: 1, fill: C.tealLight, w: 52 },
            ]}
          />
        </g>
      ) : (
        <Planks pts={[[0, 112], [240, 112], [240, 150], [0, 150]]} rows={2} seed={7} />
      )}
      {kind === 'lab' ? (
        <g>
          <Wash pts={[[30, 112], [120, 116], [214, 112], [200, 122], [44, 122]]} fill={INK} opacity={0.22} />
          {[[70, C.seal, 0], [122, C.indigo, 1], [174, C.teal, 2]].map(([x, fill, i]) => (
            <g key={i as number}>
              <Shape pts={[[(x as number) - 20, 72], [(x as number) + 20, 73], [(x as number) + 20, 112], [(x as number) - 20, 112]]} fill={fill as string} w={2.8} seed={20 + (i as number)} />
              <Shape pts={[[(x as number) + 20, 73], [(x as number) + 30, 65], [(x as number) + 30, 104], [(x as number) + 20, 112]]} fill={fill as string} w={2.2} seed={24 + (i as number)} hatch={{ angle: -60, gap: 3.6, w: 1 }} hatchOpacity={0.6} />
              <Shape pts={[[(x as number) - 20, 72], [(x as number) - 10, 64], [(x as number) + 30, 65], [(x as number) + 20, 73]]} fill={fill as string} w={2.2} seed={28 + (i as number)} />
              <Wash pts={[[(x as number) - 20, 72], [(x as number) - 10, 64], [(x as number) + 30, 65], [(x as number) + 20, 73]]} fill={C.bone} opacity={0.3} smooth={false} />
            </g>
          ))}
          <Shape pts={ell(70, 92, 10, 10, 9, 0.04, 31)} smooth w={2.4} ink={C.bone} />
          <Stroke pts={[[122, 84], [122, 102]]} w={4.4} color={C.bone} smooth={false} />
          <Flecks marks={[[164, 84, 20, 0], [164, 92, 14, 0], [164, 100, 20, 0]]} w={3} color={C.bone} seed={32} />
        </g>
      ) : null}
      {kind === 'atlas' ? (
        <g>
          <CompassRose x={62} y={62} r={40} seed={41} />
          <Telescope x={166} y={126} s={1.1} r={-24} seed={42} />
        </g>
      ) : null}
      {kind === 'codex' ? (
        <g>
          <Shape pts={box(22, 16, 196, 52)} fill={C.ink2} w={3} seed={51} />
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              {i < 5 ? <Stroke pts={[[22 + i * 39.2, 16], [22 + i * 39.2, 68]]} w={3.4} color={C.wood} smooth={false} seed={52 + i} /> : null}
              {i !== 3 ? <ScrollEnd x={41.6 + i * 39.2} y={38} r={12} seed={56 + i} tag={[C.indigo, C.teal, C.ochre, C.seal, C.indigo][i]!} /> : null}
            </g>
          ))}
          <Shape pts={box(18, 68, 204, 8)} fill={C.woodLight} w={2.4} seed={61} />
          <Books x={36} y={112} n={7} seed={5} h={30} />
          <RolledScroll x={184} y={112} seed={62} band={C.teal} len={46} />
        </g>
      ) : null}
      {kind === 'certification' ? (
        <g>
          <Shape pts={[[40, 26], [176, 22], [180, 104], [44, 108]]} fill={C.paperHi} w={2.8} seed={71} />
          <Flecks marks={[[56, 42, 80, -1], [56, 54, 100, -1], [56, 66, 64, -1], [56, 78, 86, -1]]} w={1.6} opacity={0.7} seed={72} />
          <WaxSeal x={150} y={82} r={20} seed={73} />
          <SealStamp x={206} y={112} seed={74} />
          <Quill x={30} y={112} r={-58} seed={75} />
        </g>
      ) : null}
    </Scene>
  );
});
