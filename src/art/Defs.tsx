import { C } from './palette';

/**
 * Shared SVG definitions, mounted once at the root of the app. Illustrations and plots reference these by id.
 *  #hatch  diagonal hatching, for the "second class" in two-colour plots so they never rely on colour alone
 *  #tone   a fine dot screen
 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="9" height="9" fill="none" />
          <path d="M0 0v9" stroke={C.ink} strokeWidth="2" />
        </pattern>
        <pattern id="tone" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="3.5" cy="3.5" r="1.1" fill={C.ink} />
        </pattern>
      </defs>
    </svg>
  );
}
