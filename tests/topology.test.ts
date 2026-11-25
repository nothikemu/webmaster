import { describe, expect, it } from 'vitest';
import { CONNECTIONS, DEFAULT_INPUTS, INITIAL_WEIGHTS, SIZES, cloneWeights, describeEffect, forward, sigmoid, weightOf, withWeight } from '@/explainers/topologyModel';

describe('the neural topology model', () => {
  it('has the layers it says it has, and one connection for every pair of units in neighbouring layers', () => {
    expect(INITIAL_WEIGHTS.map((l) => l.length)).toEqual([4, 3, 1]);
    expect(CONNECTIONS.length).toBe(3 * 4 + 4 * 3 + 3 * 1);
    expect(new Set(CONNECTIONS.map((c) => c.label)).size).toBe(CONNECTIONS.length);
  });
  it('computes each unit as a weighted sum passed through a squashing curve', () => {
    const p = forward(DEFAULT_INPUTS, INITIAL_WEIGHTS);
    const z = 0.9 * 0.8 + -0.4 * 0.3 + 0.3 * 0.6;
    expect(p.z[1]![0]).toBeCloseTo(z, 10);
    expect(p.a[1]![0]).toBeCloseTo(sigmoid(z), 10);
    expect(p.a.map((l) => l.length)).toEqual([...SIZES]);
    for (const layer of p.a.slice(1)) for (const v of layer) expect(v > 0 && v < 1).toBe(true);
  });
  it('is deterministic, and changing one weight changes the output without touching the original weights', () => {
    const before = forward(DEFAULT_INPUTS, INITIAL_WEIGHTS).a[3]![0]!;
    expect(forward(DEFAULT_INPUTS, cloneWeights(INITIAL_WEIGHTS)).a[3]![0]).toBe(before);
    const c = CONNECTIONS[CONNECTIONS.length - 1]!;
    const changed = withWeight(INITIAL_WEIGHTS, c, 0.1);
    expect(weightOf(INITIAL_WEIGHTS, c)).toBe(0.8);
    expect(weightOf(changed, c)).toBe(0.1);
    expect(forward(DEFAULT_INPUTS, changed).a[3]![0]!).toBeLessThan(before);
  });
  it('describes an effect in words, naming the connection and the direction', () => {
    const c = CONNECTIONS[0]!;
    const text = describeEffect(c, 0.9, -0.5, 0.7, 0.62);
    expect(text).toContain('Input 1 to A1');
    expect(text).toMatch(/fell by 0.08/);
    expect(text).toMatch(/inhibits/);
  });
});
