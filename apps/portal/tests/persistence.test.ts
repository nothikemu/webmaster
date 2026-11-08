/* eslint-disable @typescript-eslint/no-explicit-any -- mutation helpers poke arbitrary shapes on purpose */
import { describe, expect, it } from 'vitest';
import type { Caps } from '../src/core/caps';
import { createSigner } from '../src/core/integrity';
import {
  createMemoryStorage,
  exportProgress,
  loadState,
  parseImport,
  saveState,
} from '../src/core/persistence';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  canonicalize,
  createInitialState,
  validateState,
} from '../src/core/schema';
import { applyEvent } from '../src/core/gamification';
import { tsKernels } from '../src/core/wasm';

const signer = createSigner(tsKernels, { subtleCrypto: false } as Caps);
const NOW = new Date(2026, 10, 2, 12).getTime();
const SALT = 'aabbccddeeff00112233445566778899';

const withProgress = () =>
  applyEvent(createInitialState(NOW, SALT), { type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a1', correct: true, firstTry: true }, NOW).state;

describe('canonicalize', () => {
  it('sorts keys and drops undefined', () => {
    expect(canonicalize({ b: 1, a: [2, { d: 1, c: undefined }] })).toBe('{"a":[2,{"d":1}],"b":1}');
  });
});

describe('validateState', () => {
  it('accepts a fresh state and a progressed state', () => {
    expect(validateState(createInitialState(NOW, SALT)).ok).toBe(true);
    expect(validateState(withProgress()).ok).toBe(true);
  });

  const mutate = (fn: (s: Record<string, any>) => void): unknown => {
    const copy = JSON.parse(JSON.stringify(withProgress())) as Record<string, any>;
    fn(copy);
    return copy;
  };

  it('rejects out-of-range and wrongly typed fields', () => {
    expect(validateState(mutate((s) => (s.xp = -5))).ok).toBe(false);
    expect(validateState(mutate((s) => (s.xp = 1.5))).ok).toBe(false);
    expect(validateState(mutate((s) => (s.modules.ethics.progress = 140))).ok).toBe(false);
    expect(validateState(mutate((s) => (s.modules.ethics.quiz.best = 9))).ok).toBe(false);
    expect(validateState(mutate((s) => (s.modules.ethics.lessons.c1 = 'expert'))).ok).toBe(false);
    expect(validateState(mutate((s) => (s.streak.lastDay = 'yesterday'))).ok).toBe(false);
    expect(validateState(mutate((s) => (s.salt = 'short'))).ok).toBe(false);
    expect(validateState(mutate((s) => delete s.modules.synthesis)).ok).toBe(false);
    expect(validateState(null).ok).toBe(false);
    expect(validateState({ v: 99 }).ok).toBe(false);
  });

  it('drops unknown lesson and action ids instead of trusting them', () => {
    const r = validateState(mutate((s) => { s.modules.foundations.lessons.zz = 'mastered'; s.modules.foundations.actions.evil = true; }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.modules.foundations.lessons).not.toHaveProperty('zz');
      expect(r.state.modules.foundations.actions).not.toHaveProperty('evil');
    }
  });
});

describe('load and save', () => {
  it('starts fresh on empty storage', async () => {
    const r = await loadState(createMemoryStorage(), signer, NOW);
    expect(r.status).toBe('fresh');
    expect(r.state.xp).toBe(0);
    expect(r.state.sig).toMatch(/^[0-9a-f]{64}$/);
    expect(r.state.salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it('round-trips saved progress', async () => {
    const storage = createMemoryStorage();
    await saveState(storage, signer, withProgress());
    const r = await loadState(storage, signer, NOW);
    expect(r.status).toBe('ok');
    expect(r.state.modules.foundations.lessons.a1).toBe('mastered');
  });

  it('resets silently when the stored XP was edited', async () => {
    const storage = createMemoryStorage();
    await saveState(storage, signer, withProgress());
    const obj = JSON.parse(storage.getItem(STORAGE_KEY)!) as { xp: number };
    obj.xp += 5000;
    storage.setItem(STORAGE_KEY, JSON.stringify(obj));
    const r = await loadState(storage, signer, NOW);
    expect(r.status).toBe('recovered');
    expect(r.state.xp).toBe(0);
  });

  it('resets silently on corrupt JSON, bad shape, and a missing signature', async () => {
    for (const bad of ['{not json', '[]', '"x"', JSON.stringify({ ...createInitialState(NOW, SALT), sig: '' })]) {
      const storage = createMemoryStorage();
      storage.setItem(STORAGE_KEY, bad);
      expect((await loadState(storage, signer, NOW)).status).toBe('recovered');
    }
  });

  it('survives a storage that throws', async () => {
    const hostile = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect((await loadState(hostile, signer, NOW)).status).toBe('fresh');
    await expect(saveState(hostile, signer, withProgress())).resolves.toBeTruthy();
  });

  it('migrates the unsigned v0 beta format', async () => {
    const storage = createMemoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ xp: 120, streak: 4, modules: { foundations: { progress: 40, lessons: ['a1', 'a2', 'nope'] } } }));
    const r = await loadState(storage, signer, NOW);
    expect(r.status).toBe('migrated');
    expect(r.state.v).toBe(SCHEMA_VERSION);
    expect(r.state.xp).toBe(120);
    expect(r.state.streak.current).toBe(4);
    expect(r.state.modules.foundations.lessons).toEqual({ a1: 'seen', a2: 'seen' });
    expect(r.state.sig).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('export and import', () => {
  it('round-trips and re-salts the imported state', async () => {
    const original = withProgress();
    const text = await exportProgress(signer, original, NOW);
    const r = await parseImport(text, signer, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.modules.foundations.lessons.a1).toBe('mastered');
      expect(r.state.salt).not.toBe(original.salt);
      expect(r.state.sig).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('rejects edited, malformed and foreign files with a plain reason', async () => {
    const text = await exportProgress(signer, withProgress(), NOW);
    const edited = JSON.parse(text) as { state: { xp: number } };
    edited.state.xp = 999999;
    const r1 = await parseImport(JSON.stringify(edited), signer, NOW);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.reason).toMatch(/signature/i);
    expect((await parseImport('nope', signer, NOW)).ok).toBe(false);
    expect((await parseImport('{"hello":1}', signer, NOW)).ok).toBe(false);
  });
});
