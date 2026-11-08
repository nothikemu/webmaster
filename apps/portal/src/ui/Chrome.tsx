import { useEffect, useRef, useState, type ReactNode } from 'react';
import { FOOTER_LINKS, NAV, SITE } from '../content/site';
import { t } from '../core/assets';
import { levelInfo } from '../core/gamification';
import { Link, useRouter } from '../router';
import { useData } from './hooks';

/** "page" on the exact route; "true" on a route inside it, so a module page marks "Modules". */
function locationState(path: string, href: string): 'page' | 'true' | undefined {
  if (path === href) return 'page';
  return path.startsWith(`${href}/`) ? 'true' : undefined;
}

/** The mark: a chamfered frame with a slider inside it. A parameter is a value you can move. */
export function Glyph({ size = 34 }: { size?: number }): ReactNode {
  return (
    <svg
      className="glyph"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 2h21v21l-7 7H2V9z"
        fill="#15222e"
        stroke="#ece8e1"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
      <path d="M8 11h16M8 21h16" stroke="#6f7a85" strokeWidth="2.4" />
      <path d="M17 7l5 0-3 8-5 0zM11 17l5 0-3 8-5 0z" fill="#ff4655" />
    </svg>
  );
}

function NavList({ path }: { path: string }): ReactNode {
  return (
    <ul className="nav-list">
      {NAV.map((n) => (
        <li key={n.href}>
          <Link to={n.href} aria-current={locationState(path, n.href)}>
            {n.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Level and XP at the top right: a key that opens the progress page. */
function Rank(): ReactNode {
  const data = useData();
  const level = levelInfo(data.xp);
  return (
    <Link to="/progress" className="site-rank">
      <span className="sr-only">{t('hub.level', { level: level.level })}</span>
      <b className="num" aria-hidden="true">
        {String(level.level).padStart(2, '0')}
      </b>
      <span>{data.xp.toLocaleString('en-US')} XP</span>
    </Link>
  );
}

export function Header(): ReactNode {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  // A new page closes the menu. Escape closes it and hands focus back to its button.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="site-header" data-surface="ink" data-open={open}>
      <div className="site-header-inner">
        <Link to="/" className="wordmark" aria-label={t('nav.home')}>
          <Glyph />
          <span>{SITE.name}</span>
        </Link>
        <button
          ref={toggle}
          type="button"
          className="menu-toggle btn btn-ghost"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-bars" aria-hidden="true" />
          {t('nav.menu')}
        </button>
        <nav id="site-nav" className="site-nav" aria-label={t('nav.primary')}>
          <NavList path={path} />
        </nav>
        <Rank />
        <span className="read-line" aria-hidden="true" />
      </div>
    </header>
  );
}

export function Footer(): ReactNode {
  return (
    <footer className="site-footer" data-surface="ink">
      <div className="wrap colophon">
        <div className="colophon-id">
          <p className="wordmark">
            <Glyph />
            <span>{SITE.name}</span>
          </p>
          <p className="colophon-note">{t('footer.privacy')}</p>
        </div>
        <nav aria-label={t('nav.footer')}>
          <ul className="colophon-links">
            {FOOTER_LINKS.map((n) => (
              <li key={n.href}>
                <Link to={n.href}>{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="colophon-event">{SITE.event}</p>
      </div>
    </footer>
  );
}
