/** The route table: which component draws which address. */
import { lazy } from 'react';
import { isModuleId, lessonBySlug, moduleById } from '@/content/modules';

const Home = lazy(() => import('./pages/Home'));
const Modules = lazy(() => import('./pages/Modules'));
const ModulePage = lazy(() => import('./pages/ModulePage'));
const LessonPage = lazy(() => import('./pages/Lesson'));
const Cases = lazy(() => import('./pages/Cases'));
const Glossary = lazy(() => import('./pages/Glossary'));
const Tools = lazy(() => import('./pages/Tools'));
const Overview = lazy(() => import('./pages/Overview'));
const NotFound = lazy(() => import('./pages/NotFound'));
const About = lazy(() => import('./pages/Static').then((m) => ({ default: m.About })));
const Accessibility = lazy(() => import('./pages/Static').then((m) => ({ default: m.Accessibility })));
const Credits = lazy(() => import('./pages/Static').then((m) => ({ default: m.Credits })));

const TITLES: Record<string, string> = {
  '/modules': 'The three modules',
  '/modules/ethics/cases': 'Cases',
  '/glossary': 'Glossary',
  '/tools': 'Tool atlas',
  '/overview': 'Your learning overview',
  '/about': 'About and sources',
  '/accessibility': 'Accessibility',
  '/credits': 'Credits',
};

export function titleFor(path: string): string {
  if (path === '/') return 'Parameter: a field guide to how machines learn';
  if (TITLES[path]) return `${TITLES[path]} · Parameter`;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'modules' && parts.length === 3) {
    const l = lessonBySlug(parts[1]!, parts[2]!);
    if (l) return `${l.title} · ${moduleById(l.module)!.title} · Parameter`;
  }
  if (parts[0] === 'modules' && parts.length === 2 && isModuleId(parts[1]!)) return `${moduleById(parts[1]!)!.title} · Parameter`;
  return 'Page not found · Parameter';
}

export function RouteView({ path }: { path: string }) {
  if (path === '/') return <Home />;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'modules') {
    if (parts.length === 1) return <Modules />;
    if (parts.length === 2 && isModuleId(parts[1]!)) return <ModulePage moduleId={parts[1]!} />;
    if (parts.length === 3 && parts[1] === 'ethics' && parts[2] === 'cases') return <Cases />;
    if (parts.length === 3 && isModuleId(parts[1]!)) {
      const l = lessonBySlug(parts[1]!, parts[2]!);
      if (l) return <LessonPage lesson={l} />;
    }
    return <NotFound />;
  }
  switch (path) {
    case '/glossary': return <Glossary />;
    case '/tools': return <Tools />;
    case '/overview': return <Overview />;
    case '/about': return <About />;
    case '/accessibility': return <Accessibility />;
    case '/credits': return <Credits />;
    default: return <NotFound />;
  }
}
