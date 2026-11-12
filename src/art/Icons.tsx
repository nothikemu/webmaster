import type { SVGProps } from 'react';

/** One icon family: 24px grid, 2.6 stroke, round caps and joins, so every icon looks inked by the same pen. */
const PATHS = {
  'arrow-right': 'M4 12h15M13 5l7 7-7 7',
  'arrow-left': 'M20 12H5M11 5l-7 7 7 7',
  check: 'M4 12.5l5 5L20 6.5',
  x: 'M5 5l14 14M19 5L5 19',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  play: 'M7 4.5v15l12-7.5z',
  book: 'M4 5.5c3-1.4 5.5-1.2 8 .8 2.500-2 5-2.200 8-.8v13c-3-1.400-5.500-1.200-8 .8-2.500-2-5-2.200-8-.8zM12 6.500v13',
  flask: 'M9.500 3.500h5M10.500 3.500v6L5 19a1.500 1.500 0 0 0 1.300 2h11.400A1.500 1.500 0 0 0 19 19l-5.500-9.500v-6M8 15h8',
  compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.500 8.500l-2 5-5 2 2-5z',
  scroll: 'M7 4h11a2 2 0 0 1 2 2v1H9M7 4a2 2 0 0 0-2 2v10a3 3 0 0 0 3 3h10a2 2 0 0 0 2-2V7M7 4v12a2 2 0 0 1-2 2M10 11h6M10 14.500h6',
  seal: 'M12 3l2.200 2 3-.5.800 3 2.600 1.600-1.200 2.800 1.200 2.800L18 16.300l-.8 3-3-.5L12 21l-2.200-2.200-3 .5-.8-3L3.400 14.700 4.600 12 3.400 9.200 6 7.600l.8-3 3 .5z',
  'sound-on': 'M4 9.500h3.500L12 5.500v13l-4.500-4H4zM15.500 9a4.200 4.200 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11',
  'sound-off': 'M4 9.500h3.500L12 5.500v13l-4.500-4H4zM16 9.500l5 5M21 9.500l-5 5',
  menu: 'M4 7h16M4 12h16M4 17h16',
  pause: 'M8 5v14M16 5v14',
  flag: 'M6 21V4M6 5h12l-2.500 4L18 13H6',
  warning: 'M12 3.500l9.500 16.500h-19zM12 10v4.500M12 17.200v.1',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.500v.1',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5.500l3.500 2',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.500a4.500 4.500 0 1 0 0 9 4.500 4.500 0 0 0 0-9zM12 11.500v1',
  key: 'M8 14.500a4.500 4.500 0 1 1 3.800-6.800L21 7.500v4h-3v3h-3l-2.200-2.200',
  shield: 'M12 3l8 3v6c0 4.500-3.200 7.800-8 9-4.800-1.200-8-4.500-8-9V6z',
  eye: 'M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5H5V6h5',
  'chevron-down': 'M5 9l7 7 7-7',
  reset: 'M4 12a8 8 0 1 0 2.500-5.800M4 4v4.500h4.500',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
  map: 'M3.500 6l5.500-2 6 2 5.500-2v14l-5.500 2-6-2-5.500 2zM9 4v14M15 6v14',
  wrench: 'M14.500 4.500a4.500 4.500 0 0 0-4.300 6L4 16.700 7.300 20l6.200-6.200a4.500 4.500 0 0 0 6-4.300l-3 3-3-.8-.8-3z',
  search: 'M10.500 3.500a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5',
  chat: 'M4 5h16v11H11l-4.500 4v-4H4z',
  music: 'M9 18V5.500l11-2V16M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.500 20c.8-4 3.700-6 7.500-6s6.700 2 7.500 6',
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
      strokeWidth={2.6}
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
