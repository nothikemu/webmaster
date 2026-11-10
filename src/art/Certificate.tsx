import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Shape, Stroke } from './Draw';
import { ell, type Pt } from './ink';
import { Lettering, WaxSeal } from './kit';
import { rng } from '@/widgets/logic/random';

/** A brushed corner flourish for the certificate. Drawn for the top-left corner; the other three are mirrored in CSS. */
export const CornerFlourish = memo(function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 110 110" aria-hidden="true" focusable="false">
      <Stroke pts={[[8, 104], [8, 40], [14, 18], [40, 8], [104, 8]]} w={5} seed={801} />
      <Stroke pts={[[20, 96], [20, 46], [26, 28], [46, 20], [96, 20]]} w={2} seed={802} />
      <Stroke pts={[[20, 46], [34, 52], [44, 44], [40, 32], [30, 34]]} w={3} color={C.seal} seed={803} />
      <Shape pts={ell(14, 14, 5, 5, 7, 0.1, 804)} smooth fill={C.seal} w={1.6} />
      <Flecks marks={[[58, 14, 10, 0], [76, 14, 6, 0], [14, 58, 10, 90], [14, 76, 6, 90]]} w={2.4} seed={805} />
    </svg>
  );
});

/** A signature: a quick, looping pen line that is different for every name but always the same for the same name. */
export const Signature = memo(function Signature({ name, className }: { name: string; className?: string }) {
  let seed = 7;
  for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  const pts: Pt[] = [[8, 30]];
  const loops = 5 + Math.floor(r() * 3);
  for (let i = 1; i <= loops; i++) {
    const x = 8 + (i * 120) / (loops + 1);
    pts.push([x - 6 + r() * 6, 10 + r() * 10]);
    pts.push([x + 2 + r() * 6, 30 + r() * 8]);
  }
  pts.push([138, 20 + r() * 8]);
  return (
    <svg className={className} viewBox="0 0 150 46" aria-hidden="true" focusable="false">
      <Stroke pts={pts} w={2.4} seed={seed} taper={0.12} />
      <Stroke pts={[[10, 40], [70, 37], [140, 40]]} w={1.6} seed={seed + 1} opacity={0.7} />
    </svg>
  );
});

/** The seal on the certificate: red wax on two ribbon tails, pressed with the score. */
export const CertSeal = memo(function CertSeal({ score, className }: { score: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 150 176" aria-hidden="true" focusable="false">
      <Shape pts={[[50, 96], [34, 168], [54, 154], [70, 170], [74, 100]]} fill={C.indigo} w={2.6} seed={811} hatch={{ angle: -60, gap: 5, w: 1 }} hatchOpacity={0.5} />
      <Shape pts={[[78, 100], [84, 170], [98, 154], [118, 166], [100, 96]]} fill={C.teal} w={2.6} seed={812} hatch={{ angle: -60, gap: 5, w: 1 }} hatchOpacity={0.5} />
      <g transform="translate(8 6)">
        <Shape pts={ell(75, 70, 60, 60, 18, 0.07, 813)} smooth fill={INK} w={0} reg={[0, 0]} />
      </g>
      <WaxSeal x={75} y={70} r={60} seed={814} />
      <Shape pts={ell(75, 70, 32, 32, 14, 0.03, 815)} smooth fill={C.seal} w={0} reg={[0, 0]} />
      <Lettering x={75} y={64} size={15} fill={C.bone} spacing={0.14}>
        PASSED
      </Lettering>
      <text x={75} y={92} fontFamily="'Dela Gothic One', sans-serif" fontSize={26} fill={C.bone} textAnchor="middle">
        {score}%
      </text>
    </svg>
  );
});
