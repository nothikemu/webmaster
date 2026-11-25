/**
 * Old addresses. The portal used to have a game, missions, ranks, a certificate and an achievements page. Those are gone, and so are
 * the three "paths". Anyone arriving at an old link is sent to the nearest page that still exists, with a short note saying why.
 * Pure data and functions, shared by the router and the build step.
 */
import { LESSONS, lessonById, lessonPath } from './modules';

export interface Redirect {
  to: string;
  /** One sentence shown on the page the visitor lands on. */
  note: string;
}

const PATH_TO_MODULE: Record<string, string> = { understand: 'foundations', use: 'synthesis', responsible: 'ethics' };

/** Ids from the first version of the portal (modules A, B, C) and the lessons that now cover the same topics. */
const FIRST_VERSION_LESSONS: Record<string, string> = {
  a1: 'f1', a2: 'u1', a3: 'u3', a4: 'f4', a5: 'f5',
  b1: 's1', b2: 't2', b3: 's3', b4: 's4', b5: 't4',
  c1: 'r1', c2: 'r4', c3: 'e3', c4: 'e4', c5: 'e5',
};

const RETIRED = 'Parameter no longer has points, levels, badges, missions or games. Everything here is open to read in any order.';
const MOVED = 'That page has moved. You are in the right place now.';

const FIXED: Record<string, Redirect> = {
  '/learn': { to: '/modules', note: MOVED },
  '/play': { to: '/modules', note: RETIRED },
  '/practice': { to: '/modules', note: RETIRED },
  '/missions': { to: '/modules', note: RETIRED },
  '/certification': { to: '/modules', note: RETIRED },
  '/achievements': { to: '/overview', note: RETIRED },
  '/challenges': { to: '/modules', note: RETIRED },
  '/challenge': { to: '/modules', note: RETIRED },
  '/progress': { to: '/overview', note: MOVED },
  '/logbook': { to: '/overview', note: 'The logbook is now a calm overview of the lessons you have read.' },
  '/lab': { to: '/modules/synthesis#console', note: 'The prompt lab is now the prompt console in the Synthesis module.' },
  '/scenarios': { to: '/modules/ethics/cases', note: 'The scenarios are now cases in the Ethics module, without scores.' },
  '/codex': { to: '/glossary', note: 'The codex is now the glossary.' },
};

/** Where an old address should go, or null if the address is not an old one. */
export function legacyRedirect(rawPath: string): Redirect | null {
  const path = rawPath.replace(/\/+$/, '') || '/';
  const fixed = FIXED[path];
  if (fixed) return fixed;
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'challenge' && parts.length > 1) return { to: '/modules', note: RETIRED };
  if (parts[0] === 'achievements' && parts.length > 1) return { to: '/overview', note: RETIRED };
  if (parts[0] === 'learn') {
    const module = PATH_TO_MODULE[parts[1] ?? ''];
    if (!module) return { to: '/modules', note: MOVED };
    if (parts.length === 2) return { to: `/modules/${module}`, note: MOVED };
    const lesson = lessonById(parts[2]!);
    return lesson ? { to: lessonPath(lesson), note: MOVED } : { to: `/modules/${module}`, note: MOVED };
  }
  // Addresses from the first version: /modules/foundations/a3 and the like
  if (parts[0] === 'modules' && parts.length === 3) {
    const id = FIRST_VERSION_LESSONS[parts[2]!] ?? parts[2]!;
    const lesson = lessonById(id);
    if (lesson && !LESSONS.some((l) => l.module === parts[1] && l.slug === parts[2])) return { to: lessonPath(lesson), note: MOVED };
  }
  return null;
}

/** Every old address that can be listed in advance. The build writes a small redirecting page for each, so they work on any static host. */
export function legacyPages(): { from: string; redirect: Redirect }[] {
  const out: { from: string; redirect: Redirect }[] = Object.entries(FIXED).map(([from, redirect]) => ({ from, redirect }));
  for (const [oldPath, module] of Object.entries(PATH_TO_MODULE)) {
    out.push({ from: `/learn/${oldPath}`, redirect: { to: `/modules/${module}`, note: MOVED } });
  }
  for (const l of LESSONS) {
    const oldPath = Object.entries(PATH_TO_MODULE).find(([, m]) => m === l.module)![0];
    if (/^[utr]\d$/.test(l.id)) out.push({ from: `/learn/${oldPath}/${l.id}`, redirect: { to: lessonPath(l), note: MOVED } });
  }
  return out;
}
