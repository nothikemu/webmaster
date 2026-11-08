/**
 * Lesson R1: a hiring screener "trained on past hires". The weights below are what such a model could plausibly
 * have learned from a biased history: it rewards a rowing club and one neighborhood. Switching features off shows
 * how bias travels through proxies. All people here are invented.
 */
export type Feature = 'skill' | 'exp' | 'club' | 'zip';

export interface Applicant {
  id: string;
  zip: 'A' | 'B';
  skill: number;
  exp: number;
  club: boolean;
}

export const APPLICANTS: readonly Applicant[] = [
  { id: 'a1', zip: 'A', skill: 82, exp: 8, club: true },
  { id: 'a2', zip: 'A', skill: 71, exp: 7, club: true },
  { id: 'a3', zip: 'A', skill: 64, exp: 6, club: true },
  { id: 'a4', zip: 'A', skill: 58, exp: 6, club: true },
  { id: 'a5', zip: 'A', skill: 52, exp: 5, club: true },
  { id: 'a6', zip: 'A', skill: 47, exp: 5, club: false },
  { id: 'b1', zip: 'B', skill: 79, exp: 8, club: false },
  { id: 'b2', zip: 'B', skill: 74, exp: 7, club: false },
  { id: 'b3', zip: 'B', skill: 66, exp: 7, club: false },
  { id: 'b4', zip: 'B', skill: 60, exp: 6, club: false },
  { id: 'b5', zip: 'B', skill: 55, exp: 5, club: false },
  { id: 'b6', zip: 'B', skill: 49, exp: 5, club: true },
];

/** What the "trained" model weights each feature. Club and neighborhood carry the old bias. */
export const WEIGHTS: Record<Feature, number> = { skill: 0.5, exp: 3, club: 25, zip: 30 };
export const FEATURE_LABEL: Record<Feature, string> = {
  skill: 'Skills test score',
  exp: 'Years of experience',
  club: 'Member of the rowing club',
  zip: 'Lives in neighborhood A',
};

export const PICKS = 6;

export function scoreOf(a: Applicant, on: ReadonlySet<Feature>): number {
  let s = 0;
  if (on.has('skill')) s += WEIGHTS.skill * a.skill;
  if (on.has('exp')) s += WEIGHTS.exp * a.exp;
  if (on.has('club') && a.club) s += WEIGHTS.club;
  if (on.has('zip') && a.zip === 'A') s += WEIGHTS.zip;
  return s;
}

export interface Audit {
  selected: Applicant[];
  rateA: number;
  rateB: number;
  gap: number;
  /** How many of the six best by skills test the model picked. */
  qualified: number;
  score: number;
}

export function audit(on: ReadonlySet<Feature>): Audit {
  const ranked = [...APPLICANTS].sort((a, b) => scoreOf(b, on) - scoreOf(a, on) || a.id.localeCompare(b.id));
  const selected = ranked.slice(0, PICKS);
  const perZip = (z: 'A' | 'B') => APPLICANTS.filter((a) => a.zip === z).length;
  const rateA = Math.round((selected.filter((a) => a.zip === 'A').length / perZip('A')) * 100);
  const rateB = Math.round((selected.filter((a) => a.zip === 'B').length / perZip('B')) * 100);
  const gap = Math.abs(rateA - rateB);
  const bestBySkill = [...APPLICANTS].sort((a, b) => b.skill - a.skill).slice(0, PICKS);
  const qualified = bestBySkill.filter((b) => selected.some((s) => s.id === b.id)).length;
  const score = Math.max(0, Math.min(100, Math.round(100 - gap * 0.9 - (PICKS - qualified) * 10)));
  return { selected, rateA, rateB, gap, qualified, score };
}
