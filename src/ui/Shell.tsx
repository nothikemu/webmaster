import { useEffect, useRef, useState } from 'react';
import { Link, usePath } from '@/router';
import { Icon } from '@/art/Icons';
import { Medal } from '@/art/Medals';
import { RankCrest } from '@/art/Ranks';
import { MentorBust } from '@/art/Cast';
import { MENTORS } from '@/content/cast';
import { BADGES, LEVEL_NAMES, MISSIONS, levelInfo, type Reward } from '@/engine/progress';
import { onRewards, useProgress } from '@/engine/store';
import { play } from '@/audio/sfx';
import { configureAudio } from '@/audio/engine';
import { setAudio } from '@/audio/control';
import { Kernel } from '@/art/Kernel';
import { Btn, LinkBtn } from './primitives';
import { pathById } from '@/content/paths';

const NAV = [
  { to: '/play', label: 'Play', also: [] as string[] },
  { to: '/learn', label: 'Learn', also: [] as string[] },
  { to: '/practice', label: 'Practice', also: ['/lab', '/scenarios', '/tools', '/codex', '/certification', '/missions'] },
  { to: '/logbook', label: 'Progress', also: [] as string[] },
] as const;

const isHere = (path: string, to: string, also: readonly string[]) => [to, ...also].some((t) => path === t || path.startsWith(t + '/'));

/** The mark: three sliders at different settings, because a parameter is a setting that gets tuned. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={`logo${small ? ' logo--sm' : ''}`}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" className="logo__mark">
        <circle cx="20" cy="20" r="19" fill="var(--seal)" />
        {[
          [12, 14],
          [20, 26],
          [28, 19],
        ].map(([y, x]) => (
          <g key={y}>
            <path d={`M9 ${y}H31`} stroke="var(--paper-hi)" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx={x} cy={y} r="3.6" fill="var(--paper-hi)" stroke="var(--seal)" strokeWidth="2" />
          </g>
        ))}
      </svg>
      <span className="logo__word">Parameter</span>
    </span>
  );
}

export function Header() {
  const path = usePath();
  const xp = useProgress((s) => s.xp);
  const sound = useProgress((s) => s.settings.sound);
  const music = useProgress((s) => s.settings.music);
  const volume = useProgress((s) => s.settings.volume);
  const sfxVolume = useProgress((s) => s.settings.sfxVolume);
  const musicVolume = useProgress((s) => s.settings.musicVolume);
  const lv = levelInfo(xp);

  useEffect(() => configureAudio({ sound, music, volume, sfxVolume, musicVolume }), [sound, music, volume, sfxVolume, musicVolume]);

  return (
    <>
      <header className="site-header">
        <div className="wrap site-header__bar">
          <Link to="/" className="site-header__home" aria-label="Parameter home">
            <Logo />
          </Link>
          <nav className="site-nav" id="site-nav" aria-label="Main">
            <ul>
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="site-nav__link" aria-current={isHere(path, n.to, n.also) ? 'page' : undefined}>
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
              onClick={() => setAudio({ sound: !sound }, !sound ? 'xp' : undefined)}
            >
              <Icon name={sound ? 'sound-on' : 'sound-off'} />
            </button>
            <button
              type="button"
              className="btn btn--quiet btn--icon btn--sm"
              aria-pressed={music}
              aria-label={music ? 'Music on. Turn music off.' : 'Music off. Turn music on.'}
              onClick={() => setAudio({ music: !music }, sound ? 'select' : undefined)}
            >
              <Icon name="music" />
            </button>
          </div>
        </div>
      </header>
      {/* On a phone the four places move to a tab bar at the bottom, where the thumb is. */}
      <nav className="tabbar" aria-label="Main (tabs)">
        <ul>
          {NAV.map((n) => (
            <li key={n.to}>
              <Link to={n.to} className="tabbar__link" aria-current={isHere(path, n.to, n.also) ? 'page' : undefined}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <Logo small />
        <nav aria-label="Footer" className="site-footer__nav">
          <ul>
            <li><Link to="/about">About and sources</Link></li>
            <li><Link to="/accessibility">Accessibility</Link></li>
            <li><Link to="/credits">Credits</Link></li>
          </ul>
        </nav>
        <p className="site-footer__note">Free, with no accounts. Your progress stays in this browser and nothing you do is sent anywhere. Built for the TSA Webmaster event, 2026-27.</p>
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
        const specials = rewards.filter((r) => r.kind === 'badge' || r.kind === 'level' || r.kind === 'path' || r.kind === 'mission');
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
      play(moment.kind === 'badge' ? 'badge' : moment.kind === 'mission' ? 'mission' : 'level');
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
  } else if (moment?.kind === 'mission') {
    const m = MISSIONS.find((x) => x.id === moment.id);
    if (m) {
      body = (
        <>
          <Kernel mood="cheer" hold="flag" className="moment__medal moment__medal--kernel" />
          <p className="label">Mission complete</p>
          <h2 id="moment-title">{m.title}</h2>
          <p>{m.brief} Every objective was real, finished work, and the {m.reward} XP bonus is paid once.</p>
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
            {moment?.kind === 'mission' ? <LinkBtn to="/missions" variant="quiet" onClick={close}>Open the mission board</LinkBtn> : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
