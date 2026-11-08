import { parseRoute, normalizePath } from './router';

/**
 * Starts downloading the page chunk for the current URL while boot is still running, so the first
 * render does not wait for a second round trip. Importing the same module again later is free.
 */
export function preloadRoute(pathname: string): Promise<unknown> {
  const route = parseRoute(normalizePath(pathname));
  switch (route.name) {
    case 'home':
      return import('./pages/Home');
    case 'hub':
      return import('./pages/ModuleHub');
    case 'module':
    case 'lesson':
    case 'quiz':
    case 'challenge':
      return route.id === 'foundations' ? import('./modules/ModuleA/ModuleA') : route.id === 'synthesis' ? import('./modules/ModuleB/ModuleB') : import('./modules/ModuleC/ModuleC');
    case 'progress':
      return import('./pages/ProgressDashboard');
    case 'achievements':
      return import('./pages/Achievements');
    case 'glossary':
      return import('./pages/Glossary');
    case 'about':
      return import('./pages/About');
    case 'accessibility':
      return import('./pages/Accessibility');
    case 'credits':
      return import('./pages/Credits');
    case 'notfound':
      break;
  }
  return Promise.resolve();
}
