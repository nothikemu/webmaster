import { describe, expect, it } from 'vitest';
import { LOCATIONS, RELICS, STATIONS } from '../src/game/data';
import { ANGLES, FACADE_R, INTERIOR, LAMP_COUNT, QUAY_Z, SPOTS, START, WALK_R, building, doorFront, interiorSpawn, lampPos, nearestSpot, type BuildingId } from '../src/game3d/layout';

const buildings = LOCATIONS.filter((l) => l.id !== 'quay').map((l) => l.id as BuildingId);

describe('3D layout', () => {
  it('puts every station and relic exactly once, in the room the content says', () => {
    for (const st of STATIONS) {
      const found = Object.entries(SPOTS).flatMap(([room, spots]) => spots.filter((s) => s.kind === 'station' && s.ref === st.id).map(() => room));
      expect(found).toEqual([st.room]);
    }
    for (const r of RELICS) {
      const found = Object.entries(SPOTS).flatMap(([room, spots]) => spots.filter((s) => s.kind === 'relic' && s.ref === r.id).map(() => room));
      expect(found).toEqual([r.room]);
    }
  });

  it('has unique ids inside each room', () => {
    for (const spots of Object.values(SPOTS)) expect(new Set(spots.map((s) => s.id)).size).toBe(spots.length);
  });

  it('keeps every interior spot well inside its room, away from the walls', () => {
    for (const id of buildings) {
      const { w, d } = INTERIOR[id];
      for (const s of SPOTS[id]) {
        expect(Math.abs(s.x)).toBeLessThan(w / 2 - 0.6);
        expect(Math.abs(s.z)).toBeLessThan(d / 2);
      }
      const sp = interiorSpawn(id);
      expect(Math.abs(sp.x)).toBeLessThan(w / 2);
      expect(sp.z).toBeLessThan(d / 2 - 1);
    }
  });

  it('keeps every outdoor spot on the walkable plaza', () => {
    for (const s of SPOTS.quay) {
      expect(s.z).toBeLessThan(QUAY_Z);
      expect(Math.hypot(s.x, s.z)).toBeLessThan(WALK_R);
    }
    expect(START.z).toBeLessThan(QUAY_Z - 2);
  });

  it('gives each building a door outside and an exit inside that returns to the quay', () => {
    const doors = SPOTS.quay.filter((s) => s.kind === 'door');
    expect(doors.map((s) => s.ref).sort()).toEqual([...buildings].sort());
    for (const id of buildings) {
      const exit = SPOTS[id].find((s) => s.kind === 'door');
      expect(exit?.ref).toBe('quay');
      const front = doorFront(id);
      expect(Math.hypot(front.x, front.z)).toBeLessThan(FACADE_R);
    }
  });

  it('lines the buildings up from west to east with room between them', () => {
    const angles = buildings.map((b) => ANGLES[b]).sort((a, b) => a - b);
    for (let i = 1; i < angles.length; i++) expect(angles[i]! - angles[i - 1]!).toBeGreaterThanOrEqual(24);
    for (const id of buildings) {
      const b = building(id);
      expect(b.z).toBeLessThan(0);
    }
  });

  it('places the mentors where their rooms expect them', () => {
    expect(SPOTS.loom.some((s) => s.id === 'wren')).toBe(true);
    expect(SPOTS.foundry.some((s) => s.id === 'brannock')).toBe(true);
    expect(SPOTS.beacon.some((s) => s.id === 'sedge')).toBe(true);
  });

  it('finds the nearest spot only within its reach', () => {
    const wren = SPOTS.loom.find((s) => s.id === 'wren')!;
    expect(nearestSpot('loom', wren.x, wren.z)?.id).toBe('wren');
    expect(nearestSpot('loom', wren.x + 40, wren.z)).toBeUndefined();
  });

  it('stands fifteen lamps on the plaza, one for each lesson', () => {
    expect(LAMP_COUNT).toBe(15);
    for (let i = 0; i < LAMP_COUNT; i++) {
      const p = lampPos(i);
      expect(p.z).toBeLessThan(QUAY_Z - 2);
      expect(Math.hypot(p.x, p.z)).toBeLessThan(40);
    }
  });
});
