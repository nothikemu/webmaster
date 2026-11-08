export type ModuleId = 'foundations' | 'synthesis' | 'ethics';

export const MODULE_IDS: readonly ModuleId[] = ['foundations', 'synthesis', 'ethics'];

export interface MicroCheck {
  prompt: string;
  options: readonly string[];
  answer: number;
  explain: string;
}

export interface Lesson {
  /** Stable id, e.g. "a1". Persisted in progress data. */
  id: string;
  title: string;
  kicker: string;
  minutes: number;
  body: readonly string[];
  keyPoints: readonly string[];
  check: MicroCheck;
}

export interface QuizQuestion {
  id: string;
  /** Lesson this question assesses. A correct answer can promote that lesson to mastered. */
  lesson: string;
  prompt: string;
  options: readonly string[];
  answer: number;
  explain: string;
}

export interface ChoiceItem {
  id: string;
  prompt: string;
  answer: number;
  explain: string;
}

/** Target range (inclusive, 0-100 scale) for each Module B parameter. */
export interface TuningRange {
  temperature: readonly [number, number];
  specificity: readonly [number, number];
  context: readonly [number, number];
  strictness: readonly [number, number];
}

export interface TuningScenario {
  id: string;
  goal: string;
  hint: string;
  ranges: TuningRange;
}

interface ChallengeBase {
  title: string;
  intro: string;
  /** Par time in seconds. Timed runs earn a bonus for beating it. */
  parSeconds: number;
}

export interface ChoiceChallenge extends ChallengeBase {
  kind: 'choice';
  options: readonly string[];
  items: readonly ChoiceItem[];
  passMark: number;
}

export interface TuningChallenge extends ChallengeBase {
  kind: 'tuning';
  scenarios: readonly TuningScenario[];
  passMark: number;
}

export type Challenge = ChoiceChallenge | TuningChallenge;

export interface RequiredAction {
  id: string;
  label: string;
}

export interface ModuleContent {
  id: ModuleId;
  code: 'A' | 'B' | 'C';
  index: 1 | 2 | 3;
  title: string;
  /** Micro-label, e.g. "MOD 01 / FOUNDATIONS". */
  label: string;
  /** Which part of the TSA theme this module answers. */
  themeSection: string;
  tagline: string;
  objective: string;
  centerpiece: {
    name: string;
    summary: string;
    /** Plain-text description announced next to the canvas for assistive technology. */
    description: string;
  };
  lessons: readonly Lesson[];
  quiz: readonly QuizQuestion[];
  challenge: Challenge;
  requiredActions: readonly RequiredAction[];
  badge: { name: string; criteria: string };
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  module: ModuleId;
}

export interface Resource {
  title: string;
  href: string;
  note: string;
  module: ModuleId;
}
