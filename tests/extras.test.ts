import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '@/content/glossary';
import { LESSONS, PATHS, lessonById } from '@/content/paths';
import { MENTORS, hookFor } from '@/content/cast';
import { MYTHS, mythForDay } from '@/content/myths';
import { buildDrill, maskTerm } from '@/content/drill';
import { TOOLS } from '@/content/tools';
import { LEVEL_FLOORS, LEVEL_NAMES, createState, dayKey, levelInfo, streak } from '@/engine/progress';

const DAY = 86_400_000;
const NOON = Date.parse('2026-11-10T12:00:00Z');

describe('streak', () => {
  const withDays = (offsets: number[]) => {
    const s = createState(NOON);
    for (const o of offsets) s.xpByDay[dayKey(NOON - o * DAY)] = 50;
    return s;
  };
  it('is zero with no activity', () => {
    expect(streak(createState(NOON), NOON)).toBe(0);
  });
  it('counts back from today', () => {
    expect(streak(withDays([0, 1, 2]), NOON)).toBe(3);
  });
  it('is not lost until a full day is missed', () => {
    expect(streak(withDays([1, 2]), NOON)).toBe(2);
    expect(streak(withDays([2, 3]), NOON)).toBe(0);
  });
  it('stops at the first gap', () => {
    expect(streak(withDays([0, 1, 3, 4]), NOON)).toBe(2);
  });
  it('ignores days recorded with zero XP', () => {
    const s = withDays([0]);
    s.xpByDay[dayKey(NOON - DAY)] = 0;
    expect(streak(s, NOON)).toBe(1);
  });
});

describe('ranks', () => {
  it('has a name and a floor for each of ten levels, rising', () => {
    expect(LEVEL_NAMES).toHaveLength(10);
    expect(LEVEL_FLOORS).toHaveLength(10);
    for (let i = 1; i < LEVEL_FLOORS.length; i++) expect(LEVEL_FLOORS[i]!).toBeGreaterThan(LEVEL_FLOORS[i - 1]!);
  });
  it('puts a player exactly on a floor into that level', () => {
    LEVEL_FLOORS.forEach((xp, i) => expect(levelInfo(xp).level).toBe(i + 1));
  });
});

describe('mentors', () => {
  it('give one hook to every lesson, and none to lessons that do not exist', () => {
    for (const l of LESSONS) expect(hookFor(l.path, l.id), l.id).toBeTruthy();
    for (const p of PATHS) {
      const ids = Object.keys(MENTORS[p.id].hooks);
      expect(ids.sort()).toEqual(p.lessons.map((l) => l.id).sort());
    }
  });
  it('keep hooks short enough to read at a glance', () => {
    for (const p of PATHS) for (const h of Object.values(MENTORS[p.id].hooks)) expect(h.length).toBeLessThan(240);
  });
});

describe('myth or fact', () => {
  it('has unique ids and points every item at a real lesson', () => {
    expect(new Set(MYTHS.map((m) => m.id)).size).toBe(MYTHS.length);
    for (const m of MYTHS) expect(lessonById(m.lesson), m.id).toBeTruthy();
  });
  it('mixes myths and facts so the answer cannot be guessed', () => {
    const facts = MYTHS.filter((m) => m.fact).length;
    expect(facts).toBeGreaterThanOrEqual(4);
    expect(MYTHS.length - facts).toBeGreaterThanOrEqual(4);
  });
  it('shows the same statement all day and a different one the next', () => {
    expect(mythForDay(NOON).id).toBe(mythForDay(NOON + 3_600_000).id);
    expect(mythForDay(NOON).id).not.toBe(mythForDay(NOON + DAY).id);
    expect(mythForDay(NOON, 1).id).toBe(mythForDay(NOON + DAY).id);
  });
});

describe('codex drill', () => {
  it('builds the asked number of questions, each with four distinct options and the right answer marked', () => {
    for (const seed of [1, 7, 99, 12345]) {
      const qs = buildDrill(GLOSSARY, seed, 10);
      expect(qs).toHaveLength(10);
      for (const q of qs) {
        if (q.kind !== 'single') throw new Error('drill questions are single choice');
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        const term = GLOSSARY.find((g) => g.term === q.options[q.answer]);
        expect(term).toBeTruthy();
        expect(q.explain.startsWith(`${term!.term}:`)).toBe(true);
      }
    }
  });
  it('never asks about the same term twice in one drill', () => {
    const qs = buildDrill(GLOSSARY, 5, 10);
    const answers = qs.map((q) => (q.kind === 'single' ? q.options[q.answer] : ''));
    expect(new Set(answers).size).toBe(answers.length);
  });
  it('is repeatable for a seed and different across seeds', () => {
    expect(buildDrill(GLOSSARY, 42)).toEqual(buildDrill(GLOSSARY, 42));
    expect(buildDrill(GLOSSARY, 42)).not.toEqual(buildDrill(GLOSSARY, 43));
  });
  it('never lets a definition give away its own term', () => {
    for (const g of GLOSSARY) {
      const bare = g.term.replace(/\s*\(.*\)\s*$/, '').toLowerCase();
      expect(maskTerm(g).toLowerCase().includes(bare), g.id).toBe(false);
    }
  });
});

describe('tool atlas', () => {
  it('gives every entry a source page and an ISO check date', () => {
    for (const t of TOOLS) {
      expect(t.access.source, t.id).toMatch(/^https:\/\//);
      expect(t.checkedOn, t.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('words unverified facts as reported, never as plain fact', () => {
    for (const t of TOOLS.filter((x) => !x.access.verified)) expect(t.access.age, t.id).toMatch(/Reported|Not read directly/);
  });
});

import { MISSIONS, MISSION_CATEGORIES, applyEvent, missionProgress, type GameEvent, type PortalState } from '@/engine/progress';
import { sanitize } from '@/engine/persistence';

const T = Date.UTC(2026, 10, 12, 12);
const play = (s: PortalState, evs: GameEvent[]) => {
  let state = s;
  const rewards: ReturnType<typeof applyEvent>['rewards'] = [];
  for (const e of evs) {
    const r = applyEvent(state, e, T);
    state = r.state;
    rewards.push(...r.rewards);
  }
  return { state, rewards };
};
/** Everything needed to finish one lesson. */
const lessonEvents = (id: string): GameEvent[] => {
  const l = lessonById(id)!;
  return [
    { type: 'learned', lesson: id },
    { type: 'tried', lesson: id, score: 100 },
    { type: 'checked', lesson: id, correct: l.check.length },
  ];
};

describe('missions', () => {
  it('have unique ids, real objectives and a known category', () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    for (const m of MISSIONS) {
      expect(MISSION_CATEGORIES, m.id).toContain(m.category);
      expect(m.objectives.length, m.id).toBeGreaterThan(0);
      expect(m.reward, m.id).toBeGreaterThan(0);
      for (const o of m.objectives) expect(o.to, o.label).toMatch(/^\//);
    }
  });
  it('are not complete for a new player, and no objective is already done', () => {
    const s = createState(T);
    for (const m of MISSIONS) expect(missionProgress(s, m), m.id).toMatchObject({ done: 0, complete: false });
  });
  it('cannot be completed by reading or visiting', () => {
    const { state } = play(createState(T), [{ type: 'learned', lesson: 'u1' }, { type: 'learned', lesson: 'u2' }]);
    expect(state.missions['first-light']).toBeUndefined();
  });
  it('complete when every objective is finished work, and pay exactly once', () => {
    const { state, rewards } = play(createState(T), [...lessonEvents('u1'), ...lessonEvents('u2')]);
    expect(state.missions['first-light']).toBe(T);
    expect(rewards.filter((r) => r.kind === 'mission')).toEqual([{ kind: 'mission', id: 'first-light' }]);
    const xp = state.xp;
    const again = play(state, [{ type: 'tried', lesson: 'u1', score: 100 }, { type: 'checked', lesson: 'u2', correct: 3 }]);
    expect(again.state.xp).toBe(xp);
    expect(again.rewards.filter((r) => r.kind === 'mission')).toHaveLength(0);
  });
  it('pay the reward they advertise', () => {
    const base = play(createState(T), [...lessonEvents('u1')]).state.xp;
    const after = play(play(createState(T), [...lessonEvents('u1')]).state, lessonEvents('u2')).state.xp;
    const m = MISSIONS.find((x) => x.id === 'first-light')!;
    // finishing u2 earns the lesson's own XP plus the mission bonus
    const lessonXp = 20 + 60 + (3 * 20 + 30) + 40;
    expect(after - base).toBe(lessonXp + m.reward);
  });
  it('are kept across a save and ignore unknown ids in a hand-edited file', () => {
    const { state } = play(createState(T), [...lessonEvents('u1'), ...lessonEvents('u2')]);
    const back = sanitize(JSON.parse(JSON.stringify({ ...state, missions: { ...state.missions, 'not-a-mission': 5, 'the-seal': 'yes' } })), T)!;
    expect(Object.keys(back.missions)).toEqual(['first-light']);
  });
});

describe('audio settings', () => {
  it('start with sound and music off, so nothing can play before the player asks', () => {
    const s = createState(T).settings;
    expect(s.sound).toBe(false);
    expect(s.music).toBe(false);
  });
  it('are saved, clamped, and default sensibly when an older save lacks them', () => {
    const raw = JSON.parse(JSON.stringify(createState(T)));
    raw.settings = { sound: true, music: true, volume: 7, sfxVolume: -3, musicVolume: 'loud', name: 'Ada' };
    const s = sanitize(raw, T)!.settings;
    expect(s).toMatchObject({ sound: true, music: true, volume: 1, sfxVolume: 0, musicVolume: 0.5, name: 'Ada' });
    const old = JSON.parse(JSON.stringify(createState(T)));
    old.settings = { sound: true, volume: 0.4, name: '' };
    expect(sanitize(old, T)!.settings).toMatchObject({ sound: true, music: false, volume: 0.4, sfxVolume: 0.8, musicVolume: 0.5 });
  });
});
