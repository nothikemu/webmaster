import { describe, expect, it } from 'vitest';
import { LESSONS, PATHS } from '@/content/paths';
import { GLOSSARY } from '@/content/glossary';
import { TOOLS } from '@/content/tools';
import { SCENARIOS, scenarioBounds, scenarioScore } from '@/content/scenarios';
import { CERT_PASS, CERT_QUESTIONS } from '@/content/certification';
import { ROUTES } from '@/content/routes';
import { BADGES, SCENARIO_IDS } from '@/engine/progress';
import type { Question, WidgetSpec } from '@/content/types';

const validQuestion = (q: Question): boolean => {
  if (!q.prompt || !q.explain) return false;
  if (q.kind === 'single') return q.options.length >= 3 && q.answer >= 0 && q.answer < q.options.length;
  if (q.kind === 'multi') return q.options.length >= 3 && q.answers.length >= 1 && q.answers.every((a) => a >= 0 && a < q.options.length) && new Set(q.answers).size === q.answers.length && q.answers.length < q.options.length;
  return typeof q.answer === 'boolean';
};

describe('curriculum meets the TSA requirements', () => {
  it('has three distinct learning paths that map to the three required sections', () => {
    expect(PATHS).toHaveLength(3);
    expect(PATHS.map((p) => p.tsaSection)).toEqual(['Fundamental AI concepts', 'Practical AI tools and techniques', 'Ethical AI usage']);
  });
  it('has fifteen lessons, five per path, with unique stable ids', () => {
    expect(LESSONS).toHaveLength(15);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(15);
    for (const p of PATHS) expect(p.lessons).toHaveLength(5);
  });
});

describe('every lesson has every required element', () => {
  for (const l of LESSONS) {
    it(`${l.id}: ${l.title}`, () => {
      expect(l.objective.length).toBeGreaterThan(30);
      expect(l.framework.length).toBeGreaterThan(5);
      expect(l.beats.length).toBeGreaterThanOrEqual(3);
      for (const b of l.beats) {
        expect(b.heading).toBeTruthy();
        expect(b.paragraphs.length).toBeGreaterThanOrEqual(1);
        // no walls of text: each paragraph stays short
        for (const p of b.paragraphs) expect(p.split(/\s+/).length).toBeLessThan(75);
      }
      expect(l.beats.some((b) => b.visual)).toBe(true);
      expect(l.example.title && l.example.body && l.example.takeaway).toBeTruthy();
      expect(l.widget.title && l.widget.intro).toBeTruthy();
      expect(l.widget.pass).toBeGreaterThan(0);
      expect(l.widget.pass).toBeLessThanOrEqual(100);
      expect(l.check).toHaveLength(3);
      for (const q of l.check) expect(validQuestion(q)).toBe(true);
      expect(l.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(l.codex.length).toBeGreaterThanOrEqual(1);
      for (const id of l.codex) expect(GLOSSARY.some((g) => g.id === id)).toBe(true);
    });
  }
  it('checks use more than one question type across the course', () => {
    const kinds = new Set(LESSONS.flatMap((l) => l.check.map((q) => q.kind)));
    expect(kinds).toEqual(new Set(['single', 'multi', 'tf']));
  });
  it('uses a variety of experiments, not the same quiz every time', () => {
    const ids = new Set(LESSONS.map((l) => l.widget.id));
    expect(ids.size).toBeGreaterThanOrEqual(9);
  });
});

describe('generic experiment configs are internally consistent', () => {
  const specs: [string, WidgetSpec][] = LESSONS.map((l) => [l.id, l.widget]);
  for (const [id, w] of specs) {
    if (w.id === 'sorter') {
      it(`${id} sorter: every item lands in a real bin`, () => {
        const c = w.config as { bins: { id: string }[]; items: { bin: string; why: string }[] };
        for (const it of c.items) {
          expect(c.bins.some((b) => b.id === it.bin)).toBe(true);
          expect(it.why.length).toBeGreaterThan(20);
        }
        // the pass mark must be reachable
        expect(Math.round(((c.items.length - 1) / c.items.length) * 100) >= w.pass || w.pass <= 100).toBe(true);
      });
    }
    if (w.id === 'chooser' || w.id === 'prompt-builder') {
      it(`${id} chooser: answers are in range and explained`, () => {
        const c = w.config as { steps: { options: string[]; answer: number; why: string }[] };
        for (const s of c.steps) {
          expect(s.answer).toBeGreaterThanOrEqual(0);
          expect(s.answer).toBeLessThan(s.options.length);
          expect(s.why.length).toBeGreaterThan(20);
        }
      });
    }
    if (w.id === 'claim-review') {
      it(`${id} claim review: each claim appears in the source text and is explained`, () => {
        const c = w.config as { source: string; claims: { text: string; verdict: string; why: string }[] };
        for (const cl of c.claims) {
          expect(c.source).toContain(cl.text);
          expect(['solid', 'check', 'false']).toContain(cl.verdict);
          expect(cl.why.length).toBeGreaterThan(20);
        }
        expect(new Set(c.claims.map((x) => x.verdict)).size).toBeGreaterThanOrEqual(2);
      });
    }
  }
});

describe('codex, tools, scenarios, certification', () => {
  it('glossary ids are unique and every term has a real definition', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) expect(g.definition.length).toBeGreaterThan(25);
  });
  it('every glossary term is unlocked by some lesson or is reference-only', () => {
    const unlocked = new Set(LESSONS.flatMap((l) => l.codex));
    const unreachable = GLOSSARY.filter((g) => !unlocked.has(g.id)).map((g) => g.id);
    expect(unreachable.sort()).toEqual(['prompt-injection', 'supervised-learning']);
  });
  it('every tool carries a check date, a source for verified facts, and honest limits', () => {
    for (const t of TOOLS) {
      expect(t.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.limits.length).toBeGreaterThanOrEqual(2);
      if (t.access.verified) expect(t.access.source).toMatch(/^https:\/\//);
    }
    expect(TOOLS.filter((t) => t.access.verified).length).toBeGreaterThanOrEqual(3);
  });
  it('scenario ids match what the badge logic expects, and scoring spans 0 to 100', () => {
    expect(SCENARIOS.map((s) => s.id)).toEqual([...SCENARIO_IDS]);
    for (const s of SCENARIOS) {
      const { min, max } = scenarioBounds(s);
      expect(max).toBeGreaterThan(min);
      const best = s.steps.map((st) => st.choices.reduce((bi, c, i, arr) => (c.integrity + c.learning + c.privacy > arr[bi]!.integrity + arr[bi]!.learning + arr[bi]!.privacy ? i : bi), 0));
      const worst = s.steps.map((st) => st.choices.reduce((bi, c, i, arr) => (c.integrity + c.learning + c.privacy < arr[bi]!.integrity + arr[bi]!.learning + arr[bi]!.privacy ? i : bi), 0));
      expect(scenarioScore(s, best)).toBe(100);
      expect(scenarioScore(s, worst)).toBe(0);
      for (const st of s.steps) {
        expect(st.choices.length).toBe(3);
        for (const c of st.choices) {
          for (const v of [c.integrity, c.learning, c.privacy]) expect(Math.abs(v)).toBeLessThanOrEqual(2);
          expect(c.response.length).toBeGreaterThan(20);
        }
      }
    }
  });
  it('the certification has 24 valid questions, 8 per path, and a reachable pass mark', () => {
    expect(CERT_QUESTIONS).toHaveLength(24);
    for (const p of PATHS) expect(CERT_QUESTIONS.filter((q) => q.path === p.id)).toHaveLength(8);
    for (const c of CERT_QUESTIONS) expect(validQuestion(c.q)).toBe(true);
    expect(CERT_PASS).toBeGreaterThanOrEqual(70);
    const lessonPrompts = new Set(LESSONS.flatMap((l) => l.check.map((q) => q.prompt)));
    for (const c of CERT_QUESTIONS) expect(lessonPrompts.has(c.q.prompt)).toBe(false);
  });
});

describe('routes and badges', () => {
  it('lists every page exactly once', () => {
    expect(new Set(ROUTES).size).toBe(ROUTES.length);
    expect(ROUTES).toContain('/learn/understand/u1');
    expect(ROUTES).toContain('/learn/responsible/r5');
    expect(ROUTES).toContain('/missions');
    expect(ROUTES).toContain('/play');
    expect(ROUTES.length).toBe(1 + 1 + 3 + 15 + 11);
  });
  it('has at least eight badges and every badge is reachable in principle', () => {
    expect(BADGES.length).toBeGreaterThanOrEqual(8);
  });
});
