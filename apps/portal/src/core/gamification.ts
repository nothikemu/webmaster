/**
 * Gamification engine: pure functions over PersistedState. No DOM, no clock, no storage, so it
 * is fully unit-testable. The XState gamification machine decides *whether* an event runs;
 * this file decides *what it does*.
 */
import { MODULES, getModule, lessonHref, moduleHref, quizHref, challengeHref, type ModuleId } from '../content';
import {
  HISTORY_DAYS,
  dayKey,
  emptyLedger,
  masteryRank,
  type Mastery,
  type ModuleState,
  type PersistedState,
} from './schema';

// ---- tunables ---------------------------------------------------------------------------------
export const XP_LESSON: Readonly<Record<Exclude<Mastery, 'unseen'>, number>> = {
  seen: 10,
  practiced: 15,
  mastered: 25,
};
export const XP_PER_QUIZ_POINT = 20;
export const XP_PERFECT_QUIZ = 50;
export const XP_CHALLENGE_FIRST = 120;
export const XP_CHALLENGE_TIME_BONUS = 80;
export const XP_CHALLENGE_REPEAT = 5;
export const XP_ACTION = 15;
export const XP_REVIEW = 5;
export const XP_BADGE = 100;
export const DAILY_SOFT_CAP = 400;
export const SOFT_CAP_RATE = 0.25;
export const MAX_QUIZ_XP_ATTEMPTS_PER_DAY = 3;
export const STREAK_BONUS_STEP = 0.05;
export const STREAK_BONUS_MAX = 0.5;
export const REVIEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000;
export const BADGE_QUIZ_MIN = 4;
export const BADGE_LESSON_RATIO = 0.8;

export const LEVEL_NAMES = [
  'Signal', 'Vector', 'Gradient', 'Layer', 'Tensor', 'Kernel',
  'Embedding', 'Attention', 'Transformer', 'Reasoner', 'Architect', 'Principal',
] as const;

// ---- levels -----------------------------------------------------------------------------------
/** Cumulative XP needed to reach `level` (level 1 starts at 0). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round((120 * Math.pow(level - 1, 1.5)) / 5) * 5;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelName(level: number): string {
  return LEVEL_NAMES[level - 1] ?? `Level ${level}`;
}

export interface LevelInfo {
  level: number;
  name: string;
  into: number;
  span: number;
  fraction: number;
}

export function levelInfo(xp: number): LevelInfo {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const span = xpForLevel(level + 1) - base;
  const into = xp - base;
  return { level, name: levelName(level), into, span, fraction: span > 0 ? into / span : 1 };
}

// ---- events and effects -----------------------------------------------------------------------
export type GameEvent =
  | { type: 'LESSON_OPENED'; module: ModuleId; lesson: string }
  | { type: 'LESSON_CHECKED'; module: ModuleId; lesson: string; correct: boolean; firstTry: boolean }
  | { type: 'QUIZ_SUBMITTED'; module: ModuleId; score: number; correctLessons: readonly string[] }
  | { type: 'CHALLENGE_FINISHED'; module: ModuleId; score: number; elapsedMs: number; timed: boolean }
  | { type: 'ACTION'; module: ModuleId; action: string }
  | { type: 'LESSON_REVIEWED'; module: ModuleId; lesson: string }
  | { type: 'ONBOARDED' };

export type Effect =
  | { type: 'xp'; amount: number; reason: string }
  | { type: 'level'; level: number; name: string }
  | { type: 'streak'; days: number }
  | { type: 'mastery'; module: ModuleId; lesson: string; to: Mastery }
  | { type: 'badge'; module: ModuleId };

export interface ApplyResult {
  state: PersistedState;
  effects: Effect[];
}

// ---- progress ---------------------------------------------------------------------------------
export function computeModuleProgress(id: ModuleId, m: ModuleState): number {
  const content = getModule(id);
  const lessonScore =
    content.lessons.reduce((sum, l) => sum + masteryRank(m.lessons[l.id] ?? 'unseen') / 3, 0) /
    content.lessons.length;
  const actionScore =
    content.requiredActions.filter((a) => m.actions[a.id]).length / content.requiredActions.length;
  const quizScore = m.quiz.best / 5;
  const challengeScore = m.challenge.done ? 1 : 0;
  return Math.max(
    0,
    Math.min(100, Math.round(lessonScore * 40 + actionScore * 15 + quizScore * 25 + challengeScore * 20)),
  );
}

export function isBadgeEarned(id: ModuleId, m: ModuleState): boolean {
  const content = getModule(id);
  const practiced = content.lessons.filter((l) => masteryRank(m.lessons[l.id] ?? 'unseen') >= 2).length;
  return (
    practiced >= Math.ceil(content.lessons.length * BADGE_LESSON_RATIO) &&
    content.requiredActions.every((a) => m.actions[a.id]) &&
    m.quiz.best >= BADGE_QUIZ_MIN &&
    m.challenge.done
  );
}

export function overallProgress(state: PersistedState): number {
  const total = MODULES.reduce((sum, m) => sum + state.modules[m.id].progress, 0);
  return Math.round(total / MODULES.length);
}

// ---- internals --------------------------------------------------------------------------------
function cloneForWrite(state: PersistedState, now: number): PersistedState {
  const day = dayKey(now);
  const next: PersistedState = {
    ...state,
    xpByDay: { ...state.xpByDay },
    activeDays: { ...state.activeDays },
    streak: { ...state.streak },
    today: state.today.day === day ? { ...state.today, quizXpAttempts: { ...state.today.quizXpAttempts }, challengeRepeatPaid: { ...state.today.challengeRepeatPaid } } : emptyLedger(day),
    modules: {
      foundations: cloneModule(state.modules.foundations),
      synthesis: cloneModule(state.modules.synthesis),
      ethics: cloneModule(state.modules.ethics),
    },
    counters: { ...state.counters },
    unlocks: { ...state.unlocks },
    updatedAt: now,
  };
  return next;
}

function cloneModule(m: ModuleState): ModuleState {
  return {
    ...m,
    lessons: { ...m.lessons },
    reviewedAt: { ...m.reviewedAt },
    quiz: { ...m.quiz },
    challenge: { ...m.challenge },
    actions: { ...m.actions },
  };
}

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return dayKey(new Date(y, m - 1, d - 1).getTime());
}

function prune(map: Record<string, number>, today: string): void {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  const cutoff = dayKey(new Date(y, m - 1, d - HISTORY_DAYS).getTime());
  for (const k of Object.keys(map)) if (k < cutoff) delete map[k];
}

/** Marks today as active and advances the streak. Called only for meaningful actions. */
function touchActivity(state: PersistedState, now: number, effects: Effect[]): void {
  const day = dayKey(now);
  state.activeDays[day] = (state.activeDays[day] ?? 0) + 1;
  if (state.streak.lastDay !== day) {
    state.streak.current = state.streak.lastDay === previousDay(day) ? state.streak.current + 1 : 1;
    state.streak.best = Math.max(state.streak.best, state.streak.current);
    state.streak.lastDay = day;
    effects.push({ type: 'streak', days: state.streak.current });
  }
  prune(state.activeDays, day);
}

export function streakMultiplier(streak: number): number {
  return 1 + Math.min(STREAK_BONUS_MAX, Math.max(0, streak - 1) * STREAK_BONUS_STEP);
}

/** Awards XP through the streak multiplier and the daily soft cap. Returns the XP granted. */
function award(state: PersistedState, base: number, reason: string, effects: Effect[], now: number): number {
  if (base <= 0) return 0;
  const boosted = base * streakMultiplier(state.streak.current);
  const room = Math.max(0, DAILY_SOFT_CAP - state.today.xp);
  const amount = Math.max(1, Math.round(Math.min(boosted, room) + Math.max(0, boosted - room) * SOFT_CAP_RATE));
  const before = levelFromXp(state.xp);
  state.xp += amount;
  state.today.xp += amount;
  const day = dayKey(now);
  state.xpByDay[day] = (state.xpByDay[day] ?? 0) + amount;
  prune(state.xpByDay, day);
  effects.push({ type: 'xp', amount, reason });
  const after = levelFromXp(state.xp);
  if (after > before) effects.push({ type: 'level', level: after, name: levelName(after) });
  return amount;
}

function raiseMastery(
  state: PersistedState,
  id: ModuleId,
  lesson: string,
  to: Mastery,
  effects: Effect[],
  now: number,
): void {
  const m = state.modules[id];
  const from = m.lessons[lesson] ?? 'unseen';
  if (masteryRank(to) <= masteryRank(from)) return;
  let base = 0;
  for (let r = masteryRank(from) + 1; r <= masteryRank(to); r++) {
    base += XP_LESSON[(['unseen', 'seen', 'practiced', 'mastered'] as const)[r] as Exclude<Mastery, 'unseen'>];
  }
  m.lessons[lesson] = to;
  if (from === 'unseen') state.counters.lessonsSeen += 1;
  effects.push({ type: 'mastery', module: id, lesson, to });
  award(state, base, `lesson ${to}`, effects, now);
}

function settle(state: PersistedState, id: ModuleId, effects: Effect[], now: number): void {
  const m = state.modules[id];
  m.progress = computeModuleProgress(id, m);
  if (!m.badge && isBadgeEarned(id, m)) {
    m.badge = true;
    effects.push({ type: 'badge', module: id });
    award(state, XP_BADGE, 'badge', effects, now);
  }
  state.last = { module: id, at: now };
}

// ---- reducer ----------------------------------------------------------------------------------
export function applyEvent(prev: PersistedState, event: GameEvent, now: number): ApplyResult {
  const effects: Effect[] = [];
  const state = cloneForWrite(prev, now);

  switch (event.type) {
    case 'ONBOARDED': {
      state.unlocks.onboarded = true;
      return { state, effects };
    }
    case 'LESSON_OPENED': {
      const known = getModule(event.module).lessons.some((l) => l.id === event.lesson);
      if (!known) return { state: prev, effects };
      if ((state.modules[event.module].lessons[event.lesson] ?? 'unseen') === 'unseen') {
        touchActivity(state, now, effects);
        raiseMastery(state, event.module, event.lesson, 'seen', effects, now);
      }
      settle(state, event.module, effects, now);
      break;
    }
    case 'LESSON_CHECKED': {
      const known = getModule(event.module).lessons.some((l) => l.id === event.lesson);
      if (!known) return { state: prev, effects };
      touchActivity(state, now, effects);
      const target: Mastery = !event.correct ? 'seen' : event.firstTry ? 'mastered' : 'practiced';
      raiseMastery(state, event.module, event.lesson, target, effects, now);
      settle(state, event.module, effects, now);
      break;
    }
    case 'QUIZ_SUBMITTED': {
      const score = Math.max(0, Math.min(5, Math.floor(event.score)));
      const m = state.modules[event.module];
      touchActivity(state, now, effects);
      state.counters.quizzesTaken += 1;
      m.quiz.attempts += 1;
      m.quiz.lastAt = now;
      const paid = state.today.quizXpAttempts[event.module] < MAX_QUIZ_XP_ATTEMPTS_PER_DAY;
      state.today.quizXpAttempts[event.module] += 1;
      const improvement = Math.max(0, score - m.quiz.best);
      const firstPerfect = score === 5 && m.quiz.best < 5;
      if (score === 5) state.counters.perfectQuizzes += 1;
      if (paid && improvement > 0) award(state, improvement * XP_PER_QUIZ_POINT, 'knowledge check', effects, now);
      if (paid && firstPerfect) award(state, XP_PERFECT_QUIZ, 'perfect check', effects, now);
      m.quiz.best = Math.max(m.quiz.best, score);
      for (const lesson of new Set(event.correctLessons)) {
        const current = m.lessons[lesson] ?? 'unseen';
        if (!getModule(event.module).lessons.some((l) => l.id === lesson)) continue;
        raiseMastery(state, event.module, lesson, masteryRank(current) >= 2 ? 'mastered' : 'practiced', effects, now);
      }
      settle(state, event.module, effects, now);
      break;
    }
    case 'CHALLENGE_FINISHED': {
      const content = getModule(event.module);
      const m = state.modules[event.module];
      touchActivity(state, now, effects);
      m.challenge.attempts += 1;
      m.challenge.bestScore = Math.max(m.challenge.bestScore, Math.floor(event.score));
      const passed = event.score >= content.challenge.passMark;
      if (passed) {
        const wasDone = m.challenge.done;
        m.challenge.done = true;
        if (event.elapsedMs > 0 && (m.challenge.bestMs === null || event.elapsedMs < m.challenge.bestMs)) {
          m.challenge.bestMs = Math.round(event.elapsedMs);
        }
        if (!wasDone) {
          state.counters.challengesCleared += 1;
          const par = content.challenge.parSeconds * 1000;
          const bonus = event.timed
            ? Math.round(XP_CHALLENGE_TIME_BONUS * Math.max(0, Math.min(1, (par - event.elapsedMs) / par)))
            : 0;
          award(state, XP_CHALLENGE_FIRST + bonus, 'challenge cleared', effects, now);
        } else if (!state.today.challengeRepeatPaid[event.module]) {
          state.today.challengeRepeatPaid[event.module] = true;
          award(state, XP_CHALLENGE_REPEAT, 'challenge repeat', effects, now);
        }
      }
      settle(state, event.module, effects, now);
      break;
    }
    case 'ACTION': {
      const content = getModule(event.module);
      if (!content.requiredActions.some((a) => a.id === event.action)) return { state: prev, effects };
      const m = state.modules[event.module];
      if (!m.actions[event.action]) {
        touchActivity(state, now, effects);
        m.actions[event.action] = true;
        state.counters.actions += 1;
        award(state, XP_ACTION, event.action, effects, now);
      }
      settle(state, event.module, effects, now);
      break;
    }
    case 'LESSON_REVIEWED': {
      const m = state.modules[event.module];
      const known = getModule(event.module).lessons.some((l) => l.id === event.lesson);
      if (!known || masteryRank(m.lessons[event.lesson] ?? 'unseen') < 2) return { state: prev, effects };
      const last = m.reviewedAt[event.lesson];
      if (last !== undefined && dayKey(last) === dayKey(now)) return { state: prev, effects };
      // Spaced review pays only when the lesson is actually due; revisiting it early is free.
      if (now - (last ?? prev.createdAt) <= REVIEW_AFTER_MS) return { state: prev, effects };
      touchActivity(state, now, effects);
      m.reviewedAt[event.lesson] = now;
      award(state, XP_REVIEW, 'review', effects, now);
      settle(state, event.module, effects, now);
      break;
    }
  }
  return { state, effects };
}

// ---- recommendations --------------------------------------------------------------------------
export interface Recommendation {
  kind: 'start' | 'lesson' | 'centerpiece' | 'quiz' | 'challenge' | 'review' | 'complete';
  module: ModuleId | null;
  label: string;
  reason: string;
  href: string;
}

export function dueReviews(state: PersistedState, now: number): Array<{ module: ModuleId; lesson: string }> {
  const out: Array<{ module: ModuleId; lesson: string }> = [];
  for (const c of MODULES) {
    const m = state.modules[c.id];
    for (const l of c.lessons) {
      if (masteryRank(m.lessons[l.id] ?? 'unseen') < 2) continue;
      const last = m.reviewedAt[l.id] ?? state.createdAt;
      if (now - last > REVIEW_AFTER_MS) out.push({ module: c.id, lesson: l.id });
    }
  }
  return out;
}

function nextInModule(state: PersistedState, id: ModuleId): Recommendation | null {
  const content = getModule(id);
  const m = state.modules[id];
  const idx = content.lessons.findIndex((l) => masteryRank(m.lessons[l.id] ?? 'unseen') < 2);
  if (idx >= 0) {
    const lesson = content.lessons[idx]!;
    const seen = (m.lessons[lesson.id] ?? 'unseen') !== 'unseen';
    return {
      kind: 'lesson',
      module: id,
      label: `Lesson ${idx + 1}: ${lesson.title}`,
      reason: seen ? 'Answer its check to lock it in.' : `Next lesson in ${content.title}.`,
      href: lessonHref(id, idx + 1),
    };
  }
  const missing = content.requiredActions.find((a) => !m.actions[a.id]);
  if (missing) {
    return { kind: 'centerpiece', module: id, label: missing.label, reason: `Finish the ${content.centerpiece.name}.`, href: moduleHref(id) };
  }
  if (m.quiz.best < BADGE_QUIZ_MIN) {
    return { kind: 'quiz', module: id, label: 'Knowledge check', reason: `Score ${BADGE_QUIZ_MIN} of 5 to qualify for the badge.`, href: quizHref(id) };
  }
  if (!m.challenge.done) {
    return { kind: 'challenge', module: id, label: content.challenge.title, reason: 'The last requirement for the badge.', href: challengeHref(id) };
  }
  return null;
}

/** Picks what to do next: resume the last module if unfinished, else the least complete one. */
export function recommendNext(state: PersistedState, now: number): Recommendation {
  const started = MODULES.some((c) => state.modules[c.id].progress > 0);
  if (!started) {
    const first = MODULES[0]!;
    return { kind: 'start', module: first.id, label: `Lesson 1: ${first.lessons[0]!.title}`, reason: 'Start with the basics.', href: lessonHref(first.id, 1) };
  }
  const open = MODULES.filter((c) => !state.modules[c.id].badge && nextInModule(state, c.id) !== null);
  if (open.length > 0) {
    const resume = state.last ? open.find((c) => c.id === state.last!.module) : undefined;
    const pick = resume ?? [...open].sort((a, b) => state.modules[a.id].progress - state.modules[b.id].progress || a.index - b.index)[0]!;
    const rec = nextInModule(state, pick.id)!;
    return resume ? { ...rec, reason: `Pick up where you left off. ${rec.reason}` } : rec;
  }
  const due = dueReviews(state, now);
  if (due.length > 0) {
    const d = due[0]!;
    const content = getModule(d.module);
    const idx = content.lessons.findIndex((l) => l.id === d.lesson);
    return { kind: 'review', module: d.module, label: `Review: ${content.lessons[idx]!.title}`, reason: 'More than three days since you last saw it.', href: lessonHref(d.module, idx + 1) };
  }
  return { kind: 'complete', module: null, label: 'All badges earned', reason: 'Come back in a few days for spaced review.', href: '/achievements' };
}
