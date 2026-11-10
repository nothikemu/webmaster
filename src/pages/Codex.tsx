import { useMemo, useState } from 'react';
import { GLOSSARY } from '@/content/glossary';
import { PATHS } from '@/content/paths';
import { buildDrill } from '@/content/drill';
import { dispatch, useProgress } from '@/engine/store';
import { Btn, Callout, Chip, Panel } from '@/ui/primitives';
import { Icon } from '@/art/Icons';
import { ScrollCabinet, type CodexSlot } from '@/art/PageScenes';
import { Quiz } from '@/widgets/Quiz';

const DRILL_SIZE = 10;
const DRILL_PASS = 80;
const DRILL_XP = 30;

export default function Codex() {
  const [q, setQ] = useState('');
  const [path, setPath] = useState<string>('all');
  /** The seed of the drill in play, or null when no drill is running. */
  const [drill, setDrill] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const unlocked = useProgress((s) => s.codex);
  const record = useProgress((s) => s.challenges['codex-drill']);

  // one pigeonhole per term, in course order, so each path's scrolls sit together
  const slots = useMemo<CodexSlot[]>(() => PATHS.flatMap((p) => GLOSSARY.filter((g) => g.path === p.id).map((g) => ({ hue: p.id, got: unlocked.includes(g.id) }))), [unlocked]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return GLOSSARY.filter((g) => (path === 'all' || g.path === path) && (!needle || `${g.term} ${g.definition}`.toLowerCase().includes(needle))).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, path]);
  const questions = useMemo(() => (drill === null ? [] : buildDrill(GLOSSARY, drill, DRILL_SIZE)), [drill]);

  const start = () => {
    setResult(null);
    setDrill(Date.now());
  };

  return (
    <div className="wrap page">
      <header className="split-head split-head--art-wide">
        <div className="split-head__copy">
          <h1>Codex</h1>
          <p className="page-head__lead">Plain-language definitions for every term in the lessons. All of them are open to read.</p>
          <p className="fact">
            <Icon name="scroll" />
            <span>
              <strong>{unlocked.length} of {GLOSSARY.length}</strong> scrolls are in your cabinet. Finishing a lesson files its terms.
            </span>
          </p>
          <div className="row">
            <Btn variant="primary" go onClick={start}>Drill ten terms</Btn>
            {record ? <span className="small">Best drill: <strong>{record.best} percent</strong></span> : <span className="small">Pass at {DRILL_PASS} percent for {DRILL_XP} XP, once.</span>}
          </div>
        </div>
        <ScrollCabinet
          slots={slots}
          className="plate split-head__art"
          label={`An illustration of a tall wooden cabinet of pigeonholes, one for each of the ${GLOSSARY.length} codex terms. ${unlocked.length} of them hold a rolled scroll. Wren the weaver stands beside it, Kernel the robot reads on a stool, and a black cat sleeps on top.`}
        />
      </header>

      {drill !== null ? (
        <section aria-labelledby="drill-h" className="drill">
          <div className="play__head">
            <h2 id="drill-h">Drill: name the term</h2>
            <Btn variant="quiet" small onClick={() => setDrill(null)}>Stop the drill</Btn>
          </div>
          <Panel className="bench" lift>
            <Quiz
              key={drill}
              questions={questions}
              label="Codex drill"
              doneLabel="See my score"
              onDone={(correct) => {
                const pct = Math.round((correct / questions.length) * 100);
                dispatch({ type: 'challenge', id: 'codex-drill', score: pct, passMark: DRILL_PASS, xp: DRILL_XP, label: 'Codex drill' });
                setResult(pct);
                setDrill(null);
              }}
            />
          </Panel>
        </section>
      ) : (
        <>
          {result !== null ? (
            <Callout icon={result >= DRILL_PASS ? 'check' : 'info'} tone={result >= DRILL_PASS ? 'good' : undefined}>
              <p role="status">
                <strong>Drill score: {result} percent.</strong> {result >= DRILL_PASS ? 'That clears the drill.' : `You need ${DRILL_PASS} to clear it. Each miss showed you the term and its meaning, so another round should go better.`}
              </p>
            </Callout>
          ) : null}
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
            <Panel tone="shade">
              <h2>No term matches that</h2>
              <p>Try a shorter search, or choose “All”.</p>
              <Btn variant="quiet" icon="reset" onClick={() => { setQ(''); setPath('all'); }}>Clear the search</Btn>
            </Panel>
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
          <p className="small">Terms are listed A to Z. “Collected” means you finished the lesson that introduces the term.</p>
        </>
      )}
    </div>
  );
}
