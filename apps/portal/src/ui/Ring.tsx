import type { ReactNode } from 'react';

interface RingProps {
  /** 0-100. */
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
  className?: string;
}

/**
 * A progress ring: a flat track and a flat arc in the realm color, butt-capped. The arc's stroke-dashoffset
 * transitions on the portal easing curve (a CSS transition on the --ease token), so the fill
 * glides to each new value. The numeric value is also exposed to assistive technology.
 */
export function Ring({
  value,
  size = 96,
  stroke = 7,
  label,
  children,
  className,
}: RingProps): ReactNode {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`progress-ring ${className ?? ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(clamped)} percent`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-arc ring-mask"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
