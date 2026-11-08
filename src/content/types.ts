/** Content types. Everything the portal teaches is plain data of these shapes, so lessons can be edited without touching UI code. */

export type PathId = 'understand' | 'use' | 'responsible';
export const PATH_IDS: readonly PathId[] = ['understand', 'use', 'responsible'];

/** Knowledge-check question. Three kinds, so checks are not all the same quiz. */
export type Question =
  | { kind: 'single'; prompt: string; options: string[]; answer: number; explain: string }
  | { kind: 'multi'; prompt: string; options: string[]; answers: number[]; explain: string }
  | { kind: 'tf'; prompt: string; answer: boolean; explain: string };

/** Small diagrams drawn by one renderer, so every visual belongs to the same illustrated world. */
export type Visual =
  | { kind: 'flow'; caption: string; steps: { label: string; note?: string }[] }
  | { kind: 'compare'; caption: string; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { kind: 'layers'; caption: string; sizes: number[]; labels: string[] }
  | { kind: 'tokens'; caption: string; tokens: string[] };

export interface Beat {
  heading: string;
  paragraphs: string[];
  visual?: Visual;
}

export interface Example {
  title: string;
  body: string;
  takeaway: string;
}

export type WidgetId =
  | 'spam-learner'
  | 'classifier'
  | 'network'
  | 'next-token'
  | 'token-window'
  | 'sorter'
  | 'prompt-builder'
  | 'chooser'
  | 'claim-review'
  | 'bias-audit';

/** Generic widget configs. Bespoke widgets (spam-learner, classifier, network, next-token, token-window) need none. */
export interface SorterConfig {
  bins: { id: string; label: string }[];
  items: { text: string; bin: string; why: string }[];
}
export interface ChooserConfig {
  steps: { prompt: string; options: string[]; answer: number; why: string }[];
}
export interface ClaimReviewConfig {
  source: string;
  claims: { text: string; verdict: 'solid' | 'check' | 'false'; why: string }[];
}
export type WidgetConfig = SorterConfig | ChooserConfig | ClaimReviewConfig | undefined;

export interface WidgetSpec {
  id: WidgetId;
  title: string;
  /** One or two sentences: what to do and what it shows. */
  intro: string;
  /** Score (0-100) at or above which the experiment counts as solved. */
  pass: number;
  config?: WidgetConfig;
}

export interface Lesson {
  /** Stable id, saved in progress data. Never rename once published. */
  id: string;
  path: PathId;
  title: string;
  kicker: string;
  minutes: number;
  objective: string;
  /** Which published AI education framework idea this lesson serves. See docs/RESEARCH_2026-27.md. */
  framework: string;
  beats: Beat[];
  example: Example;
  widget: WidgetSpec;
  check: Question[];
  takeaways: string[];
  /** Codex term ids this lesson adds to the player's codex. */
  codex: string[];
}

export interface PathContent {
  id: PathId;
  number: 1 | 2 | 3;
  title: string;
  verb: string;
  place: string;
  tagline: string;
  /** Which part of the TSA challenge this path answers. */
  tsaSection: string;
  summary: string;
  lessons: Lesson[];
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  path: PathId;
}

export interface Tool {
  id: string;
  name: string;
  maker: string;
  category: 'chat' | 'research' | 'writing' | 'coding' | 'image' | 'study' | 'data';
  does: string;
  goodFor: string[];
  limits: string[];
  /** Access facts. `verified` means read on the dated official page named in `source`. */
  access: { age: string; account: string; cost: string; verified: boolean; source?: string };
  checkedOn: string;
  privacy: string;
}

export interface ScenarioChoice {
  text: string;
  /** Change to each meter, -2..+2. */
  integrity: number;
  learning: number;
  privacy: number;
  response: string;
}
export interface ScenarioStep {
  prompt: string;
  choices: ScenarioChoice[];
}
export interface Scenario {
  id: string;
  title: string;
  setting: string;
  steps: ScenarioStep[];
  lesson: string;
}

export interface CertQuestion {
  path: PathId;
  q: Question;
}
