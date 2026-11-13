import { describe, expect, it } from 'vitest';
import { RELICS, STATIONS } from '../src/game/data';
import { objective } from '../src/game/objective';
import { createState, type PortalState } from '../src/engine/progress';
import { SPOTS } from '../src/game3d/layout';

const fresh = (): PortalState => createState(0);
const clearAll = (s: PortalState, ids = STATIONS.map((x) => x.id)): PortalState => {
  for (const id of ids) {
    const st = STATIONS.find((x) => x.id === id)!;
    s.game.stations[id] = { cleared: Array.from({ length: st.rounds }, (_, i) => i + 1), plays: st.rounds };
  }
  return s;
};

describe('the objective tracker', () => {
  it('starts a new game with a door on the Quay', () => {
    const o = objective(fresh(), 'quay');
    expect(o.target).toEqual({ room: 'quay', spot: 'door:loom' });
    expect(o.title).toMatch(/Loom House/);
    expect(o.hint.length).toBeGreaterThan(10);
  });

  it('points at the station once you are inside the right room', () => {
    const o = objective(fresh(), 'loom');
    expect(o.target).toEqual({ room: 'loom', spot: 'station:cabinet' });
  });

  it('finishes the room you are in before sending you elsewhere', () => {
    const s = clearAll(fresh(), ['cabinet']);
    expect(objective(s, 'loom').target?.spot).toBe('station:frame');
    // standing in the Foundry with an unfinished station there, the Foundry comes first even though the Loom is earlier in the list
    expect(objective(fresh(), 'foundry').target?.spot).toBe('station:anvil');
  });

  it('sends you out of a room whose work is done, then to the next door', () => {
    const s = clearAll(fresh(), ['cabinet', 'frame']);
    expect(objective(s, 'loom').target).toEqual({ room: 'loom', spot: 'exit' });
    expect(objective(s, 'quay').target).toEqual({ room: 'quay', spot: 'door:foundry' });
  });

  it('only ever points at things that exist in the stage', () => {
    for (const here of ['quay', 'loom', 'foundry', 'beacon', 'archive', 'hall', 'office'] as const) {
      for (const open of [false, true]) {
        const s = fresh();
        s.game.freeRoam = open;
        s.xp = open ? 9999 : 0;
        const o = objective(s, here);
        if (o.target) expect(SPOTS[o.target.room].some((p) => p.id === o.target!.spot), `${here} ${o.id}`).toBe(true);
      }
    }
  });

  it('moves on to hidden relics, then to what is locked, then to the examination', () => {
    const s = clearAll(fresh(), STATIONS.filter((x) => x.room !== 'archive').map((x) => x.id));
    s.xp = 0;
    // level 1: the archive is locked, so the stations that can be done are done; relics in open rooms are next
    expect(objective(s, 'quay').id).toMatch(/^relics/);
    for (const r of RELICS) s.game.relics[r.id] = 1;
    expect(objective(s, 'quay').id).toMatch(/^level:/);
    s.game.freeRoam = true;
    clearAll(s);
    expect(objective(s, 'quay').target).toEqual({ room: 'quay', spot: 'door:hall' });
    expect(objective(s, 'hall').target).toEqual({ room: 'hall', spot: 'exam' });
  });
});
