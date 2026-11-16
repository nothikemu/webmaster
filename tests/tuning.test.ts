import { describe, expect, it } from 'vitest';
import { DIAL_MAX, applyEvent, createState, tuningLeft, tuningPoints, tuningSpent, type PortalState } from '../src/engine/progress';
import { sanitize } from '../src/engine/persistence';
import { RELICS, STATIONS } from '../src/game/data';

const rich = (): PortalState => {
  const s = createState(0);
  for (const st of STATIONS) s.game.stations[st.id] = { cleared: Array.from({ length: st.rounds }, (_, i) => i + 1), plays: st.rounds };
  for (const r of RELICS) s.game.relics[r.id] = 1;
  return s;
};
const tune = (s: PortalState, dial: 'reach' | 'glow' | 'stride', level: number) => applyEvent(s, { type: 'tune', dial, level }, 1).state;

describe('the lantern dials', () => {
  it('start at zero with nothing to spend', () => {
    const s = createState(0);
    expect(s.game.tuning).toEqual({ reach: 0, glow: 0, stride: 0 });
    expect(tuningPoints(s)).toBe(0);
    expect(tune(s, 'reach', 3).game.tuning.reach).toBe(0);
  });

  it('pay points for finished work: rounds, relics, lessons and the certification', () => {
    const s = rich();
    // 16 rounds -> 8, 17 relics -> 4
    expect(tuningPoints(s)).toBe(8 + 4);
    s.lessons['u1'] = { learned: true, tryScore: 100, checkBest: 3, done: true };
    expect(tuningPoints(s)).toBe(12);
    s.challenges['certification'] = { best: 90, passed: true, plays: 1 };
    expect(tuningPoints(s)).toBe(13);
  });

  it('cannot be set above the points earned or above the top of a dial', () => {
    const s = rich(); // 12 points
    let t = tune(s, 'reach', 9);
    expect(t.game.tuning.reach).toBe(DIAL_MAX);
    t = tune(t, 'glow', 9);
    expect(t.game.tuning.glow).toBe(DIAL_MAX);
    t = tune(t, 'stride', 9);
    expect(tuningSpent(t.game.tuning)).toBe(12);
    expect(t.game.tuning.stride).toBe(2);
    expect(tuningLeft(t)).toBe(0);
  });

  it('can be moved freely, and reset', () => {
    let t = tune(rich(), 'reach', 5);
    t = tune(t, 'reach', 1);
    t = tune(t, 'stride', 4);
    expect(t.game.tuning).toEqual({ reach: 1, glow: 0, stride: 4 });
    expect(applyEvent(t, { type: 'tune-reset' }, 1).state.game.tuning).toEqual({ reach: 0, glow: 0, stride: 0 });
  });

  it('does not change the original state', () => {
    const s = rich();
    tune(s, 'reach', 3);
    expect(s.game.tuning.reach).toBe(0);
  });

  it('is saved, loaded, clamped, and a save cannot spend what it did not earn', () => {
    const good = tune(rich(), 'glow', 3);
    const back = sanitize(JSON.parse(JSON.stringify(good)), 5)!;
    expect(back.game.tuning.glow).toBe(3);
    const cheat = JSON.parse(JSON.stringify(createState(0)));
    cheat.game.tuning = { reach: 5, glow: 5, stride: 5 };
    expect(sanitize(cheat, 5)!.game.tuning).toEqual({ reach: 0, glow: 0, stride: 0 });
    const old = JSON.parse(JSON.stringify(createState(0)));
    delete old.game.tuning;
    expect(sanitize(old, 5)!.game.tuning).toEqual({ reach: 0, glow: 0, stride: 0 });
  });
});
