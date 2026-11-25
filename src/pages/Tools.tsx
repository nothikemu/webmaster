import { useMemo, useState } from 'react';
import { TOOLS, TOOL_CATEGORIES } from '@/content/tools';
import { Link } from '@/router';
import { Btn, Callout } from '@/ui/primitives';
import { Icon } from '@/art/Icons';

/** Real AI tools, what they are for, and who may use them, each dated. Part of the practical-tools side of Synthesis. */
export default function Tools() {
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter((t) => (cat === 'all' || t.category === cat) && (!needle || `${t.name} ${t.maker} ${t.does} ${t.goodFor.join(' ')}`.toLowerCase().includes(needle)));
  }, [cat, q]);

  return (
    <div className="wrap page tools hue-synthesis">
      <header className="page-head">
        <nav aria-label="Breadcrumb" className="crumbs">
          <ol>
            <li>
              <Link to="/modules">Modules</Link>
            </li>
            <li>
              <Link to="/modules/synthesis">Synthesis</Link>
            </li>
            <li aria-current="page">Tool atlas</li>
          </ol>
        </nav>
        <p className="kicker">Synthesis · reference</p>
        <h1>
          The tool <em>atlas</em>
        </h1>
        <p className="page-head__lead">
          Real AI tools, what they are for, and who may use them. Every entry carries the date it was checked, because age rules, prices and features change often.
        </p>
        <dl className="legend">
          <div>
            <dt>
              <span className="tag tag--good">
                <Icon name="check" /> Read on vendor page
              </span>
            </dt>
            <dd>We read the age and account rules on the company&apos;s own page on the date shown.</dd>
          </div>
          <div>
            <dt>
              <span className="tag tag--bad">
                <Icon name="warning" /> Reported, confirm
              </span>
            </dt>
            <dd>We found it described, but could not read the company&apos;s page ourselves. Check it before you rely on it.</dd>
          </div>
        </dl>
      </header>

      <div className="glossary__tools">
        <div className="field">
          <label htmlFor="tool-q">Search tools</label>
          <input id="tool-q" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <p className="label" id="tool-cat">
            Kind of tool
          </p>
          <div className="filters" role="group" aria-labelledby="tool-cat">
            {[{ id: 'all', label: 'All' }, ...TOOL_CATEGORIES].map((c) => (
              <button key={c.id} type="button" className="filter" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="note" role="status">
        {list.length} of {TOOLS.length} tools shown
      </p>

      {list.length === 0 ? (
        <div className="empty">
          <h2>No tool matches that</h2>
          <p>Try a shorter search, or choose “All”.</p>
          <Btn variant="quiet" icon="reset" onClick={() => { setQ(''); setCat('all'); }}>
            Clear the search
          </Btn>
        </div>
      ) : (
        <ul className="dossiers">
          {list.map((t) => (
            <li key={t.id}>
              <article className="dossier">
                <div className="dossier__head">
                  <div>
                    <h2>{t.name}</h2>
                    <p className="small">
                      {t.maker} · {TOOL_CATEGORIES.find((c) => c.id === t.category)?.label}
                    </p>
                  </div>
                  <div className="dossier__stamps">
                    <span className={`tag ${t.access.verified ? 'tag--good' : 'tag--bad'}`}>
                      <Icon name={t.access.verified ? 'check' : 'warning'} /> {t.access.verified ? 'Read on vendor page' : 'Reported, confirm'}
                    </span>
                    <span className="small num">Checked {t.checkedOn}</span>
                  </div>
                </div>
                <p>{t.does}</p>
                <details className="disclosure">
                  <summary>Access, limits and privacy</summary>
                  <div className="disclosure__body">
                    <dl className="facts">
                      <div>
                        <dt>Age</dt>
                        <dd>{t.access.age}</dd>
                      </div>
                      <div>
                        <dt>Account</dt>
                        <dd>{t.access.account}</dd>
                      </div>
                      <div>
                        <dt>Cost</dt>
                        <dd>{t.access.cost}</dd>
                      </div>
                      <div>
                        <dt>Privacy</dt>
                        <dd>{t.privacy}</dd>
                      </div>
                    </dl>
                    <div className="dossier__cols">
                      <div>
                        <h3>Good for</h3>
                        <ul>
                          {t.goodFor.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3>Limits</h3>
                        <ul>
                          {t.limits.map((g) => (
                            <li key={g}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {t.access.source ? (
                      <p className="small">
                        Source:{' '}
                        <a href={t.access.source} target="_blank" rel="noopener noreferrer">
                          vendor page <Icon name="external" />
                          <span className="visually-hidden"> (opens in a new tab)</span>
                        </a>
                      </p>
                    ) : null}
                  </div>
                </details>
              </article>
            </li>
          ))}
        </ul>
      )}
      <Callout icon="warning">
        <p>
          Before using any tool for school, check your teacher&apos;s rules and your school&apos;s approved list. A tool being allowed for you to sign up for does not make it allowed for an assignment.
        </p>
      </Callout>
      <p className="small atlas-note">Image, writing and data tools are not listed yet, because we have not been able to check their rules on the companies&apos; own pages.</p>
    </div>
  );
}
