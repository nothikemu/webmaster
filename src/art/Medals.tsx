import { C } from './palette';

const S = { stroke: C.ink, strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' } as const;

/** The emblem inside each medal, drawn in a 120x120 box. One glyph per real achievement. */
const GLYPHS: Record<string, JSX.Element> = {
  'loom-keeper': (
    <g {...S}>
      <path d="M32 28 H88 M32 92 H88" />
      <path d="M40 28 V92 M52 28 V92 M64 28 V92 M76 28 V92" />
      <path d="M32 50 L44 62 L56 50 L68 62 L80 50 L92 62" stroke={C.seal} strokeWidth="5" />
    </g>
  ),
  'model-explorer': (
    <g {...S}>
      <circle cx="60" cy="60" r="32" />
      <path d="M60 36 L70 60 L60 84 L50 60 Z" fill={C.paperHi} />
      <circle cx="60" cy="60" r="4" fill={C.ink} />
      <path d="M60 20 V28 M60 92 V100 M20 60 H28 M92 60 H100" />
    </g>
  ),
  'prompt-smith': (
    <g {...S}>
      <path d="M30 70 H52 Q56 52 76 50 H96 Q96 66 82 70 L78 84 H44 L40 70" fill={C.paperHi} />
      <path d="M36 92 H86" />
      <path d="M62 30 L66 40 M76 28 L74 40 M48 32 L54 40" stroke={C.seal} />
    </g>
  ),
  'source-hunter': (
    <g {...S}>
      <circle cx="52" cy="52" r="22" fill={C.paperHi} />
      <path d="M68 68 L92 92" strokeWidth="8" />
      <path d="M42 46 H62 M42 54 H58 M42 62 H52" strokeWidth="3.5" />
    </g>
  ),
  'sharp-eye': (
    <g {...S}>
      <path d="M22 62 Q60 24 98 62 Q60 98 22 62 Z" fill={C.paperHi} />
      <circle cx="60" cy="61" r="15" fill={C.ink} />
      <circle cx="55" cy="56" r="5" fill={C.paperHi} stroke="none" />
      <path d="M60 22 V30 M36 30 L40 36 M84 30 L80 36" />
    </g>
  ),
  'fair-hand': (
    <g {...S}>
      <path d="M60 24 V92 M40 92 H80 M28 38 H92" />
      <path d="M28 38 L18 62 H40 Z M92 38 L82 62 H104 Z" fill={C.paperHi} />
      <circle cx="60" cy="24" r="5" fill={C.seal} />
    </g>
  ),
  'lantern-bearer': (
    <g {...S}>
      <path d="M44 34 Q60 14 76 34" />
      <rect x="46" y="34" width="28" height="8" fill={C.ink} />
      <ellipse cx="60" cy="62" rx="20" ry="24" fill={C.lantern} />
      <path d="M40 62 H80 M60 40 V86" strokeWidth="3" />
      <rect x="48" y="86" width="24" height="8" fill={C.ink} />
    </g>
  ),
  fieldwork: (
    <g {...S}>
      <path d="M36 96 V24" />
      <path d="M36 28 H92 L80 44 L92 60 H36" fill={C.seal} />
      <path d="M24 96 H64" />
      <path d="M72 80 q4 -8 8 0 M86 90 q4 -8 8 0" strokeWidth="3.5" />
    </g>
  ),
  'literacy-master': (
    <g {...S}>
      <polygon points="48,92 72,92 68,40 52,40" fill={C.paperHi} />
      <polygon points="53,58 67,58 68,70 52,70" fill={C.seal} strokeWidth="3" />
      <rect x="46" y="32" width="28" height="8" fill={C.ink} />
      <path d="M52 32 H68 L60 18 Z" fill={C.lantern} />
      <path d="M30 100 q8 -8 16 0 t16 0 t16 0 t16 0" strokeWidth="4" />
      <path d="M28 32 L18 24 M92 32 L102 24 M26 46 L14 44 M94 46 L106 44" strokeWidth="3.5" />
    </g>
  ),
};

const HUE_FILL: Record<string, string> = {
  understand: C.indigo,
  use: C.teal,
  responsible: C.ochre,
  all: C.seal,
};

interface MedalProps {
  id: string;
  path: 'understand' | 'use' | 'responsible' | 'all';
  earned: boolean;
  className?: string;
}

/** A medal: chamfered frame, hard offset shadow, one glyph. Locked medals are hatched and dashed, never just greyed. */
export function Medal({ id, path, earned, className }: MedalProps) {
  const frame = 'M30 6 H90 L114 30 V90 L90 114 H30 L6 90 V30 Z';
  const fill = earned ? HUE_FILL[path]! : C.paperLo;
  return (
    <svg className={className} viewBox="0 0 126 126" aria-hidden="true" focusable="false">
      <path d={frame} transform="translate(6 6)" fill={C.ink} />
      <path d={frame} fill={fill} stroke={C.ink} strokeWidth="4.5" strokeLinejoin="round" strokeDasharray={earned ? undefined : '10 7'} />
      {earned ? <path d="M30 12 H90 L108 30 V90 L90 108 H30 L12 90 V30 Z" fill="none" stroke={C.paperHi} strokeWidth="2" opacity="0.7" /> : <path d={frame} fill="url(#hatch)" opacity="0.14" />}
      {earned ? (
        <g>
          <circle cx="60" cy="60" r="38" fill={C.paperHi} opacity="0.28" />
          {GLYPHS[id]}
        </g>
      ) : (
        <g opacity="0.6">
          <rect x="44" y="56" width="32" height="26" fill={C.paperLo} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
          <path d="M50 56 V48 a10 10 0 0 1 20 0 V56" fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
