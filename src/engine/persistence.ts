/**
 * Saving progress. Everything stays in this browser (localStorage). There are no accounts and nothing is sent anywhere.
 * `sanitize` rebuilds a clean state from untrusted JSON, so a corrupted or hand-edited save can never crash the app.
 * It is a learning tracker, not a security boundary: anyone can edit their own browser storage.
 */
import { BADGES, STATE_VERSION, createState, type ActivityItem, type ChallengeResult, type LessonProgress, type PortalState } from './progress';
import { LESSONS, PATHS } from '@/content/paths';
import { GLOSSARY } from '@/content/glossary';

export const STORAGE_KEY = 'tideweight/v1';
export const EXPORT_FORMAT = 'tideweight-progress';

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
    const probe = '__tideweight_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return { storage: window.localStorage, persistent: true };
  } catch {
    return { storage: memoryStorage(), persistent: false };
  }
}

const num = (v: unknown, lo: number, hi: number, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : fallback);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const LESSON_IDS = new Set(LESSONS.map((l) => l.id));
const BADGE_IDS = new Set(BADGES.map((b) => b.id));
const PATH_IDS = new Set(PATHS.map((p) => p.id as string));
const TERM_IDS = new Set(GLOSSARY.map((g) => g.id));
const CHALLENGE_KEY = /^[a-z0-9-]{1,40}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Rebuild a valid state from unknown JSON, or return null if it is not a Tideweight save at all. */
export function sanitize(raw: unknown, now: number): PortalState | null {
  if (!isObj(raw) || raw.v !== STATE_VERSION) return null;
  const s = createState(now);
  s.createdAt = num(raw.createdAt, 0, 8.64e15, now);
  s.xp = num(raw.xp, 0, 1_000_000);

  if (isObj(raw.lessons)) {
    for (const [id, v] of Object.entries(raw.lessons)) {
      if (!LESSON_IDS.has(id) || !isObj(v)) continue;
      const l: LessonProgress = {
        learned: v.learned === true,
        tryScore: num(v.tryScore, 0, 100),
        checkBest: num(v.checkBest, 0, 3),
        done: v.done === true,
      };
      if (typeof v.doneAt === 'number' && Number.isFinite(v.doneAt)) l.doneAt = v.doneAt;
      s.lessons[id] = l;
    }
  }
  if (isObj(raw.challenges)) {
    for (const [id, v] of Object.entries(raw.challenges)) {
      if (!CHALLENGE_KEY.test(id) || !isObj(v)) continue;
      const c: ChallengeResult = { best: num(v.best, 0, 100), passed: v.passed === true, plays: num(v.plays, 0, 100000) };
      s.challenges[id] = c;
    }
  }
  if (isObj(raw.badges)) for (const [id, t] of Object.entries(raw.badges)) if (BADGE_IDS.has(id) && typeof t === 'number') s.badges[id] = t;
  if (isObj(raw.pathsDone)) for (const [id, t] of Object.entries(raw.pathsDone)) if (PATH_IDS.has(id) && typeof t === 'number') s.pathsDone[id] = t;
  if (Array.isArray(raw.codex)) s.codex = [...new Set(raw.codex.filter((t): t is string => typeof t === 'string' && TERM_IDS.has(t)))];
  if (Array.isArray(raw.activity)) {
    s.activity = raw.activity
      .filter(isObj)
      .map((a): ActivityItem => ({ t: num(a.t, 0, 8.64e15), label: typeof a.label === 'string' ? a.label.slice(0, 120) : '', xp: num(a.xp, 0, 5000) }))
      .slice(0, 40);
  }
  if (isObj(raw.xpByDay)) {
    const days = Object.entries(raw.xpByDay)
      .filter(([k, v]) => DAY.test(k) && typeof v === 'number')
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 120);
    for (const [k, v] of days) s.xpByDay[k] = num(v, 0, 100000);
  }
  s.lastLesson = typeof raw.lastLesson === 'string' && LESSON_IDS.has(raw.lastLesson) ? raw.lastLesson : null;
  if (isObj(raw.settings)) {
    s.settings = {
      sound: raw.settings.sound === true,
      volume: typeof raw.settings.volume === 'number' ? Math.min(1, Math.max(0, raw.settings.volume)) : 0.6,
      name: typeof raw.settings.name === 'string' ? raw.settings.name.slice(0, 60) : '',
    };
  }
  return s;
}

export type LoadStatus = 'fresh' | 'ok' | 'recovered';

export function load(storage: StorageLike, now: number): { state: PortalState; status: LoadStatus } {
  let text: string | null = null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    text = null;
  }
  if (text === null) return { state: createState(now), status: 'fresh' };
  try {
    const state = sanitize(JSON.parse(text), now);
    if (state) return { state, status: 'ok' };
  } catch {
    // fall through to recovery
  }
  // Keep the unreadable save under another key so nothing is silently destroyed, then start fresh.
  try {
    storage.setItem(`${STORAGE_KEY}-unreadable`, text);
  } catch {
    // nothing more we can do
  }
  return { state: createState(now), status: 'recovered' };
}

export function save(storage: StorageLike, state: PortalState): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clear(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function exportJson(state: PortalState): string {
  return JSON.stringify({ format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), state }, null, 2);
}

export type ImportResult = { ok: true; state: PortalState } | { ok: false; reason: string };

export function importJson(text: string, now: number): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'That file is not valid JSON.' };
  }
  if (!isObj(parsed) || parsed.format !== EXPORT_FORMAT) return { ok: false, reason: 'That file is not a Tideweight progress export.' };
  const state = sanitize(parsed.state, now);
  return state ? { ok: true, state } : { ok: false, reason: 'The progress data in that file could not be read.' };
}
