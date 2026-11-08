import { moduleA } from './moduleA';
import { moduleB } from './moduleB';
import { moduleC } from './moduleC';
import type { ModuleContent, ModuleId } from './types';

export * from './types';
export { glossary, resources } from './glossary';
export { VULNERABILITIES } from './moduleC';

export const MODULES: readonly ModuleContent[] = [moduleA, moduleB, moduleC];

const byId = new Map<ModuleId, ModuleContent>(MODULES.map((m) => [m.id, m]));

export function getModule(id: ModuleId): ModuleContent {
  const found = byId.get(id);
  if (!found) throw new Error(`unknown module: ${id}`);
  return found;
}

export function isModuleId(value: string): value is ModuleId {
  return byId.has(value as ModuleId);
}

export const moduleHref = (id: ModuleId): string => `/modules/${id}`;
export const lessonHref = (id: ModuleId, n: number): string => `/modules/${id}/lessons/${n}`;
export const quizHref = (id: ModuleId): string => `/modules/${id}/knowledge-check`;
export const challengeHref = (id: ModuleId): string => `/modules/${id}/challenge`;

/** Every route that exists as a real, separately addressable page. */
export const STATIC_ROUTES: readonly string[] = [
  '/',
  '/modules',
  ...MODULES.flatMap((m) => [
    moduleHref(m.id),
    ...m.lessons.map((_, i) => lessonHref(m.id, i + 1)),
    quizHref(m.id),
    challengeHref(m.id),
  ]),
  '/progress',
  '/achievements',
  '/glossary',
  '/about',
  '/accessibility',
  '/credits',
];
