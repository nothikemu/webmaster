import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { getAnnouncement, subscribeAnnouncements } from '../core/announce';
import { t } from '../core/assets';

/** Polite live region for progress, unlocks and route changes. Mounted once at the app root. */
export function LiveRegion(): ReactNode {
  const message = useSyncExternalStore(subscribeAnnouncements, getAnnouncement, getAnnouncement);
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="live-region">
      {message}
    </div>
  );
}

export function SkipLink(): ReactNode {
  return (
    <a className="skip-link" href="#main">
      {t('a11y.skip')}
    </a>
  );
}

/** Text that is available to assistive technology but not drawn. */
export function VisuallyHidden({ id, children }: { id?: string; children: ReactNode }): ReactNode {
  return (
    <p className="sr-only" id={id}>
      {children}
    </p>
  );
}

const QUERY = '(prefers-reduced-motion: reduce)';

/** Tracks the reduced-motion preference live, so toggling the OS setting takes effect immediately. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    try {
      return matchMedia(QUERY).matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let mql: MediaQueryList;
    try {
      mql = matchMedia(QUERY);
    } catch {
      return undefined;
    }
    const onChange = (): void => setReduced(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Wraps a labelled region so each section has an accessible name from its own heading. */
export function Section({
  id,
  heading,
  headingLevel = 2,
  className,
  children,
}: {
  id: string;
  heading: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
  children: ReactNode;
}): ReactNode {
  const Tag = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section aria-labelledby={`${id}-h`} className={className}>
      <Tag id={`${id}-h`}>{heading}</Tag>
      {children}
    </section>
  );
}
