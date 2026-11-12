import { describe, expect, it } from 'vitest';
import { CABINET_ROUNDS, evaluate, predict } from '../src/game/logic/cabinet';
import { FRAME_ROUNDS, accuracy, loss, step } from '../src/game/logic/frame';
import { CORRECT_ORDER, MILESTONES, START_ORDER, correctCount, isSolved, move, starsFor } from '../src/game/logic/timeline';
import { CAP, ORDERS, forge } from '../src/game/logic/anvil';
import { CASES, grade, type Flag } from '../src/game/logic/weld';
import { AUDIT_ROUNDS, run, slice, type Feature } from '../src/game/logic/audit';
import { LOCATIONS, RELICS, STATIONS, stationById } from '../src/game/data';
import { applyEvent, createState, gameProgress, isUnlocked, levelInfo, nextGoal, stationDone, MISSIONS } from '../src/engine/progress';
import { sanitize } from '../src/engine/persistence';
import { rng } from '../src/widgets/logic/random';

describe('Curator\'s Cabinet', () => {
  it('has three rounds with a budget and hidden test moths', () => {
    expect(CABINET_ROUNDS).toHaveLength(3);
    for (const r of CABINET_ROUNDS) expect(r.test.length).toBeGreaterThanOrEqual(30);
  });
  it('is not passed by random label picks most of the time', () => {
    for (const r of CABINET_ROUNDS.slice(0, 2)) {
      const rand = rng(1);
      let pass = 0;
      for (let t = 0; t < 600; t++) {
        const idx = new Set<number>();
        while (idx.size < r.budget) idx.add(Math.floor(rand() * r.pool.length));
        if (evaluate(r.pool.filter((m) => idx.has(m.id)), r).pass) pass++;
      }
      expect(pass / 600).toBeLessThan(0.3);
    }
  });
  it('round 3 cannot be passed from the west pool alone, but can once scouts add the east', () => {
    const r = CABINET_ROUNDS[2]!;
    expect(evaluate(r.pool, r).pass).toBe(false);
    expect(evaluate([...r.pool, ...r.scouts!], r).pass).toBe(true);
  });
  it('has fixed solutions that the automated playthrough relies on', () => {
    const pick = (r: (typeof CABINET_ROUNDS)[number], ids: number[]) => [...r.pool, ...(r.scouts ?? [])].filter((m) => ids.includes(m.id));
    expect(evaluate(pick(CABINET_ROUNDS[0]!, [0, 3, 8, 15]), CABINET_ROUNDS[0]!).pass).toBe(true);
    expect(evaluate(pick(CABINET_ROUNDS[1]!, [0, 3, 5, 6, 14, 22]), CABINET_ROUNDS[1]!).pass).toBe(true);
    const r3 = CABINET_ROUNDS[2]!;
    expect(evaluate(pick(r3, [1, 5, 16, 25]), r3).pass).toBe(false);
    expect(evaluate(pick(r3, [1, 5, 16, 25, 500, 506, 507, 511]), r3).pass).toBe(true);
  });
  it('never puts two moths on top of each other', () => {
    for (const r of CABINET_ROUNDS) {
      const all = [...r.pool, ...(r.scouts ?? [])];
      for (const a of all) for (const b of all) if (a.id < b.id) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(4);
    }
  });
  it('predicts the nearest labeled neighbor', () => {
    const r = CABINET_ROUNDS[0]!;
    expect(predict([], 1, 1)).toBeNull();
    const a = r.pool[0]!;
    expect(predict([a], 50, 50)).toBe(a.kind);
  });
});

describe('Weight Frame', () => {
  it('every round has a perfect answer and gradient descent finds one', () => {
    for (const r of FRAME_ROUNDS) {
      expect(accuracy(r.answer, r.threads).pct).toBe(100);
      let d = { w1: 0, w2: 0, b: 0 };
      const start = loss(d, r.threads);
      for (let i = 0; i < 300; i++) d = step(d, r.threads);
      expect(loss(d, r.threads)).toBeLessThan(start);
      expect(accuracy(d, r.threads).pct).toBe(100);
    }
  });
  it('the dials at zero do not sort anything', () => {
    for (const r of FRAME_ROUNDS) expect(accuracy({ w1: 0, w2: 0, b: 0 }, r.threads).pct).toBeLessThan(100);
  });
  it('round 3 cannot be solved without the bias', () => {
    const r = FRAME_ROUNDS[2]!;
    let best = 0;
    for (let w1 = -6; w1 <= 6; w1 += 0.5) for (let w2 = -6; w2 <= 6; w2 += 0.5) best = Math.max(best, accuracy({ w1, w2, b: 0 }, r.threads).pct);
    expect(best).toBeLessThan(100);
  });
});

describe('Timeline of Minds', () => {
  it('has seven milestones with distinct years and clues that hide the year', () => {
    expect(MILESTONES).toHaveLength(7);
    expect(new Set(MILESTONES.map((m) => m.year)).size).toBe(7);
    for (const m of MILESTONES) expect(m.clue).not.toContain(String(m.year));
  });
  it('starts unsolved and solves when sorted', () => {
    expect(isSolved(START_ORDER)).toBe(false);
    expect(correctCount(START_ORDER)).toBeLessThan(7);
    expect(isSolved(CORRECT_ORDER)).toBe(true);
  });
  it('moves cards and awards fewer stars for more guesses', () => {
    expect(move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(move(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
    expect(starsFor(3)).toBe(3);
    expect(starsFor(6)).toBe(2);
    expect(starsFor(12)).toBe(1);
  });
});

describe('Anvil Orders', () => {
  const best = (o: (typeof ORDERS)[number]) => o.needs.map((t) => o.pieces.find((p) => p.tag === t && p.fits && !p.leaks)!.id);
  it('each order is solved by one good piece per need, within the cap', () => {
    for (const o of ORDERS) {
      const ids = best(o);
      expect(ids.length).toBeLessThanOrEqual(CAP);
      expect(forge(o, ids).pass).toBe(true);
    }
  });
  it('a missing need or a leaked private detail fails', () => {
    const o3 = ORDERS[2]!;
    expect(forge(o3, best(o3).slice(1)).pass).toBe(false);
    const leaky = best(o3).map((id) => (id === 'o3-c2' ? 'o3-c1' : id));
    const v = forge(o3, leaky);
    expect(v.leaks).toHaveLength(1);
    expect(v.pass).toBe(false);
  });
  it('vague filler never meets a need', () => {
    const o = ORDERS[0]!;
    expect(forge(o, ['o1-x1', 'o1-x2']).met).toEqual([]);
    expect(forge(o, ['o1-t2', 'o1-a2', 'o1-f2']).pass).toBe(false);
  });
});

describe('Weld Test', () => {
  const perfect = (c: (typeof CASES)[number]): Record<string, Flag> => Object.fromEntries(c.claims.map((cl) => [cl.id, (cl.truth === 'supported' ? 'keep' : 'cut') as Flag]));
  it('marking every claim correctly passes', () => {
    for (const c of CASES) expect(grade(c, perfect(c)).pass).toBe(true);
  });
  it('keeping everything fails, and so does leaving claims unmarked', () => {
    for (const c of CASES) {
      expect(grade(c, Object.fromEntries(c.claims.map((cl) => [cl.id, 'keep']))).pass).toBe(false);
      expect(grade(c, {}).pass).toBe(false);
    }
  });
  it('one miss is allowed, unless it is a high-stakes claim', () => {
    const c = CASES[0]!;
    const flags = perfect(c);
    flags['c3'] = 'cut';
    expect(grade(c, flags).pass).toBe(true);
    flags['c5'] = 'keep';
    expect(grade(c, flags).pass).toBe(false);
  });
  it('every case has more false claims than tests, so triage is real', () => {
    for (const c of CASES) {
      expect(c.claims.filter((x) => x.truth !== 'supported').length).toBeGreaterThanOrEqual(c.tests);
      expect(c.claims.length).toBeGreaterThan(c.tests);
    }
  });
});

describe('Fairness Audit', () => {
  it('leaving every feature on fails each round, and removing the proxies passes it', () => {
    for (const r of AUDIT_ROUNDS) {
      expect(run(r, { on: new Set<Feature>(r.features), review: false }).pass).toBe(false);
      expect(run(r, { on: new Set(r.features.filter((f) => !r.proxies.includes(f))), review: false }).pass).toBe(true);
    }
  });
  it('removing a legitimate feature does not fix it', () => {
    for (const r of AUDIT_ROUNDS) expect(run(r, { on: new Set(r.features.filter((f) => f !== 'grades')), review: false }).pass).toBe(false);
  });
  it('both districts have the same spread of ability, so a gap is the screener\'s doing', () => {
    for (const r of AUDIT_ROUNDS) {
      const q = (d: string) => r.applicants.filter((a) => a.district === d && a.qualified).length;
      expect(Math.abs(q('North') - q('South'))).toBeLessThanOrEqual(3);
    }
  });
  it('slices report group sizes that add up', () => {
    const r = AUDIT_ROUNDS[0]!;
    const rows = slice(r, run(r, { on: new Set<Feature>(r.features), review: false }).approved, 'device');
    expect(rows.reduce((a, x) => a + x.n, 0)).toBe(r.applicants.length);
  });
});

describe('game progression', () => {
  const now = 1_700_000_000_000;
  it('pays a round once and marks the station done after its last round', () => {
    let s = createState(now);
    const r1 = applyEvent(s, { type: 'round', station: 'frame', round: 1 }, now);
    expect(r1.state.xp).toBe(40);
    s = r1.state;
    expect(applyEvent(s, { type: 'round', station: 'frame', round: 1 }, now).state.xp).toBe(40);
    s = applyEvent(s, { type: 'round', station: 'frame', round: 2 }, now).state;
    const last = applyEvent(s, { type: 'round', station: 'frame', round: 3 }, now);
    expect(last.rewards.some((r) => r.kind === 'station')).toBe(true);
    expect(stationDone(last.state, 'frame')).toBe(true);
  });
  it('ignores unknown stations, rounds and relics', () => {
    const s = createState(now);
    expect(applyEvent(s, { type: 'round', station: 'nope', round: 1 }, now).state.xp).toBe(0);
    expect(applyEvent(s, { type: 'round', station: 'frame', round: 9 }, now).state.xp).toBe(0);
    expect(applyEvent(s, { type: 'relic', id: 'nope' }, now).state.xp).toBe(0);
  });
  it('pays each relic and first visit once', () => {
    let s = createState(now);
    s = applyEvent(s, { type: 'relic', id: RELICS[0]!.id }, now).state;
    const again = applyEvent(s, { type: 'relic', id: RELICS[0]!.id }, now);
    expect(again.state.xp).toBe(s.xp);
    const v = applyEvent(s, { type: 'visit', room: 'loom' }, now).state;
    expect(v.xp).toBe(s.xp + 10);
    expect(applyEvent(v, { type: 'visit', room: 'loom' }, now).state.xp).toBe(v.xp);
    expect(applyEvent(s, { type: 'visit', room: 'quay' }, now).state.xp).toBe(s.xp);
  });
  it('locks the Archive and the Hall until the level, and free roam opens them', () => {
    let s = createState(now);
    expect(isUnlocked(s, 'loom')).toBe(true);
    expect(isUnlocked(s, 'archive')).toBe(false);
    expect(isUnlocked(s, 'hall')).toBe(false);
    s.xp = 130;
    expect(levelInfo(s.xp).level).toBe(2);
    expect(isUnlocked(s, 'archive')).toBe(true);
    expect(isUnlocked(s, 'hall')).toBe(false);
    s = applyEvent(s, { type: 'game', patch: { freeRoam: true } }, now).state;
    expect(isUnlocked(s, 'hall')).toBe(true);
  });
  it('completes a game mission only from cleared stations', () => {
    let s = createState(now);
    for (const st of ['cabinet', 'frame'] as const) for (let r = 1; r <= stationById(st)!.rounds; r++) s = applyEvent(s, { type: 'round', station: st, round: r }, now).state;
    expect(s.missions['curators-eye']).toBeTruthy();
    expect(s.missions['struck-and-tested']).toBeUndefined();
  });
  it('suggests a next goal and reports progress', () => {
    const s = createState(now);
    expect(nextGoal(s).room).toBe('loom');
    expect(gameProgress(s).stationsTotal).toBe(STATIONS.length);
  });
  it('survives a round trip through sanitize and drops bad game data', () => {
    let s = createState(now);
    s = applyEvent(s, { type: 'round', station: 'anvil', round: 2 }, now).state;
    s = applyEvent(s, { type: 'relic', id: 'five-parts' }, now).state;
    s = applyEvent(s, { type: 'game', patch: { at: 'foundry', started: true } }, now).state;
    const back = sanitize(JSON.parse(JSON.stringify(s)), now)!;
    expect(back.game).toEqual(s.game);
    const bad = JSON.parse(JSON.stringify(s));
    bad.game.stations.anvil.cleared = [2, 99, 'x'];
    bad.game.relics = { 'five-parts': 5, ghost: 7 };
    bad.game.at = 'moon';
    const clean = sanitize(bad, now)!;
    expect(clean.game.stations['anvil']!.cleared).toEqual([2]);
    expect(Object.keys(clean.game.relics)).toEqual(['five-parts']);
    expect(clean.game.at).toBe('quay');
  });
  it('remembers that the closing scene has been shown', () => {
    const s = applyEvent(createState(now), { type: 'game', patch: { ended: true } }, now).state;
    expect(s.game.ended).toBe(true);
    expect(sanitize(JSON.parse(JSON.stringify(s)), now)!.game.ended).toBe(true);
  });
  it('an older save without game data still loads', () => {
    const old = JSON.parse(JSON.stringify(createState(now)));
    delete old.game;
    expect(sanitize(old, now)!.game.started).toBe(false);
  });
});

describe('world data', () => {
  it('has a quay plus six buildings, with doors in order along the quay', () => {
    expect(LOCATIONS).toHaveLength(7);
    const doors = LOCATIONS.filter((l) => l.id !== 'quay').map((l) => l.doorX);
    expect([...doors].sort((a, b) => a - b)).toEqual(doors);
  });
  it('every station lives in a real room and teaches one of the three required areas', () => {
    for (const st of STATIONS) {
      expect(LOCATIONS.some((l) => l.id === st.room)).toBe(true);
      expect(['understand', 'use', 'responsible']).toContain(st.area);
    }
    for (const area of ['understand', 'use', 'responsible']) expect(STATIONS.some((s) => s.area === area)).toBe(true);
  });
  it('relics are unique, sit in a real room, and teach every area', () => {
    expect(new Set(RELICS.map((r) => r.id)).size).toBe(RELICS.length);
    for (const r of RELICS) {
      expect(LOCATIONS.some((l) => l.id === r.room)).toBe(true);
      expect(r.text.length).toBeGreaterThan(80);
    }
    for (const area of ['understand', 'use', 'responsible']) expect(RELICS.filter((r) => r.area === area).length).toBeGreaterThanOrEqual(4);
  });
  it('game missions are in the mission list and reference only real things', () => {
    for (const id of ['curators-eye', 'struck-and-tested', 'honest-lamp', 'deep-time', 'relic-hunter', 'harbor-master']) expect(MISSIONS.some((m) => m.id === id)).toBe(true);
  });
});
