import { useEffect, useRef, useState } from 'react';
import { Link, setNote, usePath, useNote } from '@/router';
import { Icon } from '@/art/Icons';
import { LogoMark } from '@/art/field/Marks';
import { MODULES } from '@/content/modules';

interface NavItem {
  to: string;
  label: string;
  /** A small number shown before the label. */
  no?: string;
  /** Pages under this address also count as "in this section". */
  prefix?: string;
}

const NAV: NavItem[] = [
  ...MODULES.map((m) => ({ to: `/modules/${m.id}`, label: m.title, no: String(m.number).padStart(2, '0'), prefix: `/modules/${m.id}/` })),
  { to: '/glossary', label: 'Glossary' },
  { to: '/tools', label: 'Tool atlas' },
  { to: '/overview', label: 'Overview' },
];

const state = (path: string, item: NavItem): 'page' | 'true' | undefined => (path === item.to ? 'page' : item.prefix && path.startsWith(item.prefix) ? 'true' : undefined);

function Wordmark() {
  return (
    <Link to="/" className="wordmark" aria-label="Parameter, home">
      <LogoMark size={30} />
      <span className="wordmark__text">Parameter</span>
    </Link>
  );
}

function NavLinks({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((item) => {
        const cur = state(path, item);
        return (
          <li key={item.to}>
            <Link to={item.to} className="nav-link" aria-current={cur} onClick={onNavigate}>
              {item.no ? <span className="nav-link__no">{item.no}</span> : null}
              {item.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}

export function Header() {
  const path = usePath();
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="site-bar">
      <div className="wrap site-bar__in">
        <Wordmark />
        <nav aria-label="Main" className="site-nav">
          <ul>
            <NavLinks path={path} />
          </ul>
        </nav>
        <button type="button" className="menu-toggle" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon name="menu" />
          Menu
        </button>
      </div>
      <dialog ref={dlg} className="menu" aria-label="Site menu" onClose={() => setOpen(false)} data-surface="night">
        <div className="menu__in">
          <div className="menu__top">
            <span className="label">Menu</span>
            <button type="button" className="menu-toggle menu-toggle--close" onClick={() => setOpen(false)}>
              <Icon name="close" />
              Close
            </button>
          </div>
          <nav aria-label="Site">
            <ul className="menu__list">
              <li>
                <Link to="/" className="nav-link" aria-current={path === '/' ? 'page' : undefined} onClick={() => setOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/modules" className="nav-link" aria-current={path === '/modules' ? 'page' : undefined} onClick={() => setOpen(false)}>
                  All modules
                </Link>
              </li>
              <NavLinks path={path} onNavigate={() => setOpen(false)} />
              <li>
                <Link to="/about" className="nav-link" aria-current={path === '/about' ? 'page' : undefined} onClick={() => setOpen(false)}>
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </dialog>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-foot" data-surface="night">
      <div className="wrap">
        <div className="site-foot__grid">
          <div className="site-foot__brand">
            <p className="site-foot__name">Parameter</p>
            <p>A field guide to how machines learn, for grades 9 to 12. Three modules, no accounts, no scores.</p>
          </div>
          <nav aria-label="Modules">
            <h2 className="label">Modules</h2>
            <ul>
              {MODULES.map((m) => (
                <li key={m.id}>
                  <Link to={`/modules/${m.id}`}>{m.title}</Link>
                </li>
              ))}
              <li>
                <Link to="/modules">All modules</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Reference">
            <h2 className="label">Reference</h2>
            <ul>
              <li>
                <Link to="/glossary">Glossary</Link>
              </li>
              <li>
                <Link to="/tools">Tool atlas</Link>
              </li>
              <li>
                <Link to="/modules/ethics/cases">Ethics cases</Link>
              </li>
              <li>
                <Link to="/overview">Your overview</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="About this site">
            <h2 className="label">This site</h2>
            <ul>
              <li>
                <Link to="/about">About and sources</Link>
              </li>
              <li>
                <Link to="/accessibility">Accessibility</Link>
              </li>
              <li>
                <Link to="/credits">Credits</Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="site-foot__base">
          Built for the TSA Webmaster event, 2026–27. Which lessons you have finished is saved only in this browser. Nothing is sent anywhere.
        </p>
      </div>
    </footer>
  );
}

/** A short note shown once after an old address has been redirected here. */
export function Notice() {
  const note = useNote();
  if (!note) return null;
  return (
    <div className="notice" role="status">
      <div className="wrap notice__in">
        <p>{note}</p>
        <button type="button" className="btn btn--quiet btn--sm" onClick={() => setNote(null)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
