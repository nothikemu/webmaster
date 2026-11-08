import { describe, expect, it } from 'vitest';
import { BASE_PARTICLES, MIN_PARTICLES, OUTLIER_MS, QualityGovernor, TIERS, startingTier } from '../src/core/quality';
import { MasterLoop } from '../src/core/loop';
import { Spring, SpringGroup, cubicBezier, ease, stepCritical } from '../src/core/spring';

describe('cubicBezier', () => {
  it('hits its endpoints and is monotonic for the portal easing', () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    let prev = 0;
    for (let i = 1; i <= 100; i++) {
      const v = ease(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it('is a straight line for (0,0,1,1) and front-loaded for the portal curve', () => {
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0.37)).toBeCloseTo(0.37, 4);
    expect(ease(0.25)).toBeGreaterThan(0.6);
  });
});

describe('critically damped spring', () => {
  it('converges without overshoot and is stable for large steps', () => {
    const s = { x: 0, v: 0 };
    let max = 0;
    for (let i = 0; i < 400; i++) {
      stepCritical(s, 1, 12, 1 / 60);
      max = Math.max(max, s.x);
    }
    expect(max).toBeLessThanOrEqual(1 + 1e-9);
    expect(s.x).toBeCloseTo(1, 5);
    const big = { x: 0, v: 0 };
    stepCritical(big, 1, 12, 5);
    expect(Number.isFinite(big.x)).toBe(true);
    expect(big.x).toBeCloseTo(1, 3);
  });

  it('Spring and SpringGroup settle on their targets', () => {
    const sp = new Spring(0, 14);
    sp.target = 5;
    for (let i = 0; i < 300; i++) sp.step(1 / 60);
    expect(sp.settled()).toBe(true);
    const g = new SpringGroup(3, 14);
    g.targets.set([1, -2, 3]);
    for (let i = 0; i < 300; i++) g.step(1 / 60);
    expect(g.settled()).toBe(true);
    expect(g.values[1]).toBeCloseTo(-2, 3);
  });
});

describe('QualityGovernor', () => {
  const feed = (g: QualityGovernor, ms: number, frames: number, startAt: number): { at: number; changes: number[] } => {
    let at = startAt;
    const changes: number[] = [];
    for (let i = 0; i < frames; i++) {
      at += ms;
      const t = g.push(ms, at);
      if (t) changes.push(t.id);
    }
    return { at, changes };
  };

  it('keeps the particle floor at or above 3,000 in every tier', () => {
    expect(Math.min(...TIERS.map((t) => t.particles))).toBe(MIN_PARTICLES);
    expect(Math.max(...TIERS.map((t) => t.particles))).toBe(BASE_PARTICLES);
  });

  it('steps down under sustained slow frames, one tier per window', () => {
    const g = new QualityGovernor(3);
    const r = feed(g, 40, 400, 10000);
    expect(r.changes[0]).toBe(2);
    expect(g.tier.id).toBe(0);
    expect(r.changes).toEqual([2, 1, 0]);
  });

  it('does not change on a short spike or outliers', () => {
    const g = new QualityGovernor(3);
    feed(g, 16.7, 80, 0);
    expect(g.push(OUTLIER_MS + 1, 5000)).toBeNull();
    const r = feed(g, 60, 10, 5000);
    expect(r.changes).toHaveLength(0);
    expect(g.tier.id).toBe(3);
  });

  it('steps up only after a long clean window and respects the ceiling', () => {
    const g = new QualityGovernor(1, 2);
    const r = feed(g, 16.6, 600, 0);
    expect(r.changes).toEqual([2]);
    expect(g.tier.id).toBe(2);
    expect(feed(g, 16.6, 600, r.at).changes).toEqual([]);
  });

  it('backs off after a rise is immediately punished', () => {
    const g = new QualityGovernor(2, 3);
    const up = feed(g, 16.6, 600, 0);
    expect(up.changes).toEqual([3]);
    // Slow frames until the first drop, then clean frames again.
    let at = up.at;
    let dropped: number | null = null;
    for (let i = 0; i < 400 && dropped === null; i++) {
      at += 40;
      dropped = g.push(40, at)?.id ?? null;
    }
    expect(dropped).toBe(2);
    const retry = feed(g, 16.6, 600, at);
    expect(retry.changes).toEqual([]);
    expect(g.tier.id).toBe(2);
  });

  it('chooses a conservative starting tier for constrained devices', () => {
    expect(startingTier({ coarsePointer: false, memoryGb: 8, cores: 8, saveData: false })).toBe(3);
    expect(startingTier({ coarsePointer: true, memoryGb: 4, cores: 8, saveData: false })).toBe(2);
    expect(startingTier({ coarsePointer: false, memoryGb: 2, cores: 8, saveData: false })).toBe(0);
    expect(startingTier({ coarsePointer: false, memoryGb: 8, cores: 8, saveData: true })).toBe(0);
  });
});

describe('MasterLoop', () => {
  it('can be constructed without a DOM and exposes a frame counter', () => {
    const g = globalThis as Record<string, unknown>;
    const saved = { document: g.document, IntersectionObserver: g.IntersectionObserver };
    delete g.document;
    delete g.IntersectionObserver;
    try {
      const loop = new MasterLoop();
      expect(loop.frameCount).toBe(0);
    } finally {
      if (saved.document !== undefined) g.document = saved.document;
      if (saved.IntersectionObserver !== undefined) g.IntersectionObserver = saved.IntersectionObserver;
    }
  });
});
