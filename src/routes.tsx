/** The route table: which component draws which address. Shared by the site and by the windows inside the game. */
import { lazy } from 'react';
import { isPathId, lessonById, pathById } from '@/content/paths';

const Home = lazy(() => import('./pages/Home'));
const LessonPage = lazy(() => import('./pages/Lesson'));
const Lab = lazy(() => import('./pages/Lab'));
const Practice = lazy(() => import('./pages/Practice'));
const Missions = lazy(() => import('./pages/Missions'));
const Game = lazy(() => import('./game/Game'));
const Tools = lazy(() => import('./pages/Tools'));
const Scenarios = lazy(() => import('./pages/Scenarios'));
const Codex = lazy(() => import('./pages/Codex'));
const Logbook = lazy(() => import('./pages/Logbook'));
const Certification = lazy(() => import('./pages/Certification'));
const NotFound = lazy(() => import('./pages/NotFound'));
const LearnIndex = lazy(() => import('./pages/Learn').then((m) => ({ default: m.LearnIndex })));
const PathPage = lazy(() => import('./pages/Learn').then((m) => ({ default: m.PathPage })));
const About = lazy(() => import('./pages/Static').then((m) => ({ default: m.About })));
const Accessibility = lazy(() => import('./pages/Static').then((m) => ({ default: m.Accessibility })));
const Credits = lazy(() => import('./pages/Static').then((m) => ({ default: m.Credits })));

export const TITLES: Record<string, string> = {
  '/': 'Parameter: learn how AI works, use it well, and know its limits',
  '/learn': 'Lessons',
  '/play': 'Play the game',
  '/practice': 'Practice',
  '/missions': 'Missions',
  '/lab': 'Prompt Lab',
  '/tools': 'Tool Atlas',
  '/scenarios': 'Scenarios',
  '/codex': 'Codex',
  '/logbook': 'Progress',
  '/certification': 'Final certification',
  '/about': 'About and sources',
  '/accessibility': 'Accessibility',
  '/credits': 'Credits',
};

/** What a window over the game calls the page it shows. */
export function pageTitle(path: string): string {
  if (TITLES[path]) return TITLES[path]!;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'learn' && parts.length === 3) return lessonById(parts[2]!)?.title ?? 'Lesson';
  if (parts[0] === 'learn' && parts.length === 2) return pathById(parts[1]!)?.title ?? 'Lessons';
  return 'Page not found';
}

/** Pages that open inside the game. Everything else (the site's own home, about, credits and the game itself) leaves it or closes the window. */
export function opensInGame(path: string): boolean {
  const p = path.split('#')[0] ?? '';
  return !(p === '' || p === '/' || p.startsWith('/play') || p === '/about' || p === '/accessibility' || p === '/credits');
}

export function RouteView({ path }: { path: string }) {
  if (path === '/') return <Home />;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'learn') {
    if (parts.length === 1) return <LearnIndex />;
    if (parts.length === 2 && isPathId(parts[1]!)) return <PathPage pathId={parts[1]!} />;
    if (parts.length === 3) return <LessonPage pathId={parts[1]!} lessonId={parts[2]!} />;
  }
  switch (path) {
    case '/play': return <Game />;
    case '/practice': return <Practice />;
    case '/missions': return <Missions />;
    case '/lab': return <Lab />;
    case '/tools': return <Tools />;
    case '/scenarios': return <Scenarios />;
    case '/codex': return <Codex />;
    case '/logbook': return <Logbook />;
    case '/certification': return <Certification />;
    case '/about': return <About />;
    case '/accessibility': return <Accessibility />;
    case '/credits': return <Credits />;
    default: return <NotFound />;
  }
}
