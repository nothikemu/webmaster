import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/router';
import { Icon, type IconName } from '@/art/Icons';
import { STATUS_LABEL, type LessonStatus } from '@/learning/state';

type Variant = 'primary' | 'secondary' | 'quiet';

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
export function Btn({ variant = 'secondary', small, block, go, icon, children, className, ...rest }: BtnBase & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cls(variant, { small, block }, className)} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {go ? <Icon name="arrow-right" className="btn__go" /> : null}
    </button>
  );
}

/** A real link that looks and behaves like a button. Use for navigation, never for actions. */
export function LinkBtn({ to, variant = 'secondary', small, block, go, icon, children, className, ...rest }: BtnBase & { to: string; className?: string; 'aria-label'?: string }) {
  return (
    <Link to={to} className={cls(variant, { small, block }, className)} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {go ? <Icon name="arrow-right" className="btn__go" /> : null}
    </Link>
  );
}

/** A quiet text link with a forward arrow. */
export function GoLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={`go-link${className ? ` ${className}` : ''}`}>
      {children}
      <Icon name="arrow-right" className="btn__go" />
    </Link>
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

/** The lesson status as a shape and a word. Neutral language: not started, started, complete. */
export function Status({ status }: { status: LessonStatus }) {
  return (
    <span className={`status status--${status === 'not-started' ? 'none' : status}`}>
      <span className="status__mark" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** A framed figure with a numbered caption, in the style of a plate in a printed field guide. */
export function Figure({ no, caption, children, className }: { no: string; caption: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure className={`figure${className ? ` ${className}` : ''}`}>
      <div className="plate">{children}</div>
      <figcaption>
        <span className="fig-no">Fig. {no}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  );
}
