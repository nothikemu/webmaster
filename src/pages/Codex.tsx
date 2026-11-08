import { useMemo, useState } from 'react';
import { GLOSSARY } from '@/content/glossary';
import { PATHS } from '@/content/paths';
import { useProgress } from '@/engine/store';
import { Chip, Meter, PageHead } from '@/ui/primitives';
import { Icon } from '@/art/Icons';

export default function Codex() {
  const [q, setQ] = useState('');
  const [path, setPath] = useState<string>('all');
  const unlocked = useProgress((s) => s.codex);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GLOSSARY.filter((g) => (path === 'all' || g.path === path) && (!needle || `${g.term} ${g.definition}`.toLowerCase().includes(needle))).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, path]);
  const pct = Math.round((unlocked.length / GLOSSARY.length) * 100);

  return (
    <div className="wrap page">
      <PageHead title="Codex" kicker="Reference" lead="Plain-language definitions for the terms in the lessons. Every definition is open to read. Finishing a lesson collects its terms with a seal.">
        <div className="district__prog">
          <Meter value={pct} label={`${unlocked.length} of ${GLOSSARY.length} terms collected`} />
          <span className="small">{unlocked.length} of {GLOSSARY.length} collected</span>
        </div>
      </PageHead>
      <div className="atlas-filters">
        <div className="field atlas-search">
          <label htmlFor="codex-q">Search the codex</label>
          <input id="codex-q" type="search" className="input" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <p className="label" id="codex-p">From path</p>
          <div className="tabs" role="group" aria-labelledby="codex-p">
            {[{ id: 'all', title: 'All' }, ...PATHS.map((p) => ({ id: p.id as string, title: p.title }))].map((p) => (
              <button key={p.id} type="button" className="key" aria-pressed={path === p.id} onClick={() => setPath(p.id)}>{p.title}</button>
            ))}
          </div>
        </div>
      </div>
      <p className="small" role="status">{list.length} terms shown</p>
      {list.length === 0 ? (
        <p>No term matches that. Try a shorter search.</p>
      ) : (
        <dl className="codex">
          {list.map((g) => {
            const got = unlocked.includes(g.id);
            return (
              <div key={g.id} className={`codex__entry${got ? ' is-got' : ''}`} data-path={g.path}>
                <dt>
                  {g.term}
                  {got ? <Chip tone="hue" icon="seal">Collected</Chip> : null}
                </dt>
                <dd>{g.definition}</dd>
              </div>
            );
          })}
        </dl>
      )}
      <p className="small"><Icon name="info" /> Terms are listed A to Z. “Collected” means you finished the lesson that introduces it.</p>
    </div>
  );
}
