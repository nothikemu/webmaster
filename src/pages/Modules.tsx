import { Link } from '@/router';
import { MODULES, coreLessons, furtherLessons, lessonPath } from '@/content/modules';
import { useLearning } from '@/learning/store';
import { moduleProgress } from '@/learning/state';
import { GoLink } from '@/ui/primitives';
import { ModulePlate } from '@/art/field/ModulePlates';

const minutes = (m: (typeof MODULES)[number]): number => coreLessons(m).reduce((a, l) => a + l.minutes, 0);

/** The three modules side by side, so they can be compared at a glance. */
export default function Modules() {
  const learner = useLearning((s) => s);
  return (
    <div className="wrap page modules-page">
      <header className="page-head">
        <p className="kicker">Contents</p>
        <h1>
          Three modules, one way of <em>thinking</em>
        </h1>
        <p className="page-head__lead">
          Each module takes one question about AI and works through it in five core lessons. Read them in order or jump to the one you need. Nothing is locked and nothing is scored.
        </p>
      </header>

      <ol className="compare">
        {MODULES.map((m) => {
          const p = moduleProgress(learner, m);
          return (
            <li key={m.id} className={`compare__col hue-${m.id}`}>
              <div className="compare__art" aria-hidden="true">
                <ModulePlate module={m.id} />
              </div>
              <p className="compare__no num">{String(m.number).padStart(2, '0')}</p>
              <h2>
                <Link to={`/modules/${m.id}`}>{m.title}</Link>
              </h2>
              <p className="compare__tag">{m.tagline}</p>
              <p className="compare__obj">{m.objective}</p>
              <dl className="facts">
                <div>
                  <dt>Core lessons</dt>
                  <dd>
                    {coreLessons(m).length} · about {minutes(m)} minutes
                  </dd>
                </div>
                <div>
                  <dt>Go further</dt>
                  <dd>{furtherLessons(m).length} optional {furtherLessons(m).length === 1 ? 'lesson' : 'lessons'}</dd>
                </div>
                <div>
                  <dt>Instrument</dt>
                  <dd>{m.centerpiece.name}</dd>
                </div>
                <div>
                  <dt>Part of the challenge</dt>
                  <dd>{m.tsaSection}</dd>
                </div>
                <div>
                  <dt>On this device</dt>
                  <dd>
                    {p.coreDone} of {p.coreTotal} core lessons complete
                  </dd>
                </div>
              </dl>
              <ol className="compare__lessons">
                {coreLessons(m).map((l) => (
                  <li key={l.id}>
                    <Link to={lessonPath(l)}>{l.title}</Link>
                  </li>
                ))}
              </ol>
              <GoLink to={`/modules/${m.id}`}>Open {m.title}</GoLink>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
