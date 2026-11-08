/**
 * Persisted progress schema (version 1): types, defaults, hand-written validation, migration
 * from the legacy v0 beta format, and canonical JSON for signing.
 */
import { MODULES, MODULE_IDS, type ModuleId } from '../content';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'tsa-ai-portal/v1';
export const HISTORY_DAYS = 140;

export type Mastery = 'unseen' | 'seen' | 'practiced' | 'mastered';
export const MASTERY_ORDER: readonly Mastery[] = ['unseen', 'seen', 'practiced', 'mastered'];
export const masteryRank = (m: Mastery): number => MASTERY_ORDER.indexOf(m);

export interface ModuleState {
  /** Cached 0-100 completion, recomputed after every event. */
  progress: number;
  lessons: Record<string, Mastery>;
  /** Epoch ms of the last spaced review per lesson. */
  reviewedAt: Record<string, number>;
  quiz: { best: number; attempts: number; lastAt: number | null };
  challenge: { done: boolean; attempts: number; bestMs: number | null; bestScore: number };
  /** Centerpiece interactions completed (ids from the module's requiredActions). */
  actions: Record<string, true>;
  badge: boolean;
}

export interface Streak {
  current: number;
  best: number;
  lastDay: string | null;
}

export interface Counters {
  lessonsSeen: number;
  quizzesTaken: number;
  challengesCleared: number;
  perfectQuizzes: number;
  actions: number;
}

/** Per-day anti-grind bookkeeping. Persisted so a reload cannot reset it. */
export interface DailyLedger {
  day: string;
  xp: number;
  quizXpAttempts: Record<ModuleId, number>;
  challengeRepeatPaid: Record<ModuleId, boolean>;
}

export interface PersistedState {
  v: typeof SCHEMA_VERSION;
  salt: string;
  createdAt: number;
  updatedAt: number;
  xp: number;
  xpByDay: Record<string, number>;
  activeDays: Record<string, number>;
  streak: Streak;
  today: DailyLedger;
  last: { module: ModuleId; at: number } | null;
  modules: Record<ModuleId, ModuleState>;
  counters: Counters;
  unlocks: { onboarded: boolean };
  sig: string;
}

const perModule = <T>(make: (id: ModuleId) => T): Record<ModuleId, T> => ({
  foundations: make('foundations'),
  synthesis: make('synthesis'),
  ethics: make('ethics'),
});

export function emptyModuleState(): ModuleState {
  return {
    progress: 0,
    lessons: {},
    reviewedAt: {},
    quiz: { best: 0, attempts: 0, lastAt: null },
    challenge: { done: false, attempts: 0, bestMs: null, bestScore: 0 },
    actions: {},
    badge: false,
  };
}

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function emptyLedger(day: string): DailyLedger {
  return {
    day,
    xp: 0,
    quizXpAttempts: perModule(() => 0),
    challengeRepeatPaid: perModule(() => false),
  };
}

export function createInitialState(now: number, salt: string): PersistedState {
  return {
    v: SCHEMA_VERSION,
    salt,
    createdAt: now,
    updatedAt: now,
    xp: 0,
    xpByDay: {},
    activeDays: {},
    streak: { current: 0, best: 0, lastDay: null },
    today: emptyLedger(dayKey(now)),
    last: null,
    modules: perModule(() => emptyModuleState()),
    counters: { lessonsSeen: 0, quizzesTaken: 0, challengesCleared: 0, perfectQuizzes: 0, actions: 0 },
    unlocks: { onboarded: false },
    sig: '',
  };
}

/** JSON with sorted keys and no whitespace, so equal states always sign to equal strings. */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
}

/** The exact string that is signed: the state without its signature. */
export function signingPayload(state: PersistedState): string {
  const { sig: _sig, ...rest } = state;
  return canonicalize(rest);
}

// ---------------------------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; state: PersistedState }
  | { ok: false; issues: string[] };

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isInt = (v: unknown, lo: number, hi: number): v is number =>
  isNum(v) && Number.isInteger(v) && v >= lo && v <= hi;
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isMastery = (v: unknown): v is Mastery => typeof v === 'string' && MASTERY_ORDER.includes(v as Mastery);

const MAX_TS = 4102444800000; // 2100-01-01
const lessonIds: Record<ModuleId, Set<string>> = perModule(
  (id) => new Set(MODULES.find((m) => m.id === id)!.lessons.map((l) => l.id)),
);
const actionIds: Record<ModuleId, Set<string>> = perModule(
  (id) => new Set(MODULES.find((m) => m.id === id)!.requiredActions.map((a) => a.id)),
);

function readModule(id: ModuleId, raw: unknown, issues: string[]): ModuleState {
  const out = emptyModuleState();
  if (!isRec(raw)) {
    issues.push(`modules.${id}: not an object`);
    return out;
  }
  if (isInt(raw.progress, 0, 100)) out.progress = raw.progress;
  else issues.push(`modules.${id}.progress`);
  if (isRec(raw.lessons)) {
    for (const [k, v] of Object.entries(raw.lessons)) {
      if (!lessonIds[id].has(k)) continue;
      if (isMastery(v)) out.lessons[k] = v;
      else issues.push(`modules.${id}.lessons.${k}`);
    }
  } else issues.push(`modules.${id}.lessons`);
  if (isRec(raw.reviewedAt)) {
    for (const [k, v] of Object.entries(raw.reviewedAt)) {
      if (lessonIds[id].has(k) && isNum(v) && v >= 0 && v <= MAX_TS) out.reviewedAt[k] = v;
    }
  }
  if (isRec(raw.quiz)) {
    const q = raw.quiz;
    if (isInt(q.best, 0, 5)) out.quiz.best = q.best;
    else issues.push(`modules.${id}.quiz.best`);
    if (isInt(q.attempts, 0, 100000)) out.quiz.attempts = q.attempts;
    else issues.push(`modules.${id}.quiz.attempts`);
    if (q.lastAt === null || (isNum(q.lastAt) && q.lastAt >= 0 && q.lastAt <= MAX_TS)) out.quiz.lastAt = q.lastAt as number | null;
    else issues.push(`modules.${id}.quiz.lastAt`);
  } else issues.push(`modules.${id}.quiz`);
  if (isRec(raw.challenge)) {
    const c = raw.challenge;
    if (typeof c.done === 'boolean') out.challenge.done = c.done;
    else issues.push(`modules.${id}.challenge.done`);
    if (isInt(c.attempts, 0, 100000)) out.challenge.attempts = c.attempts;
    else issues.push(`modules.${id}.challenge.attempts`);
    if (c.bestMs === null || (isNum(c.bestMs) && c.bestMs >= 0 && c.bestMs <= 86_400_000)) out.challenge.bestMs = c.bestMs as number | null;
    else issues.push(`modules.${id}.challenge.bestMs`);
    if (isInt(c.bestScore, 0, 100)) out.challenge.bestScore = c.bestScore;
    else issues.push(`modules.${id}.challenge.bestScore`);
  } else issues.push(`modules.${id}.challenge`);
  if (isRec(raw.actions)) {
    for (const [k, v] of Object.entries(raw.actions)) if (actionIds[id].has(k) && v === true) out.actions[k] = true;
  } else issues.push(`modules.${id}.actions`);
  if (typeof raw.badge === 'boolean') out.badge = raw.badge;
  else issues.push(`modules.${id}.badge`);
  return out;
}

function readDayMap(raw: unknown, name: string, issues: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRec(raw)) {
    issues.push(name);
    return out;
  }
  for (const [k, v] of Object.entries(raw)) {
    if (isDay(k) && isInt(v, 0, 1_000_000)) out[k] = v;
    else issues.push(`${name}.${k}`);
  }
  return out;
}

/** Validates unknown input and rebuilds a clean state from whitelisted fields only. */
export function validateState(raw: unknown): ValidationResult {
  const issues: string[] = [];
  if (!isRec(raw)) return { ok: false, issues: ['root: not an object'] };
  if (raw.v !== SCHEMA_VERSION) return { ok: false, issues: [`v: expected ${SCHEMA_VERSION}`] };
  if (typeof raw.salt !== 'string' || !/^[0-9a-f]{32}$/.test(raw.salt)) issues.push('salt');
  if (typeof raw.sig !== 'string' || !/^([0-9a-f]{64})?$/.test(raw.sig)) issues.push('sig');
  if (!isNum(raw.createdAt) || raw.createdAt < 0 || raw.createdAt > MAX_TS) issues.push('createdAt');
  if (!isNum(raw.updatedAt) || raw.updatedAt < 0 || raw.updatedAt > MAX_TS) issues.push('updatedAt');
  if (!isInt(raw.xp, 0, 100_000_000)) issues.push('xp');

  const streakRaw = raw.streak;
  let streak: Streak = { current: 0, best: 0, lastDay: null };
  if (isRec(streakRaw) && isInt(streakRaw.current, 0, 100000) && isInt(streakRaw.best, 0, 100000) && (streakRaw.lastDay === null || isDay(streakRaw.lastDay))) {
    streak = { current: streakRaw.current, best: streakRaw.best, lastDay: streakRaw.lastDay as string | null };
  } else issues.push('streak');

  const todayRaw = raw.today;
  let today = emptyLedger('1970-01-01');
  if (isRec(todayRaw) && isDay(todayRaw.day) && isInt(todayRaw.xp, 0, 1_000_000) && isRec(todayRaw.quizXpAttempts) && isRec(todayRaw.challengeRepeatPaid)) {
    today = emptyLedger(todayRaw.day);
    today.xp = todayRaw.xp;
    for (const id of MODULE_IDS) {
      const q = todayRaw.quizXpAttempts[id];
      if (isInt(q, 0, 1000)) today.quizXpAttempts[id] = q;
      else issues.push(`today.quizXpAttempts.${id}`);
      today.challengeRepeatPaid[id] = todayRaw.challengeRepeatPaid[id] === true;
    }
  } else issues.push('today');

  let last: PersistedState['last'] = null;
  if (raw.last !== null) {
    if (isRec(raw.last) && typeof raw.last.module === 'string' && (MODULE_IDS as readonly string[]).includes(raw.last.module) && isNum(raw.last.at)) {
      last = { module: raw.last.module as ModuleId, at: raw.last.at };
    } else issues.push('last');
  }

  const modulesRaw = raw.modules;
  const modules = perModule(() => emptyModuleState());
  if (isRec(modulesRaw)) {
    for (const id of MODULE_IDS) modules[id] = readModule(id, modulesRaw[id], issues);
  } else issues.push('modules');

  const countersRaw = raw.counters;
  const counters = { lessonsSeen: 0, quizzesTaken: 0, challengesCleared: 0, perfectQuizzes: 0, actions: 0 };
  if (isRec(countersRaw)) {
    for (const key of Object.keys(counters) as Array<keyof Counters>) {
      const v = countersRaw[key];
      if (isInt(v, 0, 1_000_000)) counters[key] = v;
      else issues.push(`counters.${key}`);
    }
  } else issues.push('counters');

  const unlocksRaw = raw.unlocks;
  let onboarded = false;
  if (isRec(unlocksRaw) && typeof unlocksRaw.onboarded === 'boolean') onboarded = unlocksRaw.onboarded;
  else issues.push('unlocks');

  const xpByDay = readDayMap(raw.xpByDay, 'xpByDay', issues);
  const activeDays = readDayMap(raw.activeDays, 'activeDays', issues);

  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    state: {
      v: SCHEMA_VERSION,
      salt: raw.salt as string,
      createdAt: raw.createdAt as number,
      updatedAt: raw.updatedAt as number,
      xp: raw.xp as number,
      xpByDay,
      activeDays,
      streak,
      today,
      last,
      modules,
      counters,
      unlocks: { onboarded },
      sig: raw.sig as string,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------------------------

/**
 * Upgrades older payloads to the current shape. v0 was the unsigned beta format:
 * `{ xp, streak: number, modules: { [id]: { progress, lessons: string[] } } }`.
 * Returns null when the input is not recognisable as progress data.
 */
export function migrate(raw: unknown, now: number, salt: string): { data: unknown; migrated: boolean } | null {
  if (!isRec(raw)) return null;
  if (raw.v === SCHEMA_VERSION) return { data: raw, migrated: false };
  if (raw.v === undefined && (raw.version === 0 || raw.version === undefined) && ('xp' in raw || 'modules' in raw)) {
    const state = createInitialState(now, salt);
    if (isInt(raw.xp, 0, 100_000_000)) state.xp = raw.xp;
    if (isInt(raw.streak, 0, 100000)) state.streak = { current: raw.streak, best: raw.streak, lastDay: null };
    if (isRec(raw.modules)) {
      for (const id of MODULE_IDS) {
        const m = raw.modules[id];
        if (!isRec(m)) continue;
        if (Array.isArray(m.lessons)) {
          for (const l of m.lessons) if (typeof l === 'string' && lessonIds[id].has(l)) state.modules[id].lessons[l] = 'seen';
        }
      }
    }
    return { data: state, migrated: true };
  }
  return null;
}
