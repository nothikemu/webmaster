/**
 * Every public URL of the site. Used by the router, the sitemap and the static-route build step.
 * Kept free of React and browser APIs so the build tool can import it.
 */
import { PATHS } from './paths';

export const ROUTES: readonly string[] = [
  '/',
  '/learn',
  ...PATHS.map((p) => `/learn/${p.id}`),
  ...PATHS.flatMap((p) => p.lessons.map((l) => `/learn/${p.id}/${l.id}`)),
  '/play',
  '/missions',
  '/lab',
  '/tools',
  '/scenarios',
  '/codex',
  '/logbook',
  '/certification',
  '/about',
  '/accessibility',
  '/credits',
];
