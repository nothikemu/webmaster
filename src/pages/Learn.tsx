import { Link } from '@/router';
import { PathScene } from '@/art/PathScenes';
import { Medal } from '@/art/Medals';
import { BADGES, lessonSteps, overallProgress, pathProgress, recommendNext } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { PATHS, lessonById, pathById } from '@/content/paths';
import { LessonRoute } from '@/ui/LessonRoute';
import { LinkBtn, Meter } from '@/ui/primitives';
import { ChartMap, StopKey, type ChartStop } from '@/art/ChartMap';
import NotFound from './NotFound';

/** The chart: all three paths at once, first as a sea chart, then stop by stop. */
export function LearnIndex() {
  const state = useProgress((s) => s);
  const rec = recommendNext(state);
  const next = rec.lesson ? lessonById(rec.lesson) : undefined;
  const overall = overallProgress(state);
  const certified = state.challenges['certification']?.passed === true;
  const stops: ChartStop[] = PATHS.flatMap((p) =>
    p.lessons.map((l, i) => {
      const st = lessonSteps(state, l.id);
      return { id: l.id, path: p.id, n: i + 1, title: l.title, to: `/learn/${p.id}/${l.id}`, state: st.done ? 'done' : st.started ? 'started' : 'new', next: rec.lesson === l.id } satisfies ChartStop;
    }),
  );
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1>The chart</h1>
        <p className="page-head__lead">Three places, fifteen stops, and the seal at the lighthouse. Every stop is open, so start wherever your curiosity is. If you are unsure, begin at the Loom House.</p>
        <div className="row">
          {next ? (
            <LinkBtn to={`/learn/${next.path}/${next.id}`} variant="primary" go>{state.xp > 0 ? 'Continue' : 'Start'}: {next.title}</LinkBtn>
          ) : (
            <LinkBtn to="/certification" variant="primary" go>{certified ? 'Retake the certification' : 'Take the final certification'}</LinkBtn>
          )}
          <span className="small"><strong>{overall.done} of {overall.total}</strong> stops finished</span>
        </div>
      </header>

      <div className="chartmap">
        <ChartMap stops={stops} certified={certified} certTo="/certification" className="chartmap__svg" />
      </div>
      <ul className="chart-key" aria-label="How to read the stops">
        <li><StopKey kind="new" /> Not started</li>
        <li><StopKey kind="started" /> In progress</li>
        <li><StopKey kind="done" /> Finished</li>
        <li><StopKey kind="next" /> Up next</li>
        <li className="chart-key__note">A dashed leg becomes a solid line once both of its stops are finished.</li>
      </ul>

      <h2 className="districts__title">Stop by stop</h2>
      <div className="districts">
        {PATHS.map((p) => {
          const prog = pathProgress(state, p.id);
          return (
            <section key={p.id} className={`district district--${p.number}`} data-path={p.id} aria-labelledby={`d-${p.id}`}>
              <div className="district__art">
                <PathScene path={p.id} className="district__scene" />
                <span className="chip chip--hue">Path {p.number}, {p.place}</span>
              </div>
              <div className="district__body">
                <h3 id={`d-${p.id}`} className="district__name">
                  <Link to={`/learn/${p.id}`}>{p.title}</Link>
                </h3>
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
          <p className="label">Path {path.number}, {path.place}</p>
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
