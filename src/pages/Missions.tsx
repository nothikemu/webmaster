import { Link } from '@/router';
import { Icon } from '@/art/Icons';
import { Divider } from '@/art/Dividers';
import { MissionOffice } from '@/art/MoreScenes';
import { MISSIONS, MISSION_CATEGORIES, missionProgress, type MissionCategory, type MissionDef } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { LinkBtn } from '@/ui/primitives';

const BLURB: Record<MissionCategory, string> = {
  Fundamentals: 'How AI works, from rules and examples to networks and next-word guessing.',
  'Field work': 'Putting AI to use on real jobs, and checking what comes back.',
  Integrity: 'Spotting the risks and keeping your name on honest work.',
  Exploration: 'Missions played in the game: walk the harbor, find what is hidden, and work the stations.',
  Capstone: 'Proving the whole course.',
};
const DIVIDER: Record<MissionCategory, 'waves' | 'rope' | 'cogs' | 'chain' | 'rigging'> = { Fundamentals: 'rope', 'Field work': 'cogs', Integrity: 'waves', Exploration: 'chain', Capstone: 'rigging' };

function Mission({ m }: { m: MissionDef }) {
  const state = useProgress((s) => s);
  const p = missionProgress(state, m);
  const status = p.complete ? 'complete' : p.done > 0 ? 'under way' : 'open';
  return (
    <li className={`mission mission--${status.replace(' ', '-')}`}>
      <div className="mission__head">
        <span className="mission__stamp">
          {p.complete ? <Icon name="check" /> : null}
          {status}
        </span>
        <h3>{m.title}</h3>
        <span className="mission__reward">{p.complete ? 'Paid' : `+${m.reward} XP`}</span>
      </div>
      <p className="mission__brief">{m.brief}</p>
      {m.concept ? <p className="mission__concept"><strong>The idea:</strong> {m.concept}</p> : null}
      <ul className="mission__objs" aria-label={`Objectives for ${m.title}: ${p.done} of ${p.total} done`}>
        {m.objectives.map((o) => {
          const done = o.done(state);
          return (
            <li key={o.label} className={done ? 'is-done' : ''}>
              <Icon name={done ? 'check' : 'target'} />
              {done ? <span>{o.label}<span className="visually-hidden"> (done)</span></span> : <Link to={o.to}>{o.label}</Link>}
            </li>
          );
        })}
      </ul>
    </li>
  );
}

export default function Missions() {
  const state = useProgress((s) => s);
  const done = MISSIONS.filter((m) => state.missions[m.id]).length;
  const paid = MISSIONS.filter((m) => state.missions[m.id]).reduce((a, m) => a + m.reward, 0);
  const next = MISSIONS.find((m) => !state.missions[m.id]);
  return (
    <div className="wrap page missions-page">
      <header className="split-head">
        <div className="split-head__copy">
          <h1>Missions</h1>
          <p className="page-head__lead">Short runs of real objectives. Each one is checked against work you have actually finished, so nothing here can be done by visiting or clicking. Finish one and its XP bonus is paid once.</p>
          <p className="fact">
            <Icon name="flag" />
            <span>
              <strong>{done} of {MISSIONS.length}</strong> missions complete{paid ? `, ${paid} bonus XP earned` : ''}.
            </span>
          </p>
          {next ? (
            <div className="row">
              <LinkBtn to={next.objectives.find((o) => !o.done(state))?.to ?? '/learn'} variant="primary" go>Next: {next.title}</LinkBtn>
            </div>
          ) : null}
        </div>
        <MissionOffice done={done} className="plate split-head__art" />
      </header>
      {MISSION_CATEGORIES.map((cat) => (
        <section key={cat} className="mission-group" aria-labelledby={`mg-${cat}`}>
          <Divider kind={DIVIDER[cat]} className="divider" />
          <div className="mission-group__grid">
            <div className="mission-group__title">
              <h2 id={`mg-${cat}`}>{cat}</h2>
              <p>{BLURB[cat]}</p>
            </div>
            <ol className="missions">
              {MISSIONS.filter((m) => m.category === cat).map((m) => (
                <Mission key={m.id} m={m} />
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
