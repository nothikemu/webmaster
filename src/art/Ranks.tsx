import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke } from './Draw';
import { arc, box, ell, star, type Pt } from './ink';

/**
 * Rank insignia: one device for each of the ten levels, painted on a shield.
 * The ranks follow a working life in the harbor, from coiling rope on the dock to keeping the light.
 * Each device is drawn in a 120 x 120 box.
 */
const DEVICES: readonly (() => JSX.Element)[] = [
  // 1 Dockhand: a coil of rope with a loose end
  () => (
    <g>
      {[30, 22, 14].map((r, i) => (
        <Shape key={r} pts={ell(60, 66, r, r * 0.62, 14, 0.03, 600 + i)} smooth w={5.4} ink={C.strawDeep} />
      ))}
      {[30, 22, 14].map((r, i) => (
        <Shape key={`l${r}`} pts={ell(60, 66, r, r * 0.62, 14, 0.03, 600 + i)} smooth w={1.4} />
      ))}
      <Stroke pts={[[88, 62], [98, 46], [90, 30]]} w={5.4} color={C.strawDeep} />
      <Stroke pts={[[88, 62], [98, 46], [90, 30]]} w={1.4} />
    </g>
  ),
  // 2 Lamplighter: a lantern on a pole
  () => (
    <g>
      <Stroke pts={[[36, 100], [38, 60], [40, 22]]} w={5} />
      <Stroke pts={[[40, 26], [66, 28]]} w={4} />
      <Stroke pts={[[66, 28], [66, 40]]} w={2.4} />
      <Shape pts={box(57, 40, 18, 6)} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(66, 62, 15, 18, 10, 0.05, 610)} smooth fill={C.lantern} w={3} hatch={{ angle: -60, gap: 5, w: 1.1 }} hatchOpacity={0.45} />
      <Shape pts={box(58, 78, 16, 5)} fill={INK} w={0} reg={[0, 0]} />
      <Flecks marks={[[90, 50, 9, -20], [92, 66, 9, 10], [86, 82, 8, 40]]} w={2.6} />
    </g>
  ),
  // 3 Scribe: a quill over a line of writing
  () => (
    <g>
      <Shape pts={[[44, 78], [56, 50], [76, 28], [94, 22], [92, 40], [76, 62], [56, 80]]} smooth fill={C.bone} w={3} seed={620} />
      <Flecks marks={[[62, 50, 10, 20], [72, 40, 10, 20], [82, 32, 9, 20], [66, 66, 9, -70], [78, 54, 9, -70]]} w={1.4} opacity={0.7} />
      <Stroke pts={[[30, 96], [46, 76], [92, 24]]} w={3} />
      <Stroke pts={[[26, 100], [40, 98], [54, 102], [70, 98], [90, 101]]} w={3.4} color={C.seal} />
    </g>
  ),
  // 4 Surveyor: a pair of dividers over a ruled line
  () => (
    <g>
      <Shape pts={ell(60, 28, 7, 7, 8, 0.05, 630)} smooth fill={C.lantern} w={2.8} />
      <Stroke pts={[[57, 34], [36, 96]]} w={5} />
      <Stroke pts={[[63, 34], [84, 96]]} w={5} />
      <Stroke pts={[[46, 66], [74, 66]]} w={3} color={C.strawDeep} />
      <Stroke pts={[[22, 100], [98, 100]]} w={3} smooth={false} />
      <Flecks marks={[[22, 100, 7, -90], [41, 100, 5, -90], [60, 100, 7, -90], [79, 100, 5, -90], [98, 100, 7, -90]]} w={2} />
    </g>
  ),
  // 5 Navigator: a star to steer by, over the swell
  () => (
    <g>
      <Shape pts={star(60, 46, 28, 4, 0.3)} fill={C.lantern} w={3} seed={640} />
      <Shape pts={star(60, 46, 15, 4, 0.36, Math.PI / 4)} fill={C.bone} w={2} seed={641} />
      <Stroke pts={[[20, 88], [34, 80], [48, 88], [62, 80], [76, 88], [90, 80], [100, 86]]} w={4} color={C.teal} />
      <Stroke pts={[[24, 102], [38, 94], [52, 102], [66, 94], [80, 102], [96, 96]]} w={3} color={C.teal} />
    </g>
  ),
  // 6 Cartographer: a folded chart with a route and a cross
  () => (
    <g>
      <Shape pts={[[22, 34], [46, 26], [72, 36], [98, 26], [98, 88], [72, 98], [46, 88], [22, 96]]} fill={C.paperHi} w={3} seed={650} />
      <Stroke pts={[[46, 26], [46, 88]]} w={1.8} opacity={0.7} smooth={false} />
      <Stroke pts={[[72, 36], [72, 98]]} w={1.8} opacity={0.7} smooth={false} />
      <Flecks marks={[[30, 80, 6, -40], [38, 72, 6, -30], [48, 66, 6, -10], [58, 64, 6, 10], [68, 60, 6, -30]]} w={2.4} color={C.seal} />
      <Flecks marks={[[78, 46, 12, 45], [78, 54.5, 12, -45]]} w={3.2} color={C.seal} />
    </g>
  ),
  // 7 Wayfinder: the compass rose
  () => (
    <g>
      <Shape pts={ell(60, 60, 38, 38, 20, 0.012, 660)} smooth w={2.6} />
      <Shape pts={star(60, 60, 24, 4, 0.3, Math.PI / 4)} fill={C.paperLo} w={1.8} seed={661} />
      <Shape pts={star(60, 60, 36, 4, 0.2)} fill={C.bone} w={2.6} seed={662} />
      <Shape pts={[[60, 24], [65, 55], [60, 60], [55, 55]]} fill={C.seal} w={1.8} />
      <Shape pts={ell(60, 60, 3.4, 3.4, 6, 0.1, 663)} smooth fill={INK} w={0} reg={[0, 0]} />
    </g>
  ),
  // 8 Harbor Warden: the anchor
  () => (
    <g>
      <Shape pts={ell(60, 26, 7, 7, 9, 0.05, 670)} smooth w={4} />
      <Stroke pts={[[60, 33], [60, 96]]} w={7} />
      <Stroke pts={[[42, 46], [78, 46]]} w={5.4} />
      <Stroke pts={arc(60, 72, 30, 26, 0, 180, 12)} w={7} />
      <Shape pts={[[24, 62], [36, 78], [22, 82]]} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={[[96, 62], [84, 78], [98, 82]]} fill={INK} w={0} reg={[0, 0]} />
      <Stroke pts={[[60, 96], [60, 40]]} w={2} color={C.lantern} />
    </g>
  ),
  // 9 Strategist: the ship's wheel
  () => (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <Stroke key={i} pts={[[60 + Math.cos(a) * 9, 60 + Math.sin(a) * 9], [60 + Math.cos(a) * 42, 60 + Math.sin(a) * 42]]} w={4.4} color={C.wood} smooth={false} seed={680 + i} />;
      })}
      <Shape pts={ell(60, 60, 29, 29, 18, 0.015, 688)} smooth w={8} ink={C.wood} />
      <Shape pts={ell(60, 60, 33, 33, 18, 0.015, 689)} smooth w={1.8} />
      <Shape pts={ell(60, 60, 25, 25, 18, 0.015, 690)} smooth w={1.8} />
      <Shape pts={ell(60, 60, 9, 9, 9, 0.04, 691)} smooth fill={C.lantern} w={2.6} />
    </g>
  ),
  // 10 Beacon Keeper: the light
  () => (
    <g>
      <Hatch pts={[[58, 34], [4, 14], [4, 50]]} color={C.lantern} angle={12} gap={5} w={2.4} opacity={0.95} />
      <Hatch pts={[[62, 34], [116, 14], [116, 50]]} color={C.lantern} angle={-12} gap={5} w={2.4} opacity={0.95} />
      <Shape pts={[[46, 102], [74, 102], [68, 46], [52, 46]]} fill={C.bone} w={3} seed={700} />
      <Shape pts={[[49, 82], [71, 82], [70, 68], [50, 68]]} fill={C.seal} w={2.2} />
      <Shape pts={box(46, 40, 28, 6)} fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={box(52, 26, 16, 14)} fill={C.lantern} w={2.6} />
      <Shape pts={[[48, 26], [60, 14], [72, 26]]} fill={C.seal} w={2.6} />
      <Stroke pts={[[34, 106], [60, 102], [86, 106]]} w={4} />
    </g>
  ),
];

const SHIELD: Pt[] = [[20, 12], [100, 10], [110, 34], [104, 78], [60, 112], [16, 78], [10, 34]];
const INSET: Pt[] = [[25, 18], [95, 16], [103, 36], [98, 75], [60, 104], [22, 75], [17, 36]];
/** The chief (top band) changes colour with the tier: paper, then teal, then indigo, then the seal. */
const tier = (level: number) => (level >= 10 ? C.seal : level >= 7 ? C.indigo : level >= 4 ? C.teal : C.ochre);

interface RankProps {
  /** 1 to 10. */
  level: number;
  /** A rank not yet reached: hatched and faded. */
  dim?: boolean;
  className?: string;
  label?: string;
}

/** The shield for a rank. Decorative unless a label is given. */
export const RankCrest = memo(function RankCrest({ level, dim = false, className, label }: RankProps) {
  const lv = Math.max(1, Math.min(10, Math.round(level)));
  const Device = DEVICES[lv - 1]!;
  return (
    <svg className={className} viewBox="0 0 130 134" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <g transform="translate(7 8)">
        <Shape pts={SHIELD} fill={INK} w={0} reg={[0, 0]} wob={0.6} />
      </g>
      <Shape pts={SHIELD} fill={dim ? C.paperLo : C.paperHi} w={4.4} hatch={dim ? { angle: 45, gap: 6, w: 1.3 } : false} hatchOpacity={0.28} />
      {dim ? null : <Shape pts={[[20, 12], [100, 10], [110, 34], [108, 40], [12, 42], [10, 34]]} fill={tier(lv)} w={0} reg={[0, 0]} fillOpacity={0.9} wob={0.4} />}
      {dim ? null : <Shape pts={INSET} w={1.6} wob={0.8} />}
      <g opacity={dim ? 0.38 : 1} transform="translate(13 18) scale(0.78)">
        <Device />
      </g>
      <Shape pts={SHIELD} w={4.4} seed={900 + lv} />
    </svg>
  );
});
