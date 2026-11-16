import { Link } from '@/router';
import { Icon } from '@/art/Icons';
import { GLOSSARY } from '@/content/glossary';
import { MISSIONS } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { MythCard } from '@/ui/MythCard';
import { PageHead } from '@/ui/primitives';

const ITEMS: { to: string; title: string; body: string }[] = [
  { to: '/lab', title: 'Prompt Lab', body: 'Build a prompt part by part and watch a weak request become a strong one.' },
  { to: '/scenarios', title: 'Scenarios', body: 'Six school situations. Choose, then see what each choice costs.' },
  { to: '/tools', title: 'Tool Atlas', body: 'Real AI tools with their age rules, costs and limits.' },
  { to: '/codex', title: 'Codex', body: `${GLOSSARY.length} plain-language terms, and a drill to test them.` },
  { to: '/missions', title: 'Missions', body: 'Short runs of real objectives, each checked against work you finished.' },
  { to: '/certification', title: 'Final certification', body: '24 questions across all three paths. Pass at 80 percent.' },
];

/** Practice: where to apply what you learned. A list, not a wall. */
export default function Practice() {
  const done = useProgress((s) => MISSIONS.filter((m) => s.missions[m.id]).length);
  return (
    <div className="wrap page">
      <PageHead title="Practice" lead="Try things for real. None of this is graded by anyone but you." />
      <ul className="card-list">
        {ITEMS.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="card-link">
              <span className="card-link__title">{i.title}</span>
              <span className="card-link__body">{i.body}</span>
              {i.to === '/missions' ? <span className="small">{done} of {MISSIONS.length} complete</span> : null}
              <Icon name="arrow-right" className="card-link__go" />
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="myth-h" className="practice-myth">
        <h2 id="myth-h">Today&apos;s myth or fact</h2>
        <MythCard />
      </section>
    </div>
  );
}
