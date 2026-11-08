import { useMemo, useState } from 'react';
import { TOOLS, TOOL_CATEGORIES } from '@/content/tools';
import { Callout, Chip, PageHead, Panel } from '@/ui/primitives';
import { Icon } from '@/art/Icons';

export default function Tools() {
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOOLS.filter((t) => (cat === 'all' || t.category === cat) && (!needle || `${t.name} ${t.maker} ${t.does} ${t.goodFor.join(' ')}`.toLowerCase().includes(needle)));
  }, [cat, q]);

  return (
    <div className="wrap page" data-path="use">
      <PageHead title="Tool Atlas" kicker="Field guide" lead="Real AI tools, what they are for, and who may use them. Every entry carries the date it was checked, because age rules, prices and features change often.">
        <Callout icon="info">
          <p>
            <strong>How to read the stamps.</strong> “Read on vendor page” means we read the age and account rules on the company&apos;s own page on the date shown. “Reported, confirm” means we found it described but could not read the vendor page directly, so check it yourself before relying on it. Image, writing and data tools are not listed yet because we have not verified them.
          </p>
        </Callout>
      </PageHead>

      <div className="atlas-filters">
        <div className="field atlas-search">
          <label htmlFor="tool-q">Search tools</label>
          <input id="tool-q" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <p className="label" id="tool-cat">Kind of tool</p>
          <div className="tabs" role="group" aria-labelledby="tool-cat">
            {[{ id: 'all', label: 'All' }, ...TOOL_CATEGORIES].map((c) => (
              <button key={c.id} type="button" className="key" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="small" role="status">{list.length} of {TOOLS.length} tools shown</p>

      {list.length === 0 ? (
        <Panel tone="shade"><h2>No tool matches that</h2><p>Try a shorter search, or choose “All”.</p></Panel>
      ) : (
        <ul className="dossiers">
          {list.map((t) => (
            <li key={t.id}>
              <Panel as="article" lift className="dossier">
                <div className="dossier__head">
                  <div>
                    <h2>{t.name}</h2>
                    <p className="small">{t.maker} · {TOOL_CATEGORIES.find((c) => c.id === t.category)?.label}</p>
                  </div>
                  <div className="dossier__stamps">
                    <Chip tone={t.access.verified ? 'hue' : undefined} icon={t.access.verified ? 'check' : 'warning'}>{t.access.verified ? 'Read on vendor page' : 'Reported, confirm'}</Chip>
                    <span className="small">Checked {t.checkedOn}</span>
                  </div>
                </div>
                <p>{t.does}</p>
                <details className="dossier__more">
                  <summary>Access, limits and privacy</summary>
                  <dl className="facts">
                    <div><dt>Age</dt><dd>{t.access.age}</dd></div>
                    <div><dt>Account</dt><dd>{t.access.account}</dd></div>
                    <div><dt>Cost</dt><dd>{t.access.cost}</dd></div>
                    <div><dt>Privacy</dt><dd>{t.privacy}</dd></div>
                  </dl>
                  <div className="dossier__cols">
                    <div><h3>Good for</h3><ul>{t.goodFor.map((g) => <li key={g}>{g}</li>)}</ul></div>
                    <div><h3>Limits</h3><ul>{t.limits.map((g) => <li key={g}>{g}</li>)}</ul></div>
                  </div>
                  {t.access.source ? (
                    <p className="small">
                      Source: <a href={t.access.source} target="_blank" rel="noopener noreferrer">vendor page <Icon name="external" /><span className="visually-hidden"> (opens in a new tab)</span></a>
                    </p>
                  ) : null}
                </details>
              </Panel>
            </li>
          ))}
        </ul>
      )}
      <Callout icon="warning"><p>Before using any tool for school, check your teacher&apos;s rules and your school&apos;s approved list. A tool being allowed for you to sign up for does not make it allowed for an assignment.</p></Callout>
    </div>
  );
}
