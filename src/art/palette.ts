/**
 * Illustration colours. These mirror the tokens in styles/tokens.css (SVG presentation attributes cannot read CSS variables
 * in every browser). Illustration only: text colours always come from the CSS tokens, which are contrast-checked.
 */
/** The warm ink used for every line drawing. Slightly browner than the interface black. */
export const INK = '#231913';

export const C = {
  ink: '#1b1612',
  ink2: '#271f18',
  ink3: '#3a2f25',
  paper: '#eadfc6',
  paperHi: '#f6efdc',
  paperLo: '#d8caa6',
  seal: '#c9341f',
  sun: '#d63a24',
  indigo: '#2f4a7c',
  indigoLo: '#22375d',
  teal: '#1f7c7a',
  tealDeep: '#15595a',
  ochre: '#d98a1b',
  lantern: '#f4bd52',
  sky1: '#f3d3a8',
  sky2: '#eeb485',
  sky3: '#e79a6f',
  hillFar: '#c49b7a',
  hillNear: '#8d6a52',
  wood: '#7a4f33',
  woodDeep: '#4d2f1d',
  straw: '#e3b04e',
  strawDeep: '#b9862c',
  moss: '#5d7a45',
  // shading steps for the illustrations (flat, never gradients)
  skyHigh: '#f7e3bd',
  tealLight: '#58b0a8',
  seaFoam: '#e9f1e4',
  woodLight: '#a8714a',
  roofRed: '#a8372a',
  roofIndigo: '#34406d',
  clothTeal: '#2d8f87',
  clothOchre: '#e0a02e',
  clothRed: '#cf4a33',
  skinDeep: '#9a5f3c',
  skinTan: '#d9a066',
  skinPale: '#f0d2b0',
  hairGrey: '#cfc8bb',
  bone: '#efe6d0',
} as const;

export type PathHueName = 'understand' | 'use' | 'responsible';
export const HUE: Record<PathHueName, { main: string; deep: string; light: string }> = {
  understand: { main: C.indigo, deep: C.indigoLo, light: '#9db5e6' },
  use: { main: C.teal, deep: C.tealDeep, light: '#62d1cb' },
  responsible: { main: C.ochre, deep: '#8f5a0a', light: C.lantern },
};
