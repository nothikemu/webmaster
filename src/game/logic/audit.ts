/**
 * The Fairness Audit. Invented scholarship applicants, a "screener" that scores them, and tools to find which traits stand in for district.
 * Merit is known here (in the real world it usually is not, which is why auditing outcomes matters). All people are invented.
 */
import { rng } from '@/widgets/logic/random';

export type Feature = 'grades' | 'essay' | 'device' | 'club' | 'prep';
export type District = 'North' | 'South';

export interface Applicant {
  id: number;
  district: District;
  grades: number;
  essay: number;
  device: 'own' | 'shared';
  club: 'yes' | 'no';
  prep: 'yes' | 'no';
  merit: number;
  qualified: boolean;
}

export interface AuditRound {
  round: 1 | 2 | 3;
  title: string;
  brief: string;
  features: Feature[];
  /** What the trained screener weights each feature. The proxies are the ones carrying the old bias. */
  weights: Record<Feature, number>;
  proxies: Feature[];
  applicants: Applicant[];
  gapMax: number;
  accMin: number;
  reviewMax: number;
}

export const FEATURE_LABEL: Record<Feature, string> = {
  grades: 'Grades',
  essay: 'Essay score',
  device: 'Has own laptop at home',
  club: 'Member of the debate club',
  prep: 'Attended the Saturday prep course',
};

const clip = (v: number) => Math.max(20, Math.min(100, Math.round(v)));

function make(round: 1 | 2 | 3): Applicant[] {
  const rand = rng(4000 + round * 17);
  const gauss = () => {
    const u = Math.max(1e-6, rand());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  /** Exactly round(share * n) true values, in a shuffled order, so the group differences are real and not luck of the draw. */
  const flags = (share: number, n: number): boolean[] => {
    const a = Array.from({ length: n }, (_, i) => i < Math.round(share * n));
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  };
  const share = { device: [0.85, 0.25], club: [0.6, 0.15], prep: [0.7, 0.2] } as const;
  const per = { North: { device: flags(share.device[0], 20), club: flags(share.club[0], 20), prep: flags(share.prep[0], 20) }, South: { device: flags(share.device[1], 20), club: flags(share.club[1], 20), prep: flags(share.prep[1], 20) } };
  // Both districts have the same spread of ability: each South applicant is a near twin of a North one. Any gap in outcomes is the screener's doing.
  const base = Array.from({ length: 20 }, () => ({ g: 70 + gauss() * 11, e: 68 + gauss() * 13 }));
  const out: Applicant[] = [];
  for (let i = 0; i < 40; i++) {
    const district: District = i % 2 === 0 ? 'North' : 'South';
    const j = Math.floor(i / 2);
    const jitter = district === 'South' ? (rand() - 0.5) * 6 : 0;
    const grades = clip(base[j]!.g + jitter);
    const essay = clip(base[j]!.e + jitter);
    const merit = Math.round(0.6 * grades + 0.4 * essay);
    out.push({
      id: i + 1,
      district,
      grades,
      essay,
      device: per[district].device[j] ? 'own' : 'shared',
      club: per[district].club[j] ? 'yes' : 'no',
      prep: per[district].prep[j] ? 'yes' : 'no',
      merit,
      qualified: merit >= 70,
    });
  }
  return out;
}

export const AUDIT_ROUNDS: readonly AuditRound[] = [
  { round: 1, title: 'The laptop', brief: 'The screener never sees a district. It sees grades, an essay score, whether the applicant has a laptop at home, and debate club.', features: ['grades', 'essay', 'device', 'club'], weights: { grades: 1, essay: 0.7, device: 20, club: 1, prep: 0 }, proxies: ['device'], applicants: make(1), gapMax: 15, accMin: 75, reviewMax: 8 },
  { round: 2, title: 'The club', brief: 'A new screener, a new set of applicants. This time the laptop is gone, but there is a club and a prep course.', features: ['grades', 'essay', 'club', 'prep'], weights: { grades: 1, essay: 0.7, device: 0, club: 42, prep: 4 }, proxies: ['club'], applicants: make(2), gapMax: 15, accMin: 75, reviewMax: 8 },
  { round: 3, title: 'Two proxies', brief: 'Everything is on this time, and two of the traits are doing the same quiet job. Fix it with as little human review as you can.', features: ['grades', 'essay', 'device', 'club', 'prep'], weights: { grades: 1, essay: 0.7, device: 14, club: 4, prep: 16 }, proxies: ['device', 'prep'], applicants: make(3), gapMax: 15, accMin: 85, reviewMax: 4 },
];

export interface Config {
  on: ReadonlySet<Feature>;
  review: boolean;
}

export const score = (a: Applicant, r: AuditRound, on: ReadonlySet<Feature>): number => {
  let s = 0;
  if (on.has('grades')) s += r.weights.grades * a.grades;
  if (on.has('essay')) s += r.weights.essay * a.essay;
  if (on.has('device') && a.device === 'own') s += r.weights.device;
  if (on.has('club') && a.club === 'yes') s += r.weights.club;
  if (on.has('prep') && a.prep === 'yes') s += r.weights.prep;
  return s;
};

export interface Outcome {
  approved: Set<number>;
  rate: Record<District, number>;
  gap: number;
  accuracy: number;
  reviewed: number;
  qualifiedRejected: number;
  pass: boolean;
}

/** The screener approves as many applicants as there are scholarships (one per qualified applicant); human review re-reads the files nearest the cutoff. */
export function run(r: AuditRound, cfg: Config): Outcome {
  const ranked = [...r.applicants].sort((a, b) => score(b, r, cfg.on) - score(a, r, cfg.on) || a.id - b.id);
  const k = r.applicants.filter((a) => a.qualified).length;
  const approved = new Set(ranked.slice(0, k).map((a) => a.id));
  let reviewed = 0;
  if (cfg.review) {
    const m = r.reviewMax / 2;
    const lo = Math.max(0, k - m);
    const hi = Math.min(ranked.length, k + m);
    const window = ranked.slice(lo, hi);
    reviewed = window.length;
    const slots = window.filter((a) => approved.has(a.id)).length;
    for (const a of window) approved.delete(a.id);
    for (const a of [...window].sort((x, y) => y.merit - x.merit || x.id - y.id).slice(0, slots)) approved.add(a.id);
  }
  const rateOf = (d: District) => {
    const g = r.applicants.filter((a) => a.district === d);
    return Math.round((g.filter((a) => approved.has(a.id)).length / g.length) * 100);
  };
  const rate = { North: rateOf('North'), South: rateOf('South') };
  const gap = Math.abs(rate.North - rate.South);
  const correct = r.applicants.filter((a) => approved.has(a.id) === a.qualified).length;
  const accuracy = Math.round((correct / r.applicants.length) * 100);
  const qualifiedRejected = r.applicants.filter((a) => a.qualified && !approved.has(a.id)).length;
  return { approved, rate, gap, accuracy, reviewed, qualifiedRejected, pass: gap <= r.gapMax && accuracy >= r.accMin && reviewed <= r.reviewMax };
}

export type SliceKey = 'district' | 'device' | 'club' | 'prep' | 'grades';
export const SLICE_LABEL: Record<SliceKey, string> = { district: 'District', device: 'Laptop at home', club: 'Debate club', prep: 'Saturday prep course', grades: 'Grades' };

export interface SliceRow {
  group: string;
  n: number;
  southShare: number;
  approvedPct: number;
  qualifiedPct: number;
}

/** Group applicants by one trait and report, for each group, how many were approved and how many were actually qualified. */
export function slice(r: AuditRound, approved: ReadonlySet<number>, key: SliceKey): SliceRow[] {
  const val = (a: Applicant): string => (key === 'grades' ? (a.grades >= 70 ? 'Grades 70 and up' : 'Grades under 70') : key === 'district' ? a.district : key === 'device' ? (a.device === 'own' ? 'Own laptop' : 'Shared or none') : key === 'club' ? (a.club === 'yes' ? 'In the club' : 'Not in the club') : a.prep === 'yes' ? 'Took the course' : 'Did not');
  const groups = [...new Set(r.applicants.map(val))].sort();
  return groups.map((g) => {
    const m = r.applicants.filter((a) => val(a) === g);
    return {
      group: g,
      n: m.length,
      southShare: Math.round((m.filter((a) => a.district === 'South').length / m.length) * 100),
      approvedPct: Math.round((m.filter((a) => approved.has(a.id)).length / m.length) * 100),
      qualifiedPct: Math.round((m.filter((a) => a.qualified).length / m.length) * 100),
    };
  });
}
