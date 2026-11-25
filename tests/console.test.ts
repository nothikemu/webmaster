import { describe, expect, it } from 'vitest';
import { BRIEFS, DEFAULT_PARAMS, PARAM_KEYS, PRESETS, buildPrompt, checkBrief, draws, explainChange, simulate, startingPoint, type Params } from '@/explainers/consoleModel';

describe('the prompt console model is a deterministic simulation', () => {
  it('gives the same numbers for the same settings, and probabilities that sum to one', () => {
    const a = simulate(DEFAULT_PARAMS);
    expect(simulate({ ...DEFAULT_PARAMS })).toEqual(a);
    expect(a.probs.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 10);
    expect(draws(a.probs)).toEqual(draws(simulate({ ...DEFAULT_PARAMS }).probs));
    expect(draws(a.probs)).toHaveLength(10);
  });
  it('lower temperature makes the output steadier, and higher makes it more varied', () => {
    const cold = simulate({ ...DEFAULT_PARAMS, temperature: 5 });
    const hot = simulate({ ...DEFAULT_PARAMS, temperature: 100 });
    expect(cold.variety).toBeLessThan(hot.variety);
    expect(new Set(draws(cold.probs)).size).toBeLessThanOrEqual(new Set(draws(hot.probs)).size);
    expect(cold.drift).toBeLessThan(hot.drift);
  });
  it('more specificity, context and strictness move probability toward the on-task openers', () => {
    const loose = simulate({ temperature: 40, specificity: 0, context: 0, strictness: 0 });
    for (const key of ['specificity', 'context', 'strictness'] as const) {
      const tight = simulate({ temperature: 40, specificity: 0, context: 0, strictness: 0, [key]: 100 } as Params);
      expect(tight.onTask, key).toBeGreaterThan(loose.onTask);
    }
  });
  it('builds a prompt whose parts follow the settings, and every preset is a valid setting', () => {
    expect(buildPrompt({ ...DEFAULT_PARAMS, strictness: 0 }, null).find((p) => p.id === 'constraints')!.active).toBe(false);
    expect(buildPrompt({ ...DEFAULT_PARAMS, strictness: 100 }, null).find((p) => p.id === 'constraints')!.lines.join(' ')).toContain('JSON');
    expect(buildPrompt(DEFAULT_PARAMS, 'cot').find((p) => p.id === 'reasoning')!.active).toBe(true);
    expect(PRESETS).toHaveLength(4);
    for (const p of PRESETS) for (const k of PARAM_KEYS) expect(p.values[k] >= 0 && p.values[k] <= 100).toBe(true);
  });
  it('explains a change in words, with the reason, and names a changed first word', () => {
    const before = DEFAULT_PARAMS;
    const after = { ...before, temperature: 5 };
    const text = explainChange({ key: 'temperature', from: 55, to: 5, before: simulate(before), after: simulate(after) });
    expect(text).toMatch(/temperature from 55 to 5/);
    expect(text).toMatch(/Why:/);
    expect(text).toMatch(/Variety fell from/);
  });
  it('checks each brief against its suggested ranges, and a starting point passes its own brief', () => {
    expect(BRIEFS).toHaveLength(3);
    for (const b of BRIEFS) {
      expect(checkBrief(startingPoint(b), b).every((c) => c.inside)).toBe(true);
      for (const k of PARAM_KEYS) expect(b.reasons[k].length).toBeGreaterThan(20);
    }
    expect(checkBrief(DEFAULT_PARAMS, BRIEFS[0]!).some((c) => !c.inside)).toBe(true);
  });
});
