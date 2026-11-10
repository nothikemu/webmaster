import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke, Wash } from './Draw';
import { box, ell, spline, type Pt } from './ink';
import { KernelParts } from './Kernel';
import { Barrel, Boat, Cloud, Crate, Crest, Gull, House, PaperLantern, Pine, Planks, Ripples, Rope, Smoke, TileRoof } from './props';

/**
 * The hero scene: a harbor town at dusk, three landmarks (one for each learning path) and Kernel on the dock.
 * Ink-brush style: every line is a brush stroke, every shadow is hatched, and the colour sits a little off the line.
 * The whole drawing is memoised, so it is computed once, not on every change of progress.
 */
export const Harbor = memo(function Harbor({ className }: { className?: string }) {
  const threads = [292, 336, 380, 424, 468, 512, 556];
  const lerpX = (x: number, y: number) => 430 + (x - 430) * ((y - 470) / 180);
  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMax slice"
      role="img"
      aria-label="An illustration of a harbor town at dusk. A workshop with a tall crane stands on a quay, a weaving hall with threads strung from its roof sits on a small island, and a striped lighthouse stands on a rock. Paper lanterns hang across the sky. A small round robot in a woven hat holds a lantern on the wooden dock."
      focusable="false"
    >
      <g filter="url(#rough)">
        {/* ---- sky ---- */}
        <rect width="1600" height="900" fill={C.sky1} />
        <rect y="296" width="1600" height="210" fill={C.sky2} />
        <rect y="470" width="1600" height="200" fill={C.sky3} />
        <Flecks marks={[[30, 120, 150, 1], [260, 60, 120, -1], [900, 90, 160, 1], [1250, 40, 140, 0], [1400, 110, 110, 2], [120, 260, 130, 0], [620, 230, 90, 1], [60, 400, 150, 1], [380, 420, 140, 0], [1180, 380, 120, -1]]} w={4} color={C.skyHigh} opacity={0.7} seed={5} />
        <Flecks marks={[[40, 330, 180, 0], [500, 360, 120, 1], [1300, 330, 200, 0], [800, 540, 150, 1], [100, 560, 180, 0], [1280, 560, 190, -1]]} w={3.4} color={C.sky3} opacity={0.6} seed={9} />

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
        <Cloud x={150} y={150} w={310} seed={3} />
        <Cloud x={470} y={228} w={190} seed={8} fill={C.paperHi} />
        <Cloud x={1170} y={128} w={400} seed={12} />
        <Cloud x={1400} y={238} w={250} seed={5} fill={C.paperHi} />
        <Cloud x={90} y={352} w={250} seed={14} fill={C.skyHigh} />
        <Cloud x={700} y={318} w={250} seed={17} fill={C.skyHigh} />
        <Gull x={820} y={150} s={1.1} seed={1} />
        <Gull x={900} y={196} s={0.8} seed={2} />
        <Gull x={760} y={236} s={0.6} seed={3} />
        <Gull x={1090} y={240} s={0.7} seed={4} />

        {/* ---- far mountains, faceted and hatched on the shadow side ---- */}
        <Shape pts={[[520, 664], [612, 540], [706, 586], [812, 452], [912, 566], [992, 524], [1102, 604], [1212, 486], [1322, 562], [1442, 462], [1600, 560], [1600, 664]]} fill={C.hillFar} w={3.2} />
        <Hatch pts={[[812, 452], [912, 566], [866, 574], [830, 500]]} angle={-60} gap={6} w={1.3} opacity={0.6} />
        <Hatch pts={[[1212, 486], [1322, 562], [1274, 570], [1240, 520]]} angle={-60} gap={6} w={1.3} opacity={0.6} />
        <Hatch pts={[[1442, 462], [1600, 560], [1540, 570], [1480, 500]]} angle={-60} gap={6} w={1.3} opacity={0.6} />
        <Stroke pts={[[812, 452], [830, 500], [826, 540]]} w={2} opacity={0.6} />
        <Stroke pts={[[1442, 462], [1470, 506], [1466, 548]]} w={2} opacity={0.6} />
        <Shape pts={[[1080, 664], [1172, 566], [1272, 614], [1384, 526], [1504, 594], [1600, 548], [1600, 664]]} fill={C.hillNear} w={3} hatch={{ angle: -55, gap: 8, w: 1.3, density: 0.7 }} hatchOpacity={0.4} />

        {/* ---- sea ---- */}
        <rect y="640" width="1600" height="260" fill={C.teal} />
        <Flecks marks={[[0, 668, 220, 0], [330, 690, 180, 1], [700, 676, 200, 0], [1100, 690, 220, 0], [1380, 672, 200, 1]]} w={3} color={C.tealLight} opacity={0.6} seed={13} />
        <rect y="800" width="1600" height="100" fill={C.tealDeep} />
        <Ripples x0={0} x1={1600} y0={654} y1={790} n={64} seed={4} />
        <Ripples x0={0} x1={1600} y0={806} y1={896} n={36} seed={7} color={C.tealLight} opacity={0.55} />
        <Stroke pts={[[0, 642], [400, 644], [800, 641], [1200, 644], [1600, 642]]} w={6} wob={1.2} />
        <Crest x={250} y={724} s={58} seed={1} />
        <Crest x={500} y={822} s={78} flip={-1} seed={2} />
        <Crest x={1160} y={856} s={86} seed={3} />
        <Crest x={1500} y={760} s={50} flip={-1} seed={4} />
        <Crest x={800} y={690} s={34} seed={5} />
        <Crest x={90} y={830} s={64} seed={6} />

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

        {/* ---- the lighthouse, far right ---- */}
        <g transform="translate(70 0)">
          <Hatch pts={[[1360, 384], [900, 316], [900, 432]]} color={C.lantern} angle={186} gap={7} w={2.6} opacity={0.95} />
          <Flecks marks={[[1300, 380, 110, 187], [1280, 372, 150, 191], [1300, 392, 120, 175], [1260, 380, 190, 183]]} w={3} color={C.lantern} opacity={0.9} seed={17} />
          <Shape pts={[[1236, 664], [1290, 574], [1346, 548], [1428, 548], [1484, 574], [1536, 664]]} fill={C.hillNear} w={3.6} hatch={{ angle: -50, gap: 7, w: 1.4 }} hatchOpacity={0.5} />
          <Stroke pts={[[1280, 620], [1340, 600], [1420, 612], [1490, 600]]} w={2} opacity={0.55} />
          <Stroke pts={[[1262, 644], [1350, 628], [1450, 640], [1520, 628]]} w={2} opacity={0.55} />
          <Shape pts={[[1350, 548], [1410, 548], [1397, 400], [1363, 400]]} fill={C.bone} w={3.6} />
          <Shape pts={[[1361, 440], [1399, 440], [1402, 480], [1358, 480]]} fill={C.seal} w={2.6} />
          <Shape pts={[[1356, 502], [1404, 502], [1408, 542], [1352, 542]]} fill={C.seal} w={2.6} />
          <Hatch pts={[[1390, 410], [1398, 410], [1408, 546], [1396, 546]]} angle={-60} gap={5} w={1.2} opacity={0.5} />
          <Shape pts={box(1344, 394, 72, 11)} fill={INK} w={0} reg={[0, 0]} />
          <Stroke pts={[[1346, 394], [1380, 388], [1414, 394]]} w={2.4} />
          <Shape pts={box(1360, 362, 40, 32)} fill={C.lantern} w={3.2} />
          <Stroke pts={[[1380, 362], [1380, 394]]} w={1.6} opacity={0.8} />
          <Shape pts={[[1350, 362], [1380, 334], [1410, 362]]} fill={C.seal} w={3.2} />
          <Stroke pts={[[1380, 334], [1380, 316]]} w={3.4} />
          <Flecks marks={[[1250, 654, 12, -50], [1280, 662, 10, -30], [1500, 658, 12, -130], [1530, 650, 10, -150], [1300, 668, 14, -80]]} w={3} color={C.seaFoam} />
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

        {/* ---- boats ---- */}
        <Boat x={560} y={738} s={0.85} seed={5} />
        <Boat x={880} y={748} s={0.5} seed={8} hull={C.clothTeal} />

        {/* ---- the dock, in the foreground ---- */}
        <Planks pts={[[730, 772], [1600, 772], [1600, 900], [640, 900]]} rows={6} seed={200} />
        <Shape pts={[[770, 744], [800, 744], [802, 784], [768, 784]]} smooth fill={C.ink2} w={3.2} />
        <Rope pts={[[785, 752], [850, 796], [900, 776], [960, 804], [1010, 800]]} seed={211} />
        <Shape pts={ell(1050, 818, 36, 14, 12, 0.05, 212)} smooth fill={C.straw} w={3} hatch={{ angle: 0, gap: 4, w: 1.2 }} hatchOpacity={0.6} />
        <Crate x={1180} y={810} w={150} h={84} seed={213} />
        <Crate x={1150} y={726} w={68} h={54} seed={214} />
        <Barrel x={1566} y={822} w={64} h={82} seed={215} band={C.seal} />

        {/* ---- festoon: lanterns on a rope across the top right ---- */}
        <Rope pts={[[640, 26], [900, 80], [1180, 130], [1420, 118], [1600, 90]]} w={5} seed={230} />
        {[[780, 66, 1], [930, 90, 1.1], [1080, 112, 1], [1240, 132, 1.1], [1400, 124, 1]].map(([x, y, s], i) => (
          <g key={i}>
            <Stroke pts={[[x as number, y as number], [x as number, (y as number) + 16]]} w={2.4} />
            <PaperLantern x={x as number} y={(y as number) + 36} s={(s as number) * 1.15} color={i % 2 ? C.lantern : C.clothRed} seed={240 + i} />
          </g>
        ))}

        {/* ---- Kernel, the guide ---- */}
        <g transform="translate(1296 560) scale(0.94)">
          <KernelParts mood="idle" />
        </g>
      </g>
      {/* printed-paper tooth over everything */}
      <rect width="1600" height="900" filter="url(#grain)" opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
});

/** Re-export so other scenes can reuse the spline helper without importing from ink directly. */
export type { Pt };
export { spline };
