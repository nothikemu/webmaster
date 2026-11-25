/**
 * The recurring mark of Parameter: a tuned line. A hand-inked curve with a small ring on it, the handle of the one number you can turn.
 * It is the logo, the divider between sections, and the thumb of the explainers' sliders.
 */
import { useMemo } from 'react';
import { type Pt, spline, strokeD, wobble } from '../ink';
import { Round } from './ink';

const pathFor = (pts: Pt[], w: number, seed: number, taper = 0.3): string => strokeD(wobble(spline(pts, false, 8), 0.5, seed), w, seed, taper);

/** The logo mark: a line that rises through a ring. */
export function LogoMark({ size = 36 }: { size?: number }) {
  const d = useMemo(() => pathFor([[1.5, 22], [10, 21], [18, 17.5], [26, 9], [34, 6.5], [42.5, 6]], 2.4, 11), []);
  return (
    <svg viewBox="0 0 46 28" width={(size * 46) / 28} height={size} aria-hidden="true" focusable="false" className="logo-mark">
      <path d={d} fill="currentColor" />
      <g style={{ color: 'var(--vermilion)' }}>
        <Round cx={22.5} cy={13.5} r={5} w={2.4} color="currentColor" fill="var(--bone-hi)" seed={4} irr={0.06} />
      </g>
    </svg>
  );
}

/** A section divider: a long tuned line with its handle somewhere along it. `at` is 0 to 1. */
export function TuneRule({ at = 0.35, className }: { at?: number; className?: string }) {
  const W = 1200;
  const d = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * W;
      pts.push([x, 14 + Math.sin(i * 0.9 + 0.4) * 5 * (1 - Math.abs(i - 6) / 8)]);
    }
    return pathFor(pts, 1.8, 29, 0.35);
  }, []);
  const x = at * W;
  return (
    <svg viewBox={`0 0 ${W} 28`} preserveAspectRatio="none" className={`tune-rule${className ? ` ${className}` : ''}`} aria-hidden="true" focusable="false">
      <path d={d} fill="currentColor" />
      <g style={{ color: 'var(--vermilion)' }}>
        <Round cx={x} cy={14} r={7} w={2} color="currentColor" fill="var(--bone)" seed={9} irr={0.05} />
      </g>
    </svg>
  );
}
