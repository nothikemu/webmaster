import { describe, expect, it } from 'vitest';
import { GLOSSARY } from '@/content/glossary';
import { MISCONCEPTIONS } from '@/content/misconceptions';
import { TOOLS } from '@/content/tools';
import { CASES } from '@/content/cases';
import { LESSONS, MODULES, coreLessons, furtherLessons, lessonBySlug, lessonPath, neighbours } from '@/content/modules';
import { ROUTES } from '@/content/routes';
import type { Question, WidgetSpec } from '@/content/types';

const validQuestion = (q: Question): boolean => {
  if (!q.prompt || !q.explain) return false;
  if (q.kind === 'single') return q.options.length >= 3 && q.answer >= 0 && q.answer < q.options.length;
  if (q.kind === 'multi') return q.options.length >= 3 && q.answers.length >= 1 && q.answers.every((a) => a >= 0 && a < q.options.length) && new Set(q.answers).size === q.answers.length && q.answers.length < q.options.length;
  return typeof q.answer === 'boolean';
};

describe('the three modules', () => {
  it('are Foundations, Synthesis and Ethics, mapped to the three required learning areas', () => {
    expect(MODULES.map((m) => m.title)).toEqual(['Foundations', 'Synthesis', 'Ethics']);
    expect(MODULES.map((m) => m.tsaSection)).toEqual(['Fundamental AI concepts', 'Practical AI tools and techniques', 'Ethical AI usage']);
    expect(MODULES.map((m) => m.centerpiece.id)).toEqual(['topology', 'console', 'matrix']);
  });
  it('each have five core lessons in the agreed order', () => {
    const titles = MODULES.map((m) => coreLessons(m).map((l) => l.title));
    expect(titles[0]).toEqual(["What AI is, and what it isn't", 'Rules versus learning', 'Neural networks', 'Training and inference', 'Data and features']);
    expect(titles[1]).toEqual(['How a model reads a prompt', 'Roles, tasks and constraints', 'Examples and few-shot prompting', 'Reasoning step by step', 'Evaluating outputs']);
    expect(titles[2]).toEqual(['Bias and fairness', 'Privacy and data leakage', 'Adversarial inputs', 'Transparency and explanation', 'Accountability']);
  });
  it('keep every earlier lesson, either as a core lesson or as a go-further lesson', () => {
    const earlier = ['u1', 'u2', 'u3', 'u4', 'u5', 't1', 't2', 't3', 't4', 't5', 'r1', 'r2', 'r3', 'r4', 'r5'];
    for (const id of earlier) expect(LESSONS.some((l) => l.id === id)).toBe(true);
    expect(furtherLessons(MODULES[0]!).length + furtherLessons(MODULES[1]!).length + furtherLessons(MODULES[2]!).length).toBe(LESSONS.length - 15);
  });
  it('have unique stable ids and readable, unique addresses', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    expect(new Set(LESSONS.map(lessonPath)).size).toBe(LESSONS.length);
    for (const l of LESSONS) expect(lessonBySlug(l.module, l.slug)).toBe(l);
  });
});

describe('every lesson has every required element', () => {
  for (const l of LESSONS) {
    it(`${l.id}: ${l.title}`, () => {
      expect(l.objective.length).toBeGreaterThan(30);
      expect(l.beats.length).toBeGreaterThanOrEqual(2);
      for (const b of l.beats) {
        expect(b.heading).toBeTruthy();
        expect(b.paragraphs.length).toBeGreaterThanOrEqual(1);
        // no walls of text: each paragraph stays short
        for (const p of b.paragraphs) expect(p.split(/\s+/).length).toBeLessThan(110);
      }
      expect(l.beats.some((b) => b.visual) || l.widget !== undefined).toBe(true);
      expect(l.check.length).toBeGreaterThanOrEqual(2);
      for (const q of l.check) expect(validQuestion(q)).toBe(true);
      expect(l.takeaways.length).toBeGreaterThanOrEqual(3);
      expect(l.glossary.length).toBeGreaterThanOrEqual(1);
      for (const id of l.glossary) expect(GLOSSARY.some((g) => g.id === id)).toBe(true);
      // nothing is scored: experiments carry no pass mark
      if (l.widget) expect('pass' in l.widget).toBe(false);
    });
  }
  it('checks use more than one question type across the course', () => {
    const kinds = new Set(LESSONS.flatMap((l) => l.check.map((q) => q.kind)));
    expect(kinds.has('single')).toBe(true);
    expect(kinds.has('tf')).toBe(true);
  });
  it('uses a variety of experiments, not the same one every time', () => {
    expect(new Set(LESSONS.flatMap((l) => (l.widget ? [l.widget.id] : []))).size).toBeGreaterThanOrEqual(9);
  });
});

describe('generic experiment configs are internally consistent', () => {
  const specs: [string, WidgetSpec][] = LESSONS.flatMap((l) => (l.widget ? ([[l.id, l.widget]] as [string, WidgetSpec][]) : []));
  for (const [id, w] of specs) {
    if (w.id === 'sorter') {
      it(`${id} sorter: every item lands in a real bin and is explained`, () => {
        const c = w.config as { bins: { id: string }[]; items: { bin: string; why: string }[] };
        for (const it of c.items) {
          expect(c.bins.some((b) => b.id === it.bin)).toBe(true);
          expect(it.why.length).toBeGreaterThan(20);
        }
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
      });
    }
  }
});

describe('glossary, tools, cases and misconceptions', () => {
  it('glossary ids are unique and every term has a real definition and a module', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length);
    for (const g of GLOSSARY) {
      expect(g.definition.length).toBeGreaterThan(25);
      expect(MODULES.some((m) => m.id === g.module)).toBe(true);
    }
  });
  it('every glossary term is taught by a lesson, or is reference-only (used by an instrument)', () => {
    const taught = new Set(LESSONS.flatMap((l) => l.glossary));
    const loose = GLOSSARY.filter((g) => !taught.has(g.id)).map((g) => g.id);
    expect(loose.sort()).toEqual(['data-leakage', 'differential-privacy', 'supervised-learning']);
  });
  it('every tool carries a check date, a source for verified facts, and honest limits', () => {
    for (const t of TOOLS) {
      expect(t.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.limits.length).toBeGreaterThanOrEqual(2);
      if (t.access.verified) expect(t.access.source).toMatch(/^https:\/\//);
    }
    expect(TOOLS.filter((t) => t.access.verified).length).toBeGreaterThanOrEqual(3);
  });
  it('cases explain every choice, mark each as a judgement, and carry no score fields', () => {
    expect(CASES.length).toBe(6);
    for (const c of CASES) {
      expect(LESSONS.some((l) => l.id === c.lesson)).toBe(true);
      for (const s of c.steps) {
        expect(s.choices.length).toBe(3);
        for (const ch of s.choices) {
          expect(ch.response.length).toBeGreaterThan(20);
          expect(['strong', 'mixed', 'weak']).toContain(ch.fit);
          expect('integrity' in ch || 'learning' in ch || 'privacy' in ch).toBe(false);
        }
      }
    }
  });
  it('misconceptions each point at a real lesson', () => {
    expect(MISCONCEPTIONS.length).toBeGreaterThanOrEqual(10);
    for (const m of MISCONCEPTIONS) expect(LESSONS.some((l) => l.id === m.lesson)).toBe(true);
  });
});

describe('routes and navigation', () => {
  it('lists every page exactly once', () => {
    expect(new Set(ROUTES).size).toBe(ROUTES.length);
    expect(ROUTES).toContain('/modules/foundations/neural-networks');
    expect(ROUTES).toContain('/modules/ethics/accountability');
    expect(ROUTES).toContain('/modules/ethics/cases');
    expect(ROUTES.length).toBe(1 + 1 + 3 + LESSONS.length + 1 + 6);
  });
  it('has no route for the removed game, missions, certification or achievements', () => {
    for (const gone of ['/play', '/missions', '/certification', '/achievements', '/practice', '/lab', '/scenarios', '/codex', '/logbook']) expect(ROUTES).not.toContain(gone);
  });
  it('previous and next stay inside the core sequence', () => {
    for (const m of MODULES) {
      const core = coreLessons(m);
      expect(neighbours(core[0]!).prev).toBeUndefined();
      expect(neighbours(core[0]!).next).toBe(core[1]);
      expect(neighbours(core[core.length - 1]!).next).toBeUndefined();
      for (const f of furtherLessons(m)) expect(neighbours(f)).toEqual({});
    }
  });
});
