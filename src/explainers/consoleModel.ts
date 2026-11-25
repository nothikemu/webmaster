/**
 * The prompt console's model. It is a deterministic simulation of how prompt settings change which word a language model is likely to
 * start its answer with. No model is called anywhere: the same settings always give the same numbers, which is what lets a learner
 * change one thing and see exactly what it did.
 */
import { rng } from '@/widgets/logic/random';

export interface Params {
  /** Each 0 to 100. Temperature maps to 0.00 to 1.50 for display. */
  temperature: number;
  specificity: number;
  context: number;
  strictness: number;
}
export type ParamKey = keyof Params;
export type PresetId = 'role' | 'cot' | 'constraint' | 'fewshot';

export const PARAM_KEYS: readonly ParamKey[] = ['temperature', 'specificity', 'context', 'strictness'];

export const PARAM_META: Readonly<Record<ParamKey, { label: string; hint: string; why: string }>> = {
  temperature: {
    label: 'Temperature',
    hint: 'How much randomness goes into picking each word',
    why: 'Temperature rescales every word’s score before one is picked. Higher temperature flattens the bars, so unlikely words are chosen more often. Lower temperature sharpens them, so the top word wins almost every time.',
  },
  specificity: {
    label: 'Specificity',
    hint: 'How exactly the task, audience and format are named',
    why: 'A more specific prompt gives the model clearer signals about what kind of answer fits. That moves probability toward the formal, on-task openers and away from casual ones.',
  },
  context: {
    label: 'Context depth',
    hint: 'How much source material and how many examples sit in the prompt',
    why: 'Source material and worked examples in the prompt make report-style openers (such as “Root”, “Impact” and “Timeline”) more likely, because the model has seen what that kind of answer looks like.',
  },
  strictness: {
    label: 'Constraint strictness',
    hint: 'How tightly format, length and exclusions are fixed',
    why: 'Tighter constraints leave less room for chatty openers. That moves probability toward the formal words and makes the answer easier to check against what you asked for.',
  },
};

export interface Preset {
  id: PresetId;
  name: string;
  summary: string;
  values: Params;
}

export const PRESETS: readonly Preset[] = [
  { id: 'role', name: 'Role framing', summary: 'Names who is speaking and who is listening.', values: { temperature: 35, specificity: 72, context: 40, strictness: 55 } },
  { id: 'cot', name: 'Chain-of-thought', summary: 'Asks for the steps before the answer.', values: { temperature: 25, specificity: 60, context: 65, strictness: 45 } },
  { id: 'constraint', name: 'Constraint stacking', summary: 'Pins length, format and exclusions.', values: { temperature: 20, specificity: 85, context: 45, strictness: 92 } },
  { id: 'fewshot', name: 'Few-shot anchoring', summary: 'Shows worked examples first.', values: { temperature: 30, specificity: 75, context: 88, strictness: 60 } },
];

export const DEFAULT_PARAMS: Params = { temperature: 55, specificity: 25, context: 15, strictness: 15 };

export interface Brief {
  id: string;
  goal: string;
  hint: string;
  /** The range each setting should sit in for this job, as [low, high]. */
  ranges: Record<ParamKey, readonly [number, number]>;
  /** One sentence per setting saying why its range suits the job. */
  reasons: Record<ParamKey, string>;
}

export const BRIEFS: readonly Brief[] = [
  {
    id: 'invoice',
    goal: 'Extract invoice totals as JSON for an accounting system.',
    hint: 'Exact output wants low randomness, tight constraints and a precise ask.',
    ranges: { temperature: [0, 25], specificity: [70, 100], context: [30, 100], strictness: [70, 100] },
    reasons: {
      temperature: 'An accounting system needs the same output every run, so randomness should be low.',
      specificity: 'The model has to know exactly which fields to return, so the ask should be precise.',
      context: 'It needs the invoice itself, and perhaps an example of the format, in the prompt.',
      strictness: 'JSON that does not match the schema breaks the system, so format and exclusions must be pinned.',
    },
  },
  {
    id: 'names',
    goal: 'Brainstorm twenty product names for a student startup.',
    hint: 'Variety wants more randomness and looser limits.',
    ranges: { temperature: [60, 100], specificity: [0, 60], context: [0, 100], strictness: [0, 40] },
    reasons: {
      temperature: 'Variety is the point, so a higher temperature that picks less likely words helps.',
      specificity: 'A loose ask leaves room for surprising ideas. Too much detail would narrow them.',
      context: 'Any amount can work: background can inspire names, but none is required.',
      strictness: 'Tight limits would cut off the odd options you are brainstorming for.',
    },
  },
  {
    id: 'policy',
    goal: 'Summarize a 40-page policy document for a board memo.',
    hint: 'A long source needs deep context and steady, moderately strict output.',
    ranges: { temperature: [0, 40], specificity: [50, 100], context: [70, 100], strictness: [40, 100] },
    reasons: {
      temperature: 'A summary should stay close to the source, so randomness should be fairly low.',
      specificity: 'The memo has an audience and a purpose, and naming them keeps the summary useful.',
      context: 'The document has to be in the prompt for the model to summarize it at all.',
      strictness: 'A board memo has a length and a format, and a few firm limits make it easy to check.',
    },
  },
];

export const TEMPERATURE = (p: Params): number => (p.temperature / 100) * 1.5;

// ---- the prompt the settings describe -----------------------------------------------------
export interface PromptPart {
  id: 'role' | 'task' | 'context' | 'examples' | 'reasoning' | 'constraints';
  label: string;
  active: boolean;
  lines: string[];
}

export const TASK_LINE = 'Summarize the incident report below for the on-call engineer.';
const TOKENS_PER_EXCERPT = 350;

export const contextBlocks = (p: Params): number => Math.round(p.context / 20);
export const exampleCount = (p: Params, preset: PresetId | null): number => {
  const base = p.context >= 85 ? 3 : p.context >= 60 ? 2 : 0;
  return preset === 'fewshot' ? Math.max(2, base) : base;
};
export const usesReasoning = (p: Params, preset: PresetId | null): boolean => preset === 'cot' || (p.specificity >= 55 && p.temperature <= 30 && p.context >= 50);

export function buildPrompt(p: Params, preset: PresetId | null): PromptPart[] {
  const blocks = contextBlocks(p);
  const examples = exampleCount(p, preset);
  const constraints: string[] = [];
  if (p.strictness >= 20) constraints.push('Use at most 120 words.');
  if (p.strictness >= 40) constraints.push('Use exactly three bullets.');
  if (p.strictness >= 60) constraints.push('Keep every bullet under 20 words.');
  if (p.strictness >= 80) constraints.push('Do not speculate about causes. Cite the log line for each claim.');
  if (p.strictness >= 95) constraints.push('Return valid JSON only: {"bullets": [string, string, string]}.');
  const roleOn = p.specificity >= 30 || preset === 'role';
  return [
    { id: 'role', label: 'Role', active: roleOn, lines: roleOn ? [p.specificity >= 60 ? 'You are an incident analyst with ten years of operations experience, writing for a tired on-call engineer.' : 'You are an incident analyst writing for an on-call engineer.'] : ['(no role stated)'] },
    { id: 'task', label: 'Task', active: true, lines: [p.specificity >= 50 ? `${TASK_LINE} Lead with user impact.` : TASK_LINE] },
    { id: 'context', label: 'Context', active: blocks > 0, lines: blocks > 0 ? [`${blocks} report excerpt${blocks === 1 ? '' : 's'}, about ${blocks * TOKENS_PER_EXCERPT} tokens.`] : ['(no source material attached)'] },
    { id: 'examples', label: 'Examples', active: examples > 0, lines: examples > 0 ? Array.from({ length: examples }, (_, i) => `Example ${i + 1}: report → three-bullet summary`) : ['(no examples)'] },
    { id: 'reasoning', label: 'Reasoning', active: usesReasoning(p, preset), lines: usesReasoning(p, preset) ? ['Work through the timeline step by step, then give the summary after “Answer:”.'] : ['(answer directly)'] },
    { id: 'constraints', label: 'Constraints', active: constraints.length > 0, lines: constraints.length > 0 ? constraints : ['(no limits stated)'] },
  ];
}

// ---- the simulated output ------------------------------------------------------------------
export const WORDS = ['The', 'Root', 'Impact', 'Timeline', 'Overall', 'So', 'Basically', 'Honestly'] as const;
/** Formal, on-task openers are true. Chatty ones are false. */
export const FORMAL: readonly boolean[] = [true, true, true, true, true, false, false, false];
const BASE_LOGITS = [1.9, 1.1, 1.2, 1.0, 1.3, 1.1, 0.9, 0.7] as const;
const CONTEXT_BOOST = [0, 1.0, 1.1, 0.9, 0.2, 0, 0, 0] as const;

export interface OutputSim {
  probs: number[];
  /** 0 to 1: how evenly probability is spread (normalised entropy). */
  variety: number;
  /** 0 to 1: probability on the formal, on-task openers. */
  onTask: number;
  /** 0 to 1: how likely the answer is to wander from the source. */
  drift: number;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function simulate(p: Params): OutputSim {
  const spec = p.specificity / 100;
  const ctx = p.context / 100;
  const strict = p.strictness / 100;
  const temp = Math.max(0.05, TEMPERATURE(p));
  const logits = BASE_LOGITS.map((base, i) => base + (FORMAL[i] ? 1 : -1) * (spec * 1.4 + strict * 1.6) + CONTEXT_BOOST[i]! * ctx * 1.3);
  const scaled = logits.map((l) => l / temp);
  const max = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);
  const entropy = -probs.reduce((a, q) => a + (q > 0 ? q * Math.log(q) : 0), 0);
  return {
    probs,
    variety: clamp01(entropy / Math.log(probs.length)),
    onTask: clamp01(probs.reduce((a, q, i) => a + (FORMAL[i] ? q : 0), 0)),
    drift: clamp01((temp / 1.5) * 0.6 + (1 - ctx) * 0.4),
  };
}

/** Ten draws from the same settings, using the same ten fixed random numbers every time, so only the settings change what comes out. */
const DRAW_U = (() => {
  const r = rng(20261125);
  return Array.from({ length: 10 }, () => r());
})();

export function draws(probs: readonly number[]): number[] {
  return DRAW_U.map((u) => {
    let acc = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i]!;
      if (u < acc) return i;
    }
    return probs.length - 1;
  });
}

// ---- what changed, in words -----------------------------------------------------------------
export interface Change {
  key: ParamKey;
  from: number;
  to: number;
  before: OutputSim;
  after: OutputSim;
}

const pct = (v: number): number => Math.round(v * 100);
const move = (a: number, b: number): string => {
  const d = pct(b) - pct(a);
  return d === 0 ? 'stayed at' : d > 0 ? 'rose from' : 'fell from';
};

export function explainChange(c: Change): string {
  const m = PARAM_META[c.key];
  const topB = WORDS[c.before.probs.indexOf(Math.max(...c.before.probs))];
  const topA = WORDS[c.after.probs.indexOf(Math.max(...c.after.probs))];
  const parts = [
    `You moved ${m.label.toLowerCase()} from ${c.from} to ${c.to}.`,
    `Variety ${move(c.before.variety, c.after.variety)} ${pct(c.before.variety)}% ${pct(c.before.variety) === pct(c.after.variety) ? '' : `to ${pct(c.after.variety)}%`}`.trim() + '.',
    `The on-task share ${move(c.before.onTask, c.after.onTask)} ${pct(c.before.onTask)}% ${pct(c.before.onTask) === pct(c.after.onTask) ? '' : `to ${pct(c.after.onTask)}%`}`.trim() + '.',
    topB !== topA ? `The most likely first word changed from “${topB}” to “${topA}”.` : `The most likely first word is still “${topA}”.`,
    `Why: ${m.why}`,
  ];
  return parts.join(' ');
}

/** For a brief, which settings are inside the suggested range. */
export function checkBrief(p: Params, b: Brief): { key: ParamKey; inside: boolean; value: number; range: readonly [number, number] }[] {
  return PARAM_KEYS.map((key) => ({ key, value: p[key], range: b.ranges[key], inside: p[key] >= b.ranges[key][0] && p[key] <= b.ranges[key][1] }));
}

/** The middle of each suggested range, as a place to start. */
export function startingPoint(b: Brief): Params {
  const mid = (k: ParamKey) => Math.round((b.ranges[k][0] + b.ranges[k][1]) / 2);
  return { temperature: mid('temperature'), specificity: mid('specificity'), context: mid('context'), strictness: mid('strictness') };
}
