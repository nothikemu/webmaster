import type { Lesson, PathContent, PathId } from './types';
import { understandLessons } from './lessons/understand';
import { useLessons } from './lessons/use';
import { responsibleLessons } from './lessons/responsible';

export const PATHS: readonly PathContent[] = [
  {
    id: 'understand',
    number: 1,
    title: 'Understand AI',
    verb: 'Understand',
    place: 'The Loom House',
    tagline: 'See what is really going on inside.',
    tsaSection: 'Fundamental AI concepts',
    summary: 'From rules and examples to neural networks and next-word prediction. Five lessons, each with an experiment you run yourself.',
    lessons: understandLessons,
  },
  {
    id: 'use',
    number: 2,
    title: 'Use AI',
    verb: 'Use',
    place: 'The Foundry Docks',
    tagline: 'Get real work done, and check it.',
    tsaSection: 'Practical AI tools and techniques',
    summary: 'Pick the right tool, write a prompt that works, refine it, verify the answer, and use AI to learn without skipping the learning.',
    lessons: useLessons,
  },
  {
    id: 'responsible',
    number: 3,
    title: 'Use AI Responsibly',
    verb: 'Question',
    place: 'The Beacon',
    tagline: 'Know the risks. Keep your judgment.',
    tsaSection: 'Ethical AI usage',
    summary: 'Bias, made-up answers, deepfakes, privacy, credit and honesty. Real cases, real decisions, and the habits that keep you trustworthy.',
    lessons: responsibleLessons,
  },
];

export const LESSONS: readonly Lesson[] = PATHS.flatMap((p) => p.lessons);

export const lessonById = (id: string): Lesson | undefined => LESSONS.find((l) => l.id === id);
export const pathById = (id: string): PathContent | undefined => PATHS.find((p) => p.id === id);
export const pathOf = (lesson: Lesson): PathContent => PATHS.find((p) => p.id === lesson.path)!;

/** Previous and next lesson in curriculum order. */
export function neighbours(id: string): { prev?: Lesson; next?: Lesson } {
  const i = LESSONS.findIndex((l) => l.id === id);
  return { prev: LESSONS[i - 1], next: LESSONS[i + 1] };
}

/** A lesson's 1-based position inside its own path. */
export const lessonNumber = (lesson: Lesson): number => pathOf(lesson).lessons.indexOf(lesson) + 1;

export const isPathId = (v: string): v is PathId => PATHS.some((p) => p.id === v);
