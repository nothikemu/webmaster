import type { Lesson, ModuleContent, ModuleId } from './types';
import { foundationsLessons } from './lessons/foundations';
import { synthesisLessons } from './lessons/synthesis';
import { ethicsLessons } from './lessons/ethics';

export const MODULES: readonly ModuleContent[] = [
  {
    id: 'foundations',
    number: 1,
    title: 'Foundations',
    tagline: 'Rules write the program. Examples write the model.',
    tsaSection: 'Fundamental AI concepts',
    summary: 'What AI is and is not, how learning from examples differs from writing rules, what a neural network is made of, and what happens during training and inference.',
    objective: 'Explain how a machine learning system differs from hand-written rules, name the parts of a neural network, and tell training apart from inference.',
    centerpiece: {
      id: 'topology',
      name: 'Neural topology',
      summary: 'A small network drawn so you can see its parts, send a signal through it, and change a weight to watch the answer move.',
    },
    lessons: foundationsLessons,
  },
  {
    id: 'synthesis',
    number: 2,
    title: 'Synthesis',
    tagline: 'A prompt is a specification. Write it so it can be tested.',
    tsaSection: 'Practical AI tools and techniques',
    summary: 'How a model reads a prompt, how roles, tasks and constraints shape the answer, how examples and visible reasoning help, and how to judge what comes back.',
    objective: 'Write prompts that state a role, task, constraints and examples; explain what temperature changes; and judge an output against a checklist.',
    centerpiece: {
      id: 'console',
      name: 'Prompt console',
      summary: 'Four controls and four prompt styles feed a deterministic simulation, so you can see what each change does to the output and why.',
    },
    lessons: synthesisLessons,
  },
  {
    id: 'ethics',
    number: 3,
    title: 'Ethics',
    tagline: 'Every model fails somewhere. Responsible teams know where.',
    tsaSection: 'Ethical AI usage',
    summary: 'Bias, privacy, attacks, opacity and accountability: where AI systems fail people, what realistic mitigations look like, and who is responsible when something goes wrong.',
    objective: 'Identify four classes of AI risk, match each to a mitigation, and describe what accountability looks like for a deployed system.',
    centerpiece: {
      id: 'matrix',
      name: 'Vulnerability matrix',
      summary: 'Four ways an AI system fails, each with its cause, its warning signs, a realistic mitigation, and a before-and-after comparison.',
    },
    lessons: ethicsLessons,
  },
];

export const LESSONS: readonly Lesson[] = MODULES.flatMap((m) => m.lessons);

export const moduleById = (id: string): ModuleContent | undefined => MODULES.find((m) => m.id === id);
export const isModuleId = (v: string): v is ModuleId => MODULES.some((m) => m.id === v);
export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
export const lessonBySlug = (module: string, slug: string): Lesson | undefined => LESSONS.find((l) => l.module === module && l.slug === slug);
export const moduleOf = (lesson: Lesson): ModuleContent => MODULES.find((m) => m.id === lesson.module)!;

export const coreLessons = (m: ModuleContent): Lesson[] => m.lessons.filter((l) => l.core);
export const furtherLessons = (m: ModuleContent): Lesson[] => m.lessons.filter((l) => !l.core);

/** The address of a lesson. */
export const lessonPath = (l: Lesson): string => `/modules/${l.module}/${l.slug}`;

/**
 * The lesson before and after this one. Core lessons run in order; the last core lesson has no "next" inside the sequence
 * (the module page offers what comes after). Go-further lessons are independent, so each one points back to the module.
 */
export function neighbours(lesson: Lesson): { prev?: Lesson; next?: Lesson } {
  if (!lesson.core) return {};
  const core = coreLessons(moduleOf(lesson));
  const i = core.indexOf(lesson);
  return { prev: core[i - 1], next: core[i + 1] };
}

/** "1" to "5" for core lessons, "A", "B", ... for go-further lessons. Used as the figure number of a lesson. */
export function lessonLabel(lesson: Lesson): string {
  const m = moduleOf(lesson);
  return lesson.core ? String(coreLessons(m).indexOf(lesson) + 1) : String.fromCharCode(65 + furtherLessons(m).indexOf(lesson));
}
