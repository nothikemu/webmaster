import { useMemo, useState, type ReactNode } from 'react';
import { MODULES, glossary, moduleHref, resources } from '../content';
import { t } from '../core/assets';
import { Link } from '../router';

const moduleOf = (id: string) => MODULES.find((m) => m.id === id);

export default function Glossary(): ReactNode {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const terms = useMemo(
    () =>
      glossary.filter(
        (g) => !q || g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q),
      ),
    [q],
  );
  // Group by first letter, keeping the source order, which is already alphabetical.
  const groups = useMemo(() => {
    const out: Array<{ letter: string; items: typeof terms }> = [];
    for (const g of terms) {
      const letter = g.term.charAt(0).toUpperCase();
      const last = out[out.length - 1];
      if (last && last.letter === letter) (last.items as Array<(typeof terms)[number]>).push(g);
      else out.push({ letter, items: [g] });
    }
    return out;
  }, [terms]);
  return (
    <div className="wrap page gloss">
      <header className="page-head">
        <h1 className="display">{t('gl.title')}</h1>
      </header>
      <div className="gloss-tools">
        <div className="field">
          <label htmlFor="gl-search" className="label">
            {t('gl.search')}
          </label>
          <input
            id="gl-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="sr-only" role="status" aria-live="polite">
            {t('gl.count', { n: terms.length })}
          </p>
        </div>
        <nav className="gloss-index" aria-label={t('gl.index')}>
          <ul>
            {groups.map((g) => (
              <li key={g.letter}>
                <a href={`#letter-${g.letter}`}>{g.letter}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="gloss-list">
        {groups.map((g) => (
          <section
            key={g.letter}
            id={`letter-${g.letter}`}
            aria-label={g.letter}
            className="gloss-group"
          >
            <p className="gloss-letter" aria-hidden="true">
              {g.letter}
            </p>
            <dl>
              {g.items.map((e) => {
                const m = moduleOf(e.module);
                return (
                  <div key={e.term} className="gl-item" data-module={e.module}>
                    <dt>{e.term}</dt>
                    <dd>
                      {e.definition}
                      {m && (
                        <Link to={moduleHref(m.id)} className="gl-ref">
                          {m.title}
                        </Link>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
      <section aria-labelledby="res-h" className="gloss-resources">
        <h2 id="res-h" className="h2">
          {t('gl.resources')}
        </h2>
        <ol className="res-list">
          {resources.map((r, i) => (
            <li key={r.href} data-module={r.module}>
              <span className="res-n" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <a href={r.href} target="_blank" rel="noopener noreferrer">
                {r.title}
                <span className="sr-only"> {t('gl.external')}</span>
              </a>
              <span className="res-note">{r.note}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
