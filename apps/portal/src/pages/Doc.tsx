import type { ReactNode } from 'react';
import type { DocPageContent } from '../content/site';
import { t } from '../core/assets';

/**
 * An editorial reference page: a contents rail that follows the reader, numbered sections in a
 * measured column. The rail is real navigation (it links to each section), not decoration.
 */
export function Doc({ page, children }: { page: DocPageContent; children?: ReactNode }): ReactNode {
  return (
    <div className="wrap page doc">
      <header className="page-head">
        <h1 className="display">{page.title}</h1>
        <p className="lead">{page.lead}</p>
      </header>
      <div className="doc-layout">
        <nav className="doc-rail" aria-label={t('doc.contents')}>
          <p className="label">{t('doc.contents')}</p>
          <ol>
            {page.sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#doc-${i}`}>
                  <span className="doc-rail-n" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="doc-main glass" data-surface="paper">
          {page.sections.map((s, i) => (
            <section
              key={s.heading}
              id={`doc-${i}`}
              aria-labelledby={`doc-h-${i}`}
              className="doc-section"
            >
              <h2 id={`doc-h-${i}`} className="h2">
                <span className="doc-n" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {s.heading}
              </h2>
              {s.paragraphs?.map((p) => (
                <p key={p.slice(0, 28)} className="prose">
                  {p}
                </p>
              ))}
              {s.items && (
                <ul className="doc-list">
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}
