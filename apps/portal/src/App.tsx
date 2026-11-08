import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { getModule } from './content';
import { t } from './core/assets';
import { useServices } from './core/services';
import { ModulePage } from './modules/ModulePage';
import { Link, RouterProvider, pageTitle, useRouter, type Route } from './router';
import { LiveRegion, SkipLink } from './ui/a11y';
import { startFx } from './ui/fx';
import { BurstOverlay } from './ui/BurstOverlay';
import { InkDefs } from './ui/Ink';
import { Footer, Header } from './ui/Chrome';
import { TelemetryHub } from './ui/TelemetryHub';

const Home = lazy(() => import('./pages/Home'));
const ModuleHub = lazy(() => import('./pages/ModuleHub'));
const ProgressDashboard = lazy(() => import('./pages/ProgressDashboard'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Glossary = lazy(() => import('./pages/Glossary'));
const About = lazy(() => import('./pages/About'));
const Accessibility = lazy(() => import('./pages/Accessibility'));
const Credits = lazy(() => import('./pages/Credits'));

function NotFound(): ReactNode {
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="display">{t('nf.title')}</h1>
        <p className="lead">{t('nf.body')}</p>
        <Link to="/" className="btn btn-primary">
          {t('nf.home')}
        </Link>
      </header>
    </div>
  );
}

function view(route: Route): ReactNode {
  switch (route.name) {
    case 'home':
      return <Home />;
    case 'hub':
      return <ModuleHub />;
    case 'module':
      return <ModulePage key={route.id} id={route.id} view={{ kind: 'overview' }} />;
    case 'lesson': {
      const exists = route.n <= getModule(route.id).lessons.length;
      return exists ? (
        <ModulePage key={route.id} id={route.id} view={{ kind: 'lesson', n: route.n }} />
      ) : (
        <NotFound />
      );
    }
    case 'quiz':
      return <ModulePage key={route.id} id={route.id} view={{ kind: 'quiz' }} />;
    case 'challenge':
      return <ModulePage key={route.id} id={route.id} view={{ kind: 'challenge' }} />;
    case 'progress':
      return <ProgressDashboard />;
    case 'achievements':
      return <Achievements />;
    case 'glossary':
      return <Glossary />;
    case 'about':
      return <About />;
    case 'accessibility':
      return <Accessibility />;
    case 'credits':
      return <Credits />;
    case 'notfound':
      return <NotFound />;
  }
}

function Shell(): ReactNode {
  const { route, path } = useRouter();
  const { actor } = useServices();

  useEffect(() => {
    document.title = pageTitle(route, {
      module: (id) => getModule(id).title,
      lesson: (id, n) => getModule(id).lessons[n - 1]?.title ?? getModule(id).title,
    });
    actor.send({ type: 'ROUTE_CHANGED', path });
  }, [route, path, actor]);

  // The motion layer: reveals, pointer light, magnetic buttons, scroll values. Off under reduced motion.
  useEffect(() => startFx(), []);

  // Reveal the app once the shell has committed (the staged load sequence ends here).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.documentElement.dataset.boot = 'ready';
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {/* The ink filters the stamps and rules use, defined once for the whole page. */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute' }}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <InkDefs />
        </defs>
      </svg>
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<div className="route-loading" aria-hidden="true" />}>
          {view(route)}
        </Suspense>
      </main>
      <Footer />
      <TelemetryHub />
      <LiveRegion />
      <BurstOverlay />
    </>
  );
}

export function App(): ReactNode {
  return (
    <RouterProvider>
      <Shell />
    </RouterProvider>
  );
}
