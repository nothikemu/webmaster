import { C } from './palette';
import { KernelParts } from './Kernel';
import type { PathId } from '@/content/types';

const OL = { stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
const OL2 = { stroke: C.ink, strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

function gearPath(cx: number, cy: number, r: number, teeth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / (teeth * 2);
  for (let i = 0; i < teeth * 2; i++) {
    const rad = i % 2 ? r * 0.78 : r;
    const a0 = i * step - step * 0.32;
    const a1 = i * step + step * 0.32;
    pts.push(`${cx + Math.cos(a0) * rad},${cy + Math.sin(a0) * rad}`, `${cx + Math.cos(a1) * rad},${cy + Math.sin(a1) * rad}`);
  }
  return `M${pts.join('L')}Z`;
}

function Loom() {
  const warps = Array.from({ length: 11 }, (_, i) => 210 + i * 24);
  return (
    <>
      <rect width="640" height="400" fill="#d3d6e4" />
      <rect y="250" width="640" height="150" fill={C.paperLo} />
      <path d="M0 250 H640" stroke={C.ink} strokeWidth="3.5" />
      {/* window onto hills */}
      <path d="M40 250 V110 a70 70 0 0 1 140 0 V250 Z" fill={C.sky1} {...OL} />
      <path d="M40 250 V200 L90 168 L130 196 L180 160 V250 Z" fill={C.hillFar} {...OL2} />
      <circle cx="132" cy="120" r="22" fill={C.sun} />
      {/* loom frame */}
      <rect x="176" y="46" width="288" height="22" fill={C.wood} {...OL} />
      <rect x="176" y="300" width="288" height="22" fill={C.wood} {...OL} />
      <rect x="168" y="46" width="24" height="300" fill={C.woodDeep} {...OL} />
      <rect x="448" y="46" width="24" height="300" fill={C.woodDeep} {...OL} />
      {/* warp threads with a woven band: a network made of cloth */}
      {warps.map((x, i) => (
        <path key={i} d={`M${x} 68 V300`} stroke={C.indigo} strokeWidth={i % 3 === 0 ? 6 : 4} strokeLinecap="round" />
      ))}
      {[150, 190, 230].map((y, r) => (
        <g key={y}>
          <path d={`M200 ${y} H440`} stroke={r === 1 ? C.seal : C.ink} strokeWidth="5" strokeLinecap="round" />
          {warps.map((x, i) => (i % 2 === r % 2 ? <circle key={i} cx={x} cy={y} r="7" fill={C.paperHi} stroke={C.ink} strokeWidth="2.5" /> : null))}
        </g>
      ))}
      <path d="M200 110 H440" stroke={C.ink} strokeWidth="2.5" strokeDasharray="3 10" strokeLinecap="round" />
      {/* shuttle */}
      <g transform="translate(330 262) rotate(-8)">
        <path d="M-34 0 Q0 -16 34 0 Q0 16 -34 0 Z" fill={C.wood} {...OL} />
        <path d="M-20 0 H20" stroke={C.lantern} strokeWidth="4" strokeLinecap="round" />
      </g>
      {/* spools */}
      {[
        [90, 338, C.seal],
        [134, 352, C.lantern],
        [520, 346, C.teal],
      ].map(([x, y, col], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect x="-18" y="-28" width="36" height="12" fill={C.wood} {...OL2} />
          <rect x="-14" y="-16" width="28" height="30" fill={col as string} {...OL2} />
          <rect x="-18" y="14" width="36" height="12" fill={C.wood} {...OL2} />
          <rect x="-14" y="-16" width="28" height="30" fill="url(#tone-fine)" opacity="0.3" />
        </g>
      ))}
      {/* lantern */}
      <path d="M560 0 V66" stroke={C.ink} strokeWidth="3" />
      <ellipse cx="560" cy="92" rx="22" ry="28" fill={C.lantern} {...OL} />
      <path d="M538 92 H582 M560 64 V120" stroke={C.ink} strokeWidth="2" opacity="0.5" />
      <g transform="translate(528 196) scale(0.62)">
        <KernelParts mood="think" />
      </g>
    </>
  );
}

function Foundry() {
  return (
    <>
      <rect width="640" height="400" fill="#cfe0dc" />
      <rect y="262" width="640" height="138" fill={C.wood} />
      <path d="M0 262 H640" stroke={C.ink} strokeWidth="3.5" />
      <path d="M0 300 H640 M0 340 H640 M0 380 H640" stroke={C.ink} strokeWidth="2" opacity="0.4" />
      {/* hanging sign */}
      <path d="M280 0 V40 M440 0 V40" stroke={C.ink} strokeWidth="3" />
      <rect x="236" y="40" width="244" height="66" fill={C.paperHi} {...OL} />
      <rect x="236" y="40" width="244" height="66" fill="url(#tone-fine)" opacity="0.18" />
      <text x="358" y="86" textAnchor="middle" fontFamily="'Dela Gothic One', Arial Black, sans-serif" fontSize="34" fill={C.ink} aria-hidden="true">PROMPT</text>
      {/* big gears */}
      <path d={gearPath(110, 130, 62, 10)} fill={C.teal} {...OL} />
      <circle cx="110" cy="130" r="20" fill={C.paperHi} {...OL} />
      <path d={gearPath(190, 76, 36, 8)} fill={C.lantern} {...OL} />
      <circle cx="190" cy="76" r="11" fill={C.paperHi} {...OL2} />
      <path d={gearPath(560, 120, 50, 9)} fill={C.tealDeep} {...OL} />
      <circle cx="560" cy="120" r="16" fill={C.paperHi} {...OL} />
      {/* workbench with anvil and tools */}
      <rect x="170" y="238" width="300" height="26" fill={C.woodDeep} {...OL} />
      <rect x="190" y="264" width="22" height="92" fill={C.woodDeep} {...OL} />
      <rect x="428" y="264" width="22" height="92" fill={C.woodDeep} {...OL} />
      <path d="M262 238 V222 H400 Q420 222 424 206 L444 206 Q438 238 418 238 Z" fill={C.ink2} {...OL} />
      <path d="M300 222 H372" stroke={C.paperHi} strokeWidth="3" opacity="0.4" strokeLinecap="round" />
      <g transform="translate(206 206) rotate(-30)">
        <rect x="0" y="0" width="14" height="52" fill={C.wood} {...OL2} />
        <rect x="-16" y="-14" width="46" height="22" fill={C.ink3} {...OL2} />
      </g>
      <path d="M440 240 l10 -34 q12 -6 22 4 l-6 8 l-6 22" fill={C.lantern} {...OL2} />
      {/* steam */}
      <circle cx="536" cy="232" r="14" fill={C.paperHi} {...OL2} />
      <circle cx="552" cy="204" r="20" fill={C.paperHi} {...OL2} />
      <circle cx="580" cy="168" r="26" fill={C.paperLo} {...OL2} />
      <rect x="520" y="240" width="40" height="110" fill={C.ink3} {...OL} />
      <g transform="translate(30 168) scale(0.66)">
        <KernelParts mood="cheer" />
      </g>
    </>
  );
}

function Beacon() {
  return (
    <>
      <rect width="640" height="400" fill="#f1dcae" />
      <rect y="150" width="640" height="130" fill={C.sky2} opacity="0.7" />
      <circle cx="120" cy="120" r="46" fill={C.sun} />
      <polygon points="438,118 0,40 0,196" fill={C.lantern} opacity="0.4" />
      {/* sea */}
      <rect y="262" width="640" height="138" fill={C.teal} />
      <rect y="262" width="640" height="138" fill="url(#waves)" />
      <path d="M0 262 H640" stroke={C.ink} strokeWidth="3.5" />
      <rect y="340" width="640" height="60" fill={C.tealDeep} />
      <rect y="340" width="640" height="60" fill="url(#waves-ink)" opacity="0.5" />
      {/* rock and tower */}
      <path d="M340 300 Q380 232 430 220 L506 220 Q556 240 590 300 V340 H340 Z" fill={C.hillNear} {...OL} />
      <path d="M340 300 Q360 260 390 244 L410 300 Z" fill="url(#tone)" opacity="0.3" />
      <polygon points="436,222 500,222 486,70 450,70" fill={C.paperHi} {...OL} />
      <polygon points="447,120 489,120 493,160 443,160" fill={C.seal} stroke={C.ink} strokeWidth="2.5" />
      <polygon points="440,176 496,176 499,214 437,214" fill={C.seal} stroke={C.ink} strokeWidth="2.5" />
      <rect x="440" y="66" width="56" height="10" fill={C.ink} />
      <rect x="452" y="30" width="32" height="36" fill={C.lantern} {...OL} />
      <path d="M440 30 H496 L468 4 Z" fill={C.seal} {...OL} />
      {/* boat in the beam */}
      <g transform="translate(200 300) scale(0.7)">
        <path d="M-70 0 H70 L50 26 H-48 Z" fill={C.seal} {...OL} />
        <path d="M0 0 V-96" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
        <path d="M6 -90 Q56 -50 50 -8 H6 Z" fill={C.paperHi} {...OL} />
      </g>
      {/* bell post */}
      <rect x="30" y="226" width="10" height="110" fill={C.woodDeep} {...OL2} />
      <path d="M35 230 H92" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
      <path d="M92 232 V244 Q70 246 70 270 H114 Q114 246 92 244" fill={C.lantern} {...OL} />
      <circle cx="92" cy="274" r="5" fill={C.ink} />
      <g transform="translate(96 214) scale(0.56)">
        <KernelParts mood="alert" />
      </g>
    </>
  );
}

const SCENES: Record<PathId, () => JSX.Element> = { understand: Loom, use: Foundry, responsible: Beacon };
const LABELS: Record<PathId, string> = {
  understand: 'An illustration of a weaving hall. Threads on a wooden loom form a net of knots, and a small robot studies them.',
  use: 'An illustration of a workshop on the docks with gears, an anvil, a sign reading PROMPT, and a cheering robot.',
  responsible: 'An illustration of a lighthouse on a rock sending a beam over the sea, with a small robot on watch beside a bell.',
};

export function PathScene({ path, className }: { path: PathId; className?: string }) {
  const Scene = SCENES[path];
  return (
    <svg className={className} viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label={LABELS[path]} focusable="false">
      <Scene />
    </svg>
  );
}
