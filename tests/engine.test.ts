import { describe, expect, it } from 'vitest';
import { BADGES, CHECK_PASS, XP, applyEvent, createState, levelInfo, lessonSteps, overallProgress, pathProgress, recommendNext, type GameEvent, type PortalState } from '@/engine/progress';
import { LESSONS, PATHS } from '@/content/paths';
import { exportJson, importJson, load, memoryStorage, sanitize, save, STORAGE_KEY } from '@/engine/persistence';

const T0 = Date.UTC(2026, 10, 8, 12);

function run(state: PortalState, events: GameEvent[], at = T0) {
  let s = state;
  const rewards = [];
  for (const e of events) {
    const r = applyEvent(s, e, at);
    s = r.state;
    rewards.push(...r.rewards);
  }
  return { s, rewards };
}

const finish = (id: string): GameEvent[] => {
  const l = LESSONS.find((x) => x.id === id)!;
  return [
    { type: 'learned', lesson: id },
    { type: 'tried', lesson: id, score: 100 },
    { type: 'checked', lesson: id, correct: l.check.length },
  ];
};

describe('XP and levels', () => {
  it('starts at level 1 with no XP', () => {
    const lv = levelInfo(0);
    expect(lv.level).toBe(1);
    expect(lv.floor).toBe(0);
    expect(lv.remaining).toBe(120);
  });
  it('levels rise at the published thresholds and cap at 10', () => {
    expect(levelInfo(119).level).toBe(1);
    expect(levelInfo(120).level).toBe(2);
    expect(levelInfo(4500).level).toBe(10);
    expect(levelInfo(99999).level).toBe(10);
    expect(levelInfo(99999).remaining).toBe(0);
  });
});

describe('earning XP', () => {
  it('pays for reading once, never twice', () => {
    const a = run(createState(T0), [{ type: 'learned', lesson: 'u1' }]);
    expect(a.s.xp).toBe(XP.learn);
    const b = run(a.s, [{ type: 'learned', lesson: 'u1' }, { type: 'learned', lesson: 'u1' }]);
    expect(b.s.xp).toBe(XP.learn);
  });
  it('pays the experiment in proportion to score, and only the improvement', () => {
    const a = run(createState(T0), [{ type: 'tried', lesson: 'u1', score: 50 }]);
    expect(a.s.xp).toBe(30);
    const b = run(a.s, [{ type: 'tried', lesson: 'u1', score: 40 }]);
    expect(b.s.xp).toBe(30);
    const c = run(b.s, [{ type: 'tried', lesson: 'u1', score: 100 }]);
    expect(c.s.xp).toBe(60);
  });
  it('pays the check per correct answer plus a one-time perfect bonus', () => {
    const a = run(createState(T0), [{ type: 'checked', lesson: 'u1', correct: 2 }]);
    expect(a.s.xp).toBe(2 * XP.checkPerQuestion);
    const b = run(a.s, [{ type: 'checked', lesson: 'u1', correct: 3 }]);
    expect(b.s.xp).toBe(3 * XP.checkPerQuestion + XP.checkPerfect);
    const c = run(b.s, [{ type: 'checked', lesson: 'u1', correct: 3 }]);
    expect(c.s.xp).toBe(b.s.xp);
  });
  it('cannot be ground: repeating a finished lesson adds nothing', () => {
    const once = run(createState(T0), finish('u1')).s;
    const again = run(once, [...finish('u1'), ...finish('u1')]).s;
    expect(again.xp).toBe(once.xp);
  });
  it('ignores unknown lessons and never mutates the previous state', () => {
    const s = createState(T0);
    const frozen = JSON.stringify(s);
    const r = applyEvent(s, { type: 'learned', lesson: 'nope' }, T0);
    expect(r.state.xp).toBe(0);
    applyEvent(s, { type: 'learned', lesson: 'u1' }, T0);
    expect(JSON.stringify(s)).toBe(frozen);
  });
});

describe('completing lessons and paths', () => {
  it('a lesson is done only when learn, experiment and check are all satisfied', () => {
    let s = createState(T0);
    s = run(s, [{ type: 'learned', lesson: 'u1' }, { type: 'tried', lesson: 'u1', score: 100 }]).s;
    expect(lessonSteps(s, 'u1').done).toBe(false);
    s = run(s, [{ type: 'checked', lesson: 'u1', correct: CHECK_PASS - 1 }]).s;
    expect(lessonSteps(s, 'u1').done).toBe(false);
    s = run(s, [{ type: 'checked', lesson: 'u1', correct: CHECK_PASS }]).s;
    expect(lessonSteps(s, 'u1').done).toBe(true);
  });
  it('an experiment below the pass mark does not count', () => {
    const lesson = LESSONS.find((l) => l.id === 'u3')!;
    const s = run(createState(T0), [{ type: 'tried', lesson: 'u3', score: lesson.widget.pass - 1 }]).s;
    expect(lessonSteps(s, 'u3').try).toBe(false);
  });
  it('finishing every lesson of a path completes it once and awards its badge', () => {
    const ids = PATHS[0]!.lessons.map((l) => l.id);
    const { s, rewards } = run(createState(T0), ids.flatMap(finish));
    expect(pathProgress(s, 'understand').pct).toBe(100);
    expect(rewards.filter((r) => r.kind === 'path')).toHaveLength(1);
    expect(s.badges['loom-keeper']).toBeDefined();
    expect(s.codex).toContain('neural-network');
  });
  it('overall progress counts finished lessons', () => {
    const { s } = run(createState(T0), finish('u1'));
    expect(overallProgress(s)).toMatchObject({ done: 1, total: 15 });
  });
});

describe('badges come only from real progress', () => {
  it('no badge from visiting, reading, or clicking', () => {
    const s = run(createState(T0), LESSONS.map((l) => ({ type: 'learned', lesson: l.id }) as GameEvent)).s;
    expect(Object.keys(s.badges)).toHaveLength(0);
  });
  it('Sharp Eye needs a perfect hallucination hunt', () => {
    const s99 = run(createState(T0), [{ type: 'tried', lesson: 'r2', score: 83 }]).s;
    expect(s99.badges['sharp-eye']).toBeUndefined();
    const s100 = run(createState(T0), [{ type: 'tried', lesson: 'r2', score: 100 }]).s;
    expect(s100.badges['sharp-eye']).toBeDefined();
  });
  it('Model Explorer needs the three model experiments', () => {
    let s = run(createState(T0), [{ type: 'tried', lesson: 'u2', score: 80 }, { type: 'tried', lesson: 'u3', score: 95 }]).s;
    expect(s.badges['model-explorer']).toBeUndefined();
    s = run(s, [{ type: 'tried', lesson: 'u4', score: 66 }]).s;
    expect(s.badges['model-explorer']).toBeDefined();
  });
  it('Prompt Smith needs two lessons and the lab challenge', () => {
    let s = run(createState(T0), [...finish('t2'), ...finish('t3')]).s;
    expect(s.badges['prompt-smith']).toBeUndefined();
    s = run(s, [{ type: 'challenge', id: 'lab-refine', score: 100, passMark: 100, xp: 60, label: 'x' }]).s;
    expect(s.badges['prompt-smith']).toBeDefined();
  });
  it('Fieldwork needs all six scenarios averaging 70 or more', () => {
    const ids = ['sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6'];
    const low = run(createState(T0), ids.map((id) => ({ type: 'challenge', id, score: 60, passMark: 60, xp: 25, label: id }) as GameEvent)).s;
    expect(low.badges['fieldwork']).toBeUndefined();
    const high = run(createState(T0), ids.map((id) => ({ type: 'challenge', id, score: 80, passMark: 60, xp: 25, label: id }) as GameEvent)).s;
    expect(high.badges['fieldwork']).toBeDefined();
  });
  it('the certification pays once and awards AI Literacy Master', () => {
    const a = run(createState(T0), [{ type: 'certification', score: 70, passMark: 80 }]).s;
    expect(a.challenges['certification']?.passed).toBe(false);
    expect(a.badges['literacy-master']).toBeUndefined();
    const b = run(a, [{ type: 'certification', score: 90, passMark: 80 }]).s;
    expect(b.badges['literacy-master']).toBeDefined();
    const xpAfter = b.xp;
    const c = run(b, [{ type: 'certification', score: 100, passMark: 80 }]).s;
    expect(c.xp).toBe(xpAfter);
  });
  it('every badge has a unique id and a stated way to earn it', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) expect(b.how.length).toBeGreaterThan(10);
  });
});

describe('level-up rewards and recommendations', () => {
  it('reports a level-up when XP crosses a threshold', () => {
    const { rewards } = run(createState(T0), finish('u1'));
    expect(rewards.some((r) => r.kind === 'level')).toBe(true);
  });
  it('recommends lesson 1 to a new player, then the one in progress, then the next', () => {
    let s = createState(T0);
    expect(recommendNext(s)).toMatchObject({ kind: 'lesson', lesson: 'u1' });
    s = run(s, [{ type: 'learned', lesson: 'u2' }]).s;
    expect(recommendNext(s)).toMatchObject({ lesson: 'u2' });
    s = run(s, finish('u2')).s;
    expect(recommendNext(s)).toMatchObject({ lesson: 'u1' });
  });
  it('recommends the certification once every lesson is done', () => {
    const s = run(createState(T0), LESSONS.flatMap((l) => finish(l.id))).s;
    expect(recommendNext(s).kind).toBe('certification');
  });
});

describe('persistence', () => {
  it('round-trips a state through storage', () => {
    const storage = memoryStorage();
    const s = run(createState(T0), finish('u1')).s;
    expect(save(storage, s)).toBe(true);
    const loaded = load(storage, T0);
    expect(loaded.status).toBe('ok');
    expect(loaded.state.xp).toBe(s.xp);
    expect(loaded.state.lessons['u1']?.done).toBe(true);
  });
  it('starts fresh when nothing is saved', () => {
    expect(load(memoryStorage(), T0).status).toBe('fresh');
  });
  it('recovers from corrupt JSON and keeps the unreadable data', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    const r = load(storage, T0);
    expect(r.status).toBe('recovered');
    expect(r.state.xp).toBe(0);
    expect(storage.getItem(`${STORAGE_KEY}-unreadable`)).toBe('{not json');
  });
  it('sanitizes hostile or malformed saves instead of trusting them', () => {
    const evil = {
      v: 1,
      xp: 'a lot',
      lessons: { u1: { learned: 'yes', tryScore: 9999, checkBest: -4, done: true }, fake: { learned: true }, __proto__: { x: 1 } },
      badges: { 'loom-keeper': 1, nonsense: 2 },
      codex: ['neural-network', 'not-a-term', 7],
      settings: { sound: 'true', volume: 12, name: 'x'.repeat(500) },
    };
    const s = sanitize(evil, T0)!;
    expect(s.xp).toBe(0);
    expect(s.lessons['u1']).toMatchObject({ learned: false, tryScore: 100, checkBest: 0, done: true });
    expect(s.lessons['fake']).toBeUndefined();
    expect(Object.keys(s.badges)).toEqual(['loom-keeper']);
    expect(s.codex).toEqual(['neural-network']);
    expect(s.settings.volume).toBe(1);
    expect(s.settings.name.length).toBe(60);
    expect(s.settings.sound).toBe(false);
  });
  it('rejects non-saves and wrong versions', () => {
    expect(sanitize(null, T0)).toBeNull();
    expect(sanitize([], T0)).toBeNull();
    expect(sanitize({ v: 99 }, T0)).toBeNull();
  });
  it('exports and re-imports progress, and rejects other files', () => {
    const s = run(createState(T0), finish('u2')).s;
    const r = importJson(exportJson(s), T0);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.state.xp).toBe(s.xp);
    expect(importJson('nope', T0).ok).toBe(false);
    expect(importJson(JSON.stringify({ format: 'something-else' }), T0).ok).toBe(false);
  });
});
