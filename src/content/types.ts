/** Content types. Everything the portal teaches is plain data of these shapes, so lessons can be edited without touching UI code. */

export type ModuleId = 'foundations' | 'synthesis' | 'ethics';
export const MODULE_IDS: readonly ModuleId[] = ['foundations', 'synthesis', 'ethics'];

/** Knowledge-check question. Three kinds, so checks are not all the same quiz. Checks are unscored: they explain, and they can be tried again. */
export type Question =
  | { kind: 'single'; prompt: string; options: string[]; answer: number; explain: string }
  | { kind: 'multi'; prompt: string; options: string[]; answers: number[]; explain: string }
  | { kind: 'tf'; prompt: string; answer: boolean; explain: string };

/** Small diagrams drawn by one renderer, so every figure belongs to the same illustrated world. */
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

/** Generic experiment configs. Bespoke experiments (spam-learner, classifier, network, next-token, token-window) need none. */
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

/** A guided experiment: something to try with your hands, with a plain statement of what it shows. */
export interface WidgetSpec {
  id: WidgetId;
  title: string;
  /** One or two sentences: what to do and what it shows. */
  intro: string;
  config?: WidgetConfig;
}

export interface Lesson {
  /** Stable id, saved in the learner's data on this device. Never rename once published. */
  id: string;
  /** Readable address part: /modules/<module>/<slug>. */
  slug: string;
  module: ModuleId;
  /** True for the five lessons that make up the module's main sequence. False for "go further" lessons: optional, same standard, deeper. */
  core: boolean;
  title: string;
  kicker: string;
  minutes: number;
  objective: string;
  /** Which published AI education framework idea this lesson serves. See docs/RESEARCH_2026-27.md. */
  framework?: string;
  beats: Beat[];
  example?: Example;
  widget?: WidgetSpec;
  check: Question[];
  takeaways: string[];
  /** Glossary term ids this lesson introduces. */
  glossary: string[];
}

export type CenterpieceId = 'topology' | 'console' | 'matrix';

export interface ModuleContent {
  id: ModuleId;
  number: 1 | 2 | 3;
  title: string;
  /** One line, set large on the module page. */
  tagline: string;
  /** Which part of the TSA challenge this module answers. */
  tsaSection: string;
  summary: string;
  /** What a learner can do after the module. */
  objective: string;
  centerpiece: { id: CenterpieceId; name: string; summary: string };
  lessons: Lesson[];
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  module: ModuleId;
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

/** A decision case. Cases are for thinking and talking, not for scoring: every choice explains its consequences. */
export interface CaseChoice {
  text: string;
  /** A judgement, not a score: whether this choice holds up. Always shown with a word and an icon. */
  fit: 'strong' | 'mixed' | 'weak';
  response: string;
}
export interface CaseStep {
  prompt: string;
  choices: CaseChoice[];
}
export interface CaseStudy {
  id: string;
  title: string;
  setting: string;
  steps: CaseStep[];
  /** The lesson that teaches the idea behind this case. */
  lesson: string;
}
