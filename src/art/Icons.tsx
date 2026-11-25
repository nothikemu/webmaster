import type { SVGProps } from 'react';

/** A small icon family on a 24px grid with a 2px round pen. Icons are decoration or paired with words; none carries meaning alone. */
const PATHS = {
  'arrow-right': 'M4 12h15M13 5.5l6.500 6.500-6.500 6.500',
  'arrow-left': 'M20 12H5M11 5.500 4.500 12l6.500 6.500',
  'arrow-down': 'M12 4v15M5.500 13 12 19.500 18.500 13',
  check: 'M4.500 12.500l5 5L20 7',
  x: 'M6 6l12 12M18 6 6 18',
  info: 'M12 3.500a8.500 8.500 0 1 0 0 17 8.500 8.500 0 0 0 0-17zM12 11v5.500M12 7.700v.1',
  warning: 'M12 3.800l9 15.700H3zM12 10v4.500M12 17.200v.1',
  reset: 'M4.500 12a7.500 7.500 0 1 0 2.300-5.400M4.500 4.500v4.200h4.200',
  download: 'M12 4v11M7.500 11 12 15.500 16.500 11M5 20h14',
  upload: 'M12 16V5M7.500 9 12 4.500 16.500 9M5 20h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
  search: 'M10.500 4a6.500 6.500 0 1 0 0 13 6.500 6.500 0 0 0 0-13zM15.500 15.500 20.500 20.500',
  menu: 'M4 8h16M4 16h16',
  close: 'M6 6l12 12M18 6 6 18',
  book: 'M4 5.500c3-1.300 5.500-1.100 8 .8 2.500-1.900 5-2.100 8-.8v13c-3-1.300-5.500-1.100-8 .8-2.500-1.900-5-2.100-8-.8zM12 6.300v13',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** Decorative by default. Pass a title only when the icon is the only thing conveying meaning. */
  title?: string;
}

export function Icon({ name, title, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
