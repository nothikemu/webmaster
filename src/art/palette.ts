/**
 * Illustration values. These mirror the tokens in styles/tokens.css (SVG presentation attributes cannot read CSS variables
 * in every browser). Illustration only: text colours always come from the CSS tokens, which are contrast-checked.
 *
 * The world is strictly monochrome. The names stay the same as in the earlier coloured version (a "teal" is still the sea,
 * "straw" is still the hats) so the drawings keep their structure, but every value is a gray, and the picture is built
 * from value, hatching and screentone instead of hue.
 */
/** The ink used for every line drawing. */
export const INK = '#141414';

export const C = {
  ink: '#0d0d0d',
  ink2: '#171717',
  ink3: '#2a2a2a',
  paper: '#e4e2dd',
  paperHi: '#f3f2ee',
  paperLo: '#cac8c2',
  /** the accent: black. Seals, flags, sashes. */
  seal: '#141414',
  /** the sun is a black stamp on the dusk sky */
  sun: '#1a1a1a',
  indigo: '#2b2b2b',
  indigoLo: '#1d1d1d',
  teal: '#4d4d4d',
  tealDeep: '#2a2a2a',
  ochre: '#8c8c8c',
  lantern: '#f6f4ec',
  sky1: '#d6d4cf',
  sky2: '#b4b2ad',
  sky3: '#8e8c88',
  hillFar: '#9b9994',
  hillNear: '#4d4b48',
  wood: '#5a5854',
  woodDeep: '#2a2926',
  straw: '#c9c7c0',
  strawDeep: '#97958f',
  moss: '#6b6a66',
  // shading steps for the illustrations (flat, never gradients)
  skyHigh: '#ecebe7',
  tealLight: '#8f8f8f',
  seaFoam: '#ebeae6',
  woodLight: '#8b8984',
  roofRed: '#7a7a76',
  roofIndigo: '#3b3b3b',
  clothTeal: '#585858',
  clothOchre: '#b5b3ad',
  clothRed: '#2e2e2e',
  skinDeep: '#6f6d69',
  skinTan: '#a9a7a2',
  skinPale: '#dedcd6',
  hairGrey: '#c4c2bd',
  bone: '#efede8',
} as const;

export type PathHueName = 'understand' | 'use' | 'responsible';
export const HUE: Record<PathHueName, { main: string; deep: string; light: string }> = {
  understand: { main: C.indigo, deep: C.indigoLo, light: '#bdbdbd' },
  use: { main: C.teal, deep: C.tealDeep, light: '#d0d0d0' },
  responsible: { main: C.ochre, deep: '#555555', light: C.lantern },
};
