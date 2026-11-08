import { describe, expect, it } from 'vitest';
import { MODULES, getModule } from '../src/content';
import {
  DAILY_SOFT_CAP,
  MAX_QUIZ_XP_ATTEMPTS_PER_DAY,
  XP_ACTION,
  XP_CHALLENGE_FIRST,
  XP_LESSON,
  XP_PER_QUIZ_POINT,
  applyEvent,
  computeModuleProgress,
  dueReviews,
  isBadgeEarned,
  levelFromXp,
  levelInfo,
  overallProgress,
  recommendNext,
  streakMultiplier,
  xpForLevel,
  type Effect,
  type GameEvent,
} from '../src/core/gamification';
import { createInitialState, type PersistedState } from '../src/core/schema';

const SALT = '00000000000000000000000000000000';
const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date(2026, 10, 2, 12, 0, 0).getTime();

const fresh = (now = T0): PersistedState => createInitialState(now, SALT);

function run(state: PersistedState, events: Array<[GameEvent, number?]>): { state: PersistedState; effects: Effect[] } {
  const all: Effect[] = [];
  let s = state;
  for (const [e, at] of events) {
    const r = applyEvent(s, e, at ?? T0);
    s = r.state;
    all.push(...r.effects);
  }
  return { state: s, effects: all };
}

const xpOf = (effects: Effect[]): number => effects.reduce((n, e) => n + (e.type === 'xp' ? e.amount : 0), 0);

describe('levels', () => {
  it('has strictly increasing thresholds and consistent inversion', () => {
    for (let l = 1; l < 20; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
    for (let l = 1; l < 20; l++) {
      expect(levelFromXp(xpForLevel(l))).toBe(l);
      expect(levelFromXp(xpForLevel(l + 1) - 1)).toBe(l);
    }
  });

  it('reports progress inside a level', () => {
    const info = levelInfo(xpForLevel(3) + 10);
    expect(info.level).toBe(3);
    expect(info.into).toBe(10);
    expect(info.fraction).toBeGreaterThan(0);
    expect(info.fraction).toBeLessThan(1);
  });
});

describe('lessons', () => {
  it('awards XP once per mastery step', () => {
    const open: GameEvent = { type: 'LESSON_OPENED', module: 'foundations', lesson: 'a1' };
    const first = run(fresh(), [[open]]);
    expect(xpOf(first.effects)).toBe(XP_LESSON.seen);
    expect(first.state.modules.foundations.lessons.a1).toBe('seen');
    const again = run(first.state, [[open]]);
    expect(xpOf(again.effects)).toBe(0);
    expect(again.state.xp).toBe(first.state.xp);
  });

  it('first-try correct jumps straight to mastered and pays every skipped step', () => {
    const r = run(fresh(), [[{ type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a2', correct: true, firstTry: true }]]);
    expect(r.state.modules.foundations.lessons.a2).toBe('mastered');
    expect(xpOf(r.effects)).toBeGreaterThanOrEqual(XP_LESSON.seen + XP_LESSON.practiced + XP_LESSON.mastered);
  });

  it('a later correct answer only reaches practiced', () => {
    const r = run(fresh(), [[{ type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a2', correct: true, firstTry: false }]]);
    expect(r.state.modules.foundations.lessons.a2).toBe('practiced');
  });

  it('ignores unknown lessons without touching state', () => {
    const s = fresh();
    const r = applyEvent(s, { type: 'LESSON_OPENED', module: 'foundations', lesson: 'zz' }, T0);
    expect(r.state).toBe(s);
    expect(r.effects).toHaveLength(0);
  });

  it('never lowers mastery', () => {
    const r = run(fresh(), [
      [{ type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a1', correct: true, firstTry: true }],
      [{ type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a1', correct: false, firstTry: false }],
      [{ type: 'LESSON_OPENED', module: 'foundations', lesson: 'a1' }],
    ]);
    expect(r.state.modules.foundations.lessons.a1).toBe('mastered');
  });
});

describe('quiz anti-grind', () => {
  const quiz = (score: number): GameEvent => ({ type: 'QUIZ_SUBMITTED', module: 'foundations', score, correctLessons: [] });

  it('pays only for improvement over the best score', () => {
    const a = run(fresh(), [[quiz(3)]]);
    expect(xpOf(a.effects)).toBe(3 * XP_PER_QUIZ_POINT);
    const b = run(a.state, [[quiz(3)]]);
    expect(xpOf(b.effects)).toBe(0);
    const c = run(b.state, [[quiz(4)]]);
    expect(xpOf(c.effects)).toBe(XP_PER_QUIZ_POINT);
    expect(c.state.modules.foundations.quiz.best).toBe(4);
  });

  it('stops paying after the daily attempt allowance but still records attempts', () => {
    let s = fresh();
    for (let i = 0; i < MAX_QUIZ_XP_ATTEMPTS_PER_DAY; i++) s = run(s, [[quiz(0)]]).state;
    const r = run(s, [[quiz(5)]]);
    expect(xpOf(r.effects)).toBe(0);
    expect(r.state.modules.foundations.quiz.best).toBe(5);
    expect(r.state.modules.foundations.quiz.attempts).toBe(MAX_QUIZ_XP_ATTEMPTS_PER_DAY + 1);
  });

  it('allowance resets the next day', () => {
    let s = fresh();
    for (let i = 0; i < MAX_QUIZ_XP_ATTEMPTS_PER_DAY; i++) s = run(s, [[quiz(0)]]).state;
    const r = run(s, [[quiz(2), T0 + DAY]]);
    expect(xpOf(r.effects)).toBeGreaterThan(0);
  });

  it('clamps nonsense scores', () => {
    const r = run(fresh(), [[quiz(99)]]);
    expect(r.state.modules.foundations.quiz.best).toBe(5);
  });
});

describe('challenge', () => {
  const pass = getModule('foundations').challenge.passMark;
  const finish = (score: number, ms = 30000, timed = true): GameEvent => ({
    type: 'CHALLENGE_FINISHED', module: 'foundations', score, elapsedMs: ms, timed,
  });

  it('does not complete below the pass mark', () => {
    const r = run(fresh(), [[finish(pass - 1)]]);
    expect(r.state.modules.foundations.challenge.done).toBe(false);
    expect(xpOf(r.effects)).toBe(0);
  });

  it('pays the first clear with a time bonus, then a small repeat once a day', () => {
    const a = run(fresh(), [[finish(pass, 10000)]]);
    expect(xpOf(a.effects)).toBeGreaterThan(XP_CHALLENGE_FIRST);
    const b = run(a.state, [[finish(pass, 9000)]]);
    expect(xpOf(b.effects)).toBeGreaterThan(0);
    expect(xpOf(b.effects)).toBeLessThan(20);
    const c = run(b.state, [[finish(pass, 8000)]]);
    expect(xpOf(c.effects)).toBe(0);
    expect(c.state.modules.foundations.challenge.bestMs).toBe(8000);
  });

  it('untimed runs get no time bonus', () => {
    const timed = run(fresh(), [[finish(pass, 1000, true)]]);
    const untimed = run(fresh(), [[finish(pass, 1000, false)]]);
    expect(xpOf(untimed.effects)).toBeLessThan(xpOf(timed.effects));
  });
});

describe('actions and review', () => {
  it('pays each centerpiece action once and rejects unknown ones', () => {
    const e: GameEvent = { type: 'ACTION', module: 'foundations', action: 'mode-orbit' };
    const a = run(fresh(), [[e]]);
    expect(xpOf(a.effects)).toBe(XP_ACTION);
    expect(xpOf(run(a.state, [[e]]).effects)).toBe(0);
    const s = fresh();
    expect(applyEvent(s, { type: 'ACTION', module: 'foundations', action: 'nope' }, T0).state).toBe(s);
  });

  it('only practiced lessons can be reviewed, once a day', () => {
    const rev: GameEvent = { type: 'LESSON_REVIEWED', module: 'foundations', lesson: 'a1' };
    const s0 = fresh();
    expect(applyEvent(s0, rev, T0).state).toBe(s0);
    const s1 = run(s0, [[{ type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a1', correct: true, firstTry: true }]]).state;
    const a = run(s1, [[rev, T0 + 4 * DAY]]);
    expect(xpOf(a.effects)).toBeGreaterThan(0);
    expect(xpOf(run(a.state, [[rev, T0 + 4 * DAY + 1000]]).effects)).toBe(0);
  });

  it('lists lessons due for spaced review after three days', () => {
    const s = run(fresh(), [[{ type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a1', correct: true, firstTry: true }]]).state;
    expect(dueReviews(s, T0 + DAY)).toHaveLength(0);
    expect(dueReviews(s, T0 + 4 * DAY)).toEqual([{ module: 'foundations', lesson: 'a1' }]);
  });
});

describe('streaks and caps', () => {
  const open = (n: number): GameEvent => ({ type: 'LESSON_OPENED', module: 'foundations', lesson: `a${n}` });

  it('counts consecutive days, resets after a gap, and tracks the best', () => {
    let s = run(fresh(), [[open(1), T0]]).state;
    expect(s.streak.current).toBe(1);
    s = run(s, [[open(2), T0 + DAY]]).state;
    expect(s.streak.current).toBe(2);
    s = run(s, [[open(3), T0 + DAY + 1000]]).state;
    expect(s.streak.current).toBe(2);
    s = run(s, [[open(4), T0 + 4 * DAY]]).state;
    expect(s.streak.current).toBe(1);
    expect(s.streak.best).toBe(2);
  });

  it('browsing alone never starts a streak', () => {
    const s = fresh();
    const r = applyEvent(s, { type: 'ONBOARDED' }, T0);
    expect(r.state.streak.current).toBe(0);
  });

  it('grows the multiplier with the streak up to its cap', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(1)).toBe(1);
    expect(streakMultiplier(3)).toBeCloseTo(1.1);
    expect(streakMultiplier(100)).toBe(1.5);
  });

  it('applies the daily soft cap', () => {
    let s = fresh();
    let paid = 0;
    // Finish and re-clear everything possible across all modules in one day.
    const events: GameEvent[] = [];
    for (const m of MODULES) {
      for (const l of m.lessons) events.push({ type: 'LESSON_CHECKED', module: m.id, lesson: l.id, correct: true, firstTry: true });
      for (const a of m.requiredActions) events.push({ type: 'ACTION', module: m.id, action: a.id });
    }
    for (const e of events) {
      const r = applyEvent(s, e, T0);
      s = r.state;
      paid += xpOf(r.effects);
    }
    expect(s.today.xp).toBe(paid);
    expect(paid).toBeGreaterThan(DAILY_SOFT_CAP);
    expect(paid).toBeLessThan(events.length * 60);
  });
});

describe('progress and badges', () => {
  function completeModule(id: 'foundations' | 'synthesis' | 'ethics', s: PersistedState, at = T0): { state: PersistedState; effects: Effect[] } {
    const m = getModule(id);
    const events: Array<[GameEvent, number]> = [];
    for (const l of m.lessons) events.push([{ type: 'LESSON_CHECKED', module: id, lesson: l.id, correct: true, firstTry: true }, at]);
    for (const a of m.requiredActions) events.push([{ type: 'ACTION', module: id, action: a.id }, at]);
    events.push([{ type: 'QUIZ_SUBMITTED', module: id, score: 5, correctLessons: m.lessons.map((l) => l.id) }, at]);
    events.push([{ type: 'CHALLENGE_FINISHED', module: id, score: m.challenge.passMark, elapsedMs: 30000, timed: true }, at]);
    return run(s, events);
  }

  it('reaches 100 and unlocks the badge exactly once', () => {
    const r = completeModule('foundations', fresh());
    expect(r.state.modules.foundations.progress).toBe(100);
    expect(r.state.modules.foundations.badge).toBe(true);
    expect(r.effects.filter((e) => e.type === 'badge')).toHaveLength(1);
    expect(isBadgeEarned('foundations', r.state.modules.foundations)).toBe(true);
    const again = run(r.state, [[{ type: 'QUIZ_SUBMITTED', module: 'foundations', score: 5, correctLessons: [] }]]);
    expect(again.effects.filter((e) => e.type === 'badge')).toHaveLength(0);
  });

  it('does not unlock a badge when any requirement is missing', () => {
    const s = fresh();
    expect(computeModuleProgress('ethics', s.modules.ethics)).toBe(0);
    expect(isBadgeEarned('ethics', s.modules.ethics)).toBe(false);
    const r = run(s, [[{ type: 'QUIZ_SUBMITTED', module: 'ethics', score: 5, correctLessons: [] }]]);
    expect(r.state.modules.ethics.badge).toBe(false);
  });

  it('averages overall progress across modules', () => {
    const r = completeModule('foundations', fresh());
    expect(overallProgress(r.state)).toBe(Math.round((100 + r.state.modules.synthesis.progress + r.state.modules.ethics.progress) / 3));
  });
});

describe('recommendNext', () => {
  it('starts at lesson 1 for new users', () => {
    const r = recommendNext(fresh(), T0);
    expect(r.kind).toBe('start');
    expect(r.href).toBe('/modules/foundations/lessons/1');
  });

  it('resumes the last module and then moves through lessons, actions, quiz, challenge', () => {
    let s = run(fresh(), [[{ type: 'LESSON_CHECKED', module: 'synthesis', lesson: 'b1', correct: true, firstTry: true }]]).state;
    let r = recommendNext(s, T0);
    expect(r.module).toBe('synthesis');
    expect(r.href).toBe('/modules/synthesis/lessons/2');
    const m = getModule('synthesis');
    s = run(s, m.lessons.slice(1).map((l) => [{ type: 'LESSON_CHECKED', module: 'synthesis', lesson: l.id, correct: true, firstTry: true }] as [GameEvent])).state;
    expect(recommendNext(s, T0).kind).toBe('centerpiece');
    s = run(s, m.requiredActions.map((a) => [{ type: 'ACTION', module: 'synthesis', action: a.id }] as [GameEvent])).state;
    expect(recommendNext(s, T0).kind).toBe('quiz');
    s = run(s, [[{ type: 'QUIZ_SUBMITTED', module: 'synthesis', score: 4, correctLessons: [] }]]).state;
    r = recommendNext(s, T0);
    expect(r.kind).toBe('challenge');
  });

  it('recommends spaced review once every badge is earned', () => {
    let s = fresh();
    for (const m of MODULES) {
      const ev: Array<[GameEvent]> = [];
      for (const l of m.lessons) ev.push([{ type: 'LESSON_CHECKED', module: m.id, lesson: l.id, correct: true, firstTry: true }]);
      for (const a of m.requiredActions) ev.push([{ type: 'ACTION', module: m.id, action: a.id }]);
      ev.push([{ type: 'QUIZ_SUBMITTED', module: m.id, score: 5, correctLessons: [] }]);
      ev.push([{ type: 'CHALLENGE_FINISHED', module: m.id, score: m.challenge.passMark, elapsedMs: 1000, timed: false }]);
      s = run(s, ev).state;
    }
    expect(recommendNext(s, T0 + 60000).kind).toBe('complete');
    expect(recommendNext(s, T0 + 5 * DAY).kind).toBe('review');
  });
});
