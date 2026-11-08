import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/router';
import { Icon, type IconName } from '@/art/Icons';
import { play } from '@/audio/sfx';

type Variant = 'primary' | 'secondary' | 'quiet' | 'hue';

interface BtnBase {
  variant?: Variant;
  small?: boolean;
  block?: boolean;
  /** Shows a forward arrow that slides on hover. Use it for buttons that move you on. */
  go?: boolean;
  icon?: IconName;
  children?: ReactNode;
}

const cls = (v: Variant, o: BtnBase, extra?: string) =>
  ['btn', v === 'secondary' ? '' : `btn--${v}`, o.small ? 'btn--sm' : '', o.block ? 'btn--block' : '', extra ?? ''].filter(Boolean).join(' ');

/** A real <button>. Has hover, pressed, focus and disabled states, and is at least 48px tall. */
export function Btn({ variant = 'secondary', small, block, go, icon, children, className, onClick, ...rest }: BtnBase & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cls(variant, { small, block }, className)}
      onClick={(e) => {
        play('press');
        onClick?.(e);
      }}
      {...rest}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
      {go ? <Icon name="arrow-right" className="btn__go" /> : null}
    </button>
  );
}

/** A real link that looks and behaves like a button. Use for navigation, never for actions. */
export function LinkBtn({ to, variant = 'secondary', small, block, go, icon, children, className, onClick, ...rest }: BtnBase & { to: string; className?: string; 'aria-label'?: string; onClick?: () => void }) {
  return (
    <Link to={to} className={cls(variant, { small, block }, className)} onClick={() => { play('press'); onClick?.(); }} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {go ? <Icon name="arrow-right" className="btn__go" /> : null}
    </Link>
  );
}

export function Panel({ children, tone = 'paper', lift, hue, className, as: Tag = 'div', ...rest }: { children?: ReactNode; tone?: 'paper' | 'ink' | 'shade'; lift?: boolean; hue?: boolean; className?: string; as?: 'div' | 'section' | 'article' | 'aside' } & Omit<React.HTMLAttributes<HTMLElement>, 'children'>) {
  const c = ['panel', tone === 'ink' ? 'panel--ink' : tone === 'shade' ? 'panel--shade' : '', lift ? 'panel--lift' : '', hue ? 'panel--hue' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <Tag className={c} data-surface={tone === 'ink' ? 'ink' : undefined} {...rest}>
      {children}
    </Tag>
  );
}

export function Chip({ children, tone, icon }: { children: ReactNode; tone?: 'ink' | 'hue' | 'seal'; icon?: IconName }) {
  return (
    <span className={`chip${tone ? ` chip--${tone}` : ''}`}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

/** A segmented progress meter. The numbers are always printed next to it, so it never relies on colour. */
export function Meter({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} style={{ ['--value' as string]: v }}>
      <div className="meter__fill" />
    </div>
  );
}

export function Callout({ icon = 'info', tone, children }: { icon?: IconName; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <div className={`callout${tone ? ` callout--${tone}` : ''}`}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  );
}

/** Visible heading block used at the top of inner pages. */
export function PageHead({ title, lead, kicker, children }: { title: string; lead?: string; kicker?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      {kicker ? <p className="label">{kicker}</p> : null}
      <h1>{title}</h1>
      {lead ? <p className="page-head__lead">{lead}</p> : null}
      {children}
    </header>
  );
}
