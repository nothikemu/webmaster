/**
 * Illustration values. These mirror the tokens in styles/tokens.css (SVG presentation attributes cannot read CSS variables
 * in every browser). Illustration only: text colours always come from the CSS tokens, which are contrast-checked.
 */
export const INK = '#17181d';

export const C = {
  ink: '#17181d',
  graphite2: '#44454d',
  graphite3: '#7a7b83',
  bone: '#f1ece0',
  boneHi: '#f9f6ee',
  boneLo: '#e6dfcf',
  boneLine: '#c9bfa6',
  cobalt: '#2038c4',
  cobaltLo: '#1a2d9e',
  cobaltHi: '#9aabff',
  cobaltWash: '#dde2f5',
  vermilion: '#d8421d',
  vermilionLo: '#a52f0e',
  vermilionHi: '#ff8f6d',
  vermilionWash: '#f4dcd1',
  ochre: '#c78a0f',
  ochreLo: '#7a5300',
  ochreHi: '#f2bb3d',
  ochreWash: '#f0e3c0',
  night: '#14151a',
  night2: '#1e2027',
  nightLine: '#3a3c46',
  onNight: '#f6f2e8',
} as const;

export type ModuleHue = 'foundations' | 'synthesis' | 'ethics';
/** Each module has one accent: cobalt for structure, vermilion for language, ochre for caution. */
export const HUE: Record<ModuleHue, { main: string; lo: string; hi: string; wash: string }> = {
  foundations: { main: C.cobalt, lo: C.cobaltLo, hi: C.cobaltHi, wash: C.cobaltWash },
  synthesis: { main: C.vermilion, lo: C.vermilionLo, hi: C.vermilionHi, wash: C.vermilionWash },
  ethics: { main: C.ochre, lo: C.ochreLo, hi: C.ochreHi, wash: C.ochreWash },
};
