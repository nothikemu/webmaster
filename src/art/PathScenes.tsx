import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke } from './Draw';
import { box, ell, type Pt } from './ink';
import { KernelParts } from './Kernel';
import { Brannock, Sedge, Wren } from './Cast';
import { Barrel, Boat, Cloud, Crest, Gull, PaperLantern, Planks, Ripples, Smoke } from './props';
import type { PathId } from '@/content/types';

function gear(cx: number, cy: number, r: number, teeth: number, rot = 0): Pt[] {
  const pts: Pt[] = [];
  const step = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const rad = i % 2 ? r * 0.8 : r;
    for (const off of [-0.3, 0.3]) {
      const a = i * step + step * off + rot;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
  }
  return pts;
}

/** The Loom House: a weaving hall where the threads of a loom make a network. */
function Loom() {
  const warps = Array.from({ length: 13 }, (_, i) => 204 + i * 21);
  return (
    <g>
      <rect width="640" height="400" fill="#d9d2c0" />
      <Flecks marks={[[10, 30, 120, 0], [300, 20, 160, 1], [470, 60, 130, 0], [60, 90, 100, 1]]} w={3.4} color={C.paperHi} opacity={0.6} seed={3} />
      {/* back wall: timber frame and a window onto the harbor hills */}
      <Shape pts={box(0, 0, 640, 262)} fill="#d9d2c0" w={0} reg={[0, 0]} />
      {[60, 180, 330, 470, 600].map((x, i) => (
        <Stroke key={i} pts={[[x, 0], [x + 1, 130], [x - 1, 262]]} w={8} color={C.woodDeep} seed={300 + i} wob={1.1} />
      ))}
      <Stroke pts={[[0, 18], [320, 24], [640, 16]]} w={10} color={C.woodDeep} seed={310} wob={1.2} />
      <Stroke pts={[[0, 262], [320, 266], [640, 262]]} w={8} color={INK} seed={311} />
      <Shape pts={[[28, 262], [28, 110], [60, 66], [100, 52], [140, 66], [172, 110], [172, 262]]} smooth fill={C.sky1} w={4} />
      <Shape pts={[[28, 262], [28, 200], [66, 170], [100, 196], [146, 158], [172, 190], [172, 262]]} fill={C.hillFar} w={2.6} hatch={{ angle: -55, gap: 6, w: 1.2 }} hatchOpacity={0.5} />
      <Shape pts={ell(104, 120, 22, 22, 14, 0.02, 301)} smooth fill={C.sun} w={2.8} />
      <Stroke pts={[[100, 52], [100, 262]]} w={3.4} />
      <Stroke pts={[[28, 160], [172, 160]]} w={3.4} />
      {/* skeins of dyed thread hanging from the beam */}
      {[[200, C.clothRed], [226, C.clothOchre], [252, C.clothTeal], [520, C.clothRed], [548, C.indigo], [574, C.clothOchre], [600, C.clothTeal]].map(([x, col], i) => (
        <g key={i}>
          <Stroke pts={[[x as number, 26], [x as number, 44]]} w={2.4} />
          <Shape pts={[[(x as number) - 8, 44], [(x as number) + 8, 44], [(x as number) + 10, 92], [x as number, 104], [(x as number) - 10, 92]]} smooth fill={col as string} w={2.6} hatch={{ angle: 75, gap: 4, w: 1 }} hatchOpacity={0.45} seed={320 + i} />
        </g>
      ))}
      {/* floor */}
      <Planks pts={[[0, 262], [640, 262], [640, 400], [0, 400]]} rows={4} seed={330} />
      {/* the loom: a heavy frame, many warp threads, a woven band made of knots */}
      <Shape pts={box(176, 56, 288, 20)} fill={C.wood} w={3.4} />
      <Shape pts={box(176, 300, 288, 20)} fill={C.wood} w={3.4} />
      <Shape pts={box(166, 56, 22, 270)} fill={C.woodDeep} w={3.4} hatch={{ angle: -70, gap: 6, w: 1.1 }} hatchColor={C.woodLight} hatchOpacity={0.5} />
      <Shape pts={box(452, 56, 22, 270)} fill={C.woodDeep} w={3.4} hatch={{ angle: -70, gap: 6, w: 1.1 }} hatchColor={C.woodLight} hatchOpacity={0.5} />
      {warps.map((x, i) => (
        <Stroke key={i} pts={[[x, 76], [x + (i % 3) - 1, 190], [x, 300]]} w={i % 4 === 0 ? 5.2 : 3.4} color={C.indigo} seed={340 + i} wob={0.8} />
      ))}
      {[142, 184, 226, 268].map((y, j) => (
        <g key={y}>
          <Stroke pts={[[196, y], [320, y + 2 - j], [446, y]]} w={j === 1 ? 5 : 3.4} color={j === 1 ? C.seal : INK} seed={360 + j} wob={0.7} />
          {warps.map((x, i) => (i % 2 === j % 2 ? <Shape key={i} pts={ell(x, y, 6.6, 6.6, 7, 0.1, i + j * 13)} smooth fill={(i + j) % 3 ? C.bone : C.lantern} w={2.4} reg={[0.8, 0.8]} /> : null))}
        </g>
      ))}
      <Shape pts={[[286, 226], [322, 216], [356, 226], [322, 238]]} smooth fill={C.wood} w={3} />
      <Stroke pts={[[298, 227], [346, 227]]} w={3} color={C.lantern} />
      {/* spools, a basket, and a cat asleep on a cushion */}
      {[[96, 346, C.clothRed], [128, 358, C.clothOchre], [152, 344, C.clothTeal], [500, 352, C.clothTeal]].map(([x, y, col], i) => (
        <g key={i}>
          <Shape pts={box((x as number) - 15, (y as number) - 24, 30, 9)} fill={C.wood} w={2.2} seed={370 + i} />
          <Shape pts={box((x as number) - 11, (y as number) - 15, 22, 26)} fill={col as string} w={2.2} hatch={{ angle: 80, gap: 3.5, w: 0.9 }} hatchOpacity={0.5} seed={380 + i} />
          <Shape pts={box((x as number) - 15, (y as number) + 11, 30, 9)} fill={C.wood} w={2.2} seed={390 + i} />
        </g>
      ))}
      <Shape pts={[[516, 340], [560, 332], [600, 340], [592, 362], [524, 364]]} smooth fill={C.clothRed} w={3} hatch={{ angle: 20, gap: 6, w: 1.1 }} hatchOpacity={0.5} />
      <Shape pts={[[530, 338], [546, 322], [570, 320], [586, 332], [580, 346], [540, 348]]} smooth fill={C.ink3} w={2.8} />
      <Shape pts={[[576, 326], [584, 312], [590, 328]]} fill={C.ink3} w={2} />
      <Shape pts={[[560, 322], [568, 310], [572, 324]]} fill={C.ink3} w={2} />
      <Stroke pts={[[532, 346], [514, 340], [510, 352]]} w={3.4} color={C.ink3} />
      {/* Wren at her loom, Kernel studying a thread */}
      <g transform="translate(40 118) scale(0.46)">
        <Wren />
      </g>
      <g transform="translate(318 244) scale(0.5)">
        <KernelParts mood="think" />
      </g>
    </g>
  );
}

/** The Foundry Docks: a workshop on the quay where prompts are made. */
function Foundry() {
  return (
    <g>
      <rect width="640" height="400" fill="#cfe0dc" />
      <Flecks marks={[[20, 20, 140, 0], [320, 30, 120, 1], [480, 80, 150, 0]]} w={3.4} color={C.paperHi} opacity={0.65} seed={4} />
      {/* back wall of planks, with a harbor window */}
      <Shape pts={box(0, 0, 640, 264)} fill="#c9b78f" w={0} reg={[0, 0]} />
      {Array.from({ length: 16 }, (_, i) => (
        <Stroke key={i} pts={[[i * 42, 0], [i * 42 + 1, 130], [i * 42 - 1, 264]]} w={2.2} opacity={0.55} seed={400 + i} wob={1} />
      ))}
      <Stroke pts={[[0, 264], [320, 268], [640, 264]]} w={8} />
      <Shape pts={[[470, 40], [600, 40], [600, 170], [470, 170]]} fill={C.sky2} w={4} />
      <Shape pts={[[470, 130], [520, 106], [560, 124], [600, 100], [600, 170], [470, 170]]} fill={C.teal} w={2.4} />
      <Stroke pts={[[535, 40], [535, 170]]} w={3.4} />
      <Stroke pts={[[470, 105], [600, 105]]} w={3.4} />
      {/* the sign, hung on chains */}
      <Stroke pts={[[250, 0], [252, 34]]} w={3.4} />
      <Stroke pts={[[420, 0], [418, 34]]} w={3.4} />
      <Shape pts={[[222, 34], [450, 32], [452, 100], [224, 102]]} fill={C.bone} w={4.2} hatch={{ angle: -50, gap: 9, w: 1.2, density: 0.6 }} hatchOpacity={0.35} />
      <text x="338" y="84" textAnchor="middle" fontFamily="'Dela Gothic One', Arial Black, sans-serif" fontSize="42" fill={INK} aria-hidden="true">PROMPT</text>
      {/* gears working together on the wall */}
      <Shape pts={gear(96, 130, 64, 11)} fill={C.teal} w={3.8} hatch={{ angle: -50, gap: 7, w: 1.3 }} hatchOpacity={0.4} />
      <Shape pts={ell(96, 130, 22, 22, 14, 0.02, 410)} smooth fill={C.bone} w={3.2} />
      <Shape pts={gear(176, 66, 36, 8, 0.2)} fill={C.lantern} w={3.4} />
      <Shape pts={ell(176, 66, 11, 11, 10, 0.03, 411)} smooth fill={C.bone} w={2.6} />
      <Shape pts={gear(52, 214, 34, 8, 0.1)} fill={C.tealDeep} w={3.4} />
      <Shape pts={ell(52, 214, 11, 11, 10, 0.03, 412)} smooth fill={C.bone} w={2.6} />
      <Shape pts={gear(566, 224, 44, 9)} fill={C.tealDeep} w={3.6} hatch={{ angle: -50, gap: 7, w: 1.2 }} hatchOpacity={0.4} />
      <Shape pts={ell(566, 224, 14, 14, 10, 0.03, 413)} smooth fill={C.bone} w={2.8} />
      {/* tools on the wall */}
      <Stroke pts={[[196, 140], [200, 220]]} w={6} color={C.woodLight} />
      <Shape pts={[[184, 130], [214, 130], [216, 150], [182, 150]]} fill={C.ink3} w={2.6} />
      <Stroke pts={[[234, 130], [232, 224]]} w={5} color={C.ink3} />
      <Shape pts={[[222, 224], [244, 224], [246, 240], [220, 240]]} fill={C.ink3} w={2.4} />
      <Shape pts={[[266, 138], [350, 138], [354, 152], [264, 152]]} fill={C.bone} w={2.8} hatch={{ angle: 90, gap: 5, w: 1.2 }} hatchOpacity={0.6} />
      <Stroke pts={[[262, 145], [248, 140]]} w={5} color={C.woodLight} />
      {/* floor */}
      <Planks pts={[[0, 264], [640, 264], [640, 400], [0, 400]]} rows={4} seed={420} />
      {/* the forge-side anvil on a stump, with a hot piece glowing */}
      <Shape pts={[[236, 330], [226, 270], [330, 270], [322, 330]]} smooth fill={C.wood} w={3.8} hatch={{ angle: -75, gap: 6, w: 1.2 }} hatchColor={C.woodDeep} hatchOpacity={0.7} />
      <Shape pts={[[216, 270], [226, 252], [306, 250], [352, 238], [348, 256], [310, 264], [326, 270]]} fill={C.ink2} w={3.8} />
      <Stroke pts={[[238, 256], [300, 254]]} w={3} color={C.paper} opacity={0.5} />
      <Shape pts={[[252, 250], [282, 244], [298, 250], [270, 254]]} smooth fill={C.ochre} w={2.4} />
      <Flecks marks={[[266, 232, 12, -90], [284, 234, 10, -60], [250, 236, 10, -120], [300, 238, 9, -40], [236, 242, 8, -150]]} w={2.6} color={C.lantern} />
      {/* barrels, steam pipe with a valve */}
      <Barrel x={528} y={352} w={58} h={74} seed={431} band={C.seal} />
      <Stroke pts={[[612, 264], [612, 150], [576, 130]]} w={11} color={INK} wob={0.6} />
      <Stroke pts={[[612, 264], [612, 150], [576, 130]]} w={6} color={C.tealLight} wob={0.6} />
      <Shape pts={ell(612, 190, 14, 14, 10, 0.04, 432)} smooth fill={C.seal} w={3} />
      <Smoke x={566} y={118} s={0.7} seed={433} />
      <PaperLantern x={410} y={150} s={1.2} seed={434} />
      <Stroke pts={[[410, 0], [410, 124]]} w={2.6} />
      {/* Brannock mid-swing beside the anvil, Kernel cheering on the floor */}
      <g transform="translate(352 158) scale(0.6)">
        <Brannock />
      </g>
      <g transform="translate(26 216) scale(0.52)">
        <KernelParts mood="cheer" />
      </g>
    </g>
  );
}

/** The Beacon: a lighthouse on a cliff, where you learn to see risk and keep your judgment. */
function Beacon() {
  return (
    <g>
      <rect width="640" height="400" fill="#f0d9a8" />
      <rect y="120" width="640" height="150" fill={C.sky2} opacity="0.8" />
      <Flecks marks={[[20, 40, 150, 0], [240, 20, 140, 1], [30, 150, 160, 0], [330, 170, 170, 1], [20, 220, 150, 0]]} w={3.8} color={C.skyHigh} opacity={0.7} seed={5} />
      <Shape pts={ell(120, 110, 52, 52, 18, 0.015, 450)} smooth fill={C.sun} w={3.4} hatch={{ angle: -35, gap: 9, w: 1.4, density: 0.8 }} hatchColor={C.roofRed} hatchOpacity={0.55} />
      <Flecks marks={Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; return [120 + Math.cos(a) * 66, 110 + Math.sin(a) * 66, 14, (a * 180) / Math.PI] as [number, number, number, number]; })} w={3} color={C.sun} opacity={0.7} seed={7} />
      <Cloud x={300} y={64} w={200} seed={451} fill={C.paperHi} />
      <Cloud x={560} y={150} w={150} seed={452} />
      <Gull x={330} y={140} s={0.8} seed={1} />
      <Gull x={370} y={166} s={0.6} seed={2} />
      <Gull x={90} y={236} s={0.5} seed={3} />
      {/* the beam, drawn as streaks */}
      <Hatch pts={[[440, 118], [0, 40], [0, 200]]} color={C.lantern} angle={188} gap={8} w={2.6} opacity={0.95} />
      {/* sea */}
      <rect y="262" width="640" height="138" fill={C.teal} />
      <rect y="338" width="640" height="62" fill={C.tealDeep} />
      <Ripples x0={0} x1={640} y0={274} y1={332} n={26} seed={9} />
      <Ripples x0={0} x1={640} y0={346} y1={396} n={14} seed={10} color={C.tealLight} />
      <Stroke pts={[[0, 263], [200, 265], [440, 262], [640, 264]]} w={5} />
      <Crest x={150} y={310} s={44} seed={11} />
      <Crest x={50} y={372} s={52} flip={-1} seed={12} />
      <Crest x={280} y={360} s={40} seed={13} />
      <Boat x={196} y={300} s={0.6} seed={14} />
      {/* the cliff and the tower */}
      <Shape pts={[[318, 400], [330, 300], [374, 250], [440, 232], [520, 238], [580, 270], [600, 330], [640, 400]]} fill={C.hillNear} w={4} hatch={{ angle: -55, gap: 7, w: 1.4 }} hatchOpacity={0.5} />
      <Stroke pts={[[340, 320], [420, 300], [500, 314], [600, 302]]} w={2.2} opacity={0.55} />
      <Stroke pts={[[330, 360], [440, 344], [540, 358], [620, 346]]} w={2.2} opacity={0.55} />
      <Shape pts={[[430, 238], [506, 238], [490, 66], [446, 66]]} fill={C.bone} w={4.2} />
      <Shape pts={[[444, 128], [494, 128], [498, 164], [440, 164]]} fill={C.seal} w={2.8} />
      <Shape pts={[[438, 184], [498, 184], [502, 224], [434, 224]]} fill={C.seal} w={2.8} />
      <Hatch pts={[[484, 72], [490, 72], [504, 236], [490, 236]]} angle={-60} gap={5} w={1.3} opacity={0.5} />
      <Shape pts={box(436, 62, 62, 11)} fill={INK} w={0} reg={[0, 0]} />
      <Stroke pts={[[436, 62], [468, 56], [500, 62]]} w={2.6} />
      <Shape pts={box(450, 26, 36, 36)} fill={C.lantern} w={3.4} />
      <Stroke pts={[[468, 26], [468, 62]]} w={1.8} opacity={0.8} />
      <Shape pts={[[440, 26], [468, -2], [496, 26]]} fill={C.seal} w={3.4} />
      <Flecks marks={[[350, 316, 12, -50], [376, 308, 10, -30], [330, 336, 11, -70], [610, 340, 11, -120]]} w={3} color={C.seaFoam} />
      {/* the bell on its post, out on the cliff edge */}
      <Stroke pts={[[566, 262], [568, 196]]} w={8} color={C.woodDeep} seed={460} />
      <Stroke pts={[[568, 198], [604, 198]]} w={6} color={C.woodDeep} seed={461} />
      <Shape pts={[[594, 202], [614, 202], [622, 230], [586, 230]]} smooth fill={C.lantern} w={3.2} />
      <Shape pts={ell(604, 234, 4, 4, 6, 0.1, 462)} smooth fill={INK} w={0} reg={[0, 0]} />
      {/* Sedge on watch on the cliff top, Kernel alert beside him */}
      <g transform="translate(318 96) scale(0.5)">
        <Sedge />
      </g>
      <g transform="translate(364 214) scale(0.4)">
        <KernelParts mood="alert" />
      </g>
    </g>
  );
}

const SCENES: Record<PathId, () => JSX.Element> = { understand: Loom, use: Foundry, responsible: Beacon };
const LABELS: Record<PathId, string> = {
  understand: 'An illustration of a weaving hall. Wren the weaver stands by a big wooden loom whose threads and knots form a network, with skeins of dyed thread above, a cat asleep on a cushion, and Kernel the robot studying a thread.',
  use: 'An illustration of a workshop on the docks. Brannock the foundry-master swings a hammer beside an anvil under a sign reading PROMPT, with gears on the wall, crates and barrels, and Kernel cheering on a crate.',
  responsible: 'An illustration of a lighthouse on a cliff at dusk. Sedge the keeper stands watch with a lantern on a pole beside a bell, with Kernel alert at his side, a boat in the beam, and waves breaking below.',
};

export const PathScene = memo(function PathScene({ path, className }: { path: PathId; className?: string }) {
  const Scene = SCENES[path];
  return (
    <svg className={className} viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={LABELS[path]} focusable="false">
      <g filter="url(#rough)">
        <Scene />
      </g>
      <rect width="640" height="400" filter="url(#paint)" opacity="0.34" style={{ mixBlendMode: 'multiply' }} />
      <rect width="640" height="400" filter="url(#grain)" opacity="0.5" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
});
