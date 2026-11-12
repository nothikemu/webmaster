/**
 * Illustrated dividers: the seams between sections, drawn with the same brush as everything else.
 * They are decorative (hidden from assistive technology) and give each change of subject its own small picture.
 */
import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Shape, Stroke } from './Draw';
import { ell, type Pt } from './ink';
import { Crest, Gull } from './props';
import { Anchor, GearWheel, Pennants } from './kit';
import { rng } from '@/widgets/logic/random';

export type DividerKind = 'waves' | 'rope' | 'chain' | 'cogs' | 'rigging';
const W = 1200;
const H = 64;

export const Divider = memo(function Divider({ kind = 'waves', className }: { kind?: DividerKind; className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <g filter="url(#rough)">
        {kind === 'waves' ? (
          <g>
            <Stroke pts={[[0, 56], [200, 52], [420, 58], [640, 53], [860, 58], [1060, 52], [1200, 56]]} w={3.4} seed={1} />
            {[80, 250, 430, 610, 790, 960, 1120].map((x, i) => (
              <Crest key={x} x={x} y={52} s={26 + (i % 3) * 7} flip={i % 2 ? -1 : 1} seed={i + 1} />
            ))}
            <Flecks marks={[[150, 58, 18, 3], [340, 60, 14, -2], [520, 58, 20, 2], [700, 60, 16, -3], [880, 59, 20, 2], [1040, 60, 14, -2]]} w={2} seed={3} />
            <Gull x={560} y={16} s={0.55} seed={2} />
            <Gull x={612} y={26} s={0.38} seed={3} />
          </g>
        ) : null}
        {kind === 'rope' ? (
          <g>
            <Stroke pts={[[0, 14], [300, 40], [600, 22], [900, 42], [1200, 16]]} w={7} seed={4} taper={0.05} />
            <Stroke pts={[[0, 14], [300, 40], [600, 22], [900, 42], [1200, 16]]} w={3} color={C.straw} seed={5} taper={0.05} />
            {[150, 430, 760, 1040].map((x, i) => (
              <Shape key={x} pts={ell(x, 28 + (i % 2) * 6, 7, 6, 8, 0.12, i)} smooth fill={C.straw} w={2.4} />
            ))}
            <Pennants pts={[[0, 14], [300, 40], [600, 22]]} n={7} seed={2} size={13} />
            <Anchor x={760} y={62} s={0.36} seed={3} />
            <Anchor x={1040} y={62} s={0.28} seed={4} />
          </g>
        ) : null}
        {kind === 'chain' ? (
          <g>
            {Array.from({ length: 24 }, (_, i) => (
              <g key={i}>
                <Shape pts={ell(34 + i * 50, 32, 22, 11, 14, 0.03, i)} smooth w={3.6} fill={i % 2 ? C.hairGrey : C.strawDeep} stipple={false} />
                <Shape pts={ell(59 + i * 50, 32, 8, 12, 10, 0.04, i + 40)} smooth w={3} fill={C.ink3} stipple={false} />
              </g>
            ))}
          </g>
        ) : null}
        {kind === 'cogs' ? (
          <g>
            <Stroke pts={[[0, 36], [600, 38], [1200, 36]]} w={2.6} seed={6} opacity={0.6} />
            {Array.from({ length: 11 }, (_, i) => (
              <GearWheel key={i} x={60 + i * 112} y={i % 2 ? 24 : 40} r={i % 3 === 0 ? 26 : 19} teeth={i % 3 === 0 ? 10 : 8} fill={[C.tealLight, C.strawDeep, C.hairGrey][i % 3]!} seed={i + 1} rot={i * 0.2} />
            ))}
          </g>
        ) : null}
        {kind === 'rigging' ? (
          <g>
            <Stroke pts={[[40, 0], [40, 64]]} w={6} seed={7} smooth={false} />
            <Stroke pts={[[1160, 0], [1160, 64]]} w={6} seed={8} smooth={false} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Stroke key={i} pts={[[40, 6 + i * 4], [600, 20 + i * 7], [1160, 6 + i * 4]]} w={1.4 + (i % 2) * 0.6} seed={10 + i} opacity={0.85} />
            ))}
            <Pennants pts={[[40, 8], [600, 20], [1160, 8]]} n={14} seed={3} size={14} />
            {[300, 520, 760, 940].map((x, i) => (
              <Shape key={x} pts={ell(x, 28 + i * 2, 5, 7, 7, 0.1, i)} smooth fill={C.ink3} w={2} />
            ))}
          </g>
        ) : null}
      </g>
    </svg>
  );
});

/**
 * The bottom edge of the hero: a black silhouette of breaking water that the dark strip below rises out of,
 * with white spray flung from the crests. It replaces a straight cut between two sections.
 */
export const InkEdge = memo(function InkEdge({ className }: { className?: string }) {
  const r = rng(11);
  const top: Pt[] = [];
  for (let x = 0; x <= 1600; x += 16) top.push([x, 50 + Math.sin(x / 70) * 8 + Math.sin(x / 23 + 1) * 5 + r() * 5]);
  const d = `M0 90L${top.map((p) => `${p[0]} ${Math.round(p[1] * 10) / 10}`).join('L')}L1600 90Z`;
  const spray: [number, number, number, number][] = [];
  for (let i = 0; i < 46; i++) {
    const p = top[Math.floor(r() * top.length)]!;
    spray.push([p[0] + (r() - 0.5) * 26, p[1] - 4 - r() * 14, 5 + r() * 8, -90 + (r() - 0.5) * 80]);
  }
  return (
    <svg className={className} viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d} fill={INK} />
      <Flecks marks={spray} w={2.2} color={C.paperHi} seed={9} opacity={0.9} />
    </svg>
  );
});
