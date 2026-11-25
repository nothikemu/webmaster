import { describe, expect, it } from 'vitest';
import { LESSONS, MODULES, coreLessons } from '@/content/modules';
import { legacyPages, legacyRedirect } from '@/content/legacy';
import { ROUTES } from '@/content/routes';
import { STATE_VERSION, applyEvent, createState, moduleProgress, statusOf, suggestNext } from '@/learning/state';
import { EXPORT_FORMAT, STORAGE_KEY, clear, exportJson, fromEarlierSave, importJson, load, memoryStorage, sanitize, save } from '@/learning/persistence';

const NOW = 1_800_000_000_000;

describe('learning state is neutral', () => {
  it('has no points, levels, streaks, badges or scores anywhere in its shape', () => {
    const s = createState();
    expect(Object.keys(s).sort()).toEqual(['completed', 'last', 'opened', 'v']);
    const text = JSON.stringify(applyEvent(s, { type: 'complete', lesson: 'f1' }, NOW));
    for (const word of ['xp', 'level', 'streak', 'badge', 'score', 'points', 'rank']) expect(text.toLowerCase()).not.toContain(word);
  });
  it('opening a lesson records a visit; completing one is explicit and reversible', () => {
    let s = createState();
    expect(statusOf(s, 'f1')).toBe('not-started');
    s = applyEvent(s, { type: 'open', lesson: 'f1' }, NOW);
    expect(statusOf(s, 'f1')).toBe('started');
    s = applyEvent(s, { type: 'complete', lesson: 'f1' }, NOW + 1);
    expect(statusOf(s, 'f1')).toBe('complete');
    s = applyEvent(s, { type: 'uncomplete', lesson: 'f1' }, NOW + 2);
    expect(statusOf(s, 'f1')).toBe('started');
    expect(s.last).toBe('f1');
  });
  it('ignores events for lessons that do not exist, and nothing ever locks', () => {
    const s = createState();
    expect(applyEvent(s, { type: 'complete', lesson: 'nope' }, NOW)).toBe(s);
    // any lesson can be completed without finishing the ones before it
    const last = coreLessons(MODULES[2]!).at(-1)!;
    expect(statusOf(applyEvent(s, { type: 'complete', lesson: last.id }, NOW), last.id)).toBe('complete');
  });
  it('summarises module position and suggests the next unfinished core lesson', () => {
    let s = createState();
    for (const id of ['f1', 'u1']) s = applyEvent(s, { type: 'complete', lesson: id }, NOW);
    const p = moduleProgress(s, MODULES[0]!);
    expect(p.coreDone).toBe(2);
    expect(p.coreTotal).toBe(5);
    expect(p.next?.id).toBe('u3');
    expect(suggestNext(s)?.id).toBe('u3');
  });
});

describe('saving, and carrying over earlier saves', () => {
  it('round-trips through storage and through an export file', () => {
    const storage = memoryStorage();
    let s = createState();
    s = applyEvent(s, { type: 'complete', lesson: 'e5' }, NOW);
    expect(save(storage, s)).toBe(true);
    expect(load(storage, NOW).state).toEqual(s);
    const back = importJson(exportJson(s), NOW);
    expect(back.ok && back.state).toEqual(s);
    expect(JSON.parse(exportJson(s)).format).toBe(EXPORT_FORMAT);
  });
  it('carries over finished lessons from an earlier version, and leaves the earlier save untouched', () => {
    const storage = memoryStorage();
    const old = JSON.stringify({
      v: 1,
      xp: 940,
      badges: { first: NOW },
      lessons: { u1: { learned: true, tryScore: 80, checkBest: 3, done: true, doneAt: NOW - 5 }, u2: { learned: true, tryScore: 0, checkBest: 0, done: false }, zz: { done: true } },
      lastLesson: 'u2',
      game: { relics: { a: 1 } },
    });
    storage.setItem('parameter/v1', old);
    const r = load(storage, NOW);
    expect(r.status).toBe('migrated');
    expect(r.carried).toBe(1);
    expect(statusOf(r.state, 'u1')).toBe('complete');
    expect(r.state.completed['u1']).toBe(NOW - 5);
    expect(statusOf(r.state, 'u2')).toBe('started');
    expect(r.state.last).toBe('u2');
    expect(storage.getItem('parameter/v1')).toBe(old); // not erased
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull(); // saved in the new format
    expect(JSON.stringify(r.state)).not.toContain('940');
  });
  it('reads the oldest name too (tideweight), preferring the newer format when both exist', () => {
    const storage = memoryStorage();
    storage.setItem('tideweight/v1', JSON.stringify({ v: 1, lessons: { t1: { done: true, doneAt: NOW } } }));
    expect(statusOf(load(storage, NOW).state, 't1')).toBe('complete');
    const s2 = memoryStorage();
    s2.setItem('parameter/v1', JSON.stringify({ v: 1, lessons: { t1: { done: true, doneAt: NOW } } }));
    s2.setItem(STORAGE_KEY, JSON.stringify(applyEvent(createState(), { type: 'complete', lesson: 'u5' }, NOW)));
    const r = load(s2, NOW);
    expect(r.status).toBe('ok');
    expect(statusOf(r.state, 'u5')).toBe('complete');
    expect(statusOf(r.state, 't1')).toBe('not-started');
  });
  it('imports exports from earlier versions, keeping only lesson completion', () => {
    const file = JSON.stringify({ format: 'parameter-progress', exportedAt: 'x', state: { v: 1, xp: 5, lessons: { r1: { done: true, doneAt: NOW } } } });
    const r = importJson(file, NOW);
    expect(r.ok && statusOf(r.state, 'r1')).toBe('complete');
    expect(importJson('{"format":"something-else"}', NOW).ok).toBe(false);
    expect(importJson('not json', NOW).ok).toBe(false);
  });
  it('keeps an unreadable save under another key instead of destroying it', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');
    expect(load(storage, NOW).status).toBe('recovered');
    expect(storage.getItem(`${STORAGE_KEY}-unreadable`)).toBe('{broken');
  });
  it('sanitizes hand-edited data and erases everything, old keys included, only when asked', () => {
    expect(sanitize({ v: STATE_VERSION, completed: { f1: 'x', nope: 1 }, opened: {}, last: 'nope' }, NOW)?.completed).toEqual({ f1: NOW });
    expect(sanitize({ v: 99 }, NOW)).toBeNull();
    const storage = memoryStorage();
    storage.setItem('parameter/v1', '{}');
    storage.setItem(STORAGE_KEY, '{}');
    clear(storage);
    expect(storage.getItem('parameter/v1')).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(fromEarlierSave({ v: 2 }, NOW)).toBeNull();
  });
});

describe('old addresses never become broken pages', () => {
  it('sends the removed game, missions, certification and achievements pages somewhere real', () => {
    for (const old of ['/play', '/practice', '/missions', '/certification', '/achievements', '/challenges', '/challenge/foundations', '/challenge', '/lab', '/scenarios', '/codex', '/logbook', '/progress', '/learn']) {
      const r = legacyRedirect(old);
      expect(r, old).not.toBeNull();
      expect(ROUTES.includes(r!.to.split('#')[0]!), `${old} -> ${r!.to}`).toBe(true);
    }
    expect(legacyRedirect('/achievements')?.note).toMatch(/no longer has points/);
  });
  it('maps the three old paths, their lessons and the first version\'s lesson ids', () => {
    expect(legacyRedirect('/learn/understand')?.to).toBe('/modules/foundations');
    expect(legacyRedirect('/learn/use/t2')?.to).toBe('/modules/synthesis/roles-tasks-constraints');
    expect(legacyRedirect('/learn/responsible/r5')?.to).toBe('/modules/ethics/credit-copyright-honesty');
    expect(legacyRedirect('/modules/foundations/a3')?.to).toBe('/modules/foundations/neural-networks');
    expect(legacyRedirect('/modules/ethics/c3')?.to).toBe('/modules/ethics/adversarial-inputs');
  });
  it('does not redirect pages that exist', () => {
    for (const r of ROUTES) expect(legacyRedirect(r), r).toBeNull();
  });
  it('lists every old address that can be known in advance, all pointing at real pages', () => {
    const pages = legacyPages();
    expect(pages.length).toBeGreaterThan(20);
    for (const p of pages) expect(ROUTES.includes(p.redirect.to.split('#')[0]!), `${p.from} -> ${p.redirect.to}`).toBe(true);
    expect(LESSONS.length).toBeGreaterThan(15);
  });
});
