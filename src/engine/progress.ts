/**
 * The progress engine: pure functions, no React, no browser APIs.
 * `applyEvent(state, event, now)` returns the next state plus what the player should be told about.
 * Everything that earns XP or a badge is decided here, which makes the rules easy to test and to explain.
 *
 * Principles (shown to the player on the Logbook page):
 *  1. XP is paid for doing the thing, once. Repeating a step pays nothing.
 *  2. A better result on a scored step pays only the improvement.
 *  3. Badges are computed from what you actually completed, never from visits or clicks.
 */
import { PATHS, LESSONS, lessonById } from '@/content/paths';
import type { PathId } from '@/content/types';

export const STATE_VERSION = 1;

// ---------- XP rules ----------
export const XP = {
  learn: 20, // read every beat of a lesson
  tryMax: 60, // experiment, in proportion to the best score
  checkPerQuestion: 20, // best number correct x 20
  checkPerfect: 30, // all questions right, once
  lessonDone: 40, // learn + experiment solved + check passed
  path: 150, // finish all lessons of a path
  badge: 100,
  certification: 300,
} as const;

export const CHECK_PASS = 2; // correct answers needed (of 3) to finish a lesson

const LEVELS = [0, 120, 320, 620, 1000, 1500, 2100, 2800, 3600, 4500] as const;
export const LEVEL_NAMES = [
  'Dockhand',
  'Lamplighter',
  'Scribe',
  'Surveyor',
  'Navigator',
  'Cartographer',
  'Wayfinder',
  'Harbor Warden',
  'Strategist',
  'Beacon Keeper',
] as const;

export interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  floor: number;
  next: number | null;
  /** XP still needed for the next level, or 0 at the top. */
  remaining: number;
  /** 0-100 progress within this level. */
  pct: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]!) level = i + 1;
  const floor = LEVELS[level - 1]!;
  const next = level < LEVELS.length ? LEVELS[level]! : null;
  return {
    level,
    name: LEVEL_NAMES[level - 1]!,
    xp,
    floor,
    next,
    remaining: next === null ? 0 : next - xp,
    pct: next === null ? 100 : Math.round(((xp - floor) / (next - floor)) * 100),
  };
}

// ---------- State ----------
export interface LessonProgress {
  learned: boolean;
  tryScore: number; // best experiment score, 0-100
  checkBest: number; // best correct answers, 0-3
  done: boolean;
  doneAt?: number;
}
export interface ChallengeResult {
  best: number; // 0-100
  passed: boolean;
  plays: number;
}
export interface ActivityItem {
  t: number;
  label: string;
  xp: number;
}
export interface Settings {
  sound: boolean;
  volume: number; // 0-1
  name: string; // optional; used only on the certificate, never leaves the device
}
export interface PortalState {
  v: number;
  createdAt: number;
  xp: number;
  lessons: Record<string, LessonProgress>;
  /** Scored side experiences: lab tasks, scenarios, certification. Keyed by id. */
  challenges: Record<string, ChallengeResult>;
  badges: Record<string, number>;
  pathsDone: Record<string, number>;
  codex: string[];
  activity: ActivityItem[];
  xpByDay: Record<string, number>;
  lastLesson: string | null;
  settings: Settings;
}

export const emptyLesson = (): LessonProgress => ({ learned: false, tryScore: 0, checkBest: 0, done: false });

export function createState(now: number): PortalState {
  return {
    v: STATE_VERSION,
    createdAt: now,
    xp: 0,
    lessons: {},
    challenges: {},
    badges: {},
    pathsDone: {},
    codex: [],
    activity: [],
    xpByDay: {},
    lastLesson: null,
    settings: { sound: false, volume: 0.6, name: '' },
  };
}

export const dayKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

// ---------- Badges ----------
export interface BadgeDef {
  id: string;
  name: string;
  title: string;
  how: string;
  path: PathId | 'all';
  earned: (s: PortalState) => boolean;
}

const lessonDone = (s: PortalState, id: string) => s.lessons[id]?.done === true;
const pathDone = (s: PortalState, id: PathId) => PATHS.find((p) => p.id === id)!.lessons.every((l) => lessonDone(s, l.id));
const tried = (s: PortalState, id: string, min: number) => (s.lessons[id]?.tryScore ?? 0) >= min;

export const BADGES: readonly BadgeDef[] = [
  { id: 'loom-keeper', name: 'Loom Keeper', title: 'AI Foundations', path: 'understand', how: 'Finish all five lessons in Understand AI.', earned: (s) => pathDone(s, 'understand') },
  { id: 'model-explorer', name: 'Model Explorer', title: 'Model Explorer', path: 'understand', how: 'Solve the classifier, neural network and next-word experiments (score 60 or more on each).', earned: (s) => tried(s, 'u2', 60) && tried(s, 'u3', 60) && tried(s, 'u4', 60) },
  { id: 'prompt-smith', name: 'Prompt Smith', title: 'Prompt Architect', path: 'use', how: 'Finish lessons 2 and 3 of Use AI and clear the Lab refine task.', earned: (s) => lessonDone(s, 't2') && lessonDone(s, 't3') && s.challenges['lab-refine']?.passed === true },
  { id: 'source-hunter', name: 'Source Hunter', title: 'Research Investigator', path: 'use', how: 'Finish the verification lesson and review every claim correctly in its experiment.', earned: (s) => lessonDone(s, 't4') && tried(s, 't4', 100) },
  { id: 'sharp-eye', name: 'Sharp Eye', title: 'Critical Thinker', path: 'responsible', how: 'Catch every invented or doubtful claim in the hallucination hunt (score 100).', earned: (s) => tried(s, 'r2', 100) },
  { id: 'fair-hand', name: 'Fair Hand', title: 'Bias Spotter', path: 'responsible', how: 'Finish the bias lesson and score 80 or more in the bias audit.', earned: (s) => lessonDone(s, 'r1') && tried(s, 'r1', 80) },
  { id: 'lantern-bearer', name: 'Lantern Bearer', title: 'Ethics Advocate', path: 'responsible', how: 'Finish all five lessons in Use AI Responsibly.', earned: (s) => pathDone(s, 'responsible') },
  { id: 'fieldwork', name: 'Fieldwork', title: 'Scenario Veteran', path: 'all', how: 'Play all six academic scenarios and average 70 or more.', earned: (s) => scenarioAverage(s) !== null && scenarioAverage(s)! >= 70 },
  { id: 'literacy-master', name: 'AI Literacy Master', title: 'Certified', path: 'all', how: 'Pass the final certification.', earned: (s) => s.challenges['certification']?.passed === true },
];

export const SCENARIO_IDS = ['sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6'] as const;
export function scenarioAverage(s: PortalState): number | null {
  const scores = SCENARIO_IDS.map((id) => s.challenges[id]?.best);
  if (scores.some((v) => v === undefined)) return null;
  return Math.round((scores as number[]).reduce((a, b) => a + b, 0) / scores.length);
}

// ---------- Events ----------
export type GameEvent =
  | { type: 'learned'; lesson: string }
  | { type: 'tried'; lesson: string; score: number }
  | { type: 'checked'; lesson: string; correct: number }
  | { type: 'challenge'; id: string; score: number; passMark: number; xp: number; label: string }
  | { type: 'certification'; score: number; passMark: number }
  | { type: 'codex'; terms: string[] }
  | { type: 'settings'; patch: Partial<Settings> };

export type Reward =
  | { kind: 'xp'; amount: number; label: string }
  | { kind: 'badge'; id: string }
  | { kind: 'path'; id: PathId }
  | { kind: 'lesson'; id: string }
  | { kind: 'level'; from: number; to: number };

export interface ApplyResult {
  state: PortalState;
  rewards: Reward[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));

/** Pure: never mutates `prev`. */
export function applyEvent(prev: PortalState, ev: GameEvent, now: number): ApplyResult {
  const s: PortalState = structuredClone(prev);
  const rewards: Reward[] = [];

  const pay = (amount: number, label: string) => {
    if (amount <= 0) return;
    s.xp += amount;
    const day = dayKey(now);
    s.xpByDay[day] = (s.xpByDay[day] ?? 0) + amount;
    s.activity = [{ t: now, label, xp: amount }, ...s.activity].slice(0, 40);
    rewards.push({ kind: 'xp', amount, label });
  };
  const lessonState = (id: string): LessonProgress => (s.lessons[id] ??= emptyLesson());

  const settle = (id: string) => {
    const l = lessonState(id);
    const lesson = lessonById(id);
    if (!lesson || l.done) return;
    if (l.learned && l.tryScore >= lesson.widget.pass && l.checkBest >= CHECK_PASS) {
      l.done = true;
      l.doneAt = now;
      pay(XP.lessonDone, `Finished: ${lesson.title}`);
      rewards.push({ kind: 'lesson', id });
      for (const term of lesson.codex) if (!s.codex.includes(term)) s.codex.push(term);
      const path = PATHS.find((p) => p.id === lesson.path)!;
      if (!s.pathsDone[path.id] && path.lessons.every((x) => s.lessons[x.id]?.done)) {
        s.pathsDone[path.id] = now;
        pay(XP.path, `Path complete: ${path.title}`);
        rewards.push({ kind: 'path', id: path.id });
      }
    }
  };

  switch (ev.type) {
    case 'learned': {
      const lesson = lessonById(ev.lesson);
      if (!lesson) break;
      const l = lessonState(ev.lesson);
      s.lastLesson = ev.lesson;
      if (!l.learned) {
        l.learned = true;
        pay(XP.learn, `Read: ${lesson.title}`);
      }
      settle(ev.lesson);
      break;
    }
    case 'tried': {
      const lesson = lessonById(ev.lesson);
      if (!lesson) break;
      const l = lessonState(ev.lesson);
      s.lastLesson = ev.lesson;
      const score = clamp(ev.score, 0, 100);
      if (score > l.tryScore) {
        const gain = Math.round((XP.tryMax * (score - l.tryScore)) / 100);
        l.tryScore = score;
        pay(gain, `Experiment: ${lesson.widget.title}`);
      }
      settle(ev.lesson);
      break;
    }
    case 'checked': {
      const lesson = lessonById(ev.lesson);
      if (!lesson) break;
      const l = lessonState(ev.lesson);
      const total = lesson.check.length;
      const correct = clamp(ev.correct, 0, total);
      if (correct > l.checkBest) {
        let gain = (correct - l.checkBest) * XP.checkPerQuestion;
        if (correct === total && l.checkBest < total) gain += XP.checkPerfect;
        l.checkBest = correct;
        pay(gain, `Knowledge check: ${lesson.title}`);
      }
      settle(ev.lesson);
      break;
    }
    case 'challenge': {
      const c = (s.challenges[ev.id] ??= { best: 0, passed: false, plays: 0 });
      c.plays += 1;
      const score = clamp(ev.score, 0, 100);
      c.best = Math.max(c.best, score);
      if (!c.passed && score >= ev.passMark) {
        c.passed = true;
        pay(ev.xp, ev.label);
      }
      break;
    }
    case 'certification': {
      const c = (s.challenges['certification'] ??= { best: 0, passed: false, plays: 0 });
      c.plays += 1;
      const score = clamp(ev.score, 0, 100);
      c.best = Math.max(c.best, score);
      if (!c.passed && score >= ev.passMark) {
        c.passed = true;
        pay(XP.certification, 'Passed the final certification');
      }
      break;
    }
    case 'codex': {
      for (const t of ev.terms) if (!s.codex.includes(t)) s.codex.push(t);
      break;
    }
    case 'settings': {
      s.settings = { ...s.settings, ...ev.patch };
      s.settings.volume = Math.min(1, Math.max(0, s.settings.volume));
      s.settings.name = s.settings.name.slice(0, 60);
      break;
    }
  }

  // Badges are recomputed after every event, so they can only come from real progress.
  for (const b of BADGES) {
    if (!s.badges[b.id] && b.earned(s)) {
      s.badges[b.id] = now;
      pay(XP.badge, `Badge: ${b.name}`);
      rewards.push({ kind: 'badge', id: b.id });
    }
  }

  const before = levelInfo(prev.xp).level;
  const after = levelInfo(s.xp).level;
  if (after > before) rewards.push({ kind: 'level', from: before, to: after });

  return { state: s, rewards };
}

// ---------- Derived views ----------
export function pathProgress(s: PortalState, id: PathId): { done: number; total: number; pct: number } {
  const path = PATHS.find((p) => p.id === id)!;
  const done = path.lessons.filter((l) => s.lessons[l.id]?.done).length;
  return { done, total: path.lessons.length, pct: Math.round((done / path.lessons.length) * 100) };
}

export function overallProgress(s: PortalState): { done: number; total: number; pct: number } {
  const done = LESSONS.filter((l) => s.lessons[l.id]?.done).length;
  return { done, total: LESSONS.length, pct: Math.round((done / LESSONS.length) * 100) };
}

/** Which of the three steps of a lesson are finished, for the stepper and the map. */
export function lessonSteps(s: PortalState, id: string): { learn: boolean; try: boolean; check: boolean; done: boolean; started: boolean } {
  const l = s.lessons[id];
  const lesson = lessonById(id);
  const learn = l?.learned === true;
  const tryDone = !!l && !!lesson && l.tryScore >= lesson.widget.pass;
  const check = !!l && l.checkBest >= CHECK_PASS;
  return { learn, try: tryDone, check, done: l?.done === true, started: !!l && (l.learned || l.tryScore > 0 || l.checkBest > 0) };
}

export interface Recommendation {
  kind: 'lesson' | 'certification' | 'explore';
  lesson?: string;
  why: string;
}

/** Continue the lesson you were in; otherwise the next unfinished lesson in curriculum order. */
export function recommendNext(s: PortalState): Recommendation {
  const last = s.lastLesson ? lessonById(s.lastLesson) : undefined;
  if (last && !s.lessons[last.id]?.done) return { kind: 'lesson', lesson: last.id, why: 'You started this one. Pick up where you left off.' };
  const next = LESSONS.find((l) => !s.lessons[l.id]?.done);
  if (next) {
    const first = !Object.keys(s.lessons).length;
    return { kind: 'lesson', lesson: next.id, why: first ? 'Start here. No background needed.' : 'The next unfinished lesson in order.' };
  }
  if (!s.challenges['certification']?.passed) return { kind: 'certification', why: 'Every lesson is done. Test what you know across all three paths.' };
  return { kind: 'explore', why: 'You have finished the course. Try the scenarios or the prompt lab again.' };
}
