import { useMemo, useState } from 'react';
import { Link } from '@/router';
import { GLOSSARY } from '@/content/glossary';
import { MISCONCEPTIONS } from '@/content/misconceptions';
import { LESSONS, MODULES, lessonById, lessonPath } from '@/content/modules';
import type { ModuleId } from '@/content/types';
import { Btn } from '@/ui/primitives';

const SORTED = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));
const letterOf = (t: string): string => t.charAt(0).toUpperCase();

/** Every term the lessons use, in plain words, with where each one is taught. Plus the common misconceptions, as reading. */
export default function Glossary() {
  const [q, setQ] = useState('');
  const [mod, setMod] = useState<ModuleId | 'all'>('all');

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return SORTED.filter((g) => (mod === 'all' || g.module === mod) && (!needle || `${g.term} ${g.definition}`.toLowerCase().includes(needle)));
  }, [q, mod]);
  const letters = useMemo(() => [...new Set(SORTED.map((g) => letterOf(g.term)))], []);
  const present = new Set(list.map((g) => letterOf(g.term)));

  return (
    <div className="wrap page glossary">
      <header className="page-head">
        <p className="kicker">Reference</p>
        <h1>
          The <em>glossary</em>
        </h1>
        <p className="page-head__lead">
          {GLOSSARY.length} terms, defined in plain words and using only ideas the lessons teach. Each one links to where it is introduced.
        </p>
      </header>

      <div className="glossary__tools">
        <div className="field">
          <label htmlFor="g-q">Search the glossary</label>
          <input id="g-q" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <p className="label" id="g-mod">
            Show terms from
          </p>
          <div className="filters" role="group" aria-labelledby="g-mod">
            <button type="button" className="filter" aria-pressed={mod === 'all'} onClick={() => setMod('all')}>
              All modules
            </button>
            {MODULES.map((m) => (
              <button key={m.id} type="button" className="filter" aria-pressed={mod === m.id} onClick={() => setMod(m.id)}>
                {m.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <nav aria-label="Jump to a letter" className="letters">
        <ul>
          {letters.map((l) => (
            <li key={l}>{present.has(l) ? <a href={`#letter-${l}`}>{l}</a> : <span aria-hidden="true">{l}</span>}</li>
          ))}
        </ul>
      </nav>
      <p className="note" role="status">
        {list.length} of {GLOSSARY.length} terms shown
      </p>

      {list.length === 0 ? (
        <div className="empty">
          <h2>No term matches that</h2>
          <p>Try a shorter search, or show terms from all modules.</p>
          <Btn variant="quiet" icon="reset" onClick={() => { setQ(''); setMod('all'); }}>
            Clear the search
          </Btn>
        </div>
      ) : (
        <dl className="terms">
          {list.map((g, i) => {
            const first = i === 0 || letterOf(list[i - 1]!.term) !== letterOf(g.term);
            const where = LESSONS.filter((l) => l.glossary.includes(g.id));
            return (
              <div key={g.id} className={`term hue-${g.module}`} id={first ? `letter-${letterOf(g.term)}` : undefined}>
                <dt>
                  <span className="term__name">{g.term}</span>
                  <span className="tag">{MODULES.find((m) => m.id === g.module)!.title}</span>
                </dt>
                <dd>
                  <p>{g.definition}</p>
                  {where.length ? (
                    <p className="term__where">
                      <span className="label">Taught in</span>
                      {where.map((l, k) => (
                        <span key={l.id}>
                          {k > 0 ? ', ' : ''}
                          <Link to={lessonPath(l)}>{l.title}</Link>
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="term__where">
                      <span className="label">Reference only</span> Not taught in a single lesson.
                    </p>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      <section aria-labelledby="myth-h" className="misconceptions">
        <p className="kicker">Reading</p>
        <h2 id="myth-h">Common misconceptions</h2>
        <p className="reading">{MISCONCEPTIONS.length} things people often believe about AI, each marked as a myth or a fact, with the reason and the lesson behind it.</p>
        <div className="myths">
          {MISCONCEPTIONS.map((m) => {
            const lesson = lessonById(m.lesson);
            return (
              <details key={m.id} className="disclosure">
                <summary>
                  <span>
                    <span className={`tag ${m.fact ? 'tag--good' : 'tag--bad'}`}>{m.fact ? 'Fact' : 'Myth'}</span> {m.statement}
                  </span>
                </summary>
                <div className="disclosure__body">
                  <p>{m.why}</p>
                  {lesson ? (
                    <p className="note">
                      Explained in <Link to={lessonPath(lesson)}>{lesson.title}</Link>.
                    </p>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
