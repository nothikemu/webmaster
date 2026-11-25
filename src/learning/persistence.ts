/**
 * Saving the learner's place. Everything stays in this browser (localStorage). There are no accounts and nothing is sent anywhere.
 *
 * Earlier versions of the portal saved much more (points, levels, badges, game positions) under the keys `parameter/v1` and `tideweight/v1`.
 * Only the useful part of those saves is carried over: which lessons were finished and which had been opened. The old keys are left
 * exactly as they were, so nothing is erased behind the learner's back. They are removed only when the learner chooses to erase their data.
 */
import { LESSONS } from '@/content/modules';
import { STATE_VERSION, createState, type LearningState } from './state';

export const STORAGE_KEY = 'parameter/learning/v2';
export const OLD_KEYS = ['parameter/v1', 'tideweight/v1'] as const;
export const EXPORT_FORMAT = 'parameter-learning';
const OLD_EXPORT_FORMATS = ['parameter-progress', 'tideweight-progress'];

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
}

/** localStorage if it works (it can throw in private windows or when blocked), otherwise memory. */
export function pickStorage(): { storage: StorageLike; persistent: boolean } {
  try {
    const probe = '__parameter_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return { storage: window.localStorage, persistent: true };
  } catch {
    return { storage: memoryStorage(), persistent: false };
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const LESSON_IDS = new Set(LESSONS.map((l) => l.id));
const time = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 8.64e15 ? Math.round(v) : fallback);

function timeMap(raw: unknown, now: number): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObj(raw)) for (const [id, t] of Object.entries(raw)) if (LESSON_IDS.has(id)) out[id] = time(t, now);
  return out;
}

/** Rebuild a valid state from unknown JSON in the current format, or return null if it is not one. */
export function sanitize(raw: unknown, now: number): LearningState | null {
  if (!isObj(raw) || raw.v !== STATE_VERSION) return null;
  const s = createState();
  s.opened = timeMap(raw.opened, now);
  s.completed = timeMap(raw.completed, now);
  // a completed lesson has necessarily been opened
  for (const id of Object.keys(s.completed)) if (!s.opened[id]) s.opened[id] = s.completed[id]!;
  s.last = typeof raw.last === 'string' && LESSON_IDS.has(raw.last) ? raw.last : null;
  return s;
}

/** Take the learning state out of an earlier save: `{ v: 1, lessons: { id: { learned, done, doneAt, ... } }, ... }`. Everything else in it is ignored. */
export function fromEarlierSave(raw: unknown, now: number): LearningState | null {
  if (!isObj(raw) || raw.v !== 1 || !isObj(raw.lessons)) return null;
  const s = createState();
  for (const [id, v] of Object.entries(raw.lessons)) {
    if (!LESSON_IDS.has(id) || !isObj(v)) continue;
    if (v.done === true) {
      s.completed[id] = time(v.doneAt, now);
      s.opened[id] = s.completed[id]!;
    } else if (v.learned === true || (typeof v.tryScore === 'number' && v.tryScore > 0) || (typeof v.checkBest === 'number' && v.checkBest > 0)) {
      s.opened[id] = now;
    }
  }
  const last = raw.lastLesson;
  s.last = typeof last === 'string' && LESSON_IDS.has(last) ? last : null;
  return s;
}

export type LoadStatus = 'fresh' | 'ok' | 'migrated' | 'recovered';

export interface Loaded {
  state: LearningState;
  status: LoadStatus;
  /** For 'migrated': how many completed lessons were carried over. */
  carried: number;
}

export function load(storage: StorageLike, now: number): Loaded {
  let text: string | null = null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    text = null;
  }
  if (text !== null) {
    try {
      const state = sanitize(JSON.parse(text), now);
      if (state) return { state, status: 'ok', carried: 0 };
    } catch {
      // fall through to recovery
    }
    // Keep the unreadable save under another key so nothing is silently destroyed, then start fresh.
    try {
      storage.setItem(`${STORAGE_KEY}-unreadable`, text);
    } catch {
      // nothing more we can do
    }
    return { state: createState(), status: 'recovered', carried: 0 };
  }
  // Nothing in the new format yet: look for an earlier save, newest name first.
  for (const key of OLD_KEYS) {
    let old: string | null = null;
    try {
      old = storage.getItem(key);
    } catch {
      old = null;
    }
    if (old === null) continue;
    try {
      const state = fromEarlierSave(JSON.parse(old), now);
      if (state) {
        save(storage, state);
        return { state, status: 'migrated', carried: Object.keys(state.completed).length };
      }
    } catch {
      // an unreadable old save is left where it is
    }
  }
  return { state: createState(), status: 'fresh', carried: 0 };
}

export function save(storage: StorageLike, state: LearningState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Remove everything this site has stored on the device, including earlier saves. Only ever called after the learner confirms. */
export function clear(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY);
    storage.removeItem(`${STORAGE_KEY}-unreadable`);
    for (const key of OLD_KEYS) storage.removeItem(key);
  } catch {
    // ignore
  }
}

export function exportJson(state: LearningState): string {
  return JSON.stringify({ format: EXPORT_FORMAT, version: STATE_VERSION, exportedAt: new Date().toISOString(), state }, null, 2);
}

export type ImportResult = { ok: true; state: LearningState; carried: number } | { ok: false; reason: string };

/** Reads a file exported from this version, or from an earlier one (which carried much more; only lesson completion is kept). */
export function importJson(text: string, now: number): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'That file is not valid JSON.' };
  }
  if (!isObj(parsed) || typeof parsed.format !== 'string') return { ok: false, reason: 'That file is not an export from Parameter.' };
  if (parsed.format === EXPORT_FORMAT) {
    const state = sanitize(parsed.state, now);
    return state ? { ok: true, state, carried: Object.keys(state.completed).length } : { ok: false, reason: 'The learning data in that file could not be read.' };
  }
  if (OLD_EXPORT_FORMATS.includes(parsed.format)) {
    const state = fromEarlierSave(parsed.state, now);
    return state ? { ok: true, state, carried: Object.keys(state.completed).length } : { ok: false, reason: 'The data in that older export could not be read.' };
  }
  return { ok: false, reason: 'That file is not an export from Parameter.' };
}
