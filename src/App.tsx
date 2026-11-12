import { Suspense, lazy, useEffect, useRef } from 'react';
import { usePath } from '@/router';
import { ArtDefs } from '@/art/Defs';
import { play } from '@/audio/sfx';
import { Footer, Header, RewardHost } from '@/ui/Shell';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { isPathId, lessonById, pathById } from '@/content/paths';

const Home = lazy(() => import('./pages/Home'));
const LessonPage = lazy(() => import('./pages/Lesson'));
const Lab = lazy(() => import('./pages/Lab'));
const Missions = lazy(() => import('./pages/Missions'));
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

const TITLES: Record<string, string> = {
  '/': 'Tideweight: Learn how AI works, use it well, and know its limits',
  '/learn': 'The chart',
  '/missions': 'Missions',
  '/lab': 'Prompt Lab',
  '/tools': 'Tool Atlas',
  '/scenarios': 'Scenarios',
  '/codex': 'Codex',
  '/logbook': 'Logbook',
  '/certification': 'Final certification',
  '/about': 'About and sources',
  '/accessibility': 'Accessibility',
  '/credits': 'Credits',
};

function Route({ path }: { path: string }) {
  if (path === '/') return <Home />;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'learn') {
    if (parts.length === 1) return <LearnIndex />;
    if (parts.length === 2 && isPathId(parts[1]!)) return <PathPage pathId={parts[1]!} />;
    if (parts.length === 3) return <LessonPage pathId={parts[1]!} lessonId={parts[2]!} />;
  }
  switch (path) {
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

function titleFor(path: string): string {
  if (TITLES[path]) return path === '/' ? TITLES[path]! : `${TITLES[path]} · Tideweight`;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'learn' && parts.length === 3) {
    const l = lessonById(parts[2]!);
    if (l) return `${l.title} · Tideweight`;
  }
  if (parts[0] === 'learn' && parts.length === 2) {
    const p = pathById(parts[1]!);
    if (p) return `${p.title} · Tideweight`;
  }
  return 'Page not found · Tideweight';
}

export default function App() {
  const path = usePath();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);

  useEffect(() => {
    document.title = titleFor(path);
    if (first.current) {
      first.current = false;
      return;
    }
    // After navigating, start at the top and move focus to the page so keyboard and screen-reader users land in the new content.
    window.scrollTo({ top: 0, behavior: 'instant' });
    play('nav');
    main.current?.focus({ preventScroll: true });
  }, [path]);

  return (
    <>
      <ArtDefs />
      <a href="#main" className="btn btn--primary skip-link" onClick={(e) => { e.preventDefault(); main.current?.focus(); main.current?.scrollIntoView(); }}>
        Skip to main content
      </a>
      <Header />
      <main id="main" ref={main} tabIndex={-1}>
        <ErrorBoundary resetKey={path}>
          <Suspense fallback={<div className="wrap page loading" role="status">Loading the page…</div>}>
            <div key={path} className="page-enter">
              <Route path={path} />
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <RewardHost />
    </>
  );
}
