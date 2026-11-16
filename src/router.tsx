/**
 * A very small router. Pages are real URLs (/learn/understand/u1), handled with the History API.
 * It reads the Vite base path, so the site works from the root of a domain or from a sub-folder.
 */
import { createContext, useContext, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function currentPath(): string {
  let p = window.location.pathname;
  if (BASE && p.startsWith(BASE)) p = p.slice(BASE.length);
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

const hrefFor = (to: string): string => `${BASE}${to === '/' ? '/' : to + '/'}`;

let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version += 1;
  listeners.forEach((l) => l());
};
window.addEventListener('popstate', emit);

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  const [path, hash] = to.split('#');
  const target = hrefFor(path || '/') + (hash ? `#${hash}` : '');
  if (opts.replace) window.history.replaceState(null, '', target);
  else window.history.pushState(null, '', target);
  emit();
}

/**
 * Inside the game, pages open in a window over the game instead of replacing it. A provider below a Link decides where a link goes;
 * without one the link navigates the site as usual. The href stays a real address, so "open in new tab" still works.
 */
export interface EmbedApi {
  go(to: string): void;
}
export const EmbedContext = createContext<EmbedApi | null>(null);

/** Re-renders when the URL changes. */
export function usePath(): string {
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => version,
    () => version,
  );
  return currentPath();
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  children?: ReactNode;
}

export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const embed = useContext(EmbedContext);
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
    e.preventDefault();
    if (embed) embed.go(to);
    else navigate(to);
  };
  return (
    <a href={hrefFor(to.split('#')[0] || '/') + (to.includes('#') ? `#${to.split('#')[1]}` : '')} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
