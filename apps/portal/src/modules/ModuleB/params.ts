import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';

/** The four Module B sliders, each 0-100. Temperature maps to 0.00-1.50 for display. */
export interface Params {
  temperature: number;
  specificity: number;
  context: number;
  strictness: number;
}

export type ParamKey = keyof Params;
export type PresetId = 'role' | 'cot' | 'constraint' | 'fewshot';

export const PARAM_KEYS: readonly ParamKey[] = ['temperature', 'specificity', 'context', 'strictness'];

export const PARAM_META: Readonly<Record<ParamKey, { label: string; hint: string }>> = {
  temperature: { label: 'Temperature', hint: 'Randomness when picking each token' },
  specificity: { label: 'Specificity', hint: 'How exactly the task, audience and format are named' },
  context: { label: 'Context depth', hint: 'How much source material and how many examples sit in the prompt' },
  strictness: { label: 'Constraint strictness', hint: 'How tightly format, length and exclusions are fixed' },
};

export interface Preset {
  id: PresetId;
  name: string;
  summary: string;
  action: string;
  values: Params;
}

export const PRESETS: readonly Preset[] = [
  { id: 'role', name: 'Role Framing', summary: 'Names who is speaking and who is listening.', action: 'preset-role', values: { temperature: 35, specificity: 72, context: 40, strictness: 55 } },
  { id: 'cot', name: 'Chain-of-Thought', summary: 'Asks for the steps before the answer.', action: 'preset-cot', values: { temperature: 25, specificity: 60, context: 65, strictness: 45 } },
  { id: 'constraint', name: 'Constraint Stacking', summary: 'Pins length, format and exclusions.', action: 'preset-constraint', values: { temperature: 20, specificity: 85, context: 45, strictness: 92 } },
  { id: 'fewshot', name: 'Few-Shot Anchoring', summary: 'Shows worked examples first.', action: 'preset-fewshot', values: { temperature: 30, specificity: 75, context: 88, strictness: 60 } },
];

export const DEFAULT_PARAMS: Params = { temperature: 55, specificity: 25, context: 15, strictness: 15 };

interface ParamsState {
  params: Params;
  preset: PresetId | null;
  /** Bumps on every preset application so the UI can start a spring transition. */
  presetSeq: number;
  set(key: ParamKey, value: number): void;
  applyPreset(id: PresetId): void;
  reset(): void;
}

export const paramsStore = createStore<ParamsState>()((set) => ({
  params: DEFAULT_PARAMS,
  preset: null,
  presetSeq: 0,
  set: (key, value) =>
    set((s) => ({ params: { ...s.params, [key]: Math.max(0, Math.min(100, Math.round(value))) }, preset: null })),
  applyPreset: (id) => {
    const preset = PRESETS.find((p) => p.id === id)!;
    set((s) => ({ params: { ...preset.values }, preset: id, presetSeq: s.presetSeq + 1 }));
  },
  reset: () => set({ params: DEFAULT_PARAMS, preset: null }),
}));

export function useParams<T>(selector: (s: ParamsState) => T): T {
  return useStore(paramsStore, selector);
}

export const temperatureValue = (p: Params): number => (p.temperature / 100) * 1.5;

// ---- prompt template -------------------------------------------------------------------------
export interface PromptPart {
  id: 'role' | 'task' | 'context' | 'examples' | 'reasoning' | 'constraints';
  label: string;
  active: boolean;
  lines: string[];
}

export const TASK_LINE = 'Summarize the incident report below for the on-call engineer.';
const TOKENS_PER_EXCERPT = 350;

export function contextBlocks(p: Params): number {
  return Math.round(p.context / 20);
}

export function exampleCount(p: Params, preset: PresetId | null): number {
  const base = p.context >= 85 ? 3 : p.context >= 60 ? 2 : 0;
  return preset === 'fewshot' ? Math.max(2, base) : base;
}

export function usesReasoning(p: Params, preset: PresetId | null): boolean {
  return preset === 'cot' || (p.specificity >= 55 && p.temperature <= 30 && p.context >= 50);
}

/** Builds the structured prompt template from the current parameters. Pure and deterministic. */
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
    {
      id: 'role',
      label: 'Role',
      active: roleOn,
      lines: roleOn
        ? [p.specificity >= 60 ? 'You are an incident analyst with ten years of operations experience, writing for a tired on-call engineer.' : 'You are an incident analyst writing for an on-call engineer.']
        : ['(no role stated)'],
    },
    { id: 'task', label: 'Task', active: true, lines: [p.specificity >= 50 ? `${TASK_LINE} Lead with user impact.` : TASK_LINE] },
    {
      id: 'context',
      label: 'Context',
      active: blocks > 0,
      lines: blocks > 0 ? [`${blocks} report excerpt${blocks === 1 ? '' : 's'}, about ${blocks * TOKENS_PER_EXCERPT} tokens.`] : ['(no source material attached)'],
    },
    {
      id: 'examples',
      label: 'Examples',
      active: examples > 0,
      lines: examples > 0 ? Array.from({ length: examples }, (_, i) => `Example ${i + 1}: report -> three-bullet summary`) : ['(no examples)'],
    },
    {
      id: 'reasoning',
      label: 'Reasoning',
      active: usesReasoning(p, preset),
      lines: usesReasoning(p, preset) ? ['Work through the timeline step by step, then give the summary after "Answer:".'] : ['(answer directly)'],
    },
    {
      id: 'constraints',
      label: 'Constraints',
      active: constraints.length > 0,
      lines: constraints.length > 0 ? constraints : ['(no limits stated)'],
    },
  ];
}

// ---- challenge checking ----------------------------------------------------------------------
export interface RangeMiss {
  key: ParamKey;
  value: number;
  range: readonly [number, number];
}

/** Returns the parameters that fall outside the target ranges (empty when the setting passes). */
export function checkRanges(p: Params, ranges: Readonly<Record<ParamKey, readonly [number, number]>>): RangeMiss[] {
  const misses: RangeMiss[] = [];
  for (const key of PARAM_KEYS) {
    const [lo, hi] = ranges[key];
    if (p[key] < lo || p[key] > hi) misses.push({ key, value: p[key], range: ranges[key] });
  }
  return misses;
}
