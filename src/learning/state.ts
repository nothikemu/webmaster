/**
 * What the portal remembers about a learner, and nothing more: which lessons they have opened and which they have marked complete.
 * No points, levels, streaks, scores or unlocks. Every lesson is open to everyone, always. Pure functions, no React, no browser APIs.
 */
import type { Lesson, ModuleContent } from '@/content/types';
import { LESSONS, MODULES, coreLessons, furtherLessons, lessonById } from '@/content/modules';

export const STATE_VERSION = 2;

export interface LearningState {
  v: typeof STATE_VERSION;
  /** Lessons opened at least once, with the time of the latest visit. */
  opened: Record<string, number>;
  /** Lessons the learner has marked complete, with the time they did so. */
  completed: Record<string, number>;
  /** The lesson opened most recently. */
  last: string | null;
}

export const createState = (): LearningState => ({ v: STATE_VERSION, opened: {}, completed: {}, last: null });

export type LearningEvent =
  | { type: 'open'; lesson: string }
  | { type: 'complete'; lesson: string }
  | { type: 'uncomplete'; lesson: string }
  | { type: 'reset' };

export function applyEvent(s: LearningState, ev: LearningEvent, now: number): LearningState {
  if (ev.type === 'reset') return createState();
  if (!lessonById(ev.lesson)) return s;
  if (ev.type === 'open') return { ...s, opened: { ...s.opened, [ev.lesson]: now }, last: ev.lesson };
  if (ev.type === 'complete') {
    if (s.completed[ev.lesson]) return s;
    return { ...s, opened: { ...s.opened, [ev.lesson]: s.opened[ev.lesson] ?? now }, completed: { ...s.completed, [ev.lesson]: now }, last: ev.lesson };
  }
  const { [ev.lesson]: _removed, ...rest } = s.completed;
  return { ...s, completed: rest };
}

export type LessonStatus = 'not-started' | 'started' | 'complete';

export function statusOf(s: LearningState, id: string): LessonStatus {
  if (s.completed[id]) return 'complete';
  return s.opened[id] ? 'started' : 'not-started';
}

export const STATUS_LABEL: Record<LessonStatus, string> = { 'not-started': 'Not started', started: 'Started', complete: 'Complete' };

export interface ModuleProgress {
  coreDone: number;
  coreTotal: number;
  furtherDone: number;
  furtherTotal: number;
  /** The first core lesson not yet complete, or null when the five are done. */
  next: Lesson | null;
}

export function moduleProgress(s: LearningState, m: ModuleContent): ModuleProgress {
  const core = coreLessons(m);
  const further = furtherLessons(m);
  return {
    coreDone: core.filter((l) => s.completed[l.id]).length,
    coreTotal: core.length,
    furtherDone: further.filter((l) => s.completed[l.id]).length,
    furtherTotal: further.length,
    next: core.find((l) => !s.completed[l.id]) ?? null,
  };
}

/** The lesson to suggest next: the next unfinished core lesson in the module the learner was last in, otherwise the first one anywhere. */
export function suggestNext(s: LearningState): Lesson | null {
  const last = s.last ? lessonById(s.last) : undefined;
  const order = last ? [MODULES.find((m) => m.id === last.module)!, ...MODULES.filter((m) => m.id !== last.module)] : [...MODULES];
  for (const m of order) {
    const next = moduleProgress(s, m).next;
    if (next) return next;
  }
  return null;
}

export const totalComplete = (s: LearningState): number => LESSONS.filter((l) => s.completed[l.id]).length;
export const hasAnyData = (s: LearningState): boolean => Object.keys(s.opened).length > 0 || Object.keys(s.completed).length > 0;
