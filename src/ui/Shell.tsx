import { useEffect, useRef, useState } from 'react';
import { Link, usePath } from '@/router';
import { Icon } from '@/art/Icons';
import { Medal } from '@/art/Medals';
import { RankCrest } from '@/art/Ranks';
import { MentorBust } from '@/art/Cast';
import { MENTORS } from '@/content/cast';
import { BADGES, LEVEL_NAMES, levelInfo, type Reward } from '@/engine/progress';
import { dispatch, onRewards, useProgress } from '@/engine/store';
import { configureSound, play } from '@/audio/sfx';
import { Btn, LinkBtn } from './primitives';
import { PATHS, pathById } from '@/content/paths';

const NAV = [
  { to: '/learn', label: 'Learn' },
  { to: '/lab', label: 'Prompt Lab' },
  { to: '/tools', label: 'Tool Atlas' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/codex', label: 'Codex' },
  { to: '/logbook', label: 'Logbook' },
] as const;

export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={`logo${small ? ' logo--sm' : ''}`}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" className="logo__mark">
        <circle cx="20" cy="20" r="18" fill="var(--seal)" stroke="var(--paper-hi)" strokeWidth="2.5" />
        <path d="M6 24c4-4 7-4 11 0s7 4 11 0 5-3 6-2" fill="none" stroke="var(--paper-hi)" strokeWidth="3" strokeLinecap="round" />
        <path d="M12 16l8-6 8 6" fill="none" stroke="var(--paper-hi)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo__word">Tideweight</span>
    </span>
  );
}

export function Header() {
  const path = usePath();
  const [open, setOpen] = useState(false);
  const xp = useProgress((s) => s.xp);
  const sound = useProgress((s) => s.settings.sound);
  const volume = useProgress((s) => s.settings.volume);
  const lv = levelInfo(xp);
  const menuBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => configureSound(sound, volume), [sound, volume]);

  return (
    <header className="site-header" data-surface="ink">
      <div className="wrap site-header__bar">
        <Link to="/" className="site-header__home" aria-label="Tideweight home">
          <Logo />
        </Link>
        <nav className={`site-nav${open ? ' is-open' : ''}`} id="site-nav" aria-label="Main">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="key" aria-current={path === n.to || path.startsWith(n.to + '/') ? 'page' : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__tools">
          <Link to="/logbook" className="xp-chip">
            <span className="xp-chip__lv">Lv {lv.level}</span> <span className="xp-chip__xp">{xp} XP</span>
            <span className="visually-hidden">, {lv.name}. Open your logbook.</span>
          </Link>
          <button
            type="button"
            className="btn btn--quiet btn--icon btn--sm"
            aria-pressed={sound}
            aria-label={sound ? 'Sound on. Turn sound off.' : 'Sound off. Turn sound on.'}
            onClick={() => {
              const next = !sound;
              dispatch({ type: 'settings', patch: { sound: next } });
              configureSound(next, volume);
              if (next) play('xp');
            }}
          >
            <Icon name={sound ? 'sound-on' : 'sound-off'} />
          </button>
          <button
            ref={menuBtn}
            type="button"
            className="btn btn--quiet btn--icon btn--sm site-header__menu"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer" data-surface="ink">
      <svg className="site-footer__waves" viewBox="0 0 1200 28" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d={`M0 28 ${Array.from({ length: 40 }, () => 'a15 15 0 0 1 30 0').join(' ')}`} fill="var(--ink)" stroke="var(--ink-line)" strokeWidth="2" transform="translate(0 -2)" />
      </svg>
      <div className="wrap site-footer__grid">
        <div className="site-footer__brand">
          <Logo small />
          <p className="site-footer__note">
            A free AI learning portal for grades 9 to 12. There are no accounts. Your progress is saved only in this browser, and nothing you do is sent anywhere.
          </p>
        </div>
        <nav aria-label="Footer" className="site-footer__nav">
          <div>
            <p className="label">Learn</p>
            <ul>
              <li><Link to="/learn">The chart</Link></li>
              {PATHS.map((p) => (
                <li key={p.id}><Link to={`/learn/${p.id}`}>{p.title}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Practice</p>
            <ul>
              <li><Link to="/lab">Prompt Lab</Link></li>
              <li><Link to="/scenarios">Scenarios</Link></li>
              <li><Link to="/certification">Final certification</Link></li>
            </ul>
          </div>
          <div>
            <p className="label">Look up</p>
            <ul>
              <li><Link to="/tools">Tool Atlas</Link></li>
              <li><Link to="/codex">Codex</Link></li>
              <li><Link to="/logbook">Logbook</Link></li>
            </ul>
          </div>
          <div>
            <p className="label">About</p>
            <ul>
              <li><Link to="/about">About and sources</Link></li>
              <li><Link to="/accessibility">Accessibility</Link></li>
              <li><Link to="/credits">Credits</Link></li>
            </ul>
          </div>
        </nav>
        <p className="site-footer__tsa">Built for the TSA Webmaster event, 2026-27.</p>
      </div>
    </footer>
  );
}

/** Toasts for XP, and a dialog for the moments that deserve a pause: a badge, a level, a finished path. */
export function RewardHost() {
  const [toasts, setToasts] = useState<{ id: number; text: string; xp: number }[]>([]);
  // Moments wait in a queue and are shown one at a time. The queue is plain state, changed only by pure updates.
  const [queue, setQueue] = useState<Reward[]>([]);
  const moment = queue[0] ?? null;
  const dialog = useRef<HTMLDialogElement>(null);
  const [live, setLive] = useState('');
  const nextId = useRef(1);

  useEffect(
    () =>
      onRewards((rewards) => {
        const xpRewards = rewards.filter((r): r is Extract<Reward, { kind: 'xp' }> => r.kind === 'xp');
        const xpTotal = xpRewards.reduce((a, r) => a + r.amount, 0);
        if (xpTotal > 0) {
          const id = nextId.current++;
          setToasts((t) => [...t.slice(-2), { id, text: xpRewards[0]!.label, xp: xpTotal }]);
          setLive(`You earned ${xpTotal} XP.`);
          play('xp');
          window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
        }
        const specials = rewards.filter((r) => r.kind === 'badge' || r.kind === 'level' || r.kind === 'path');
        if (specials.length) setQueue((q) => [...q, ...specials]);
        if (rewards.some((r) => r.kind === 'lesson')) play('lesson');
      }),
    [],
  );

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (moment && !d.open) {
      d.showModal();
      play(moment.kind === 'badge' ? 'badge' : 'level');
    }
  }, [moment]);

  // Closing the dialog (by button, Escape or the backdrop key) fires its close event, which moves the queue on.
  const close = () => dialog.current?.close();

  let body: JSX.Element | null = null;
  if (moment?.kind === 'badge') {
    const b = BADGES.find((x) => x.id === moment.id);
    if (b) {
      body = (
        <>
          <Medal id={b.id} path={b.path} earned className="moment__medal" />
          <p className="label">Badge earned</p>
          <h2 id="moment-title">{b.name}</h2>
          <p>{b.title}. {b.how}</p>
        </>
      );
    }
  } else if (moment?.kind === 'level') {
    body = (
      <>
        <RankCrest level={moment.to} className="moment__medal" />
        <p className="label">New rank</p>
        <h2 id="moment-title">Level {moment.to}: {LEVEL_NAMES[moment.to - 1]}</h2>
        <p>You were {LEVEL_NAMES[moment.from - 1]}, level {moment.from}. This rank is yours because of work you finished, and it stays in your logbook.</p>
      </>
    );
  } else if (moment?.kind === 'path') {
    const p = pathById(moment.id);
    body = (
      <>
        <MentorBust who={moment.id} className="moment__medal moment__medal--bust" />
        <p className="label">Path complete</p>
        <h2 id="moment-title">{p?.title}</h2>
        <p>
          {MENTORS[moment.id].name} raises a pennant over {p?.place}. Every lesson on this path is finished, and all five of its lanterns are lit.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="toasts" aria-hidden="true">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <b>+{t.xp} XP</b>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <div className="visually-hidden" role="status" aria-live="polite">{live}</div>
      <dialog ref={dialog} className="dialog" aria-labelledby="moment-title" onClose={() => setQueue((q) => q.slice(1))}>
        <div className="panel panel--ink dialog__body" data-surface="ink">
          {body}
          <div className="row">
            <Btn variant="primary" go onClick={close}>Keep going</Btn>
            {moment?.kind === 'badge' ? <LinkBtn to="/logbook" variant="quiet" onClick={close}>See all badges</LinkBtn> : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
