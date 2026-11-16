import { describe, expect, it } from 'vitest';
import { LEGACY_STORAGE_KEY, STORAGE_KEY, clear, exportJson, importJson, load, memoryStorage, save } from '../src/engine/persistence';
import { createState } from '../src/engine/progress';

describe('the rename from Tideweight to Parameter', () => {
  it('still loads a save made under the old name, and keeps it under the new one', () => {
    const storage = memoryStorage();
    const old = createState(1000);
    old.xp = 321;
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(old));
    const r = load(storage, 2000);
    expect(r.status).toBe('ok');
    expect(r.state.xp).toBe(321);
    expect(save(storage, r.state)).toBe(true);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).xp).toBe(321);
  });

  it('prefers the new save when both exist', () => {
    const storage = memoryStorage();
    const a = createState(1);
    a.xp = 10;
    const b = createState(1);
    b.xp = 99;
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(a));
    storage.setItem(STORAGE_KEY, JSON.stringify(b));
    expect(load(storage, 5).state.xp).toBe(99);
  });

  it('erasing progress removes both copies, so an erased save cannot come back', () => {
    const storage = memoryStorage();
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(createState(1)));
    storage.setItem(STORAGE_KEY, JSON.stringify(createState(1)));
    clear(storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(load(storage, 9).status).toBe('fresh');
  });

  it('imports files exported under either name', () => {
    const s = createState(1);
    s.xp = 40;
    const modern = exportJson(s);
    expect(importJson(modern, 1).ok).toBe(true);
    const legacy = modern.replace('"parameter-progress"', '"tideweight-progress"');
    const r = importJson(legacy, 1);
    expect(r.ok && r.state.xp).toBe(40);
    expect(importJson(modern.replace('"parameter-progress"', '"something-else"'), 1).ok).toBe(false);
  });
});
