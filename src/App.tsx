import { Suspense, useEffect, useRef } from 'react';
import { usePath } from '@/router';
import { ArtDefs } from '@/art/Defs';
import { play } from '@/audio/sfx';
import { Footer, Header, RewardHost } from '@/ui/Shell';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { lessonById, pathById } from '@/content/paths';
import { RouteView, TITLES } from '@/routes';

function titleFor(path: string): string {
  if (TITLES[path]) return path === '/' ? TITLES[path]! : `${TITLES[path]} · Parameter`;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'learn' && parts.length === 3) {
    const l = lessonById(parts[2]!);
    if (l) return `${l.title} · Parameter`;
  }
  if (parts[0] === 'learn' && parts.length === 2) {
    const p = pathById(parts[1]!);
    if (p) return `${p.title} · Parameter`;
  }
  return 'Page not found · Parameter';
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
              <RouteView path={path} />
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <RewardHost />
    </>
  );
}
