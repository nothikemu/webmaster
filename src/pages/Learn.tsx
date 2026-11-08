import { Link } from '@/router';
import { PathScene } from '@/art/PathScenes';
import { Medal } from '@/art/Medals';
import { BADGES, pathProgress, recommendNext } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { PATHS, lessonById, pathById } from '@/content/paths';
import { LessonRoute } from '@/ui/LessonRoute';
import { LinkBtn, Meter, PageHead } from '@/ui/primitives';
import NotFound from './NotFound';

/** The chart: all three paths at once. */
export function LearnIndex() {
  const state = useProgress((s) => s);
  const rec = recommendNext(state);
  const next = rec.lesson ? lessonById(rec.lesson) : undefined;
  return (
    <div className="wrap page">
      <PageHead title="The chart" kicker="Learn" lead="Three paths, fifteen lessons. Every stop is open, so start wherever your curiosity is. If you are unsure, begin with Understand AI.">
        {next ? (
          <div className="row">
            <LinkBtn to={`/learn/${next.path}/${next.id}`} variant="primary" go>{state.xp > 0 ? 'Continue' : 'Start'}: {next.title}</LinkBtn>
          </div>
        ) : null}
      </PageHead>
      <div className="districts">
        {PATHS.map((p) => {
          const prog = pathProgress(state, p.id);
          return (
            <section key={p.id} className={`district district--${p.number}`} data-path={p.id} aria-labelledby={`d-${p.id}`}>
              <div className="district__art">
                <PathScene path={p.id} className="district__scene" />
                <span className="chip chip--hue">Path {p.number} · {p.place}</span>
              </div>
              <div className="district__body">
                <h2 id={`d-${p.id}`}>
                  <Link to={`/learn/${p.id}`}>{p.title}</Link>
                </h2>
                <p className="district__tag">{p.tagline} <span className="small">({p.tsaSection})</span></p>
                <div className="district__prog">
                  <Meter value={prog.pct} label={`${p.title}: ${prog.done} of ${prog.total} lessons finished`} />
                  <span className="small">{prog.done} of {prog.total} finished</span>
                </div>
                <LessonRoute path={p} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function PathPage({ pathId }: { pathId: string }) {
  const path = pathById(pathId);
  const state = useProgress((s) => s);
  if (!path) return <NotFound />;
  const prog = pathProgress(state, path.id);
  const badges = BADGES.filter((b) => b.path === path.id);
  return (
    <div data-path={path.id}>
      <header className="path-hero" data-surface="ink">
        <PathScene path={path.id} className="path-hero__art" />
        <div className="wrap path-hero__copy">
          <nav aria-label="Breadcrumb" className="crumbs"><Link to="/learn">Learn</Link> <span aria-hidden="true">/</span> {path.title}</nav>
          <p className="label">Path {path.number} · {path.place}</p>
          <h1>{path.title}</h1>
          <p className="path-hero__tag">{path.summary}</p>
          <p className="small">Answers the TSA challenge section: {path.tsaSection}.</p>
        </div>
      </header>
      <div className="wrap page path-grid">
        <section aria-labelledby="route-h">
          <h2 id="route-h">The route</h2>
          <div className="district__prog">
            <Meter value={prog.pct} label={`${prog.done} of ${prog.total} lessons finished`} />
            <span className="small">{prog.done} of {prog.total} finished</span>
          </div>
          <LessonRoute path={path} />
        </section>
        <aside aria-labelledby="goals-h" className="path-side">
          <h2 id="goals-h">By the end you can</h2>
          <ul className="goals">
            {path.lessons.map((l) => (
              <li key={l.id}>{l.objective}</li>
            ))}
          </ul>
          {badges.length ? (
            <>
              <h2>Badges on this path</h2>
              <ul className="badge-mini">
                {badges.map((b) => (
                  <li key={b.id}>
                    <Medal id={b.id} path={b.path} earned={!!state.badges[b.id]} className="badge-mini__medal" />
                    <span><strong>{b.name}</strong><br /><span className="small">{b.how}</span></span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
