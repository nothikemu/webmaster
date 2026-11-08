import { useRef, type KeyboardEvent, type ReactNode } from 'react';

interface Option<T extends string> {
  value: T;
  label: string;
  /** Keyboard shortcut, announced to assistive technology and not drawn, e.g. "1". */
  hint?: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange(value: T): void;
  className?: string;
}

/**
 * A segmented control built as an ARIA radio group with a roving tabindex: one tab stop, arrow
 * keys move and select, Home and End jump to the ends.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: Props<T>): ReactNode {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const move = (to: number): void => {
    const next = (to + options.length) % options.length;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>): void => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        move(0);
        break;
      case 'End':
        e.preventDefault();
        move(options.length - 1);
        break;
    }
  };

  return (
    <div className={`segmented ${className ?? ''}`} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          className="segmented-item"
          aria-keyshortcuts={o.hint}
          onClick={() => onChange(o.value)}
          onKeyDown={onKey}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
