/**
 * Tasks, inside the game. Missions, lessons, practice and progress are the site's own pages, shown in a window over the game, so a
 * player never has to leave to see a task, start one or finish one. Links inside those pages stay inside the window.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmbedContext, navigate, type EmbedApi } from '@/router';
import { RouteView, opensInGame, pageTitle } from '@/routes';
import { play } from '@/audio/sfx';
import { Btn } from '@/ui/primitives';
import { GameDialog } from './overlays';

const TABS = [
  { to: '/missions', label: 'Missions', also: [] as string[] },
  { to: '/learn', label: 'Lessons', also: [] as string[] },
  { to: '/practice', label: 'Practice', also: ['/lab', '/scenarios', '/tools', '/codex', '/certification'] },
  { to: '/logbook', label: 'Progress', also: [] as string[] },
] as const;

const tabOf = (path: string) => TABS.find((t) => [t.to, ...t.also].some((x) => path === x || path.startsWith(x + '/'))) ?? TABS[0];

export function TaskHub({ start, onClose }: { start: string; onClose: () => void }) {
  const [stack, setStack] = useState<string[]>([start.split('#')[0] || '/missions']);
  const path = stack[stack.length - 1]!;
  const page = useRef<HTMLDivElement>(null);

  const api = useMemo<EmbedApi>(
    () => ({
      go(to) {
        const p = to.split('#')[0] || '/';
        if (!opensInGame(p)) {
          if (p.startsWith('/play')) onClose();
          else navigate(to); // the site's own home, about and credits: leaving on purpose
          return;
        }
        play('nav');
        setStack((s) => (s[s.length - 1] === p ? s : [...s, p]));
      },
    }),
    [onClose],
  );
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  // each page starts at its top, and focus moves to it so a keyboard or screen-reader player lands in the new content
  useEffect(() => {
    page.current?.closest('.gdialog__body')?.scrollTo({ top: 0 });
    page.current?.focus({ preventScroll: true });
  }, [path]);

  const here = tabOf(path);
  return (
    <GameDialog title="Tasks" onClose={onClose} wide paper className="gdialog--hub">
      <EmbedContext.Provider value={api}>
        <div className="hub">
          <div className="hub__bar">
            {stack.length > 1 ? (
              <Btn variant="quiet" small icon="arrow-left" onClick={back} aria-label={`Back from ${pageTitle(path)}`}>
                Back
              </Btn>
            ) : null}
            <nav className="hub__tabs" aria-label="Task sections">
              {TABS.map((t) => (
                <button
                  key={t.to}
                  type="button"
                  className="key"
                  aria-current={t === here ? 'page' : undefined}
                  onClick={() => {
                    play('tick');
                    setStack([t.to]);
                  }}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>
          <div ref={page} className="hub__page" tabIndex={-1} aria-label={pageTitle(path)}>
            <Suspense fallback={<p role="status">Loading…</p>}>
              <RouteView path={path} />
            </Suspense>
          </div>
        </div>
      </EmbedContext.Provider>
    </GameDialog>
  );
}
