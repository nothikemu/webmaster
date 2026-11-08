import { C } from './palette';

/**
 * Shared SVG definitions, mounted once at the root of the app. Every illustration references these by id.
 *  #tone    screentone dots (manga-style shading, no gradients)
 *  #hatch   diagonal hatching for shadow and "locked" states
 *  #waves   a traditional overlapping-arc wave pattern
 *  #grain   a very small noise tile for printed-paper texture on large flat areas
 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="tone" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="4.5" cy="4.5" r="2" fill={C.ink} />
        </pattern>
        <pattern id="tone-fine" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3" cy="3" r="1.15" fill={C.ink} />
        </pattern>
        <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="9" height="9" fill="none" />
          <path d="M0 0v9" stroke={C.ink} strokeWidth="2" />
        </pattern>
        <pattern id="waves" width="60" height="30" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={C.paperHi} strokeWidth="2.2" opacity="0.55">
            <path d="M0 30 a30 30 0 0 1 60 0" />
            <path d="M8 30 a22 22 0 0 1 44 0" />
            <path d="M16 30 a14 14 0 0 1 28 0" />
            <path d="M-30 15 a30 30 0 0 1 60 0" />
            <path d="M-22 15 a22 22 0 0 1 44 0" />
            <path d="M-14 15 a14 14 0 0 1 28 0" />
            <path d="M30 15 a30 30 0 0 1 60 0" />
            <path d="M38 15 a22 22 0 0 1 44 0" />
            <path d="M46 15 a14 14 0 0 1 28 0" />
          </g>
        </pattern>
        <pattern id="waves-ink" width="60" height="30" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={C.ink} strokeWidth="2.2" opacity="0.5">
            <path d="M0 30 a30 30 0 0 1 60 0" />
            <path d="M8 30 a22 22 0 0 1 44 0" />
            <path d="M16 30 a14 14 0 0 1 28 0" />
            <path d="M-30 15 a30 30 0 0 1 60 0" />
            <path d="M-22 15 a22 22 0 0 1 44 0" />
            <path d="M-14 15 a14 14 0 0 1 28 0" />
            <path d="M30 15 a30 30 0 0 1 60 0" />
            <path d="M38 15 a22 22 0 0 1 44 0" />
            <path d="M46 15 a14 14 0 0 1 28 0" />
          </g>
        </pattern>
      </defs>
    </svg>
  );
}
