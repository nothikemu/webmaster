import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke } from './Draw';
import { box, ell, type Pt } from './ink';

/** The emblem inside each medal, hand-inked in a 120 x 120 box. One distinct glyph per real achievement. */
const GLYPHS: Record<string, () => JSX.Element> = {
  'loom-keeper': () => (
    <g>
      <Shape pts={box(28, 26, 64, 8)} fill={C.woodDeep} w={2.6} />
      <Shape pts={box(28, 86, 64, 8)} fill={C.woodDeep} w={2.6} />
      {[38, 49, 60, 71, 82].map((x, i) => (
        <Stroke key={i} pts={[[x, 34], [x + (i % 2) - 0.5, 60], [x, 86]]} w={3.4} color={INK} seed={500 + i} />
      ))}
      <Stroke pts={[[32, 52], [44, 64], [56, 50], [68, 64], [80, 50], [90, 62]]} w={5.2} color={C.seal} smooth={false} />
      {[[44, 64], [68, 64], [56, 50], [80, 50]].map(([x, y], i) => (
        <Shape key={i} pts={ell(x!, y!, 4.4, 4.4, 7, 0.1, 510 + i)} smooth fill={C.bone} w={2} reg={[0.6, 0.6]} />
      ))}
    </g>
  ),
  'model-explorer': () => (
    <g>
      <Shape pts={ell(60, 60, 31, 31, 16, 0.02, 520)} smooth fill={C.bone} w={3.4} hatch={{ angle: -50, gap: 6, w: 1.1 }} hatchOpacity={0.4} />
      <Flecks marks={[[60, 24, 6, 90], [60, 96, 6, -90], [24, 60, 6, 0], [96, 60, 6, 180]]} w={3} />
      <Shape pts={[[60, 34], [70, 60], [60, 86], [50, 60]]} fill={C.bone} w={3} />
      <Shape pts={[[60, 34], [70, 60], [50, 60]]} fill={C.seal} w={2.4} />
      <Shape pts={ell(60, 60, 4, 4, 6, 0.05, 521)} smooth fill={INK} w={0} reg={[0, 0]} />
    </g>
  ),
  'prompt-smith': () => (
    <g>
      <Shape pts={[[26, 70], [52, 70], [60, 54], [94, 52], [92, 64], [80, 70], [76, 86], [42, 86], [38, 72]]} fill={C.ink2} w={3.2} hatch={{ angle: -45, gap: 5, w: 1.1 }} hatchColor={C.bone} hatchOpacity={0.35} />
      <Stroke pts={[[44, 74], [58, 62], [86, 58]]} w={2.2} color={C.bone} opacity={0.7} />
      <Shape pts={box(34, 86, 50, 8)} fill={C.woodDeep} w={2.4} />
      <Flecks marks={[[56, 42, 12, -90], [70, 40, 12, -70], [44, 44, 10, -110], [82, 46, 10, -50]]} w={3.2} color={C.lantern} />
    </g>
  ),
  'source-hunter': () => (
    <g>
      <Shape pts={[[34, 36], [78, 34], [80, 90], [36, 92]]} fill={C.bone} w={2.8} />
      <Flecks marks={[[42, 46, 26, 0], [42, 56, 20, 0], [42, 66, 24, 0], [42, 76, 16, 0]]} w={2.2} opacity={0.8} />
      <Shape pts={ell(58, 56, 22, 22, 14, 0.03, 530)} smooth fill={C.tealLight} fillOpacity={0.55} w={4.6} />
      <Stroke pts={[[46, 46], [52, 42]]} w={2.6} color={C.bone} />
      <Stroke pts={[[74, 74], [96, 98]]} w={9} color={INK} taper={0.08} />
      <Stroke pts={[[74, 74], [96, 98]]} w={4.4} color={C.woodLight} taper={0.08} />
    </g>
  ),
  'sharp-eye': () => (
    <g>
      <Shape pts={[[20, 62], [38, 44], [60, 38], [82, 44], [100, 62], [82, 80], [60, 86], [38, 80]]} smooth fill={C.bone} w={3.6} />
      <Shape pts={ell(60, 62, 16, 16, 12, 0.03, 540)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(60, 62, 10, 10, 10, 0.03, 541)} smooth fill={C.teal} w={0} reg={[0, 0]} />
      <Shape pts={ell(56, 57, 4.6, 4.6, 6, 0.1, 542)} smooth fill={C.bone} w={0} reg={[0, 0]} />
      <Flecks marks={[[60, 26, 10, -90], [38, 30, 9, -120], [82, 30, 9, -60], [24, 44, 8, -150], [96, 44, 8, -30]]} w={3} />
    </g>
  ),
  'fair-hand': () => (
    <g>
      <Stroke pts={[[60, 90], [60, 32]]} w={5} color={INK} />
      <Shape pts={[[40, 94], [80, 94], [76, 86], [44, 86]]} fill={C.woodDeep} w={2.4} />
      <Stroke pts={[[26, 40], [60, 34], [94, 40]]} w={5} color={INK} />
      <Shape pts={ell(60, 30, 5, 5, 6, 0.05, 550)} smooth fill={C.seal} w={2.4} />
      {[26, 94].map((x, i) => (
        <g key={x}>
          <Stroke pts={[[x, 40], [x - 10, 62]]} w={1.8} />
          <Stroke pts={[[x, 40], [x + 10, 62]]} w={1.8} />
          <Shape pts={[[x - 14, 62], [x + 14, 62], [x + 8, 72], [x - 8, 72]]} smooth fill={C.bone} w={2.8} seed={551 + i} />
        </g>
      ))}
    </g>
  ),
  'lantern-bearer': () => (
    <g>
      <Stroke pts={[[44, 38], [60, 22], [76, 38]]} w={3.4} />
      <Shape pts={box(46, 36, 28, 8)} fill={INK} w={2.4} />
      <Shape pts={ell(60, 62, 20, 25, 12, 0.04, 560)} smooth fill={C.lantern} w={3.4} hatch={{ angle: -60, gap: 6, w: 1.3 }} hatchOpacity={0.45} />
      <Stroke pts={[[41, 62], [60, 68], [79, 62]]} w={2.2} opacity={0.7} />
      <Stroke pts={[[50, 42], [46, 62], [50, 82]]} w={2} opacity={0.7} />
      <Stroke pts={[[70, 42], [74, 62], [70, 82]]} w={2} opacity={0.7} />
      <Shape pts={box(48, 86, 24, 8)} fill={INK} w={2.4} />
      <Flecks marks={[[22, 56, 10, 180], [98, 56, 10, 0], [26, 80, 9, 150], [94, 80, 9, 30], [60, 12, 8, -90]]} w={3} />
    </g>
  ),
  fieldwork: () => (
    <g>
      <Stroke pts={[[38, 98], [38, 24]]} w={5.6} color={INK} />
      <Shape pts={[[40, 26], [92, 30], [78, 44], [92, 58], [40, 56]]} smooth fill={C.seal} w={3} hatch={{ angle: 60, gap: 5, w: 1.1 }} hatchOpacity={0.5} />
      <Shape pts={[[24, 96], [70, 94], [76, 100], [22, 102]]} fill={C.woodDeep} w={2.2} />
      <Shape pts={[[70, 78], [76, 70], [82, 78], [78, 88], [72, 88]]} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={[[88, 90], [94, 82], [100, 90], [96, 100], [90, 100]]} smooth fill={INK} w={0} reg={[0, 0]} />
    </g>
  ),
  'literacy-master': () => (
    <g>
      <Shape pts={[[48, 94], [72, 94], [68, 42], [52, 42]]} fill={C.bone} w={3.2} />
      <Shape pts={[[53, 58], [67, 58], [69, 70], [51, 70]]} fill={C.seal} w={2.4} />
      <Shape pts={box(44, 34, 32, 9)} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={[[50, 34], [60, 18], [70, 34]]} fill={C.lantern} w={2.8} />
      <Flecks marks={[[28, 30, 12, 200], [92, 30, 12, -20], [24, 48, 11, 175], [96, 48, 11, 5]]} w={3.2} />
      <Stroke pts={[[26, 100], [38, 94], [50, 100], [62, 94], [74, 100], [86, 94], [96, 100]]} w={3.4} />
    </g>
  ),
};

const HUE_FILL: Record<string, string> = { understand: C.indigo, use: C.teal, responsible: C.ochre, all: C.seal };
const FRAME: Pt[] = [[30, 8], [90, 6], [114, 30], [112, 90], [90, 114], [30, 112], [8, 90], [6, 30]];
const INNER: Pt[] = [[32, 15], [88, 14], [106, 32], [105, 88], [88, 106], [32, 105], [15, 88], [14, 32]];

interface MedalProps {
  id: string;
  path: 'understand' | 'use' | 'responsible' | 'all';
  earned: boolean;
  className?: string;
}

/** A medal: a chamfered, hand-inked frame on a hard offset shadow, with one glyph. Locked medals are hatched, faded and padlocked. */
export const Medal = memo(function Medal({ id, path, earned, className }: MedalProps) {
  const Glyph = GLYPHS[id];
  return (
    <svg className={className} viewBox="0 0 126 126" aria-hidden="true" focusable="false">
      <g transform="translate(6 6)">
        <Shape pts={FRAME} fill={INK} w={0} reg={[0, 0]} wob={0.6} />
      </g>
      <Shape pts={FRAME} fill={earned ? HUE_FILL[path]! : C.paperLo} w={4.2} hatch={earned ? { angle: -50, gap: 7, w: 1.3, density: 0.75 } : { angle: 45, gap: 6, w: 1.4 }} hatchColor={earned ? INK : INK} hatchOpacity={earned ? 0.28 : 0.3} />
      {earned ? <Shape pts={INNER} w={1.8} ink={C.bone} wob={0.8} /> : null}
      {earned ? (
        <g>
          <Shape pts={ell(60, 60, 38, 38, 18, 0.02, 580)} smooth fill={C.bone} fillOpacity={0.3} w={0} reg={[0, 0]} />
          {Glyph ? <Glyph /> : null}
        </g>
      ) : (
        <g opacity={0.75}>
          <Shape pts={box(44, 58, 32, 26)} fill={C.paperLo} w={3.4} />
          <Stroke pts={[[50, 58], [50, 48], [60, 40], [70, 48], [70, 58]]} w={4.2} />
          <Shape pts={ell(60, 70, 3, 3, 6, 0.1, 581)} smooth fill={INK} w={0} reg={[0, 0]} />
        </g>
      )}
      <Hatch pts={[[96, 20], [106, 32], [105, 88], [96, 100]]} angle={-60} gap={5} w={1.2} opacity={earned ? 0.3 : 0.2} />
    </svg>
  );
});
