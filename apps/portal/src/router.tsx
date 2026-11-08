/**
 * A small History API router. Routes are real URLs (the build emits an HTML file for each), links
 * are ordinary anchors, and every navigation moves focus to the new page's h1, resets scroll and
 * announces the page title, so keyboard and screen reader users are never left behind.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { announce } from './core/announce';
import { isModuleId, type ModuleId } from './content';
import { preloadRoute } from './preload';

export type Route =
  | { name: 'home' }
  | { name: 'hub' }
  | { name: 'module'; id: ModuleId }
  | { name: 'lesson'; id: ModuleId; n: number }
  | { name: 'quiz'; id: ModuleId }
  | { name: 'challenge'; id: ModuleId }
  | { name: 'progress' }
  | { name: 'achievements' }
  | { name: 'glossary' }
  | { name: 'about' }
  | { name: 'accessibility' }
  | { name: 'credits' }
  | { name: 'notfound' };


type ViewTransitionDocument = Document & { startViewTransition(update: () => void): unknown };
let navigationToken = 0;

/** View transitions are used when the browser has them, the app is running and motion is welcome. */
function canTransition(): boolean {
  if (!('startViewTransition' in document) || document.visibilityState !== 'visible') return false;
  if (document.documentElement.dataset.fx !== 'on') return false;
  return true;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Strips the deployment base and trailing slash: "/repo/modules/x/" -> "/modules/x". */
export function normalizePath(pathname: string): string {
  let p = pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export const withBase = (path: string): string => (path === '/' ? `${BASE}/` : `${BASE}${path}`);

export function parseRoute(path: string): Route {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };
  const [a, b, c, d] = parts;
  if (a === 'modules') {
    if (!b) return { name: 'hub' };
    if (!isModuleId(b)) return { name: 'notfound' };
    if (!c) return { name: 'module', id: b };
    if (c === 'lessons' && d && /^[1-9]\d*$/.test(d) && parts.length === 4) return { name: 'lesson', id: b, n: Number(d) };
    if (c === 'knowledge-check' && parts.length === 3) return { name: 'quiz', id: b };
    if (c === 'challenge' && parts.length === 3) return { name: 'challenge', id: b };
    return { name: 'notfound' };
  }
  if (parts.length === 1) {
    switch (a) {
      case 'progress':
      case 'achievements':
      case 'glossary':
      case 'about':
      case 'accessibility':
      case 'credits':
        return { name: a };
    }
  }
  return { name: 'notfound' };
}

interface RouterValue {
  path: string;
  route: Route;
  navigate(to: string, options?: { replace?: boolean }): void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function useRouter(): RouterValue {
  const v = useContext(RouterContext);
  if (!v) throw new Error('useRouter must be used inside <RouterProvider>');
  return v;
}

function focusMainHeading(): void {
  const h1 = document.querySelector<HTMLElement>('main h1');
  if (h1) {
    if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
}

export function RouterProvider({ children, onRoute }: { children: ReactNode; onRoute?: (path: string) => void }): ReactNode {
  const [path, setPath] = useState(() => normalizePath(location.pathname));

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const next = normalizePath(to.startsWith(BASE) && BASE ? to : withBase(to));
    if (options?.replace) history.replaceState(null, '', withBase(next));
    else history.pushState(null, '', withBase(next));
    const token = ++navigationToken;
    if (!canTransition()) {
      setPath(next);
      return;
    }
    // A page change is a cross-fade with a little depth. The next page's code is fetched first (for at
    // most half a second) so the transition lands on finished content, not on a loading state.
    const settle = new Promise<void>((resolve) => setTimeout(resolve, 500));
    void Promise.race([preloadRoute(next).catch(() => undefined), settle]).then(() => {
      if (token !== navigationToken) return;
      try {
        (document as ViewTransitionDocument).startViewTransition(() => {
          flushSync(() => setPath(next));
          window.scrollTo(0, 0);
        });
      } catch {
        setPath(next);
      }
    });
  }, []);

  useEffect(() => {
    const onPop = (): void => {
      navigationToken++;
      setPath(normalizePath(location.pathname));
    };
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, []);

  // After every route change: scroll to top, move focus to the heading, announce the title.
  useEffect(() => {
    onRoute?.(path);
    const first = firstRender.current;
    firstRender.current = false;
    if (first) return undefined;
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => {
      focusMainHeading();
      announce(document.title);
    });
    return () => cancelAnimationFrame(id);
  }, [path, onRoute]);

  const value = useMemo<RouterValue>(() => ({ path, route: parseRoute(path), navigate }), [path, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

const firstRender = { current: true };

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };

/** An anchor that navigates client-side but stays a real link: middle-click, copy and new tab all work. */
export function Link({ to, onClick, children, ...rest }: LinkProps): ReactNode {
  const { navigate, path } = useRouter();
  const external = /^[a-z]+:/i.test(to);
  const handle = (e: MouseEvent<HTMLAnchorElement>): void => {
    onClick?.(e);
    if (e.defaultPrevented || external) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target && rest.target !== '_self') return;
    e.preventDefault();
    // The next page opens as a widening circle from the link that was chosen (see fx.css).
    const r = e.currentTarget.getBoundingClientRect();
    const root = document.documentElement.style;
    root.setProperty('--vt-x', `${Math.round(e.clientX || r.left + r.width / 2)}px`);
    root.setProperty('--vt-y', `${Math.round(e.clientY || r.top + r.height / 2)}px`);
    navigate(to);
  };
  const current = !external && normalizePath(withBase(to)) === path ? 'page' : undefined;
  return (
    <a href={external ? to : withBase(to)} onClick={handle} aria-current={current} {...rest}>
      {children}
    </a>
  );
}

export function pageTitle(route: Route, names: { module(id: ModuleId): string; lesson(id: ModuleId, n: number): string }): string {
  const suffix = ' · Parameter';
  switch (route.name) {
    case 'home':
      return 'Parameter: Interactive AI Learning Portal';
    case 'hub':
      return `Modules${suffix}`;
    case 'module':
      return `${names.module(route.id)}${suffix}`;
    case 'lesson':
      return `${names.lesson(route.id, route.n)} · ${names.module(route.id)}${suffix}`;
    case 'quiz':
      return `${names.module(route.id)} knowledge check${suffix}`;
    case 'challenge':
      return `${names.module(route.id)} challenge${suffix}`;
    case 'progress':
      return `Progress${suffix}`;
    case 'achievements':
      return `Achievements${suffix}`;
    case 'glossary':
      return `Glossary and resources${suffix}`;
    case 'about':
      return `About${suffix}`;
    case 'accessibility':
      return `Accessibility statement${suffix}`;
    case 'credits':
      return `Credits${suffix}`;
    case 'notfound':
      return `Page not found${suffix}`;
  }
}
