import { C } from './palette';

export type Mood = 'idle' | 'think' | 'cheer' | 'alert';

interface KernelProps {
  mood?: Mood;
  /** Accessible description. Decorative uses leave it empty. */
  label?: string;
  className?: string;
}

const OL = { stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

/**
 * Kernel, the guide: a small round automaton in a woven travelling hat, carrying a lantern.
 * One character, four moods, drawn from the same parts so it always looks like the same person.
 */
export function KernelParts({ mood = 'idle' }: { mood?: Mood }) {
  const cheer = mood === 'cheer';
  const think = mood === 'think';
  const alert = mood === 'alert';
  return (
    <g>
      {/* ground shadow */}
      <ellipse cx="112" cy="268" rx="64" ry="9" fill={C.ink} opacity="0.2" />

      {/* legs and feet */}
      <rect x="80" y="216" width="21" height="38" rx="8" fill={C.ink3} {...OL} />
      <rect x="124" y="216" width="21" height="38" rx="8" fill={C.ink3} {...OL} />
      <ellipse cx="88" cy="258" rx="19" ry="9" fill={C.wood} {...OL} />
      <ellipse cx="136" cy="258" rx="19" ry="9" fill={C.wood} {...OL} />

      {/* torso */}
      <path d="M64 172 Q58 218 82 226 L144 226 Q168 218 162 172 Z" fill={C.teal} {...OL} />
      <rect x="94" y="184" width="36" height="26" rx="4" fill={C.paperHi} stroke={C.ink} strokeWidth="2.5" />
      <path d="M100 192h24M100 199h16" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="112" cy="217" r="5" fill={C.seal} stroke={C.ink} strokeWidth="2" />
      {/* screentone on the shadow side */}
      <path d="M64 172 Q58 218 82 226 L96 226 Q80 210 82 172 Z" fill="url(#tone)" opacity="0.5" />

      {/* arms */}
      {cheer ? (
        <>
          <path d="M66 184 Q40 170 30 140" fill="none" {...OL} strokeWidth={6} />
          <path d="M66 184 Q40 170 30 140" fill="none" stroke={C.paperHi} strokeWidth="2" strokeLinecap="round" />
          <circle cx="29" cy="136" r="10" fill={C.paperHi} {...OL} />
          <path d="M160 184 Q186 170 196 140" fill="none" {...OL} strokeWidth={6} />
          <path d="M160 184 Q186 170 196 140" fill="none" stroke={C.paperHi} strokeWidth="2" strokeLinecap="round" />
          <circle cx="197" cy="136" r="10" fill={C.paperHi} {...OL} />
        </>
      ) : (
        <>
          <path d="M66 186 Q44 204 40 232" fill="none" {...OL} strokeWidth={6} />
          <path d="M66 186 Q44 204 40 232" fill="none" stroke={C.paperHi} strokeWidth="2" strokeLinecap="round" />
          <circle cx="40" cy="236" r="10" fill={C.paperHi} {...OL} />
          {think ? (
            <>
              <path d="M160 186 Q186 190 164 168" fill="none" {...OL} strokeWidth={6} />
              <path d="M160 186 Q186 190 164 168" fill="none" stroke={C.paperHi} strokeWidth="2" strokeLinecap="round" />
              <circle cx="160" cy="166" r="9" fill={C.paperHi} {...OL} />
            </>
          ) : (
            <>
              <path d="M160 186 Q190 192 198 214" fill="none" {...OL} strokeWidth={6} />
              <path d="M160 186 Q190 192 198 214" fill="none" stroke={C.paperHi} strokeWidth="2" strokeLinecap="round" />
              <circle cx="199" cy="218" r="10" fill={C.paperHi} {...OL} />
              {/* lantern */}
              <path d="M199 228 v10" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
              <ellipse cx="199" cy="252" rx="15" ry="18" fill={C.lantern} {...OL} />
              <path d="M184 252 H214 M199 234 V270" stroke={C.ink} strokeWidth="2" opacity="0.55" />
              <rect x="190" y="231" width="18" height="6" rx="2" fill={C.ink} />
              <rect x="192" y="267" width="14" height="5" rx="2" fill={C.ink} />
            </>
          )}
        </>
      )}

      {/* head */}
      <rect x="52" y="94" width="120" height="86" rx="30" fill={C.paperHi} {...OL} />
      <path d="M52 140 Q52 180 82 180 L100 180 Q70 170 70 126 Z" fill="url(#tone)" opacity="0.45" />
      <rect x="64" y="109" width="96" height="54" rx="22" fill={C.ink} />
      {/* ear lugs */}
      <circle cx="50" cy="136" r="9" fill={C.ochre} {...OL} strokeWidth={3} />
      <circle cx="174" cy="136" r="9" fill={C.ochre} {...OL} strokeWidth={3} />
      {/* eyes */}
      <circle cx="91" cy="134" r={alert ? 12 : 10.5} fill={C.paperHi} />
      <circle cx="133" cy="134" r={alert ? 12 : 10.5} fill={C.paperHi} />
      <circle cx={think ? 95 : 91} cy={think ? 130 : 135} r={alert ? 3.5 : 5} fill={C.ink} />
      <circle cx={think ? 137 : 133} cy={think ? 130 : 135} r={alert ? 3.5 : 5} fill={C.ink} />
      {alert ? <path d="M78 116 L102 122 M146 116 L122 122" stroke={C.lantern} strokeWidth="3.5" strokeLinecap="round" /> : null}
      {/* mouth */}
      {cheer ? (
        <path d="M100 148 Q112 164 124 148 Z" fill={C.lantern} stroke={C.lantern} strokeWidth="2" strokeLinejoin="round" />
      ) : alert ? (
        <ellipse cx="112" cy="153" rx="5" ry="6" fill={C.lantern} />
      ) : think ? (
        <path d="M104 152 H122" stroke={C.lantern} strokeWidth="3.5" strokeLinecap="round" />
      ) : (
        <path d="M101 148 Q112 158 123 148" fill="none" stroke={C.lantern} strokeWidth="3.5" strokeLinecap="round" />
      )}
      <circle cx="74" cy="148" r="4" fill={C.seal} opacity="0.9" />
      <circle cx="150" cy="148" r="4" fill={C.seal} opacity="0.9" />

      {/* woven travelling hat */}
      <path d="M113 26 L222 98 Q113 118 4 98 Z" fill={C.straw} {...OL} />
      <path d="M113 26 L222 98 Q190 104 165 106 Q150 62 113 26 Z" fill={C.strawDeep} opacity="0.55" />
      <path d="M113 26 L72 100 M113 26 L113 112 M113 26 L154 104 M113 26 L36 99 M113 26 L190 101" stroke={C.ink} strokeWidth="2" opacity="0.55" fill="none" />
      <path d="M52 78 Q113 94 174 78" fill="none" stroke={C.seal} strokeWidth="5" strokeLinecap="round" />
      <circle cx="113" cy="26" r="6" fill={C.seal} {...OL} strokeWidth={3} />
      {/* chin cord */}
      <path d="M52 101 Q56 150 84 178 M174 101 Q170 150 144 178" fill="none" stroke={C.seal} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="113" cy="184" r="7" fill={C.seal} stroke={C.ink} strokeWidth="2.5" />

      {think ? (
        <g>
          <circle cx="196" cy="70" r="6" fill={C.paperHi} {...OL} strokeWidth={3} />
          <circle cx="210" cy="46" r="9" fill={C.paperHi} {...OL} strokeWidth={3} />
        </g>
      ) : null}
      {alert ? <path d="M200 58 v26 M200 96 v.5" stroke={C.seal} strokeWidth="9" strokeLinecap="round" /> : null}
    </g>
  );
}

/** Stand-alone Kernel, for use outside another illustration. */
export function Kernel({ mood = 'idle', label, className }: KernelProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 230 285"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <KernelParts mood={mood} />
    </svg>
  );
}
