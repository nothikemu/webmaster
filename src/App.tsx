import { Suspense, useEffect, useRef } from 'react';
import { navigate, setNote, usePath } from '@/router';
import { ArtDefs } from '@/art/Defs';
import { Footer, Header, Notice } from '@/ui/Shell';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { legacyRedirect } from '@/content/legacy';
import { RouteView, titleFor } from '@/routes';

export default function App() {
  const path = usePath();
  const main = useRef<HTMLElement>(null);
  const first = useRef(true);
  const old = legacyRedirect(path);

  // A redirect page written at build time sends old addresses here with ?moved=<old address>, so the same note can be shown.
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('moved');
    if (!from) return;
    const r = legacyRedirect(from);
    if (r) setNote(r.note);
    window.history.replaceState(null, '', window.location.pathname + window.location.hash);
  }, []);

  // Old addresses (the game, missions, the three paths) go to the nearest page that still exists, with a note saying why.
  useEffect(() => {
    if (!old) return;
    setNote(old.note);
    navigate(old.to, { replace: true });
  }, [old]);

  useEffect(() => {
    if (old) return;
    document.title = titleFor(path);
    const hash = window.location.hash.slice(1);
    if (first.current) {
      first.current = false;
      if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
      return;
    }
    // After navigating, move focus to the page so keyboard and screen-reader users land in the new content.
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    main.current?.focus({ preventScroll: true });
  }, [path, old]);

  return (
    <>
      <ArtDefs />
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); main.current?.focus(); main.current?.scrollIntoView(); }}>
        Skip to main content
      </a>
      <Header />
      <main id="main" ref={main} tabIndex={-1}>
        <Notice />
        <ErrorBoundary resetKey={path}>
          <Suspense fallback={<div className="wrap page-loading" role="status">Loading the page…</div>}>
            {old ? null : (
              <div key={path} className="page-enter">
                <RouteView path={path} />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </>
  );
}
