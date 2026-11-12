import { memo } from 'react';
import { Link } from '@/router';
import { C, INK, HUE, type PathHueName } from './palette';
import { Dry, Finish, Flecks, Hatch, Shape, Spatter, Stroke, Wash } from './Draw';
import { box, ell } from './ink';
import { KernelParts } from './Kernel';
import { Barrel, Boat, Cloud, Crate, Crest, Gull, House, Pine, Planks, Ripples, Rope, Smoke, TileRoof } from './props';
import { Basket, Buoy, Cat, Figure, Kite, Rowboat, Stall } from './kit';

const W = 1600;
const H = 900;
const FIT = 'xMaxYMax slice';

/**
 * The hero: a harbor town at dusk with the three places of the portal, and Kernel on the dock.
 *
 * It is drawn in two layers that sit exactly on top of each other.
 *  - The base never changes, so it is computed once and the browser paints it once.
 *  - The live layer holds what follows the player: a lantern for each finished lesson, a pennant on each finished place,
 *    the beam of the lighthouse once the certification is passed, and the three places as links.
 * Keeping them apart means lighting a lantern never repaints the whole picture.
 */
const HarborBase = memo(function HarborBase() {
  const threads = [292, 336, 380, 424, 468, 512, 556];
  const lerpX = (x: number, y: number) => 430 + (x - 430) * ((y - 470) / 180);
  return (
    <svg
      className="hero__layer"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={FIT}
      role="img"
      aria-label="An illustration of a harbor town at dusk. A workshop with a tall crane stands on a quay, a weaving hall with threads strung from its roof sits on a small island, and a striped lighthouse stands on a rock. Townsfolk fish, carry baskets and fly a kite. A small round robot in a woven hat holds a lantern on the wooden dock, with a black cat on a crate behind it."
      focusable="false"
    >
      <g filter="url(#rough)">
        {/* ---- sky ---- */}
        <rect width={W} height={H} fill={C.sky1} />
        <rect y="296" width={W} height="210" fill={C.sky2} />
        <rect y="470" width={W} height="200" fill={C.sky3} />
        <Dry pts={[[20, 120], [220, 112], [420, 122]]} w={26} color={C.skyHigh} opacity={0.8} seed={5} bristles={7} />
        <Dry pts={[[860, 92], [1090, 84], [1320, 96]]} w={30} color={C.skyHigh} opacity={0.75} seed={6} bristles={8} />
        <Dry pts={[[1180, 246], [1400, 238], [1600, 250]]} w={22} color={C.skyHigh} opacity={0.6} seed={7} bristles={6} />
        <Dry pts={[[30, 334], [260, 326], [520, 338]]} w={22} color={C.sky3} opacity={0.55} seed={9} bristles={6} />
        <Dry pts={[[1240, 336], [1420, 330], [1600, 340]]} w={20} color={C.sky3} opacity={0.5} seed={10} bristles={5} />
        <Dry pts={[[700, 548], [860, 542], [1000, 552]]} w={16} color={C.sky1} opacity={0.45} seed={11} bristles={5} />

        {/* ---- the sun, with brushed rays ---- */}
        <Shape pts={ell(1010, 470, 238, 238, 28, 0.01, 21)} smooth fill={C.sky2} w={0} reg={[0, 0]} />
        <Flecks
          marks={Array.from({ length: 26 }, (_, i) => {
            const a = (i / 26) * Math.PI * 2 + 0.07 * Math.sin(i * 2.3);
            const r0 = 248 + (i % 3) * 8;
            return [1010 + Math.cos(a) * r0, 470 + Math.sin(a) * r0, 22 + (i % 4) * 7, (a * 180) / Math.PI] as [number, number, number, number];
          })}
          w={3.6}
          color={C.sun}
          opacity={0.75}
          seed={31}
        />
        <Shape pts={ell(1010, 470, 200, 200, 26, 0.012, 22)} smooth fill={C.sun} w={4.4} hatch={{ angle: -35, gap: 11, w: 1.6, density: 0.8 }} hatchColor={C.roofRed} hatchOpacity={0.6} />
        <Hatch pts={[[880, 540], [1010, 580], [1130, 540], [1010, 640]]} angle={-30} gap={8} w={1.4} opacity={0.25} smooth />

        {/* ---- clouds ---- */}
        <Cloud x={470} y={228} w={190} seed={8} fill={C.paperHi} />
        <Cloud x={1440} y={300} w={220} seed={5} fill={C.paperHi} />
        <Cloud x={90} y={352} w={250} seed={14} fill={C.skyHigh} />

        {/* ---- far mountains, faceted and hatched on the shadow side ---- */}
        <Shape pts={[[520, 664], [612, 540], [706, 586], [812, 452], [912, 566], [992, 524], [1102, 604], [1212, 486], [1322, 562], [1442, 462], [1600, 560], [1600, 664]]} fill={C.hillFar} w={3.2} />
        <Hatch pts={[[812, 452], [912, 566], [866, 574], [830, 500]]} angle={-60} gap={6} w={1.3} opacity={0.6} />
        <Hatch pts={[[1212, 486], [1322, 562], [1274, 570], [1240, 520]]} angle={-60} gap={6} w={1.3} opacity={0.6} />
        <Hatch pts={[[1442, 462], [1600, 560], [1540, 570], [1480, 500]]} angle={-60} gap={6} w={1.3} opacity={0.6} />
        <Stroke pts={[[812, 452], [830, 500], [826, 540]]} w={2} opacity={0.6} />
        <Stroke pts={[[1442, 462], [1470, 506], [1466, 548]]} w={2} opacity={0.6} />
        <Shape pts={[[1080, 664], [1172, 566], [1272, 614], [1384, 526], [1504, 594], [1600, 548], [1600, 664]]} fill={C.hillNear} w={3} hatch={{ angle: -55, gap: 8, w: 1.3, density: 0.7 }} hatchOpacity={0.4} />

        {/* ---- sea: two tones, the sun's road across it, ripples and breaking crests ---- */}
        <rect y="640" width={W} height="260" fill={C.teal} />
        <rect y="800" width={W} height="100" fill={C.tealDeep} />
        <Dry pts={[[0, 670], [260, 664], [520, 672]]} w={16} color={C.tealLight} opacity={0.6} seed={13} bristles={6} />
        <Dry pts={[[1080, 688], [1320, 682], [1600, 690]]} w={16} color={C.tealLight} opacity={0.5} seed={14} bristles={6} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Dry key={i} pts={[[944 - i * 22, 700 + i * 18], [1010, 698 + i * 18 + (i % 2) * 3], [1076 + i * 22, 700 + i * 18]]} w={7 - i * 0.6} color={i % 2 ? C.lantern : C.sun} opacity={0.75 - i * 0.1} seed={40 + i} bristles={4} />
        ))}
        <Ripples x0={0} x1={W} y0={654} y1={790} n={64} seed={4} />
        <Ripples x0={0} x1={W} y0={806} y1={896} n={36} seed={7} color={C.tealLight} opacity={0.55} />
        <Stroke pts={[[0, 642], [400, 644], [800, 641], [1200, 644], [1600, 642]]} w={6} wob={1.2} />
        <Boat x={830} y={640} s={0.16} seed={3} />
        <Boat x={1560} y={638} s={0.12} seed={9} hull={C.clothTeal} />
        <Crest x={250} y={724} s={58} seed={1} />
        <Crest x={500} y={822} s={78} flip={-1} seed={2} />
        <Crest x={1500} y={760} s={50} flip={-1} seed={4} />
        <Crest x={90} y={830} s={64} seed={6} />
        <Crest x={352} y={876} s={54} seed={8} />
        <Crest x={636} y={868} s={40} flip={-1} seed={9} />
        <Dry pts={[[20, 790], [150, 782], [300, 792]]} w={12} color={C.seaFoam} opacity={0.7} seed={15} bristles={5} />
        <Dry pts={[[330, 846], [470, 838], [600, 848]]} w={10} color={C.seaFoam} opacity={0.6} seed={16} bristles={4} />

        {/* ---- left: the town on its hill ---- */}
        <Shape pts={[[0, 520], [110, 480], [250, 468], [430, 500], [620, 540], [770, 612], [770, 674], [0, 674]]} smooth fill={C.hillNear} w={3.6} hatch={{ angle: -50, gap: 9, w: 1.4, density: 0.7 }} hatchOpacity={0.4} />
        <Stroke pts={[[60, 560], [200, 528], [340, 566], [470, 540], [610, 588]]} w={2} opacity={0.45} />
        <Stroke pts={[[110, 640], [260, 606], [410, 628], [560, 600], [690, 640]]} w={2} opacity={0.4} />
        <Flecks marks={[[40, 610, 9, -80], [48, 618, 8, -100], [190, 588, 9, -80], [310, 612, 8, -95], [500, 596, 9, -85], [650, 628, 8, -90]]} w={2.4} color={C.moss} />
        <Pine x={60} y={566} s={1.4} seed={11} />
        <Pine x={118} y={580} s={0.95} seed={12} />
        <Pine x={706} y={608} s={1.15} seed={13} />
        <House x={202} y={566} w={100} h={68} seed={21} chimney />
        <Smoke x={236} y={474} s={0.6} seed={41} />
        <House x={332} y={598} w={84} h={58} roof={C.roofIndigo} lit={false} seed={22} />
        <House x={470} y={582} w={92} h={62} seed={23} roof={C.clothTeal} />
        <House x={632} y={616} w={80} h={56} roof={C.roofRed} lit={false} seed={24} />
        <House x={112} y={620} w={72} h={50} roof={C.roofIndigo} seed={25} />
        <Stroke pts={[[150, 548], [300, 562], [390, 548]]} w={1.8} opacity={0.8} />
        {[[185, 556, C.clothRed], [215, 560, C.clothTeal], [250, 563, C.clothOchre], [290, 562, C.bone], [330, 558, C.clothRed]].map(([x, y, col], i) => (
          <Shape key={i} pts={[[(x as number) - 8, y as number], [(x as number) + 8, (y as number) - 1], [(x as number) + 7, (y as number) + 20], [(x as number) - 7, (y as number) + 19]]} fill={col as string} w={1.8} seed={60 + i} />
        ))}
        <Stall x={404} y={662} s={0.86} seed={26} />
        <Figure x={360} y={664} s={0.8} kind="pole" cloth={C.indigo} seed={27} />
        <Figure x={556} y={640} s={0.74} kind="kite" cloth={C.clothRed} seed={28} hat={false} />
        <Kite x={742} y={250} tx={562} ty={610} s={1.5} seed={29} fill={C.clothTeal} />

        {/* ---- the lighthouse, far right (its lamp and beam are in the live layer) ---- */}
        <g transform="translate(70 0)">
          <Shape pts={[[1236, 664], [1290, 574], [1346, 548], [1428, 548], [1484, 574], [1536, 664]]} fill={C.hillNear} w={3.6} hatch={{ angle: -50, gap: 7, w: 1.4 }} hatchOpacity={0.5} />
          <Stroke pts={[[1280, 620], [1340, 600], [1420, 612], [1490, 600]]} w={2} opacity={0.55} />
          <Stroke pts={[[1262, 644], [1350, 628], [1450, 640], [1520, 628]]} w={2} opacity={0.55} />
          <Shape pts={[[1350, 548], [1410, 548], [1397, 400], [1363, 400]]} fill={C.bone} w={3.6} />
          <Shape pts={[[1361, 440], [1399, 440], [1402, 480], [1358, 480]]} fill={C.seal} w={2.6} />
          <Shape pts={[[1356, 502], [1404, 502], [1408, 542], [1352, 542]]} fill={C.seal} w={2.6} />
          <Hatch pts={[[1390, 410], [1398, 410], [1408, 546], [1396, 546]]} angle={-60} gap={5} w={1.2} opacity={0.5} />
          <Shape pts={box(1372, 518, 16, 30)} fill={C.woodDeep} w={2.2} />
          <Shape pts={box(1373, 452, 12, 16)} fill={C.ink2} w={1.8} />
          <Shape pts={box(1344, 394, 72, 11)} fill={INK} w={0} reg={[0, 0]} />
          <Stroke pts={[[1346, 394], [1380, 388], [1414, 394]]} w={2.4} />
          <Flecks marks={[[1348, 394, 10, -90], [1364, 394, 10, -90], [1396, 394, 10, -90], [1412, 394, 10, -90]]} w={1.6} />
          <Shape pts={box(1360, 362, 40, 32)} fill={C.paperLo} w={3.2} hatch={{ angle: 45, gap: 5, w: 1.1 }} hatchOpacity={0.35} />
          <Stroke pts={[[1380, 362], [1380, 394]]} w={1.6} opacity={0.8} />
          <Shape pts={[[1350, 362], [1380, 334], [1410, 362]]} fill={C.seal} w={3.2} />
          <Stroke pts={[[1380, 334], [1380, 316]]} w={3.4} />
          <Flecks marks={[[1250, 654, 12, -50], [1280, 662, 10, -30], [1500, 658, 12, -130], [1530, 650, 10, -150], [1300, 668, 14, -80]]} w={3} color={C.seaFoam} />
          <Figure x={1316} y={598} s={0.7} kind="lantern" cloth={C.woodDeep} seed={71} hat={false} />
        </g>

        {/* ---- the Loom House, on its own small island ---- */}
        <Shape pts={[[966, 668], [1004, 642], [1060, 640], [1200, 640], [1256, 648], [1280, 680], [1270, 698], [966, 698]]} smooth fill={C.hillNear} w={3.4} hatch={{ angle: -50, gap: 6, w: 1.3 }} hatchOpacity={0.5} />
        <Flecks marks={[[1010, 650, 8, -80], [1030, 646, 9, -95], [1240, 652, 8, -85], [1260, 660, 7, -100]]} w={2.4} color={C.moss} />
        <g transform="translate(768 135) scale(0.8)">
          <Shape pts={box(300, 548, 260, 84)} fill={C.bone} w={3.6} />
          <Hatch pts={box(470, 552, 86, 76)} angle={-55} gap={6} w={1.3} opacity={0.5} />
          <Stroke pts={[[302, 590], [430, 594], [558, 590]]} w={2.4} opacity={0.65} />
          <TileRoof x={430} y={548} w={290} h={80} fill={C.roofIndigo} seed={71} rows={4} />
          <TileRoof x={430} y={496} w={150} h={52} fill={C.indigo} seed={72} rows={3} />
          {threads.map((x0, i) => (
            <Stroke key={i} pts={[[430, 470], [(430 + x0) / 2 + (i % 2 ? 2 : -2), 560], [x0, 650]]} w={i === 3 ? 7 : 5} color={C.indigo} seed={80 + i} wob={0.9} />
          ))}
          {[548, 584, 620].map((y, j) => (
            <g key={y}>
              <Stroke pts={[[lerpX(292, y), y], [430, y + 2], [lerpX(556, y), y]]} w={3} opacity={0.85} seed={90 + j} />
              {threads.map((x0, i) => (
                <Shape key={i} pts={ell(lerpX(x0, y), y, 7.5, 7.5, 7, 0.1, i + j * 7)} smooth fill={(i + j) % 2 ? C.lantern : C.bone} w={2.6} reg={[0.8, 0.8]} />
              ))}
            </g>
          ))}
          <Shape pts={ell(430, 470, 10, 10, 8, 0.08, 99)} smooth fill={C.seal} w={3} />
          {[[318, 640, C.clothRed], [346, 646, C.clothOchre], [530, 644, C.clothTeal], [548, 650, C.clothRed]].map(([x, y, col], i) => (
            <Shape key={i} pts={ell(x as number, y as number, 11, 9, 8, 0.08, 110 + i)} smooth fill={col as string} w={2.4} />
          ))}
          <Shape pts={box(415, 596, 30, 36)} fill={C.woodDeep} w={2.6} />
        </g>
        <Figure x={1226} y={646} s={0.72} cloth={C.indigo} seed={115} />

        {/* ---- the Foundry quay ---- */}
        <g transform="translate(166 141) scale(0.78)">
          <Planks pts={[[676, 654], [1022, 654], [1022, 678], [676, 678]]} rows={2} seed={120} />
          <Shape pts={box(704, 588, 200, 66)} fill={C.bone} w={3.6} />
          <Hatch pts={box(840, 592, 62, 58)} angle={-55} gap={6} w={1.3} opacity={0.5} />
          <Shape pts={box(722, 606, 64, 48)} fill={C.ink2} w={3} />
          <Wash pts={box(728, 622, 52, 32)} fill={C.ochre} opacity={0.85} smooth={false} />
          <Flecks marks={[[732, 618, 8, -60], [750, 614, 8, -90], [768, 618, 8, -120]]} w={2.2} color={C.lantern} />
          <Shape pts={box(802, 604, 36, 30)} fill={C.lantern} w={2.6} />
          <Stroke pts={[[820, 604], [820, 634]]} w={1.4} opacity={0.8} />
          <TileRoof x={804} y={588} w={200} h={52} fill={C.tealDeep} seed={131} rows={3} />
          <Shape pts={box(864, 500, 30, 92)} fill={C.hillNear} w={3} />
          <Smoke x={880} y={486} s={1.1} seed={141} />
          <Stroke pts={[[938, 654], [938, 398]]} w={7} />
          <Stroke pts={[[966, 654], [966, 398]]} w={7} />
          {[440, 490, 540, 590, 640].map((y, i) => (
            <Stroke key={y} pts={[[938, y + 50], [966, y]]} w={4.6} smooth={false} seed={150 + i} />
          ))}
          <Stroke pts={[[936, 410], [1030, 428], [1132, 458]]} w={8} seed={160} />
          <Stroke pts={[[1100, 450], [1098, 548]]} w={3} />
          <Crate x={1096} y={594} w={56} h={46} seed={161} />
          <Barrel x={720} y={650} w={44} h={54} seed={162} />
          <Barrel x={770} y={654} w={40} h={46} seed={163} band={C.seal} />
          <Shape pts={ell(804, 566, 14, 14, 10, 0.05, 164)} smooth fill={C.lantern} w={2.4} />
          <Flecks marks={[[804, 548, 6, -90], [818, 553, 6, -50], [790, 553, 6, -130], [804, 584, 6, 90]]} w={2} />
        </g>
        <Stroke pts={[[968, 653], [990, 650], [1000, 650]]} w={9} color={C.wood} />
        <Figure x={872} y={652} s={0.7} kind="crate" cloth={C.clothTeal} seed={165} />
        <Spatter x={742} y={612} r={26} n={10} seed={166} color={C.lantern} />

        {/* ---- boats and things afloat ---- */}
        <Boat x={560} y={738} s={0.85} seed={5} />
        <Boat x={880} y={748} s={0.5} seed={8} hull={C.clothTeal} />
        <Rowboat x={300} y={812} s={1.5} seed={170} />
        <Figure x={296} y={800} s={1.1} kind="rod" cloth={C.clothOchre} seed={171} />
        <Buoy x={150} y={770} s={1.1} seed={172} />

        {/* ---- the dock, in the foreground ---- */}
        <Planks pts={[[730, 772], [1600, 772], [1600, 900], [640, 900]]} rows={6} seed={200} />
        <Wash pts={[[1060, 884], [1300, 890], [1560, 880], [1540, 900], [1080, 900]]} fill={INK} opacity={0.2} />
        <Shape pts={[[770, 744], [800, 744], [802, 784], [768, 784]]} smooth fill={C.ink2} w={3.2} />
        <Rope pts={[[785, 752], [850, 796], [900, 776], [960, 804], [1010, 800]]} seed={211} />
        <Basket x={1050} y={830} s={1.3} seed={212} />
        <Crate x={1180} y={810} w={150} h={84} seed={213} />
        <Crate x={1150} y={726} w={68} h={54} seed={214} />
        <Cat x={1218} y={726} seed={216} s={1.05} />
        <Barrel x={1566} y={822} w={64} h={82} seed={215} band={C.seal} />
        <Figure x={900} y={772} s={1.25} kind="sit" cloth={C.clothRed} seed={217} flip />
        <Stroke pts={[[888, 742], [846, 700], [800, 676]]} w={2.2} seed={218} />
        <Stroke pts={[[800, 676], [796, 720], [798, 768]]} w={1} opacity={0.8} />

        {/* ---- Kernel, the guide ---- */}
        <g transform="translate(1296 560) scale(0.94)">
          <KernelParts mood="idle" />
        </g>
      </g>
      {/* uneven pigment and paper tooth over everything */}
      <Finish w={W} h={H} />
      <rect width={W} height={H} filter="url(#paint)" opacity="0.34" style={{ mixBlendMode: 'multiply' }} />
      <rect width={W} height={H} filter="url(#grain)" opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
});

/** One lantern on the festoon. Lit lanterns glow yellow with rays; unlit ones are bare hatched paper. The cap and tassel carry the path's colour. */
function FestoonLantern({ x, y, lit, hue, index }: { x: number; y: number; lit: boolean; hue: string; index: number }) {
  return (
    <g className="festoon__lantern" style={{ ['--i' as string]: index }}>
      <Stroke pts={[[x, y], [x, y + 13]]} w={2.2} smooth={false} />
      <Shape pts={box(x - 7, y + 12, 14, 5)} fill={hue} w={1.8} seed={300 + index} />
      <Shape pts={ell(x, y + 34, 13, 17, 9, 0.05, 320 + index)} smooth fill={lit ? C.lantern : C.ink3} w={2.8} hatch={lit ? { angle: -60, gap: 6, w: 1 } : { angle: 45, gap: 4.5, w: 1.1 }} hatchOpacity={lit ? 0.3 : 0.45} />
      {lit ? <Stroke pts={[[x - 12, y + 32], [x, y + 37], [x + 12, y + 32]]} w={1.5} opacity={0.6} /> : null}
      <Shape pts={box(x - 6, y + 50, 12, 4)} fill={hue} w={1.6} seed={340 + index} />
      <Stroke pts={[[x, y + 54], [x - 1.5, y + 64]]} w={2.2} color={hue} smooth={false} />
      {lit ? <Flecks marks={[[x - 22, y + 26, 7, 200], [x + 22, y + 26, 7, -20], [x - 20, y + 46, 6, 150], [x + 20, y + 46, 6, 30]]} w={1.8} seed={360 + index} /> : null}
    </g>
  );
}

/** Three clouds that drift very slowly in the live layer, so the sky is not a still photograph. */
const DriftClouds = memo(function DriftClouds() {
  return (
    <g filter="url(#rough)">
      <g className="hero__drift hero__drift--a"><Cloud x={150} y={150} w={310} seed={3} /></g>
      <g className="hero__drift hero__drift--b"><Cloud x={1170} y={228} w={300} seed={12} /></g>
      <g className="hero__drift hero__drift--c"><Cloud x={700} y={368} w={210} seed={17} fill={C.skyHigh} /></g>
    </g>
  );
});

export interface HarborPlace {
  id: PathHueName;
  to: string;
  title: string;
  place: string;
  done: number;
  total: number;
}

interface HarborProps {
  className?: string;
  /** One entry per lesson, in course order: true when the lesson is finished. */
  lit: readonly boolean[];
  places: readonly HarborPlace[];
  certified: boolean;
}

/** Where each place's marker sits in the picture. */
const PIN: Record<PathHueName, { x: number; y: number; side: 1 | -1 }> = {
  use: { x: 792, y: 560, side: -1 },
  understand: { x: 1112, y: 486, side: 1 },
  responsible: { x: 1528, y: 440, side: -1 },
};
const PIN_FILL: Record<PathHueName, string> = { understand: C.indigo, use: C.teal, responsible: C.ochre };

export function Harbor({ className, lit, places, certified }: HarborProps) {
  const hues: PathHueName[] = ['understand', 'use', 'responsible'];
  const count = lit.length;
  // the festoon rope sags between three posts; lanterns hang along it
  const rope = (t: number): [number, number] => {
    const x = 702 + t * 876;
    const sag = Math.sin(t * Math.PI * 3) ** 2 * 26;
    return [x, 96 + sag + t * 22];
  };
  return (
    <div className={className}>
      <HarborBase />
      <svg className="hero__layer hero__layer--live" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={FIT} role="group" aria-label="The three places of the harbor" focusable="false">
        <DriftClouds />
        {/* the beam of the lighthouse, once the certification is passed */}
        {certified ? (
          <g className="hero__beam" transform="translate(70 0)">
            <Hatch pts={[[1360, 384], [900, 316], [900, 432]]} color={C.lantern} angle={186} gap={7} w={2.6} opacity={0.95} />
            <Flecks marks={[[1300, 380, 110, 187], [1280, 372, 150, 191], [1300, 392, 120, 175], [1260, 380, 190, 183]]} w={3} color={C.lantern} opacity={0.9} seed={17} />
            <Shape pts={box(1360, 362, 40, 32)} fill={C.lantern} w={3.2} />
            <Stroke pts={[[1380, 362], [1380, 394]]} w={1.6} opacity={0.8} />
          </g>
        ) : null}

        {/* gulls */}
        <g className="hero__gulls">
          <Gull x={820} y={250} s={1.1} seed={1} />
          <Gull x={900} y={296} s={0.8} seed={2} />
          <Gull x={1300} y={320} s={0.6} seed={3} />
          <Gull x={1090} y={300} s={0.7} seed={4} />
        </g>

        {/* a pennant on each place whose lessons are all finished */}
        {places.map((p) =>
          p.done >= p.total ? (
            <g key={`f-${p.id}`}>
              <Stroke pts={[[PIN[p.id].x + 36 * PIN[p.id].side, PIN[p.id].y + 60], [PIN[p.id].x + 36 * PIN[p.id].side, PIN[p.id].y - 30]]} w={3.4} smooth={false} />
              <Shape pts={[[PIN[p.id].x + 36 * PIN[p.id].side, PIN[p.id].y - 30], [PIN[p.id].x + 36 * PIN[p.id].side + 34, PIN[p.id].y - 20], [PIN[p.id].x + 36 * PIN[p.id].side, PIN[p.id].y - 8]]} fill={PIN_FILL[p.id]} w={2.4} />
            </g>
          ) : null,
        )}

        {/* the festoon: one lantern for every lesson */}
        <g className="festoon">
          <Rope pts={Array.from({ length: 13 }, (_, i) => rope(i / 12))} w={4} seed={230} />
          {lit.map((on, i) => {
            const [x, y] = rope((i + 0.5) / count);
            return <FestoonLantern key={i} x={x} y={y + 2} lit={on} hue={HUE[hues[Math.min(2, Math.floor((i / count) * 3))]!].main} index={i} />;
          })}
        </g>

        {/* the three places, as links */}
        {places.map((p) => {
          const pin = PIN[p.id];
          const n = hues.indexOf(p.id) + 1;
          const tw = Math.max(p.title.length, p.place.length) * 8.4 + 22;
          const lx = pin.side === 1 ? pin.x + 26 : pin.x - 26 - tw;
          return (
            <Link key={p.id} to={p.to} className="hero-pin">
              <circle cx={pin.x} cy={pin.y} r={30} fill="transparent" />
              <g transform="translate(4 5)">
                <Shape pts={ell(pin.x, pin.y, 22, 22, 14, 0.03, pin.x)} smooth fill={INK} w={0} reg={[0, 0]} />
              </g>
              <Shape pts={ell(pin.x, pin.y, 22, 22, 14, 0.03, pin.x)} smooth fill={PIN_FILL[p.id]} w={3.6} seed={pin.x + pin.y} />
              <text x={pin.x} y={pin.y + 8} textAnchor="middle" fontFamily="'Dela Gothic One', sans-serif" fontSize={22} fill={p.id === 'responsible' ? INK : C.bone}>
                {n}
              </text>
              <g className="hero-pin__label">
                <Shape pts={box(lx, pin.y - 21, tw, 42)} fill={C.ink} w={0} reg={[0, 0]} wob={0.5} />
                <text className="hero-pin__text" x={lx + 11} y={pin.y - 3} fill={C.lantern}>
                  {p.place}
                </text>
                <text className="hero-pin__text" x={lx + 11} y={pin.y + 14} fill={C.bone}>
                  {p.title}
                </text>
              </g>
              <text className="svg-sr" x={pin.x} y={pin.y}>
                {`. ${p.done} of ${p.total} lessons finished.`}
              </text>
            </Link>
          );
        })}
      </svg>
    </div>
  );
}
