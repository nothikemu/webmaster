/**
 * Every public URL of the site. Used by the router, the sitemap and the static-route build step.
 * Kept free of React and browser APIs so the build tool can import it.
 */
import { LESSONS, MODULES, lessonPath } from './modules';

export const ROUTES: readonly string[] = [
  '/',
  '/modules',
  ...MODULES.map((m) => `/modules/${m.id}`),
  ...LESSONS.map(lessonPath),
  '/modules/ethics/cases',
  '/glossary',
  '/tools',
  '/overview',
  '/about',
  '/accessibility',
  '/credits',
];
