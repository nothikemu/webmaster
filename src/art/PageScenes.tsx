/**
 * One illustration for each place in the portal outside the lessons.
 * Each is composed for the shape its page gives it (a frieze, a framed picture, a poster, a cabinet),
 * so no two pages open the same way, but they are all drawn with the same brush and palette.
 */
import { memo } from 'react';
import { C, INK, HUE, type PathHueName } from './palette';
import { At, Dry, Flecks, Hatch, Scene, Shape, Spatter, Stroke, Tone, Wash } from './Draw';
import { box, ell, type Pt } from './ink';
import { KernelParts } from './Kernel';
import { Brannock, Sedge, Wren } from './Cast';
import { Barrel, Boat, Cloud, Crate, Crest, Gull, PaperLantern, Pine, Planks, Ripples, Rope, TileRoof } from './props';
import {
  Anvil,
  Basket,
  Beam,
  Bell,
  Books,
  Brush,
  Buoy,
  Cat,
  CompassRose,
  Figure,
  GearWheel,
  InkPot,
  Ladder,
  Lettering,
  MapSheet,
  MiniLighthouse,
  OpenBook,
  Pennants,
  Plaster,
  Pot,
  Quill,
  RolledScroll,
  Rowboat,
  ScrollEnd,
  SealStamp,
  Shelf,
  Signpost,
  Sun,
  Table,
  Telescope,
  TypeBlock,
  WallPlanks,
  WallTool,
  WaxSeal,
  Window,
} from './kit';

const WALL_USE = '#a9a7a2';
const WALL_LOOM = '#d2d0cb';

/** Sky in three flat bands with dry-brushed streaks, shared by the outdoor scenes. */
function Sky({ w, h, seed = 1 }: { w: number; h: number; seed?: number }) {
  return (
    <g>
      <rect width={w} height={h} fill={C.sky1} />
      <rect y={h * 0.42} width={w} height={h * 0.34} fill={C.sky2} />
      <rect y={h * 0.72} width={w} height={h * 0.28} fill={C.sky3} />
      <Dry pts={[[w * 0.04, h * 0.14], [w * 0.3, h * 0.12], [w * 0.52, h * 0.15]]} w={h * 0.04} color={C.skyHigh} opacity={0.8} seed={seed} bristles={6} />
      <Dry pts={[[w * 0.5, h * 0.3], [w * 0.74, h * 0.27], [w * 0.98, h * 0.3]]} w={h * 0.035} color={C.skyHigh} opacity={0.7} seed={seed + 1} bristles={5} />
      <Dry pts={[[w * 0.02, h * 0.5], [w * 0.26, h * 0.48], [w * 0.5, h * 0.51]]} w={h * 0.03} color={C.sky3} opacity={0.6} seed={seed + 2} bristles={5} />
      <Dry pts={[[w * 0.46, h * 0.62], [w * 0.72, h * 0.6], [w, h * 0.63]]} w={h * 0.03} color={C.sky1} opacity={0.5} seed={seed + 3} bristles={4} />
    </g>
  );
}

/** A band of sea: two tones, a ruled horizon, ripples and sheen. */
function Sea({ y, w, h, seed = 1 }: { y: number; w: number; h: number; seed?: number }) {
  return (
    <g>
      <rect y={y} width={w} height={h} fill={C.teal} />
      <rect y={y + h * 0.62} width={w} height={h * 0.38} fill={C.tealDeep} />
      <Dry pts={[[w * 0.05, y + h * 0.16], [w * 0.4, y + h * 0.13], [w * 0.7, y + h * 0.17]]} w={h * 0.08} color={C.tealLight} opacity={0.55} seed={seed} bristles={5} />
      <Ripples x0={0} x1={w} y0={y + h * 0.08} y1={y + h * 0.58} n={Math.round(w / 26)} seed={seed + 1} />
      <Ripples x0={0} x1={w} y0={y + h * 0.66} y1={y + h * 0.96} n={Math.round(w / 44)} seed={seed + 2} color={C.tealLight} opacity={0.55} />
      <Stroke pts={[[0, y + 1], [w * 0.5, y + 2.4], [w, y + 1]]} w={4.6} wob={1.1} seed={seed + 3} />
    </g>
  );
}

// ------------------------------------------------------------------------------------------------ Prompt Lab

/** The five parts of a prompt as turned wooden blocks, each with its own mark. */
function PartBlock({ x, y, fill, mark, seed }: { x: number; y: number; fill: string; mark: 'task' | 'context' | 'audience' | 'format' | 'limits'; seed: number }) {
  const light = fill === C.bone || fill === C.lantern ? INK : C.bone;
  return (
    <At x={x} y={y}>
      <Shape pts={[[-17, -34], [17, -33], [17, 0], [-17, 0]]} fill={fill} w={2.8} seed={seed} />
      <Shape pts={[[17, -33], [26, -40], [26, -7], [17, 0]]} fill={fill} w={2.2} seed={seed + 1} hatch={{ angle: -60, gap: 3.6, w: 1 }} hatchOpacity={0.6} />
      <Shape pts={[[-17, -34], [-8, -41], [26, -40], [17, -33]]} fill={fill} w={2.2} seed={seed + 2} />
      <Wash pts={[[-17, -34], [-8, -41], [26, -40], [17, -33]]} fill={C.bone} opacity={0.3} smooth={false} />
      {mark === 'task' ? (
        <>
          <Shape pts={ell(0, -17, 9, 9, 9, 0.04, seed + 3)} smooth w={2.2} ink={light} />
          <Shape pts={ell(0, -17, 3, 3, 6, 0.1, seed + 4)} smooth fill={light} w={0} reg={[0, 0]} />
        </>
      ) : mark === 'context' ? (
        <>
          <Shape pts={ell(0, -27, 2.6, 2.6, 6, 0.1, seed + 3)} smooth fill={light} w={0} reg={[0, 0]} />
          <Stroke pts={[[0, -21], [0, -7]]} w={4} color={light} smooth={false} />
        </>
      ) : mark === 'audience' ? (
        <>
          <Shape pts={ell(0, -24, 5, 5, 7, 0.06, seed + 3)} smooth fill={light} w={0} reg={[0, 0]} />
          <Shape pts={[[-10, -6], [-7, -16], [7, -16], [10, -6]]} smooth fill={light} w={0} reg={[0, 0]} />
        </>
      ) : mark === 'format' ? (
        <Flecks marks={[[-9, -25, 18, 0], [-9, -17, 13, 0], [-9, -9, 18, 0]]} w={3} color={light} seed={seed + 3} />
      ) : (
        <>
          <Stroke pts={[[-10, -9], [10, -9]]} w={2.6} color={light} smooth={false} />
          <Flecks marks={[[-10, -9, 9, -90], [-3, -9, 6, -90], [4, -9, 9, -90], [10, -9, 6, -90]]} w={2} color={light} seed={seed + 3} />
        </>
      )}
    </At>
  );
}

/** Prompt Lab: the long bench in the Foundry, where a request is assembled from five parts. A frieze, 1600 x 300. */
export const LabFrieze = memo(function LabFrieze({ className }: { className?: string }) {
  return (
    <Scene
      w={1600}
      h={300}
      className={className}
      label="An illustration of a long workshop bench. Five wooden blocks, each marked for one part of a prompt, are lined up to be fitted into a tray. Brannock the foundry-master swings his hammer behind the bench, Kernel the robot points the way from a crate, and a black cat sleeps underneath."
    >
      <WallPlanks x={0} y={0} w={1600} h={228} fill={WALL_USE} seed={3} />
      {/* the doorway to the quay, with a split curtain */}
      <Shape pts={box(40, 34, 150, 194)} fill={C.sky1} w={0} reg={[0, 0]} />
      <rect x={40} y={150} width={150} height={78} fill={C.teal} />
      <Sun x={128} y={128} r={34} seed={7} rays={14} />
      <Ripples x0={44} x1={188} y0={158} y1={222} n={12} seed={5} />
      <Stroke pts={[[40, 151], [115, 153], [190, 151]]} w={3.4} />
      <Shape pts={box(40, 34, 150, 194)} w={5} ink={C.woodDeep} seed={11} />
      <Shape pts={box(40, 34, 150, 194)} w={2.2} seed={12} />
      <Shape pts={[[36, 30], [110, 31], [108, 96], [72, 104], [38, 94]]} smooth fill={C.tealDeep} w={2.8} seed={13} hatch={{ angle: -65, gap: 6, w: 1.1 }} hatchColor={C.bone} hatchOpacity={0.3} />
      <Shape pts={[[118, 31], [194, 30], [192, 92], [156, 102], [120, 94]]} smooth fill={C.tealDeep} w={2.8} seed={14} hatch={{ angle: -65, gap: 6, w: 1.1 }} hatchColor={C.bone} hatchOpacity={0.3} />
      <Shape pts={ell(74, 64, 13, 13, 10, 0.05, 15)} smooth fill={C.bone} w={2} />
      <Shape pts={ell(156, 64, 13, 13, 10, 0.05, 16)} smooth fill={C.bone} w={2} />
      <Beam pts={[[26, 28], [204, 30]]} w={7} seed={17} />

      {/* the shelf of jars and the tool wall */}
      <Shelf x={250} y={62} w={420} seed={21} />
      <Books x={262} y={62} n={5} seed={4} h={38} />
      <Pot x={360} y={62} ink={C.seal} seed={22} />
      <Pot x={398} y={62} ink={C.teal} seed={23} w={26} h={38} />
      <Pot x={434} y={62} ink={C.ochre} seed={24} />
      <RolledScroll x={500} y={62} seed={25} band={C.teal} />
      <RolledScroll x={506} y={46} seed={26} len={48} band={C.ochre} />
      <Pot x={572} y={62} ink={C.ink2} seed={27} w={34} h={28} label={false} />
      <Brush x={566} y={38} r={-78} len={46} seed={28} />
      <Brush x={578} y={38} r={-100} len={50} seed={29} tip={C.seal} />
      <Books x={612} y={62} n={3} seed={9} h={34} />
      <Shape pts={box(262, 104, 330, 104)} fill={C.ink2} w={3.2} seed={31} />
      <Tone pts={box(266, 108, 322, 96)} opacity={0.25} />
      <WallTool kind="hammer" x={300} y={122} seed={32} />
      <WallTool kind="tongs" x={352} y={120} seed={33} />
      <WallTool kind="saw" x={408} y={132} seed={34} />
      <WallTool kind="wrench" x={470} y={122} seed={35} />
      <WallTool kind="square" x={520} y={124} seed={36} />
      <WallTool kind="hammer" x={566} y={126} seed={37} s={0.8} />

      {/* the board that names the five parts */}
      <Shape pts={box(700, 26, 178, 128)} fill={C.ink2} w={4} seed={41} />
      <Shape pts={box(700, 26, 178, 128)} w={6} ink={C.wood} seed={42} />
      {['TASK', 'CONTEXT', 'AUDIENCE', 'FORMAT', 'LIMITS'].map((t, i) => (
        <g key={t}>
          <Shape pts={box(716, 38 + i * 22, 13, 13)} w={1.8} ink={C.bone} seed={50 + i} />
          {i < 3 ? <Stroke pts={[[718, 45 + i * 22], [722, 50 + i * 22], [732, 37 + i * 22]]} w={2.6} color={C.lantern} seed={56 + i} /> : null}
          <Lettering x={740} y={50 + i * 22} size={15} fill={C.bone} anchor="start">
            {t}
          </Lettering>
        </g>
      ))}
      <Dry pts={[[826, 140], [846, 136], [866, 142]]} w={6} color={C.bone} opacity={0.5} bristles={3} seed={61} />

      {/* window on the harbor */}
      <Window x={1196} y={30} w={150} h={104} seed={71}>
        <rect y={66} width={150} height={38} fill={C.teal} />
        <MiniLighthouse x={108} y={68} s={0.48} seed={72} />
        <Boat x={44} y={84} s={0.22} seed={73} />
        <Stroke pts={[[0, 67], [75, 68], [150, 67]]} w={2.6} />
      </Window>
      <Stroke pts={[[1000, 0], [1000, 26]]} w={2.4} />
      <PaperLantern x={1000} y={46} s={1.1} seed={74} />
      <Stroke pts={[[1420, 0], [1420, 34]]} w={2.4} />
      <PaperLantern x={1420} y={54} s={1} color={C.clothRed} seed={75} />
      <Pennants pts={[[940, 12], [1060, 26], [1180, 14]]} n={8} seed={5} size={13} />
      <GearWheel x={1476} y={132} r={42} teeth={10} fill={C.teal} seed={76} />
      <GearWheel x={1540} y={86} r={26} teeth={8} fill={C.tealDeep} seed={77} rot={0.3} />

      {/* floor */}
      <Planks pts={[[0, 228], [1600, 228], [1600, 300], [0, 300]]} rows={3} seed={80} />
      <Wash pts={[[640, 262], [960, 270], [1280, 262], [1250, 286], [960, 292], [670, 286]]} fill={INK} opacity={0.26} />

      {/* Brannock, behind the bench */}
      <At x={1034} y={48} s={0.67}>
        <Brannock />
      </At>
      <Spatter x={1150} y={62} r={40} n={16} seed={81} color={C.lantern} />
      <Flecks marks={[[1158, 44, 12, -40], [1172, 60, 12, -10], [1162, 78, 10, 20], [1134, 40, 10, -100]]} w={2.4} color={C.lantern} seed={82} />

      {/* the bench and everything on it */}
      <Table x={980} y={272} w={640} h={72} seed={85} />
      <PartBlock x={904} y={200} fill={C.seal} mark="task" seed={90} />
      <PartBlock x={956} y={200} fill={C.indigo} mark="context" seed={93} />
      <PartBlock x={1008} y={200} fill={C.teal} mark="audience" seed={96} />
      <Shape pts={[[1118, 200], [1296, 200], [1292, 186], [1122, 186]]} fill={C.wood} w={2.8} seed={100} />
      <Hatch pts={box(1124, 188, 166, 10)} angle={-65} gap={4.5} w={1} opacity={0.45} />
      <PartBlock x={1228} y={188} fill={C.ochre} mark="format" seed={102} />
      <PartBlock x={1272} y={188} fill={C.bone} mark="limits" seed={105} />
      <Shape pts={box(1128, 170, 26, 16)} w={1.8} ink={C.bone} wob={0.5} seed={108} />
      <Shape pts={box(1160, 170, 26, 16)} w={1.8} ink={C.bone} wob={0.5} seed={109} />
      <Shape pts={box(1192, 170, 26, 16)} w={1.8} ink={C.bone} wob={0.5} seed={107} />
      <RolledScroll x={722} y={200} seed={110} band={C.seal} />
      <SealStamp x={784} y={200} seed={111} s={0.8} />
      <InkPot x={836} y={200} seed={112} s={0.9} />

      {/* Kernel on a crate, showing where the next block goes */}
      <Crate x={596} y={284} w={86} h={62} seed={115} />
      <At x={540} y={104} s={0.43}>
        <KernelParts mood="point" />
      </At>

      {/* the anvil corner */}
      <Anvil x={1352} y={288} s={1.15} seed={120} />
      <Barrel x={1466} y={294} w={58} h={72} seed={121} band={C.seal} />
      <Crate x={1548} y={296} w={74} h={58} seed={122} />
      <Cat x={846} y={290} pose="loaf" seed={123} />
      <Rope pts={[[230, 280], [262, 268], [296, 282], [330, 270]]} w={5} seed={124} />
      <Basket x={420} y={288} load="none" seed={125} />
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Tool Atlas

/** A field-guide card pinned to the wall: a scribbled subject, some lines, and either a seal or a question mark. */
function GuideCard({ x, y, r, seen, hue, seed }: { x: number; y: number; r: number; seen: boolean; hue: string; seed: number }) {
  return (
    <At x={x} y={y} r={r}>
      <Shape pts={[[-17, -22], [17, -22], [17, 22], [-17, 22]]} fill={C.paperHi} w={2} seed={seed} />
      <Shape pts={box(-12, -17, 24, 13)} fill={hue} w={1.4} seed={seed + 1} />
      <Flecks marks={[[-12, 2, 22, 0], [-12, 8, 16, 0], [-12, 14, 20, 0]]} w={1.3} opacity={0.7} seed={seed + 2} />
      {seen ? <Shape pts={ell(10, 14, 5.5, 5.5, 7, 0.14, seed + 3)} smooth fill={C.seal} w={1.3} /> : <Lettering x={10} y={19} size={13} fill={C.seal}>?</Lettering>}
      <Shape pts={ell(0, -22, 2.4, 2.4, 6, 0.1, seed + 4)} smooth fill={C.seal} w={1.2} />
    </At>
  );
}

/** Tool Atlas: the chart room, with the field guide pinned up and a glass on the horizon. A framed picture, 560 x 440. */
export const AtlasRoom = memo(function AtlasRoom({ className }: { className?: string }) {
  return (
    <Scene
      w={560}
      h={440}
      className={className}
      label="An illustration of a chart room. A brass telescope points out of an arched window at a ship on the sea. On the wall a big chart is pinned beside eight field-guide cards, some stamped with a red seal and some marked with a question. Kernel the robot points at the cards, and a black cat sits on the window sill."
    >
      <Plaster x={0} y={0} w={560} h={392} fill={C.bone} seed={2} />
      <Hatch pts={box(0, 0, 560, 22)} angle={-70} gap={5} w={1.2} opacity={0.3} />
      <Beam pts={[[0, 14], [280, 18], [560, 13]]} w={11} seed={3} />
      {/* the arched window */}
      <Window x={34} y={58} w={136} h={226} arch seed={5}>
        <rect y={150} width={136} height={76} fill={C.teal} />
        <Sun x={92} y={118} r={30} seed={6} rays={14} />
        <Shape pts={[[0, 152], [34, 128], [62, 150]]} fill={C.hillFar} w={2} seed={7} />
        <Boat x={62} y={186} s={0.36} seed={8} hull={C.clothRed} />
        <Ripples x0={4} x1={132} y0={158} y1={220} n={12} seed={9} />
        <Gull x={40} y={78} s={0.5} seed={2} />
        <Gull x={66} y={96} s={0.36} seed={3} />
        <Stroke pts={[[0, 151], [68, 152], [136, 151]]} w={2.6} />
      </Window>
      <Cat x={150} y={292} seed={11} s={0.92} />

      {/* the big chart, pinned, with a route in red string */}
      <Shape pts={[[236, 46], [396, 42], [400, 170], [240, 174]]} fill={C.paperHi} w={2.8} seed={15} />
      <Shape pts={[[250, 62], [300, 54], [322, 78], [304, 112], [262, 120], [244, 92]]} smooth fill={C.paperLo} w={1.8} seed={16} hatch={{ angle: -50, gap: 5, w: 1 }} hatchOpacity={0.4} />
      <Shape pts={[[338, 104], [380, 96], [392, 132], [368, 158], [336, 148]]} smooth fill={C.paperLo} w={1.8} seed={17} hatch={{ angle: -50, gap: 5, w: 1 }} hatchOpacity={0.4} />
      <CompassRose x={372} y={68} r={15} ring={false} seed={18} />
      <Flecks marks={[[254, 140, 20, 4], [262, 152, 16, 2], [300, 160, 22, -3]]} w={1.3} color={C.teal} seed={19} />
      <Stroke pts={[[278, 88], [308, 128], [352, 122], [366, 140]]} w={1.8} color={C.seal} smooth={false} seed={20} />
      {[[278, 88], [308, 128], [352, 122], [366, 140]].map(([px, py], i) => (
        <Shape key={i} pts={ell(px!, py!, 3.4, 3.4, 6, 0.1, 21 + i)} smooth fill={C.seal} w={1.4} />
      ))}
      <Flecks marks={[[240, 48, 3, 90], [396, 44, 3, 90], [398, 168, 3, 90], [242, 172, 3, 90]]} w={3} color={C.woodDeep} />

      {/* the field guide: eight cards */}
      {[
        [432, 72, -3, true, C.indigo],
        [474, 70, 2, true, C.teal],
        [516, 74, -2, false, C.ochre],
        [432, 128, 2, false, C.clothRed],
        [474, 130, -3, false, C.teal],
        [516, 128, 3, false, C.indigo],
        [452, 186, -2, false, C.ochre],
        [496, 184, 2, true, C.moss],
      ].map(([cx, cy, cr, seen, hue], i) => (
        <GuideCard key={i} x={cx as number} y={cy as number} r={cr as number} seen={seen as boolean} hue={hue as string} seed={30 + i * 6} />
      ))}
      <Stroke pts={[[226, 22], [226, 40]]} w={2.2} />
      <PaperLantern x={206} y={64} s={1.05} seed={81} />
      <Stroke pts={[[206, 20], [206, 44]]} w={2.2} />

      {/* floor and furniture */}
      <Planks pts={[[0, 392], [560, 392], [560, 440], [0, 440]]} rows={2} seed={85} />
      <Table x={436} y={404} w={226} h={104} seed={86} />
      <Books x={346} y={300} n={4} seed={6} h={36} />
      <MapSheet x={452} y={292} w={86} h={12} seed={87} />
      <RolledScroll x={452} y={286} seed={88} band={C.teal} len={62} />
      <CompassRose x={516} y={282} r={20} seed={89} />
      <Shape pts={ell(516, 282, 24, 24, 16, 0.02, 90)} smooth w={3.4} ink={C.strawDeep} />
      <InkPot x={404} y={300} s={0.8} seed={91} />
      <Quill x={406} y={282} s={0.72} r={-66} seed={92} />
      <At x={150} y={414} s={1.3} flip>
        <Telescope r={-24} seed={93} />
      </At>
      <Crate x={278} y={410} w={64} h={46} seed={94} />
      <At x={222} y={228} s={0.5}>
        <KernelParts mood="point" />
      </At>
      <Wash pts={[[90, 408], [200, 412], [330, 406], [310, 420], [120, 420]]} fill={INK} opacity={0.2} />
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Scenarios

/** Scenarios: the fork on the cliff road at dusk, where every case begins. A poster, 480 x 620. */
export const Crossroads = memo(function Crossroads({ className }: { className?: string }) {
  return (
    <Scene
      w={480}
      h={620}
      className={className}
      label="An illustration of a fork in a cliff road at dusk. A signpost points three ways, to honesty, learning and privacy. Sedge the keeper holds up a lantern on a pole, Kernel the robot stands at the fork deciding, and a lighthouse stands on the far headland under a low red sun."
    >
      <Sky w={480} h={400} seed={3} />
      <Sun x={150} y={232} r={86} seed={5} rays={22} />
      <Cloud x={352} y={84} w={190} seed={4} />
      <Cloud x={92} y={56} w={130} seed={9} fill={C.paperHi} />
      <Gull x={266} y={138} s={0.7} seed={1} />
      <Gull x={306} y={166} s={0.5} seed={2} />
      <Gull x={236} y={176} s={0.4} seed={3} />
      {/* far headland and the beacon */}
      <Shape pts={[[250, 372], [300, 318], [350, 300], [410, 304], [480, 280], [480, 372]]} fill={C.hillFar} w={2.8} seed={11} />
      <Hatch pts={[[352, 302], [412, 306], [470, 286], [476, 366], [360, 366]]} angle={-58} gap={6} w={1.2} opacity={0.5} seed={12} />
      <MiniLighthouse x={394} y={304} s={0.94} seed={13} />
      <Sea y={340} w={480} h={74} seed={15} />
      <Crest x={66} y={388} s={24} seed={3} />
      <Boat x={150} y={372} s={0.2} seed={5} />

      {/* the near hill and its three roads */}
      <Shape pts={[[0, 420], [70, 392], [190, 384], [330, 396], [480, 376], [480, 620], [0, 620]]} smooth fill={C.hillNear} w={3.4} seed={21} hatch={{ angle: -52, gap: 9, w: 1.3, density: 0.7 }} hatchOpacity={0.35} />
      <Dry pts={[[226, 566], [170, 500], [96, 440], [40, 408]]} w={30} color={C.paperLo} opacity={0.7} bristles={7} seed={22} ragged={0.4} />
      <Dry pts={[[240, 560], [262, 480], [312, 424], [380, 392]]} w={26} color={C.paperLo} opacity={0.7} bristles={7} seed={23} ragged={0.4} />
      <Dry pts={[[254, 572], [330, 540], [410, 500], [480, 470]]} w={30} color={C.paperLo} opacity={0.7} bristles={7} seed={24} ragged={0.4} />
      <Dry pts={[[150, 620], [200, 596], [240, 566]]} w={46} color={C.paperLo} opacity={0.75} bristles={8} seed={25} ragged={0.3} />
      <Stroke pts={[[20, 470], [110, 452], [180, 470]]} w={1.8} opacity={0.4} />
      <Stroke pts={[[300, 470], [370, 452], [460, 448]]} w={1.8} opacity={0.4} />
      <Flecks marks={[[30, 520, 10, -80], [40, 526, 9, -100], [118, 548, 10, -85], [404, 560, 10, -80], [414, 566, 9, -100], [330, 600, 10, -85], [60, 596, 10, -95], [452, 530, 9, -80]]} w={2.4} color={C.moss} seed={26} />
      <Pine x={34} y={452} s={1.25} seed={31} />
      <Pine x={78} y={436} s={0.8} seed={32} />
      <Pine x={452} y={418} s={0.9} seed={33} />
      <Figure x={66} y={420} s={0.55} kind="pole" cloth={C.indigo} seed={34} />
      <Figure x={346} y={410} s={0.5} kind="lantern" cloth={C.clothRed} seed={35} hat={false} />
      <At x={440} y={418} s={0.5}>
        <Beam pts={[[0, 0], [0, -74]]} w={7} seed={36} />
        <Beam pts={[[-4, -70], [30, -72]]} w={5} seed={37} />
        <Bell x={24} y={-70} seed={38} />
      </At>

      {/* Sedge, with the light */}
      <At x={300} y={318} s={0.86}>
        <Sedge />
      </At>
      {/* the signpost at the fork */}
      <Signpost
        x={246}
        y={584}
        s={1.18}
        h={182}
        seed={41}
        boards={[
          { at: 160, dir: -1, text: 'HONESTY', fill: C.bone, w: 92 },
          { at: 128, dir: 1, text: 'LEARNING', fill: C.lantern, w: 96 },
          { at: 96, dir: -1, text: 'PRIVACY', fill: C.tealLight, w: 74 },
        ]}
      />
      {/* Kernel, deciding */}
      <At x={-16} y={446} s={0.6}>
        <KernelParts mood="think" hold="none" />
      </At>
      {/* a satchel of case files, and Bobbin going her own way */}
      <Shape pts={[[352, 582], [404, 578], [410, 606], [356, 610]]} smooth fill={C.wood} w={2.8} seed={51} hatch={{ angle: -55, gap: 5, w: 1.1 }} hatchOpacity={0.5} />
      <Shape pts={[[352, 582], [404, 578], [398, 594], [358, 596]]} smooth fill={C.woodLight} w={2.2} seed={52} />
      <Shape pts={[[362, 566], [392, 562], [396, 584], [366, 588]]} fill={C.paperHi} w={1.8} seed={53} />
      <Flecks marks={[[368, 572, 20, -6], [368, 578, 14, -6]]} w={1.2} opacity={0.7} />
      <WaxSeal x={388} y={580} r={5} seed={54} />
      <Cat x={438} y={604} pose="walk" seed={55} s={0.8} />
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Codex

export interface CodexSlot {
  hue: PathHueName;
  /** true when the player has collected this term. */
  got: boolean;
}

/**
 * Codex: the scroll cabinet in the Loom House. One pigeonhole for each term, ten to a shelf, in course order.
 * A scroll appears in its hole when the term is collected, tagged in the colour of its path,
 * so the picture is also the progress meter.
 */
export const ScrollCabinet = memo(function ScrollCabinet({ slots, className, label }: { slots: CodexSlot[]; className?: string; label: string }) {
  const cols = 10;
  const rows = Math.max(1, Math.ceil(slots.length / cols));
  const cw = 46;
  const ch = Math.min(46, 184 / rows);
  const x0 = 44;
  const y0 = 62;
  const w = cols * cw;
  const h = rows * ch;
  return (
    <Scene w={640} h={380} className={className} label={label}>
      <WallPlanks x={0} y={0} w={640} h={324} fill={WALL_LOOM} seed={4} every={52} />
      <Stroke pts={[[572, 0], [572, 24]]} w={2.2} />
      <PaperLantern x={572} y={46} s={1.05} seed={3} />
      <Planks pts={[[0, 324], [640, 324], [640, 380], [0, 380]]} rows={2} seed={8} />

      {/* the carcass of the cabinet */}
      <Wash pts={[[x0 - 6, 318], [x0 + w + 30, 318], [x0 + w + 8, 334], [x0 + 4, 334]]} fill={INK} opacity={0.24} />
      <Shape pts={box(x0 - 12, y0 - 14, w + 24, h + 90)} fill={C.wood} w={3.6} seed={11} />
      <Hatch pts={box(x0 + w + 2, y0 - 10, 8, h + 82)} angle={-65} gap={4} w={1} opacity={0.5} />
      <Shape pts={box(x0 - 20, y0 - 26, w + 40, 14)} fill={C.woodDeep} w={3} seed={12} />
      <Shape pts={box(x0, y0, w, h)} fill={C.ink2} w={2.6} seed={13} />
      {Array.from({ length: rows * cols }, (_, i) => {
        const slot = slots[i];
        const cx = x0 + (i % cols) * cw + cw / 2;
        const cy = y0 + Math.floor(i / cols) * ch + ch / 2 - 5;
        if (!slot) return null;
        return slot.got ? <ScrollEnd key={i} x={cx - 3} y={cy} r={12} seed={i * 7 + 3} tag={HUE[slot.hue].main} /> : <Shape key={i} pts={ell(cx, cy + 3, 10, 10, 9, 0.06, i)} smooth w={1.2} ink={C.ink3} />;
      })}
      {Array.from({ length: cols + 1 }, (_, c) => (
        <Stroke key={`v${c}`} pts={[[x0 + c * cw, y0], [x0 + c * cw + 0.6, y0 + h]]} w={3.8} color={C.wood} smooth={false} seed={60 + c} />
      ))}
      {Array.from({ length: rows }, (_, r) => (
        <Shape key={`h${r}`} pts={box(x0 - 2, y0 + (r + 1) * ch - 5, w + 4, 6)} fill={C.woodLight} w={2} seed={80 + r} />
      ))}
      {/* drawers */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`d${i}`}>
          <Shape pts={box(x0 + 4 + (i * (w - 8)) / 4, y0 + h + 10, (w - 8) / 4 - 8, 50)} fill={C.woodLight} w={2.4} seed={90 + i} />
          <Hatch pts={box(x0 + 8 + (i * (w - 8)) / 4, y0 + h + 40, (w - 8) / 4 - 16, 16)} angle={-65} gap={4.5} w={1} opacity={0.4} seed={94 + i} />
          <Shape pts={ell(x0 + (w - 8) / 8 + (i * (w - 8)) / 4, y0 + h + 32, 5.5, 5.5, 8, 0.06, 98 + i)} smooth fill={C.lantern} w={2} />
        </g>
      ))}
      <Shape pts={box(x0 - 6, y0 + h + 68, 12, 26)} fill={C.woodDeep} w={2.4} seed={103} />
      <Shape pts={box(x0 + w - 6, y0 + h + 68, 12, 26)} fill={C.woodDeep} w={2.4} seed={104} />
      <Cat x={x0 + w * 0.74} y={y0 - 26} pose="loaf" seed={105} />
      <Books x={x0 + 12} y={y0 - 26} n={4} seed={7} h={26} />
      <RolledScroll x={x0 + w * 0.42} y={y0 - 26} seed={106} band={C.indigo} len={50} />

      <Ladder x1={x0 + w * 0.08} y1={326} x2={x0 + w * 0.08 + 30} y2={y0 - 6} seed={110} rungs={7} />
      {/* Wren keeps the cabinet; Kernel reads */}
      <At x={510} y={146} s={0.6}>
        <Wren />
      </At>
      <At x={338} y={224} s={0.4}>
        <KernelParts mood="read" />
      </At>
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Logbook

/**
 * Logbook: the cabin where the log is kept. One hook on the wall for each badge;
 * a medal hangs on a hook once the badge is earned. A picture, 460 x 320.
 */
export const LogCabin = memo(function LogCabin({ earned, total = 9, className, label }: { earned: number; total?: number; className?: string; label: string }) {
  const ribbon = [C.indigo, C.indigo, C.teal, C.teal, C.ochre, C.ochre, C.ochre, C.seal, C.seal];
  return (
    <Scene w={460} h={320} className={className} label={label}>
      <WallPlanks x={0} y={0} w={460} h={270} fill={WALL_USE} seed={6} />
      {/* the medal rail */}
      <Beam pts={[[22, 26], [230, 29], [438, 25]]} w={6} seed={2} fill={C.wood} />
      {Array.from({ length: total }, (_, i) => {
        const hx = 46 + (i * 368) / (total - 1);
        return (
          <g key={i}>
            <Shape pts={ell(hx, 30, 2.6, 2.6, 6, 0.1, i)} smooth fill={INK} w={0} reg={[0, 0]} />
            {i < earned ? (
              <g>
                <Shape pts={[[hx - 5, 31], [hx + 5, 31], [hx + 4, 52], [hx - 4, 52]]} fill={ribbon[i % ribbon.length]!} w={1.6} seed={20 + i} />
                <Shape pts={ell(hx, 60, 9, 9, 9, 0.06, 30 + i)} smooth fill={C.lantern} w={2.2} hatch={{ angle: -50, gap: 4, w: 0.9 }} hatchOpacity={0.4} />
                <Shape pts={ell(hx, 60, 3.4, 3.4, 6, 0.1, 40 + i)} smooth fill={C.seal} w={1} />
              </g>
            ) : null}
          </g>
        );
      })}
      {/* porthole */}
      <Shape pts={ell(112, 138, 52, 52, 20, 0.012, 51)} smooth fill={C.sky1} w={0} reg={[0, 0]} />
      <Shape pts={[...ell(112, 138, 52, 52, 20, 0.012, 51).filter((p) => p[1] > 146), [60, 146]]} fill={C.teal} w={0} reg={[0, 0]} wob={0.2} />
      <Boat x={118} y={160} s={0.22} seed={52} />
      <Gull x={88} y={112} s={0.4} seed={4} />
      <Flecks marks={[[70, 164, 16, 2], [126, 172, 18, -2], [92, 178, 12, 0]]} w={1.8} color={C.seaFoam} seed={53} />
      <Stroke pts={[[62, 147], [112, 148], [162, 147]]} w={2.4} />
      <Shape pts={ell(112, 138, 52, 52, 20, 0.012, 51)} smooth w={9} ink={C.strawDeep} seed={54} />
      <Shape pts={ell(112, 138, 57, 57, 20, 0.012, 55)} smooth w={2.2} seed={56} />
      <Shape pts={ell(112, 138, 47, 47, 20, 0.012, 57)} smooth w={1.8} seed={58} />
      {[0, 60, 120, 180, 240, 300].map((a, i) => (
        <Shape key={a} pts={ell(112 + Math.cos((a * Math.PI) / 180) * 52, 138 + Math.sin((a * Math.PI) / 180) * 52, 2.6, 2.6, 6, 0.1, 60 + i)} smooth fill={INK} w={0} reg={[0, 0]} />
      ))}
      {/* the chart of where you have been */}
      <MapSheet x={292} y={128} w={132} h={92} r={-3} seed={66} />
      <Flecks marks={[[228, 86, 3, 90], [356, 80, 3, 90]]} w={3} color={C.seal} />
      <Stroke pts={[[408, 60], [408, 98]]} w={2.2} />
      <PaperLantern x={408} y={120} s={1.1} seed={67} />

      <Planks pts={[[0, 270], [460, 270], [460, 320], [0, 320]]} rows={2} seed={70} />
      <Table x={200} y={300} w={330} h={104} seed={72} />
      <OpenBook x={176} y={196} s={1.5} seed={73} />
      <InkPot x={292} y={196} seed={74} />
      <Quill x={294} y={176} r={-62} seed={75} />
      <Pot x={72} y={196} ink={C.seal} seed={76} w={26} h={26} />
      <CompassRose x={328} y={188} r={13} seed={77} />
      <Shape pts={ell(328, 188, 16, 16, 12, 0.03, 78)} smooth w={2.8} ink={C.strawDeep} />
      <Cat x={150} y={300} pose="loaf" seed={79} flip />
      <Crate x={404} y={302} w={70} h={46} seed={80} />
      <At x={348} y={136} s={0.44}>
        <KernelParts mood="wave" />
      </At>
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Certification

/** A portrait of one mentor on their own ground, the way a harbor guild would paint its masters. 300 x 400. */
export const MentorCard = memo(function MentorCard({ who, className }: { who: PathHueName; className?: string }) {
  if (who === 'understand') {
    return (
      <Scene w={300} h={400} className={className} label="A portrait of Wren the weaver, small and round under a wide straw hat, holding her staff in front of the threads of the great loom.">
        <rect width={300} height={400} fill={C.indigoLo} />
        <Tone pts={box(0, 0, 300, 400)} opacity={0.16} coarse />
        <Shape pts={ell(150, 160, 112, 112, 22, 0.015, 3)} smooth fill={C.indigo} w={0} reg={[0, 0]} />
        {[40, 82, 124, 176, 218, 260].map((tx, i) => (
          <Stroke key={tx} pts={[[tx, 0], [tx + (i % 2 ? 4 : -4), 170], [tx, 352]]} w={3} color={C.bone} opacity={0.55} seed={10 + i} />
        ))}
        {[[40, 96], [124, 74], [218, 100], [82, 204], [176, 188], [260, 216]].map(([kx, ky], i) => (
          <Shape key={i} pts={ell(kx!, ky!, 7, 7, 8, 0.08, 20 + i)} smooth fill={i % 2 ? C.lantern : C.bone} w={2.2} />
        ))}
        <Stroke pts={[[40, 96], [124, 74], [218, 100]]} w={2.2} color={C.bone} opacity={0.7} smooth={false} />
        <Stroke pts={[[82, 204], [176, 188], [260, 216]]} w={2.2} color={C.bone} opacity={0.7} smooth={false} />
        <Planks pts={[[0, 352], [300, 352], [300, 400], [0, 400]]} rows={2} seed={30} />
        <At x={42} y={44} s={1.06}>
          <Wren />
        </At>
        <Cat x={256} y={362} seed={31} s={0.9} />
      </Scene>
    );
  }
  if (who === 'use') {
    return (
      <Scene w={300} h={400} className={className} label="A portrait of Brannock the foundry-master, broad and bearded, with his hammer raised and gears turning behind him.">
        <rect width={300} height={400} fill={C.tealDeep} />
        <Tone pts={box(0, 0, 300, 400)} opacity={0.16} coarse />
        <GearWheel x={84} y={104} r={78} teeth={12} fill={C.teal} seed={3} />
        <GearWheel x={236} y={212} r={52} teeth={9} fill={C.tealLight} seed={5} rot={0.3} />
        <GearWheel x={232} y={70} r={30} teeth={8} fill={C.lantern} seed={7} />
        <Spatter x={226} y={60} r={56} n={22} seed={9} color={C.lantern} />
        <Planks pts={[[0, 352], [300, 352], [300, 400], [0, 400]]} rows={2} seed={30} />
        <At x={32} y={42} s={1.07}>
          <Brannock />
        </At>
        <Anvil x={250} y={362} s={0.7} seed={11} />
      </Scene>
    );
  }
  return (
    <Scene w={300} h={400} className={className} label="A portrait of Sedge the beacon-keeper, tall and narrow in a windblown coat, holding a lantern on a pole in front of the lighthouse and a low sun.">
      <rect width={300} height={400} fill={C.sky2} />
      <rect width={300} height={150} fill={C.sky1} />
      <Dry pts={[[10, 60], [150, 54], [290, 62]]} w={16} color={C.skyHigh} opacity={0.8} seed={2} bristles={6} />
      <Sun x={84} y={196} r={74} seed={3} rays={20} />
      <rect y={270} width={300} height={90} fill={C.teal} />
      <Ripples x0={0} x1={300} y0={280} y1={350} n={22} seed={4} />
      <Stroke pts={[[0, 271], [150, 273], [300, 271]]} w={4} />
      <MiniLighthouse x={246} y={274} s={1.06} seed={5} />
      <Shape pts={[[0, 352], [120, 340], [300, 350], [300, 400], [0, 400]]} smooth fill={C.hillNear} w={3.2} seed={6} hatch={{ angle: -52, gap: 8, w: 1.2 }} hatchOpacity={0.45} />
      <At x={46} y={56} s={1.08}>
        <Sedge />
      </At>
      <Gull x={236} y={84} s={0.6} seed={1} />
      <Gull x={262} y={110} s={0.42} seed={2} />
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ About, Accessibility, Credits

/** About: the notice board on the quay, where the town pins up what everyone should know. A tall picture, 420 x 520. */
export const NoticeBoard = memo(function NoticeBoard({ className }: { className?: string }) {
  const sheet = (x: number, y: number, w: number, h: number, r: number, seed: number, extra?: JSX.Element) => (
    <At x={x} y={y} r={r} key={seed}>
      <Shape pts={box(-w / 2, -h / 2, w, h)} fill={C.paperHi} w={2} seed={seed} />
      {extra ?? <Flecks marks={Array.from({ length: Math.floor(h / 9) - 1 }, (_, i) => [-w / 2 + 6, -h / 2 + 10 + i * 9, w - 14 - ((i * 7 + seed) % 12), 0] as [number, number, number, number])} w={1.3} opacity={0.7} seed={seed + 1} />}
      <Shape pts={ell(0, -h / 2 + 3, 2.6, 2.6, 6, 0.1, seed + 2)} smooth fill={C.seal} w={1.2} />
    </At>
  );
  return (
    <Scene
      w={420}
      h={520}
      className={className}
      label="An illustration of a wooden notice board on the quay under a small tiled roof. Papers, a chart and a sheet with three coloured squares are pinned to it. Kernel the robot points at the board, a gull stands on the roof, and a black cat sits at the foot of a post."
    >
      <Sky w={420} h={380} seed={5} />
      <Cloud x={96} y={70} w={150} seed={6} />
      <Cloud x={338} y={120} w={130} seed={3} fill={C.paperHi} />
      <Shape pts={[[230, 342], [290, 300], [340, 318], [420, 286], [420, 342]]} fill={C.hillFar} w={2.4} seed={8} />
      <MiniLighthouse x={380} y={300} s={0.5} seed={9} />
      <Sea y={332} w={420} h={96} seed={11} />
      <Boat x={84} y={372} s={0.3} seed={12} />
      <Crest x={300} y={404} s={26} seed={2} flip={-1} />
      <Planks pts={[[0, 424], [420, 424], [420, 520], [0, 520]]} rows={4} seed={15} />

      {/* the board */}
      <Beam pts={[[98, 440], [98, 150]]} w={11} seed={20} fill={C.wood} />
      <Beam pts={[[330, 440], [330, 150]]} w={11} seed={21} fill={C.wood} />
      <Shape pts={box(74, 150, 280, 212)} fill={C.woodLight} w={3.4} seed={22} />
      <Hatch pts={box(78, 154, 272, 204)} angle={-70} gap={9} w={1} opacity={0.3} seed={23} />
      <Shape pts={box(74, 150, 280, 212)} w={7} ink={C.woodDeep} seed={24} />
      <TileRoof x={214} y={148} w={318} h={50} fill={C.roofRed} seed={25} rows={3} />
      {sheet(130, 206, 70, 84, -4, 30)}
      {sheet(212, 196, 62, 60, 3, 34, (
        <g>
          <Shape pts={box(-24, -18, 14, 14)} fill={C.indigo} w={1.4} />
          <Shape pts={box(-7, -18, 14, 14)} fill={C.teal} w={1.4} />
          <Shape pts={box(10, -18, 14, 14)} fill={C.ochre} w={1.4} />
          <Flecks marks={[[-24, 6, 46, 0], [-24, 14, 32, 0]]} w={1.3} opacity={0.7} />
        </g>
      ))}
      <MapSheet x={296} y={214} w={84} h={70} r={4} seed={38} />
      <Shape pts={ell(296, 182, 2.6, 2.6, 6, 0.1, 39)} smooth fill={C.seal} w={1.2} />
      {sheet(142, 310, 78, 56, 3, 42)}
      {sheet(232, 300, 70, 76, -3, 46, (
        <g>
          <Flecks marks={[[-28, -26, 50, 0], [-28, -17, 40, 0], [-28, -8, 48, 0], [-28, 1, 30, 0]]} w={1.3} opacity={0.7} />
          <WaxSeal x={16} y={22} r={9} seed={47} />
        </g>
      ))}
      {sheet(312, 312, 54, 48, 5, 50)}
      <Stroke pts={[[214, 172], [232, 262]]} w={1.2} color={C.seal} smooth={false} />
      <Stroke pts={[[348, 150], [364, 170]]} w={2.2} />
      <PaperLantern x={366} y={192} s={1.05} seed={55} />
      <Gull x={150} y={92} s={0.6} seed={3} />
      {/* a gull on the roof */}
      <Shape pts={[[236, 96], [250, 84], [266, 90], [262, 104], [244, 106]]} smooth fill={C.bone} w={2.2} seed={56} />
      <Shape pts={ell(268, 84, 6, 5.5, 7, 0.06, 57)} smooth fill={C.bone} w={2} />
      <Stroke pts={[[273, 85], [281, 87]]} w={2.6} color={C.ochre} />
      <Stroke pts={[[250, 105], [249, 114]]} w={1.6} color={C.ochre} />
      <Stroke pts={[[258, 105], [258, 114]]} w={1.6} color={C.ochre} />

      <Barrel x={376} y={470} w={56} h={72} seed={60} band={C.seal} />
      <Cat x={332} y={444} seed={61} />
      <Rope pts={[[20, 492], [60, 478], [96, 494]]} w={5} seed={62} />
      <At x={-4} y={300} s={0.62}>
        <KernelParts mood="point" hold="none" />
      </At>
    </Scene>
  );
});

/** Accessibility: the wide gangway, with a rail on both sides, a bell and a light, so everyone can come aboard. 420 x 520. */
export const Gangway = memo(function Gangway({ className }: { className?: string }) {
  const rampL: Pt[] = [[40, 452], [246, 280]];
  const rampR: Pt[] = [[150, 478], [322, 300]];
  return (
    <Scene
      w={420}
      h={520}
      className={className}
      label="An illustration of a wide wooden gangway leading from the dock up onto a ship. It has a handrail on both sides, bright edge strips, a bell on a post and a lantern. Two townsfolk walk up it, and Kernel the robot waves from the deck."
    >
      <Sky w={420} h={360} seed={8} />
      <Sun x={96} y={150} r={46} seed={3} rays={16} />
      <Cloud x={300} y={64} w={170} seed={11} />
      <Gull x={184} y={76} s={0.6} seed={5} />
      <Gull x={214} y={100} s={0.42} seed={6} />
      <Sea y={312} w={420} h={130} seed={9} />
      <Crest x={56} y={404} s={28} seed={4} />

      {/* the ship */}
      <Stroke pts={[[352, 300], [356, 40]]} w={9} seed={20} />
      <Shape pts={[[364, 60], [420, 96], [420, 232], [364, 238]]} smooth fill={C.bone} w={3} seed={21} hatch={{ angle: -62, gap: 7, w: 1.1 }} hatchOpacity={0.35} />
      <Stroke pts={[[366, 120], [420, 128]]} w={1.6} opacity={0.6} />
      <Stroke pts={[[366, 180], [420, 186]]} w={1.6} opacity={0.6} />
      <Shape pts={[[350, 44], [392, 34], [372, 58]]} fill={C.clothRed} w={2.4} seed={22} />
      <Shape pts={[[236, 284], [420, 264], [420, 410], [300, 410], [262, 360]]} smooth fill={C.wood} w={3.6} seed={23} hatch={{ angle: -48, gap: 7, w: 1.2 }} hatchOpacity={0.45} />
      <Stroke pts={[[244, 304], [330, 296], [420, 288]]} w={4.4} color={C.bone} seed={24} />
      <Stroke pts={[[256, 334], [338, 328], [420, 322]]} w={1.8} opacity={0.6} seed={25} />
      <Stroke pts={[[236, 284], [330, 274], [420, 264]]} w={6} seed={26} />

      {/* the gangway: wide, edged in a bright strip, railed on both sides */}
      <Shape pts={[rampL[0]!, rampL[1]!, rampR[1]!, rampR[0]!]} fill={C.woodLight} w={3.4} seed={30} />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 0.6) / 9.4;
        const a: Pt = [rampL[0]![0] + (rampL[1]![0] - rampL[0]![0]) * t, rampL[0]![1] + (rampL[1]![1] - rampL[0]![1]) * t];
        const b: Pt = [rampR[0]![0] + (rampR[1]![0] - rampR[0]![0]) * t, rampR[0]![1] + (rampR[1]![1] - rampR[0]![1]) * t];
        return <Stroke key={i} pts={[a, b]} w={2.6} color={C.woodDeep} smooth={false} seed={32 + i} />;
      })}
      <Stroke pts={rampL} w={6} color={C.lantern} smooth={false} seed={44} />
      <Stroke pts={rampR} w={6} color={C.lantern} smooth={false} seed={45} />
      {[0.08, 0.36, 0.64, 0.92].map((t, i) => {
        const a: Pt = [rampL[0]![0] + (rampL[1]![0] - rampL[0]![0]) * t, rampL[0]![1] + (rampL[1]![1] - rampL[0]![1]) * t];
        const b: Pt = [rampR[0]![0] + (rampR[1]![0] - rampR[0]![0]) * t, rampR[0]![1] + (rampR[1]![1] - rampR[0]![1]) * t];
        return (
          <g key={i}>
            <Stroke pts={[a, [a[0], a[1] - 52]]} w={5} color={C.woodDeep} smooth={false} seed={50 + i} />
            <Stroke pts={[b, [b[0], b[1] - 56]]} w={5.6} color={C.woodDeep} smooth={false} seed={55 + i} />
          </g>
        );
      })}
      <Rope pts={[[56, 386], [116, 344], [176, 292], [230, 240]]} w={4} seed={60} />
      <Figure x={150} y={390} s={1.1} kind="lantern" cloth={C.indigo} seed={62} />
      <Figure x={212} y={336} s={1} kind="crate" cloth={C.clothRed} seed={63} />
      <Rope pts={[[162, 410], [222, 366], [276, 312], [318, 252]]} w={5} seed={61} />

      {/* Kernel on deck */}
      <At x={254} y={166} s={0.46}>
        <KernelParts mood="wave" hold="none" />
      </At>

      {/* the dock, the bell and the light */}
      <Planks pts={[[0, 446], [420, 446], [420, 520], [0, 520]]} rows={3} seed={70} />
      <Beam pts={[[30, 470], [30, 296]]} w={9} seed={72} fill={C.wood} />
      <Beam pts={[[26, 300], [80, 302]]} w={6} seed={73} fill={C.wood} />
      <Bell x={70} y={304} seed={74} s={1.1} />
      <Flecks marks={[[98, 334, 10, -20], [100, 350, 10, 10], [42, 344, 9, 190]]} w={2} seed={75} />
      <Shape pts={box(322, 446, 22, 44)} fill={C.ink3} w={2.8} seed={76} />
      <Rope pts={[[332, 452], [366, 438], [400, 420]]} w={4} seed={77} />
      <Stroke pts={[[388, 446], [388, 398]]} w={5} color={C.woodDeep} />
      <PaperLantern x={388} y={380} s={1.2} seed={78} />
      <Cat x={270} y={500} pose="walk" seed={79} s={0.8} flip />
    </Scene>
  );
});

/** Credits: the print table. Four inks, the brushes, the type and a line of prints hung up to dry. 420 x 520. */
export const PrintTable = memo(function PrintTable({ className }: { className?: string }) {
  const print = (x: number, y: number, r: number, seed: number, art: JSX.Element) => (
    <At x={x} y={y} r={r} key={seed}>
      <Shape pts={box(-38, 0, 76, 96)} fill={C.paperHi} w={2.2} seed={seed} />
      <g transform="translate(0 48)">{art}</g>
      <Shape pts={box(-5, -8, 10, 16)} fill={C.woodLight} w={1.6} seed={seed + 1} />
    </At>
  );
  return (
    <Scene
      w={420}
      h={520}
      className={className}
      label="An illustration of a print table. Pots of indigo, teal, ochre and red ink stand in a row beside a jar of brushes, a roller and wooden type blocks. Three prints hang drying on a line above. Inky paw prints cross the table, and the tail of a black cat is just leaving."
    >
      <Plaster x={0} y={0} w={420} h={520} fill={C.bone} seed={7} />
      <Dry pts={[[250, 40], [300, 180], [330, 330]]} w={70} color={C.paperHi} opacity={0.7} bristles={9} seed={3} />
      {/* the drying line */}
      <Stroke pts={[[0, 52], [140, 74], [290, 70], [420, 46]]} w={2.4} seed={10} />
      {print(84, 66, -3, 12, (
        <g>
          <Shape pts={ell(0, -8, 22, 22, 14, 0.03, 13)} smooth fill={C.seal} w={0} reg={[0, 0]} />
          <Stroke pts={[[-30, 22], [-14, 14], [0, 22], [14, 14], [30, 22]]} w={4} color={C.teal} seed={14} />
          <Stroke pts={[[-30, 32], [-14, 24], [0, 32], [14, 24], [30, 32]]} w={3} color={C.teal} seed={15} />
        </g>
      ))}
      {print(210, 72, 2, 20, (
        <g>
          <Shape pts={[[0, -28], [30, 2], [0, 8], [-30, 2]]} fill={C.ochre} w={0} reg={[0, 0]} />
          <Stroke pts={[[-24, 0], [0, 5], [24, 0]]} w={3} color={C.seal} seed={21} />
          <Shape pts={[[-14, 10], [14, 10], [12, 30], [-12, 30]]} smooth fill={C.ink2} w={0} reg={[0, 0]} />
        </g>
      ))}
      {print(336, 64, -2, 26, (
        <g>
          <Shape pts={[[-8, 30], [8, 30], [5, -14], [-5, -14]]} fill={C.indigo} w={0} reg={[0, 0]} />
          <Shape pts={[[-9, -14], [0, -26], [9, -14]]} fill={C.seal} w={0} reg={[0, 0]} />
          <Flecks marks={[[-12, -18, 16, 190], [-12, -10, 14, 170]]} w={2.6} color={C.ochre} seed={27} />
        </g>
      ))}

      {/* the table */}
      <Shape pts={[[0, 338], [420, 330], [420, 520], [0, 520]]} fill={C.woodLight} w={3.4} seed={30} />
      <Hatch pts={[[0, 470], [420, 462], [420, 520], [0, 520]]} angle={-72} gap={7} w={1.1} opacity={0.35} seed={31} />
      <Stroke pts={[[0, 392], [210, 388], [420, 384]]} w={1.4} opacity={0.45} seed={32} />
      <Stroke pts={[[0, 448], [210, 444], [420, 440]]} w={1.4} opacity={0.45} seed={33} />
      <Wash pts={[[20, 364], [200, 370], [400, 360], [390, 378], [200, 386], [30, 380]]} fill={INK} opacity={0.14} />

      <Pot x={52} y={372} ink={C.indigo} seed={40} w={44} h={46} />
      <Pot x={112} y={380} ink={C.teal} seed={41} w={42} h={42} />
      <Pot x={172} y={372} ink={C.ochre} seed={42} w={44} h={48} />
      <Pot x={232} y={382} ink={C.seal} seed={43} w={42} h={42} />
      <Pot x={352} y={376} ink={C.ink2} seed={44} w={50} h={56} label={false} />
      <Brush x={340} y={326} r={-74} len={86} seed={45} />
      <Brush x={352} y={326} r={-92} len={96} seed={46} tip={C.seal} />
      <Brush x={364} y={326} r={-108} len={82} seed={47} tip={C.indigo} />
      <Brush x={372} y={328} r={-122} len={70} seed={48} tip={C.teal} />

      {/* roller, with the stripe of ink it has just laid */}
      <Dry pts={[[44, 446], [130, 440], [214, 444]]} w={30} color={C.seal} opacity={0.92} bristles={9} seed={50} ragged={0.5} />
      <Shape pts={box(206, 426, 22, 38)} fill={C.ink3} w={2.6} seed={51} />
      <Stroke pts={[[228, 445], [262, 440], [286, 420]]} w={5} color={C.woodDeep} seed={52} />
      <Shape pts={ell(292, 414, 9, 12, 9, 0.05, 53)} smooth fill={C.woodLight} w={2.4} />

      {/* type */}
      <TypeBlock x={300} y={490} ch="T" seed={60} size={34} />
      <TypeBlock x={346} y={496} ch="w" seed={62} size={34} fill={C.clothTeal} />
      <TypeBlock x={322} y={452} ch="&" seed={64} size={30} fill={C.clothOchre} />
      {/* a cut block */}
      <Shape pts={box(40, 476, 112, 30)} fill={C.ink2} w={2.8} seed={66} />
      <Stroke pts={[[50, 492], [64, 484], [78, 492], [92, 484], [106, 492], [120, 484], [140, 492]]} w={2.6} color={C.bone} seed={67} />

      {/* Bobbin was here */}
      {[[176, 494, 20], [196, 474, 24], [222, 496, 22], [244, 474, 26], [268, 492, 20]].map(([px, py, pr], i) => (
        <At key={i} x={px} y={py} r={pr! - 60} s={0.9}>
          <Shape pts={ell(0, 0, 4.4, 3.8, 7, 0.1, 70 + i)} smooth fill={INK} w={0} reg={[0, 0]} />
          <Shape pts={ell(-5, -6, 1.8, 2.2, 5, 0.1, 76 + i)} smooth fill={INK} w={0} reg={[0, 0]} />
          <Shape pts={ell(0, -8, 1.8, 2.2, 5, 0.1, 82 + i)} smooth fill={INK} w={0} reg={[0, 0]} />
          <Shape pts={ell(5, -6, 1.8, 2.2, 5, 0.1, 88 + i)} smooth fill={INK} w={0} reg={[0, 0]} />
        </At>
      ))}
      <Stroke pts={[[420, 470], [404, 462], [396, 440], [408, 424]]} w={7} seed={95} />
      <Spatter x={150} y={410} r={60} n={18} seed={96} />
      <Spatter x={260} y={436} r={30} n={10} seed={97} color={C.seal} />
    </Scene>
  );
});

// ------------------------------------------------------------------------------------------------ Not found

/** Page not found: adrift, with the chart upside down. A wide picture, 1200 x 520. */
export const Adrift = memo(function Adrift({ className }: { className?: string }) {
  return (
    <Scene
      w={1200}
      h={520}
      className={className}
      label="An illustration of Kernel the robot adrift in a rowing boat on an open sea, looking alarmed and holding a chart. A buoy carries signs pointing in every direction. A lighthouse is just visible far away through bands of fog."
    >
      <Sky w={1200} h={330} seed={12} />
      <Sun x={920} y={250} r={110} seed={3} rays={22} />
      <Cloud x={220} y={90} w={300} seed={5} />
      <Cloud x={640} y={130} w={220} seed={8} fill={C.paperHi} />
      <Shape pts={[[0, 304], [120, 268], [240, 290], [330, 304]]} fill={C.hillFar} w={2.6} seed={9} />
      <MiniLighthouse x={150} y={274} s={0.56} seed={10} />
      <Sea y={300} w={1200} h={220} seed={14} />
      {/* fog */}
      <Dry pts={[[0, 286], [300, 278], [640, 290], [900, 280]]} w={34} color={C.paperHi} opacity={0.85} bristles={9} seed={20} ragged={0.5} />
      <Dry pts={[[420, 322], [760, 314], [1200, 326]]} w={26} color={C.paperHi} opacity={0.7} bristles={8} seed={21} ragged={0.5} />
      <Dry pts={[[0, 352], [260, 344], [520, 356]]} w={22} color={C.paperHi} opacity={0.55} bristles={7} seed={22} ragged={0.6} />
      <Crest x={140} y={452} s={54} seed={3} />
      <Crest x={1060} y={470} s={62} seed={5} flip={-1} />
      <Crest x={430} y={404} s={30} seed={7} />
      <Gull x={520} y={120} s={0.9} seed={1} />
      <Gull x={590} y={160} s={0.6} seed={2} />

      {/* the buoy that is no help at all */}
      <At x={338} y={432} s={1.5}>
        <Buoy seed={30} />
      </At>
      <Signpost
        x={338}
        y={404}
        s={1.1}
        h={124}
        seed={31}
        boards={[
          { at: 108, dir: 1, text: '?', fill: C.bone, w: 54 },
          { at: 82, dir: -1, text: '?', fill: C.lantern, w: 54 },
          { at: 56, dir: 1, text: '?', fill: C.tealLight, w: 54 },
        ]}
      />

      {/* Kernel and the boat */}
      <At x={676} y={236} s={0.76}>
        <KernelParts mood="alert" hold="map" />
      </At>
      <At x={770} y={452} s={2.9}>
        <Rowboat seed={40} />
      </At>
      <Stroke pts={[[690, 420], [612, 468]]} w={6} color={C.woodDeep} seed={41} />
      <Shape pts={[[604, 462], [622, 472], [598, 494], [586, 482]]} smooth fill={C.woodLight} w={2.4} seed={42} />
      <Cat x={868} y={422} seed={43} s={1.1} flip />
      {/* a bottle with a note */}
      <At x={1010} y={420} r={24}>
        <Shape pts={[[-10, -30], [10, -30], [12, 0], [-12, 0]]} smooth fill={C.tealLight} w={2.4} seed={50} />
        <Shape pts={box(-5, -44, 10, 14)} fill={C.tealLight} w={2} seed={51} />
        <Shape pts={box(-6, -50, 12, 7)} fill={C.wood} w={1.8} seed={52} />
        <Shape pts={box(-6, -22, 12, 16)} fill={C.paperHi} w={1.4} seed={53} />
      </At>
      <Flecks marks={[[980, 430, 20, 4], [1030, 436, 16, -4], [600, 500, 30, 2], [900, 496, 30, -2]]} w={2.4} color={C.seaFoam} seed={54} />
    </Scene>
  );
});
