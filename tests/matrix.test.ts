import { describe, expect, it } from 'vitest';
import { FAILURES, MATCH_SPEC, layout, totals } from '@/explainers/matrixModel';
import type { SorterConfig } from '@/content/types';

describe('the vulnerability matrix', () => {
  it('has the four failures, each with a cause, signs, steps and a mitigation', () => {
    expect(FAILURES.map((f) => f.name)).toEqual(['Bias drift', 'Data leakage', 'Adversarial input', 'Opaque decisioning']);
    for (const f of FAILURES) {
      expect(f.signs.length).toBeGreaterThanOrEqual(2);
      expect(f.steps).toHaveLength(3);
      expect(f.mitigation.length).toBeGreaterThan(60);
    }
    expect(FAILURES[0]!.mitigation).toContain('34.7%');
    expect(FAILURES[1]!.mitigation).toContain('GPT-2');
  });
  it('lays out exactly the counts it is given, and the mitigated case is never worse', () => {
    for (const f of FAILURES) {
      for (const side of [f.before, f.after]) {
        const cells = layout(side);
        const t = totals(side);
        expect(cells).toHaveLength(40);
        expect(cells.filter((c) => c.state === 'bad')).toHaveLength(t.bad);
        expect(cells.filter((c) => c.state === 'caught')).toHaveLength(t.caught);
      }
      expect(totals(f.after).bad).toBeLessThan(totals(f.before).bad);
    }
  });
  it('keeps the incident-matching exercise unscored: every item has a real bin and a reason', () => {
    const c = MATCH_SPEC.config as SorterConfig;
    expect(c.items).toHaveLength(8);
    for (const it of c.items) {
      expect(c.bins.some((b) => b.id === it.bin)).toBe(true);
      expect(it.why.length).toBeGreaterThan(20);
    }
    expect('pass' in MATCH_SPEC).toBe(false);
  });
});
