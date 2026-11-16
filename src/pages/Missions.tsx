import { Link } from '@/router';
import { Icon } from '@/art/Icons';
import { MISSIONS, MISSION_CATEGORIES, missionProgress, type MissionCategory, type MissionDef } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { LinkBtn, PageHead } from '@/ui/primitives';

const BLURB: Record<MissionCategory, string> = {
  Fundamentals: 'How AI works, from rules and examples to networks and next-word guessing.',
  'Field work': 'Putting AI to use on real jobs, and checking what comes back.',
  Integrity: 'Spotting the risks and keeping your name on honest work.',
  Exploration: 'Missions played in the game: walk the harbor, find what is hidden, and work the stations.',
  Capstone: 'Proving the whole course.',
};

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
      <PageHead title="Missions" lead="Short runs of real objectives. Each one is checked against work you finished, so nothing here can be done by clicking around.">
        <p className="fact">
          <Icon name="flag" />
          <span>
            <strong>{done} of {MISSIONS.length}</strong> complete{paid ? `, ${paid} bonus XP earned` : ''}
          </span>
        </p>
        {next ? (
          <div className="row">
            <LinkBtn to={next.objectives.find((o) => !o.done(state))?.to ?? '/learn'} variant="primary" go>Next: {next.title}</LinkBtn>
          </div>
        ) : null}
      </PageHead>
      {MISSION_CATEGORIES.map((cat) => {
        const list = MISSIONS.filter((m) => m.category === cat);
        const n = list.filter((m) => state.missions[m.id]).length;
        return (
          <section key={cat} className="mission-group" aria-labelledby={`mg-${cat}`}>
            <h2 id={`mg-${cat}`}>
              {cat} <span className="mission-group__count">{n} of {list.length}</span>
            </h2>
            <p className="mission-group__blurb">{BLURB[cat]}</p>
            <ol className="missions">
              {list.map((m) => (
                <Mission key={m.id} m={m} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
