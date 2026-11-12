/**
 * The progress engine: pure functions, no React, no browser APIs.
 * `applyEvent(state, event, now)` returns the next state plus what the player should be told about.
 * Everything that earns XP or a badge is decided here, which makes the rules easy to test and to explain.
 *
 * Principles (shown to the player on the Logbook page):
 *  1. XP is paid for doing the thing, once. Repeating a step pays nothing.
 *  2. A better result on a scored step pays only the improvement.
 *  3. Badges are computed from what you actually completed, never from visits or clicks.
 */
import { PATHS, LESSONS, lessonById } from '@/content/paths';
import type { PathId } from '@/content/types';
import { GAME_XP, LOCATIONS, RELICS, STATIONS, locationById, relicById, stationById, type RoomId } from '@/game/data';

export const STATE_VERSION = 1;

// ---------- XP rules ----------
export const XP = {
  learn: 20, // read every beat of a lesson
  tryMax: 60, // experiment, in proportion to the best score
  checkPerQuestion: 20, // best number correct x 20
  checkPerfect: 30, // all questions right, once
  lessonDone: 40, // learn + experiment solved + check passed
  path: 150, // finish all lessons of a path
  badge: 100,
  certification: 300,
} as const;

export const CHECK_PASS = 2; // correct answers needed (of 3) to finish a lesson

const LEVELS = [0, 120, 320, 620, 1000, 1500, 2100, 2800, 3600, 4500] as const;
/** XP needed to reach each level, level 1 first. */
export const LEVEL_FLOORS: readonly number[] = LEVELS;
export const LEVEL_NAMES = [
  'Dockhand',
  'Lamplighter',
  'Scribe',
  'Surveyor',
  'Navigator',
  'Cartographer',
  'Wayfinder',
  'Harbor Warden',
  'Strategist',
  'Beacon Keeper',
] as const;

export interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  floor: number;
  next: number | null;
  /** XP still needed for the next level, or 0 at the top. */
  remaining: number;
  /** 0-100 progress within this level. */
  pct: number;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]!) level = i + 1;
  const floor = LEVELS[level - 1]!;
  const next = level < LEVELS.length ? LEVELS[level]! : null;
  return {
    level,
    name: LEVEL_NAMES[level - 1]!,
    xp,
    floor,
    next,
    remaining: next === null ? 0 : next - xp,
    pct: next === null ? 100 : Math.round(((xp - floor) / (next - floor)) * 100),
  };
}

// ---------- State ----------
export interface LessonProgress {
  learned: boolean;
  tryScore: number; // best experiment score, 0-100
  checkBest: number; // best correct answers, 0-3
  done: boolean;
  doneAt?: number;
}
export interface ChallengeResult {
  best: number; // 0-100
  passed: boolean;
  plays: number;
}
export interface ActivityItem {
  t: number;
  label: string;
  xp: number;
}
export interface Settings {
  /** Interface sounds on or off. */
  sound: boolean;
  /** Background music on or off. Both start off. */
  music: boolean;
  /** Master volume, 0-1. */
  volume: number;
  sfxVolume: number; // 0-1
  musicVolume: number; // 0-1
  /** The player's name. Optional; shown in the logbook and on the certificate, and never leaves the device. */
  name: string;
}
/** The explorable game: which stations are cleared, which relics are found, where the player stands. */
export interface GameState {
  /** Rounds cleared per station (1-based round numbers) and how many times it was played. */
  stations: Record<string, { cleared: number[]; plays: number }>;
  /** Relics found, with the time each was found. */
  relics: Record<string, number>;
  /** First entry into each building. */
  visited: Record<string, number>;
  /** The room the player last stood in. */
  at: RoomId;
  /** Opens every door, for reviewers and teachers. Rewards are unchanged. */
  freeRoam: boolean;
  /** False until the player has pressed Begin on the title screen. */
  started: boolean;
  /** True once the closing scene (every station cleared) has been shown. */
  ended: boolean;
}

export const emptyGame = (): GameState => ({ stations: {}, relics: {}, visited: {}, at: 'quay', freeRoam: false, started: false, ended: false });

export interface PortalState {
  v: number;
  createdAt: number;
  xp: number;
  lessons: Record<string, LessonProgress>;
  /** Scored side experiences: lab tasks, scenarios, certification. Keyed by id. */
  challenges: Record<string, ChallengeResult>;
  badges: Record<string, number>;
  /** Missions completed, with the time each was completed. */
  missions: Record<string, number>;
  pathsDone: Record<string, number>;
  codex: string[];
  activity: ActivityItem[];
  xpByDay: Record<string, number>;
  lastLesson: string | null;
  settings: Settings;
  game: GameState;
}

export const emptyLesson = (): LessonProgress => ({ learned: false, tryScore: 0, checkBest: 0, done: false });

export function createState(now: number): PortalState {
  return {
    v: STATE_VERSION,
    createdAt: now,
    xp: 0,
    lessons: {},
    challenges: {},
    badges: {},
    missions: {},
    pathsDone: {},
    codex: [],
    activity: [],
    xpByDay: {},
    lastLesson: null,
    settings: { sound: false, music: false, volume: 0.6, sfxVolume: 0.8, musicVolume: 0.5, name: '' },
    game: emptyGame(),
  };
}

export const dayKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const DAY_MS = 86_400_000;

/**
 * Days in a row on which XP was earned, counting back from today.
 * If nothing has been earned yet today the count starts from yesterday, so a streak only ends after a full day is missed.
 */
export function streak(s: PortalState, now: number): number {
  let t = Date.parse(`${dayKey(now)}T00:00:00Z`);
  if (!s.xpByDay[dayKey(t)]) t -= DAY_MS;
  let n = 0;
  while ((s.xpByDay[dayKey(t)] ?? 0) > 0) {
    n += 1;
    t -= DAY_MS;
  }
  return n;
}

// ---------- Badges ----------
export interface BadgeDef {
  id: string;
  name: string;
  title: string;
  how: string;
  path: PathId | 'all';
  earned: (s: PortalState) => boolean;
}

const lessonDone = (s: PortalState, id: string) => s.lessons[id]?.done === true;
const pathDone = (s: PortalState, id: PathId) => PATHS.find((p) => p.id === id)!.lessons.every((l) => lessonDone(s, l.id));
const tried = (s: PortalState, id: string, min: number) => (s.lessons[id]?.tryScore ?? 0) >= min;

export const BADGES: readonly BadgeDef[] = [
  { id: 'loom-keeper', name: 'Loom Keeper', title: 'AI Foundations', path: 'understand', how: 'Finish all five lessons in Understand AI.', earned: (s) => pathDone(s, 'understand') },
  { id: 'model-explorer', name: 'Model Explorer', title: 'Model Explorer', path: 'understand', how: 'Solve the classifier, neural network and next-word experiments (score 60 or more on each).', earned: (s) => tried(s, 'u2', 60) && tried(s, 'u3', 60) && tried(s, 'u4', 60) },
  { id: 'prompt-smith', name: 'Prompt Smith', title: 'Prompt Architect', path: 'use', how: 'Finish lessons 2 and 3 of Use AI and clear the Lab refine task.', earned: (s) => lessonDone(s, 't2') && lessonDone(s, 't3') && s.challenges['lab-refine']?.passed === true },
  { id: 'source-hunter', name: 'Source Hunter', title: 'Research Investigator', path: 'use', how: 'Finish the verification lesson and review every claim correctly in its experiment.', earned: (s) => lessonDone(s, 't4') && tried(s, 't4', 100) },
  { id: 'sharp-eye', name: 'Sharp Eye', title: 'Critical Thinker', path: 'responsible', how: 'Catch every invented or doubtful claim in the hallucination hunt (score 100).', earned: (s) => tried(s, 'r2', 100) },
  { id: 'fair-hand', name: 'Fair Hand', title: 'Bias Spotter', path: 'responsible', how: 'Finish the bias lesson and score 80 or more in the bias audit.', earned: (s) => lessonDone(s, 'r1') && tried(s, 'r1', 80) },
  { id: 'lantern-bearer', name: 'Lantern Bearer', title: 'Ethics Advocate', path: 'responsible', how: 'Finish all five lessons in Use AI Responsibly.', earned: (s) => pathDone(s, 'responsible') },
  { id: 'fieldwork', name: 'Fieldwork', title: 'Scenario Veteran', path: 'all', how: 'Play all six academic scenarios and average 70 or more.', earned: (s) => scenarioAverage(s) !== null && scenarioAverage(s)! >= 70 },
  { id: 'literacy-master', name: 'AI Literacy Master', title: 'Certified', path: 'all', how: 'Pass the final certification.', earned: (s) => s.challenges['certification']?.passed === true },
];

// ---------- Missions ----------
export type MissionCategory = 'Fundamentals' | 'Field work' | 'Integrity' | 'Exploration' | 'Capstone';
export interface MissionObjective {
  label: string;
  /** Where to go to do it. */
  to: string;
  done: (s: PortalState) => boolean;
}
export interface MissionDef {
  id: string;
  category: MissionCategory;
  title: string;
  brief: string;
  /** XP, paid once, on top of what the work itself earns. */
  reward: number;
  objectives: MissionObjective[];
  /** The idea the mission is about, for missions played in the game. */
  concept?: string;
}

const lessonTo = (id: string) => `/learn/${lessonById(id)!.path}/${id}`;
const finish = (id: string): MissionObjective => ({ label: `Finish "${lessonById(id)!.title}"`, to: lessonTo(id), done: (s) => lessonDone(s, id) });
const score = (id: string, min: number, what: string): MissionObjective => ({ label: `${what} (score ${min} or more)`, to: lessonTo(id), done: (s) => tried(s, id, min) });
const scenariosPlayed = (s: PortalState) => SCENARIO_IDS.filter((id) => s.challenges[id]).length;

const stationRounds = (id: string) => stationById(id)?.rounds ?? 1;
/** Rounds of a station cleared so far. */
export const roundsCleared = (s: PortalState, id: string): number => s.game.stations[id]?.cleared.length ?? 0;
export const stationDone = (s: PortalState, id: string): boolean => roundsCleared(s, id) >= stationRounds(id);
const clearStation = (id: string): MissionObjective => ({ label: `Clear ${stationById(id)!.title}`, to: '/play', done: (s) => stationDone(s, id) });
const relicsFound = (s: PortalState, ids: readonly string[]) => ids.filter((id) => s.game.relics[id]).length;
const findRelics = (n: number, ids: readonly string[], where: string): MissionObjective => ({ label: `Find ${n} relics ${where}`, to: '/play', done: (s) => relicsFound(s, ids) >= n });
const relicIdsIn = (room: RoomId) => RELICS.filter((r) => r.room === room).map((r) => r.id);

/**
 * The mission board. Each mission is a short run of real objectives, and every objective is read straight from
 * the player's finished work. Nothing here can be completed by visiting or clicking.
 */
export const MISSIONS: readonly MissionDef[] = [
  { id: 'first-light', category: 'Fundamentals', title: 'First light', brief: 'See the difference between a program with rules and a system that learns from examples.', reward: 40, objectives: [finish('u1'), finish('u2')] },
  { id: 'weave-the-network', category: 'Fundamentals', title: 'Weave the network', brief: 'Train a small neural network, then watch a language model guess the next word.', reward: 50, objectives: [finish('u3'), finish('u4')] },
  { id: 'the-whole-loom', category: 'Fundamentals', title: 'The whole loom', brief: 'Finish every lesson at the Loom House.', reward: 80, objectives: PATHS.find((p) => p.id === 'understand')!.lessons.map((l) => finish(l.id)) },
  { id: 'foundry-apprentice', category: 'Field work', title: 'Foundry apprentice', brief: 'Pick the right tool for a job, then write a prompt that asks for what you actually need.', reward: 40, objectives: [finish('t1'), finish('t2')] },
  { id: 'strike-true', category: 'Field work', title: 'Strike true', brief: 'Refine a result in rounds, and clear the Prompt Lab with a strong five-part prompt.', reward: 50, objectives: [finish('t3'), { label: 'Clear the Prompt Lab with four or more parts', to: '/lab', done: (s) => s.challenges['lab-refine']?.passed === true }] },
  { id: 'test-every-weld', category: 'Field work', title: 'Test every weld', brief: 'Check an AI answer claim by claim, and catch every one that needs checking.', reward: 60, objectives: [finish('t4'), score('t4', 100, 'Review every claim correctly')] },
  { id: 'case-files', category: 'Field work', title: 'Case files', brief: 'Work through three school situations and see what each choice costs.', reward: 60, objectives: [{ label: 'Play three scenarios', to: '/scenarios', done: (s) => scenariosPlayed(s) >= 3 }] },
  { id: 'keepers-watch', category: 'Integrity', title: "Keeper's watch", brief: 'Catch an AI making things up.', reward: 60, objectives: [finish('r2'), score('r2', 100, 'Catch every invented or doubtful claim')] },
  { id: 'fair-hands', category: 'Integrity', title: 'Fair hands', brief: 'Find where bias gets into a system, and audit a screener for it.', reward: 50, objectives: [finish('r1'), score('r1', 80, 'Audit the screener')] },
  { id: 'say-what-you-did', category: 'Integrity', title: 'Say what you did', brief: 'Protect your own data and other people\'s, and be honest about who did the work.', reward: 50, objectives: [finish('r4'), finish('r5')] },
  { id: 'lexicon', category: 'Capstone', title: 'Lexicon', brief: 'Collect twenty terms in the Codex and pass the drill.', reward: 50, objectives: [{ label: 'Collect 20 Codex terms', to: '/learn', done: (s) => s.codex.length >= 20 }, { label: 'Pass the Codex drill', to: '/codex', done: (s) => s.challenges['codex-drill']?.passed === true }] },
  { id: 'the-seal', category: 'Capstone', title: 'The seal', brief: 'Finish all fifteen lessons and pass the final certification.', reward: 100, objectives: [{ label: 'Finish all 15 lessons', to: '/learn', done: (s) => LESSONS.every((l) => lessonDone(s, l.id)) }, { label: 'Pass the final certification', to: '/certification', done: (s) => s.challenges['certification']?.passed === true }] },
  { id: 'curators-eye', category: 'Exploration', title: "The curator's eye", brief: 'Wren needs the moth cabinet sorted and the weight frame set. Teach the model with a few well-chosen examples, then tune a neuron by hand.', reward: 70, concept: 'Training data, coverage, weights and bias.', objectives: [clearStation('cabinet'), clearStation('frame')] },
  { id: 'struck-and-tested', category: 'Exploration', title: 'Struck and tested', brief: 'Brannock has orders to fill and an assistant that sounds too sure of itself. Write prompts that work, then test what comes back.', reward: 70, concept: 'Prompt structure, privacy and verification.', objectives: [clearStation('anvil'), clearStation('weld')] },
  { id: 'honest-lamp', category: 'Exploration', title: 'The honest lamp', brief: 'Sedge suspects the scholarship screener. Prove it, find the proxy, and fix it without breaking it.', reward: 60, concept: 'Algorithmic bias and the trade-offs of fixing it.', objectives: [clearStation('audit'), findRelics(2, relicIdsIn('beacon'), 'in the Beacon')] },
  { id: 'deep-time', category: 'Exploration', title: 'Deep time', brief: 'Rebuild the Archive timeline and walk through every building in the harbor.', reward: 60, concept: 'The history of AI and how it fits together.', objectives: [clearStation('timeline'), { label: 'Enter all six buildings', to: '/play', done: (s) => LOCATIONS.filter((l) => l.id !== 'quay').every((l) => s.game.visited[l.id]) }] },
  { id: 'relic-hunter', category: 'Exploration', title: 'Relic hunter', brief: 'Small things are tucked away around the harbor. Each one explains an idea. Find twelve.', reward: 80, concept: 'Every relic is a short explanation of a core idea.', objectives: [findRelics(12, RELICS.map((r) => r.id), 'anywhere in the harbor')] },
  { id: 'harbor-master', category: 'Capstone', title: 'Harbor master', brief: 'Clear every station in the game and find fifteen relics.', reward: 120, concept: 'All three learning areas, played.', objectives: [...STATIONS.map((st) => clearStation(st.id)), findRelics(15, RELICS.map((r) => r.id), 'anywhere in the harbor')] },
];
export const MISSION_CATEGORIES: readonly MissionCategory[] = ['Fundamentals', 'Field work', 'Integrity', 'Exploration', 'Capstone'];

export function missionProgress(s: PortalState, m: MissionDef): { done: number; total: number; complete: boolean } {
  const done = m.objectives.filter((o) => o.done(s)).length;
  return { done, total: m.objectives.length, complete: !!s.missions[m.id] };
}

export const SCENARIO_IDS = ['sc1', 'sc2', 'sc3', 'sc4', 'sc5', 'sc6'] as const;
export function scenarioAverage(s: PortalState): number | null {
  const scores = SCENARIO_IDS.map((id) => s.challenges[id]?.best);
  if (scores.some((v) => v === undefined)) return null;
  return Math.round((scores as number[]).reduce((a, b) => a + b, 0) / scores.length);
}

// ---------- Events ----------
export type GameEvent =
  | { type: 'learned'; lesson: string }
  | { type: 'tried'; lesson: string; score: number }
  | { type: 'checked'; lesson: string; correct: number }
  | { type: 'challenge'; id: string; score: number; passMark: number; xp: number; label: string }
  | { type: 'certification'; score: number; passMark: number }
  | { type: 'codex'; terms: string[] }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'round'; station: string; round: number }
  | { type: 'relic'; id: string }
  | { type: 'visit'; room: string }
  | { type: 'game'; patch: Partial<Pick<GameState, 'at' | 'freeRoam' | 'started' | 'ended'>> };

export type Reward =
  | { kind: 'xp'; amount: number; label: string }
  | { kind: 'badge'; id: string }
  | { kind: 'mission'; id: string }
  | { kind: 'path'; id: PathId }
  | { kind: 'lesson'; id: string }
  | { kind: 'level'; from: number; to: number }
  | { kind: 'relic'; id: string }
  | { kind: 'station'; id: string };

export interface ApplyResult {
  state: PortalState;
  rewards: Reward[];
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));

/** Pure: never mutates `prev`. */
export function applyEvent(prev: PortalState, ev: GameEvent, now: number): ApplyResult {
  const s: PortalState = structuredClone(prev);
  const rewards: Reward[] = [];

  const pay = (amount: number, label: string) => {
    if (amount <= 0) return;
    s.xp += amount;
    const day = dayKey(now);
    s.xpByDay[day] = (s.xpByDay[day] ?? 0) + amount;
    s.activity = [{ t: now, label, xp: amount }, ...s.activity].slice(0, 40);
    rewards.push({ kind: 'xp', amount, label });
  };
  const lessonState = (id: string): LessonProgress => (s.lessons[id] ??= emptyLesson());

  const settle = (id: string) => {
    const l = lessonState(id);
    const lesson = lessonById(id);
    if (!lesson || l.done) return;
    if (l.learned && l.tryScore >= lesson.widget.pass && l.checkBest >= CHECK_PASS) {
      l.done = true;
      l.doneAt = now;
      pay(XP.lessonDone, `Finished: ${lesson.title}`);
      rewards.push({ kind: 'lesson', id });
      for (const term of lesson.codex) if (!s.codex.includes(term)) s.codex.push(term);
      const path = PATHS.find((p) => p.id === lesson.path)!;
      if (!s.pathsDone[path.id] && path.lessons.every((x) => s.lessons[x.id]?.done)) {
        s.pathsDone[path.id] = now;
        pay(XP.path, `Path complete: ${path.title}`);
        rewards.push({ kind: 'path', id: path.id });
      }
    }
  };

  switch (ev.type) {
    case 'learned': {
      const lesson = lessonById(ev.lesson);
      if (!lesson) break;
      const l = lessonState(ev.lesson);
      s.lastLesson = ev.lesson;
      if (!l.learned) {
        l.learned = true;
        pay(XP.learn, `Read: ${lesson.title}`);
      }
      settle(ev.lesson);
      break;
    }
    case 'tried': {
      const lesson = lessonById(ev.lesson);
      if (!lesson) break;
      const l = lessonState(ev.lesson);
      s.lastLesson = ev.lesson;
      const score = clamp(ev.score, 0, 100);
      if (score > l.tryScore) {
        const gain = Math.round((XP.tryMax * (score - l.tryScore)) / 100);
        l.tryScore = score;
        pay(gain, `Experiment: ${lesson.widget.title}`);
      }
      settle(ev.lesson);
      break;
    }
    case 'checked': {
      const lesson = lessonById(ev.lesson);
      if (!lesson) break;
      const l = lessonState(ev.lesson);
      const total = lesson.check.length;
      const correct = clamp(ev.correct, 0, total);
      if (correct > l.checkBest) {
        let gain = (correct - l.checkBest) * XP.checkPerQuestion;
        if (correct === total && l.checkBest < total) gain += XP.checkPerfect;
        l.checkBest = correct;
        pay(gain, `Knowledge check: ${lesson.title}`);
      }
      settle(ev.lesson);
      break;
    }
    case 'challenge': {
      const c = (s.challenges[ev.id] ??= { best: 0, passed: false, plays: 0 });
      c.plays += 1;
      const score = clamp(ev.score, 0, 100);
      c.best = Math.max(c.best, score);
      if (!c.passed && score >= ev.passMark) {
        c.passed = true;
        pay(ev.xp, ev.label);
      }
      break;
    }
    case 'certification': {
      const c = (s.challenges['certification'] ??= { best: 0, passed: false, plays: 0 });
      c.plays += 1;
      const score = clamp(ev.score, 0, 100);
      c.best = Math.max(c.best, score);
      if (!c.passed && score >= ev.passMark) {
        c.passed = true;
        pay(XP.certification, 'Passed the final certification');
      }
      break;
    }
    case 'codex': {
      for (const t of ev.terms) if (!s.codex.includes(t)) s.codex.push(t);
      break;
    }
    case 'round': {
      const st = stationById(ev.station);
      if (!st || !Number.isInteger(ev.round) || ev.round < 1 || ev.round > st.rounds) break;
      const rec = (s.game.stations[st.id] ??= { cleared: [], plays: 0 });
      rec.plays += 1;
      if (!rec.cleared.includes(ev.round)) {
        rec.cleared = [...rec.cleared, ev.round].sort((a, b) => a - b);
        pay(GAME_XP.round, `${st.title}: round ${ev.round}`);
        if (rec.cleared.length >= st.rounds) rewards.push({ kind: 'station', id: st.id });
      }
      break;
    }
    case 'relic': {
      const r = relicById(ev.id);
      if (!r || s.game.relics[r.id]) break;
      s.game.relics[r.id] = now;
      pay(GAME_XP.relic, `Found: ${r.name}`);
      rewards.push({ kind: 'relic', id: r.id });
      break;
    }
    case 'visit': {
      const loc = locationById(ev.room);
      if (!loc || loc.id === 'quay' || s.game.visited[loc.id]) break;
      s.game.visited[loc.id] = now;
      pay(GAME_XP.visit, `First visit: ${loc.name}`);
      break;
    }
    case 'game': {
      const p = ev.patch;
      if (p.at && locationById(p.at)) s.game.at = p.at;
      if (typeof p.freeRoam === 'boolean') s.game.freeRoam = p.freeRoam;
      if (typeof p.started === 'boolean') s.game.started = p.started;
      if (typeof p.ended === 'boolean') s.game.ended = p.ended;
      break;
    }
    case 'settings': {
      s.settings = { ...s.settings, ...ev.patch };
      for (const k of ['volume', 'sfxVolume', 'musicVolume'] as const) s.settings[k] = Math.min(1, Math.max(0, s.settings[k]));
      s.settings.name = s.settings.name.slice(0, 60);
      break;
    }
  }

  // Badges are recomputed after every event, so they can only come from real progress.
  for (const b of BADGES) {
    if (!s.badges[b.id] && b.earned(s)) {
      s.badges[b.id] = now;
      pay(XP.badge, `Badge: ${b.name}`);
      rewards.push({ kind: 'badge', id: b.id });
    }
  }

  // Missions are checked the same way: only real, finished work can complete one, and each pays once.
  for (const m of MISSIONS) {
    if (!s.missions[m.id] && m.objectives.every((o) => o.done(s))) {
      s.missions[m.id] = now;
      pay(m.reward, `Mission: ${m.title}`);
      rewards.push({ kind: 'mission', id: m.id });
    }
  }

  const before = levelInfo(prev.xp).level;
  const after = levelInfo(s.xp).level;
  if (after > before) rewards.push({ kind: 'level', from: before, to: after });

  return { state: s, rewards };
}

// ---------- Game ----------
/** A building is open when the player has reached its level, or has switched on free roam. The Quay and the Office are always open. */
export function isUnlocked(s: PortalState, room: RoomId): boolean {
  const loc = locationById(room);
  if (!loc) return false;
  if (!loc.unlock || s.game.freeRoam) return true;
  return levelInfo(s.xp).level >= loc.unlock.level;
}

/** Where to go next in the game: the first unfinished station in an open building, else the next relic-rich room. */
export function nextGoal(s: PortalState): { room: RoomId; text: string } {
  for (const st of STATIONS) {
    if (!stationDone(s, st.id) && isUnlocked(s, st.room)) return { room: st.room, text: `${st.title}, in ${locationById(st.room)!.name}` };
  }
  const missing = RELICS.find((r) => !s.game.relics[r.id] && isUnlocked(s, r.room));
  if (missing) return { room: missing.room, text: `Something is still hidden in ${locationById(missing.room)!.name}` };
  const locked = LOCATIONS.find((l) => !isUnlocked(s, l.id));
  if (locked) return { room: 'quay', text: locked.unlock!.hint };
  return { room: 'hall', text: 'Take the final examination in the Trial Hall' };
}

export function gameProgress(s: PortalState): { rounds: number; roundsTotal: number; relics: number; relicsTotal: number; stations: number; stationsTotal: number } {
  return {
    rounds: STATIONS.reduce((a, st) => a + Math.min(st.rounds, roundsCleared(s, st.id)), 0),
    roundsTotal: STATIONS.reduce((a, st) => a + st.rounds, 0),
    relics: RELICS.filter((r) => s.game.relics[r.id]).length,
    relicsTotal: RELICS.length,
    stations: STATIONS.filter((st) => stationDone(s, st.id)).length,
    stationsTotal: STATIONS.length,
  };
}

// ---------- Derived views ----------
export function pathProgress(s: PortalState, id: PathId): { done: number; total: number; pct: number } {
  const path = PATHS.find((p) => p.id === id)!;
  const done = path.lessons.filter((l) => s.lessons[l.id]?.done).length;
  return { done, total: path.lessons.length, pct: Math.round((done / path.lessons.length) * 100) };
}

export function overallProgress(s: PortalState): { done: number; total: number; pct: number } {
  const done = LESSONS.filter((l) => s.lessons[l.id]?.done).length;
  return { done, total: LESSONS.length, pct: Math.round((done / LESSONS.length) * 100) };
}

/** Which of the three steps of a lesson are finished, for the stepper and the map. */
export function lessonSteps(s: PortalState, id: string): { learn: boolean; try: boolean; check: boolean; done: boolean; started: boolean } {
  const l = s.lessons[id];
  const lesson = lessonById(id);
  const learn = l?.learned === true;
  const tryDone = !!l && !!lesson && l.tryScore >= lesson.widget.pass;
  const check = !!l && l.checkBest >= CHECK_PASS;
  return { learn, try: tryDone, check, done: l?.done === true, started: !!l && (l.learned || l.tryScore > 0 || l.checkBest > 0) };
}

export interface Recommendation {
  kind: 'lesson' | 'certification' | 'explore';
  lesson?: string;
  why: string;
}

/** Continue the lesson you were in; otherwise the next unfinished lesson in curriculum order. */
export function recommendNext(s: PortalState): Recommendation {
  const last = s.lastLesson ? lessonById(s.lastLesson) : undefined;
  if (last && !s.lessons[last.id]?.done) return { kind: 'lesson', lesson: last.id, why: 'You started this one. Pick up where you left off.' };
  const next = LESSONS.find((l) => !s.lessons[l.id]?.done);
  if (next) {
    const first = !Object.keys(s.lessons).length;
    return { kind: 'lesson', lesson: next.id, why: first ? 'Start here. No background needed.' : 'The next unfinished lesson in order.' };
  }
  if (!s.challenges['certification']?.passed) return { kind: 'certification', why: 'Every lesson is done. Test what you know across all three paths.' };
  return { kind: 'explore', why: 'You have finished the course. Try the scenarios or the prompt lab again.' };
}
