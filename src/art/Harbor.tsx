import { C } from './palette';
import { KernelParts } from './Kernel';

const OL = { stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const OL2 = { stroke: C.ink, strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

/** A curved pagoda-style roof centred on x, sitting on baseline y. */
function Roof({ x, y, w, h, fill = C.ink3 }: { x: number; y: number; w: number; h: number; fill?: string }) {
  const l = x - w / 2;
  const r = x + w / 2;
  return (
    <g>
      <path d={`M${l - 8} ${y} Q${x - w / 4} ${y - h * 0.12} ${x} ${y - h} Q${x + w / 4} ${y - h * 0.12} ${r + 8} ${y} Z`} fill={fill} {...OL} />
      <path d={`M${l + 6} ${y - 4} Q${x - w / 4} ${y - h * 0.16} ${x - 2} ${y - h + 8}`} fill="none" stroke={C.paperHi} strokeWidth="2" opacity="0.35" strokeLinecap="round" />
      <rect x={l - 4} y={y} width={w + 8} height="7" fill={C.ink} />
    </g>
  );
}

function House({ x, y, s = 1, lit = true }: { x: number; y: number; s?: number; lit?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-46" y="-34" width="92" height="64" fill={C.paperLo} {...OL} />
      <rect x="-46" y="-34" width="92" height="64" fill="url(#tone-fine)" opacity="0.28" />
      <path d="M-46 -34 H46 M0 -34 V30" stroke={C.ink} strokeWidth="2.5" opacity="0.7" />
      <rect x="-30" y="-16" width="20" height="22" fill={lit ? C.lantern : C.ink3} {...OL2} />
      <rect x="12" y="-16" width="20" height="22" fill={lit ? C.lantern : C.ink3} {...OL2} />
      <rect x="-9" y="8" width="18" height="22" fill={C.woodDeep} {...OL2} />
      <Roof x={0} y={-34} w={104} h={52} />
    </g>
  );
}

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-4" width="8" height="22" fill={C.woodDeep} stroke={C.ink} strokeWidth="2.5" />
      <path d="M0 -62 L22 -26 H8 L28 6 H-28 L-8 -26 H-22 Z" fill={C.ink2} {...OL2} />
    </g>
  );
}

function Boat({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-70 0 H70 L50 26 H-48 Z" fill={C.seal} {...OL} />
      <path d="M-60 8 H62" stroke={C.paperHi} strokeWidth="3" />
      <path d="M0 0 V-120" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      <path d="M6 -112 Q64 -62 56 -8 H6 Z" fill={C.paperHi} {...OL} />
      <path d="M-6 -96 Q-42 -56 -48 -8 H-6 Z" fill={C.paperLo} {...OL} />
      <path d="M6 -112 Q64 -62 56 -8 H6 Z" fill="url(#tone-fine)" opacity="0.25" />
    </g>
  );
}

export function Harbor({ className }: { className?: string }) {
  const threads = Array.from({ length: 7 }, (_, i) => 292 + i * 44);
  const wefts = [548, 584, 620];
  const lerp = (x: number, y: number) => {
    // x position on a thread that runs from the ridge (430, 470) to (x0, 650), at height y
    const t = (y - 470) / (650 - 470);
    return 430 + (x - 430) * t;
  };
  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMax slice"
      role="img"
      aria-label="An illustrated harbor town at dusk: a workshop with a tall crane, a weaving hall on a small island with threads strung from its roof, and a lighthouse on a rock. A small round robot in a straw hat holds a lantern on the dock."
      focusable="false"
    >
      {/* sky: three flat bands and a sun */}
      <rect width="1600" height="900" fill={C.sky1} />
      <rect y="300" width="1600" height="200" fill={C.sky2} />
      <rect y="470" width="1600" height="190" fill={C.sky3} />
      <circle cx="1010" cy="470" r="236" fill={C.sky2} />
      <circle cx="1010" cy="470" r="200" fill={C.sun} />
      <path d="M1010 270 a200 200 0 0 0 -178 110 a200 200 0 0 0 -22 90 h200z" fill="url(#tone)" opacity="0.16" />
      {/* cloud bars */}
      {[
        [90, 150, 300],
        [380, 225, 170],
        [1150, 130, 380],
        [1330, 222, 230],
        [40, 340, 240],
        [640, 300, 260],
      ].map(([cx, cy, w], i) => (
        <rect key={i} x={cx} y={cy} width={w} height="22" rx="11" fill={C.paperHi} opacity="0.9" />
      ))}
      {/* gulls */}
      <path d="M800 150 q14 -16 28 0 q14 -16 28 0 M900 205 q10 -12 20 0 q10 -12 20 0 M730 240 q8 -10 16 0 q8 -10 16 0" fill="none" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />

      {/* far mountains */}
      <path d="M520 660 L610 540 L700 585 L810 455 L910 565 L990 525 L1100 600 L1210 485 L1320 560 L1440 465 L1600 560 V660 Z" fill={C.hillFar} {...OL2} />
      <path d="M810 455 L910 565 L860 571 Z M1210 485 L1320 560 L1270 566 Z M1440 465 L1600 560 L1530 566 Z" fill="url(#tone)" opacity="0.22" />
      <path d="M1080 660 L1170 565 L1270 612 L1380 525 L1500 592 L1600 545 V660 Z" fill={C.hillNear} {...OL2} />

      {/* sea */}
      <rect y="640" width="1600" height="260" fill={C.teal} />
      <rect y="640" width="1600" height="260" fill="url(#waves)" />
      <rect y="640" width="1600" height="8" fill={C.ink} />
      <rect y="800" width="1600" height="100" fill={C.tealDeep} />
      <rect y="800" width="1600" height="100" fill="url(#waves-ink)" opacity="0.5" />

      {/* left: the town on its hill */}
      <path d="M0 520 Q220 452 430 498 Q620 538 770 610 V672 H0 Z" fill={C.hillNear} {...OL} />
      <path d="M0 560 Q150 520 260 556 Q160 600 0 620 Z" fill="url(#tone)" opacity="0.22" />
      <Pine x={60} y={560} s={1.3} />
      <Pine x={118} y={576} s={0.9} />
      <Pine x={700} y={600} s={1.1} />
      <House x={198} y={560} s={1} />
      <House x={330} y={590} s={0.85} lit={false} />
      <House x={470} y={578} s={0.9} />
      <House x={640} y={610} s={0.8} lit={false} />
      <House x={110} y={612} s={0.75} lit={false} />

      {/* lighthouse on its rock, far right */}
      <g transform="translate(70 0)">
        <polygon points="1360,384 880,310 880,440" fill={C.lantern} opacity="0.3" />
        <path d="M1240 660 Q1290 568 1346 548 L1428 548 Q1484 572 1530 660 Z" fill={C.hillNear} {...OL} />
        <path d="M1240 660 Q1270 600 1300 576 L1330 660 Z" fill="url(#tone)" opacity="0.3" />
        <polygon points="1352,548 1408,548 1396,400 1364,400" fill={C.paperHi} {...OL} />
        <polygon points="1360.7,440 1399.3,440 1402.6,480 1357.4,480" fill={C.seal} stroke={C.ink} strokeWidth="2.5" />
        <polygon points="1355.7,500 1404.3,500 1407.6,540 1352.4,540" fill={C.seal} stroke={C.ink} strokeWidth="2.5" />
        <rect x="1346" y="396" width="68" height="10" fill={C.ink} />
        <rect x="1362" y="366" width="36" height="30" fill={C.lantern} {...OL} />
        <path d="M1352 366 H1408 L1380 338 Z" fill={C.seal} {...OL} />
        <path d="M1380 338 V324" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* the Loom House on its own small island: threads strung from the ridge into a woven net */}
      <path d="M970 664 Q1000 638 1050 642 L1190 642 Q1250 642 1274 676 V694 H970 Z" fill={C.hillNear} {...OL} />
      <path d="M970 664 Q990 650 1020 648 L1040 694 H970 Z" fill="url(#tone)" opacity="0.3" />
      <g transform="translate(768 135) scale(0.8)">
        <rect x="300" y="548" width="260" height="84" fill={C.paperLo} {...OL} />
        <rect x="300" y="548" width="260" height="84" fill="url(#tone-fine)" opacity="0.22" />
        <Roof x={430} y={548} w={300} h={78} fill={C.indigoLo} />
        <Roof x={430} y={494} w={150} h={52} fill={C.indigo} />
        {threads.map((x0, i) => (
          <path key={i} d={`M430 470 L${x0} 650`} stroke={C.indigo} strokeWidth={i === 3 ? 7 : 5} strokeLinecap="round" opacity="0.95" />
        ))}
        {wefts.map((y) => (
          <g key={y}>
            <path d={`M${lerp(threads[0]!, y)} ${y} L${lerp(threads[6]!, y)} ${y}`} stroke={C.ink} strokeWidth="3" opacity="0.8" />
            {threads.map((x0, i) => (
              <circle key={i} cx={lerp(x0, y)} cy={y} r="7.5" fill={i % 2 ? C.lantern : C.paperHi} stroke={C.ink} strokeWidth="3" />
            ))}
          </g>
        ))}
        <circle cx="430" cy="470" r="10" fill={C.seal} {...OL2} />
        <rect x="415" y="598" width="30" height="34" fill={C.woodDeep} {...OL2} />
      </g>

      {/* Foundry quay: workshop, chimney, crane */}
      <g transform="translate(166 141) scale(0.78)">
        <rect x="676" y="654" width="346" height="22" fill={C.wood} {...OL} />
        <path d="M700 654 V676 M760 654 V676 M820 654 V676 M880 654 V676 M940 654 V676 M1000 654 V676" stroke={C.ink} strokeWidth="2" opacity="0.5" />
        <rect x="704" y="590" width="200" height="64" fill={C.paperLo} {...OL} />
        <path d="M704 612 H904 M756 590 V654 M852 590 V654" stroke={C.ink} strokeWidth="2.5" opacity="0.7" />
        <rect x="718" y="620" width="30" height="34" fill={C.tealDeep} {...OL2} />
        <rect x="764" y="606" width="36" height="26" fill={C.lantern} {...OL2} />
        <path d="M690 590 L804 540 L918 590 Z" fill={C.tealDeep} {...OL} />
        <rect x="866" y="498" width="30" height="86" fill={C.ink2} {...OL} />
        <circle cx="884" cy="478" r="19" fill={C.paperHi} {...OL2} />
        <circle cx="902" cy="444" r="26" fill={C.paperHi} {...OL2} />
        <circle cx="940" cy="404" r="34" fill={C.paperLo} {...OL2} />
        <path d="M938 654 V398 M966 654 V398 M938 440 L966 398 M938 490 L966 440 M938 540 L966 490 M938 590 L966 540 M938 640 L966 590" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M936 408 L1130 458" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
        <path d="M1096 449 V548" stroke={C.ink} strokeWidth="3" />
        <rect x="1070" y="548" width="52" height="44" fill={C.wood} {...OL} />
        <path d="M1070 548 L1122 592 M1122 548 L1070 592" stroke={C.ink} strokeWidth="2.5" opacity="0.6" />
      </g>

      {/* boats */}
      <Boat x={560} y={738} s={0.75} />
      <Boat x={880} y={745} s={0.5} />

      {/* foreground dock on the right, with the guide */}
      <path d="M730 772 H1600 V900 H640 Z" fill={C.wood} {...OL} />
      <path d="M690 806 H1600 M664 840 H1600 M650 872 H1600" stroke={C.ink} strokeWidth="2.5" opacity="0.55" />
      <path d="M840 772 V900 M990 772 V900 M1140 772 V900 M1290 772 V900 M1440 772 V900" stroke={C.ink} strokeWidth="2" opacity="0.28" />
      <rect x="730" y="772" width="870" height="10" fill={C.woodDeep} />
      {/* bollard and rope */}
      <rect x="770" y="744" width="30" height="40" rx="6" fill={C.ink2} {...OL} />
      <path d="M785 752 Q850 792 900 774 T1000 802" fill="none" stroke={C.strawDeep} strokeWidth="7" strokeLinecap="round" />
      <path d="M785 752 Q850 792 900 774 T1000 802" fill="none" stroke={C.straw} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 8" />
      {/* crates */}
      <rect x="1100" y="724" width="170" height="86" fill={C.wood} {...OL} />
      <rect x="1126" y="670" width="64" height="54" fill={C.wood} {...OL} />
      <path d="M1126 670 L1190 724" stroke={C.ink} strokeWidth="3" opacity="0.5" />
      <path d="M1100 760 H1270 M1150 724 V810 M1220 724 V810" stroke={C.ink} strokeWidth="3" opacity="0.5" />
      <rect x="1100" y="724" width="170" height="86" fill="url(#tone-fine)" opacity="0.2" />
      {/* Kernel, the guide */}
      <g transform="translate(1296 586) scale(0.88)">
        <KernelParts mood="idle" />
      </g>
    </svg>
  );
}
