import { useMemo, useState } from 'react';
import { Link } from '@/router';
import { Harbor, type HarborPlace } from '@/art/Harbor';
import { PathScene } from '@/art/PathScenes';
import { Kernel } from '@/art/Kernel';
import { RankCrest } from '@/art/Ranks';
import { Spot, type SpotKind } from '@/art/Spots';
import { Icon } from '@/art/Icons';
import { LESSONS, PATHS, lessonById } from '@/content/paths';
import { GLOSSARY } from '@/content/glossary';
import { mythForDay } from '@/content/myths';
import { levelInfo, overallProgress, pathProgress, recommendNext, streak, XP } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { Btn, LinkBtn, Meter, Panel } from '@/ui/primitives';
import { play } from '@/audio/sfx';

const TOOLKIT: { to: string; spot: SpotKind; title: string; body: string; big?: boolean }[] = [
  { to: '/lab', spot: 'lab', title: 'Prompt Lab', body: 'Build a prompt part by part and watch a weak request turn into a strong one. A clearly labeled demonstration, not a live AI.', big: true },
  { to: '/scenarios', spot: 'scenarios', title: 'Scenarios', body: 'Six school situations. Choose, then see what each choice does to honesty, learning and privacy.', big: true },
  { to: '/tools', spot: 'atlas', title: 'Tool Atlas', body: 'Real AI tools with age rules, costs and limits, each stamped with the date it was checked.' },
  { to: '/codex', spot: 'codex', title: 'Codex', body: `${GLOSSARY.length} plain-language terms, and a drill to test them. Finish lessons to collect them.` },
  { to: '/certification', spot: 'certification', title: 'Final certification', body: '24 questions from the three keepers of the harbor. Pass at 80 percent and print your certificate.' },
];

/** One statement a day. The learner calls it, sees why, and is pointed at the lesson that explains it. */
function MythCard() {
  const [offset, setOffset] = useState(0);
  const [pick, setPick] = useState<boolean | null>(null);
  const myth = mythForDay(Date.now(), offset);
  const lesson = lessonById(myth.lesson);
  const right = pick !== null && pick === myth.fact;
  const answer = (v: boolean) => {
    setPick(v);
    play(v === myth.fact ? 'right' : 'wrong');
  };
  return (
    <Panel lift className="myth">
      <p className="label">Today&apos;s statement</p>
      <p className="myth__statement">“{myth.statement}”</p>
      {pick === null ? (
        <div className="row" role="group" aria-label="Is the statement a myth or a fact?">
          <Btn variant="primary" onClick={() => answer(false)}>It is a myth</Btn>
          <Btn variant="secondary" onClick={() => answer(true)}>It is a fact</Btn>
        </div>
      ) : (
        <div role="status" className="myth__answer">
          <p className={`myth__verdict${right ? ' is-right' : ''}`}>
            <Icon name={right ? 'check' : 'x'} /> {right ? 'Right.' : 'Not quite.'} That one is {myth.fact ? 'a fact' : 'a myth'}.
          </p>
          <p>{myth.why}</p>
          <div className="row">
            {lesson ? <LinkBtn to={`/learn/${lesson.path}/${lesson.id}`} variant="primary" go>Lesson: {lesson.title}</LinkBtn> : null}
            <Btn variant="quiet" icon="reset" onClick={() => { setOffset((o) => o + 1); setPick(null); }}>Try another</Btn>
          </div>
        </div>
      )}
    </Panel>
  );
}

export default function Home() {
  const state = useProgress((s) => s);
  const lv = levelInfo(state.xp);
  const overall = overallProgress(state);
  const rec = recommendNext(state);
  const started = state.xp > 0;
  const recLesson = rec.lesson ? lessonById(rec.lesson) : undefined;
  const total = LESSONS.reduce((a, l) => a + l.minutes, 0);
  const run = streak(state, Date.now());
  const certified = state.challenges['certification']?.passed === true;

  // The picture only needs to know which lessons are finished, so it is not redrawn for every XP change.
  const litKey = LESSONS.map((l) => (state.lessons[l.id]?.done ? '1' : '0')).join('');
  const lit = useMemo(() => litKey.split('').map((c) => c === '1'), [litKey]);
  const places = useMemo<HarborPlace[]>(
    () =>
      PATHS.map((p, i) => ({
        id: p.id,
        to: `/learn/${p.id}`,
        title: p.title,
        place: p.place,
        done: litKey.slice(i * 5, i * 5 + p.lessons.length).split('1').length - 1,
        total: p.lessons.length,
      })),
    [litKey],
  );

  return (
    <>
      <section className="hero" aria-labelledby="hero-h">
        <Harbor className="hero__art" lit={lit} places={places} certified={certified} />
        <div className="wrap hero__inner">
          <Panel className="hero__copy" lift>
            <p className="label">An AI learning portal for grades 9 to 12</p>
            <h1 id="hero-h">Learn how AI works. Use it well. Know when not to.</h1>
            <p className="hero__lead">
              Fifteen short lessons across three paths. Train a real neural network, catch an AI making things up, and decide what is fair in the situations you will actually face at school.
            </p>
            <div className="row">
              {recLesson ? (
                <LinkBtn to={`/learn/${recLesson.path}/${recLesson.id}`} variant="primary" go>
                  {started ? `Continue: ${recLesson.title}` : 'Start with lesson 1'}
                </LinkBtn>
              ) : (
                <LinkBtn to="/certification" variant="primary" go>{certified ? 'Retake the certification' : 'Take the final certification'}</LinkBtn>
              )}
              <LinkBtn to="/learn" variant="secondary">Open the chart</LinkBtn>
            </div>
          </Panel>
        </div>
      </section>

      <section className="strip" data-surface="ink" aria-label="Your progress">
        <div className="wrap strip__grid">
          <Link to="/logbook" className="strip__level">
            <RankCrest level={lv.level} className="strip__crest" />
            <span>
              <span className="label">Level {lv.level}</span>
              <span className="strip__name">{lv.name}</span>
              <span className="visually-hidden">. Open your logbook.</span>
            </span>
          </Link>
          <div className="strip__meter">
            <p className="small">
              <strong>{state.xp} XP</strong>
              {lv.next ? `, ${lv.remaining} to level ${lv.level + 1}` : ', top rank'}
            </p>
            <Meter value={lv.pct} label={`Progress to the next level, ${lv.pct} percent`} />
          </div>
          <dl className="strip__facts">
            <div>
              <dt>Lanterns lit</dt>
              <dd>{overall.done} of {overall.total}</dd>
            </div>
            <div>
              <dt>Day streak</dt>
              <dd>{run}</dd>
            </div>
          </dl>
          <p className="strip__note">{started ? rec.why : 'Every lesson you finish lights one lantern over the harbor. No account is needed, and your progress is saved on this device only.'}</p>
        </div>
      </section>

      <section className="section chart" aria-labelledby="chart-h">
        <div className="wrap">
          <div className="section-head">
            <h2 id="chart-h">Three paths, three places in the harbor</h2>
            <p className="prose">Each path answers one part of learning AI well. They are open in any order, and about {Math.round(total / 60)} hours in all.</p>
          </div>
          <ul className="paths">
            {PATHS.map((p) => {
              const prog = pathProgress(state, p.id);
              return (
                <li key={p.id} className={`paths__item paths__item--${p.number}`} data-path={p.id}>
                  <Link to={`/learn/${p.id}`} className="path-card panel panel--lift">
                    <PathScene path={p.id} className="path-card__art" />
                    <span className="path-card__body">
                      <span className="chip chip--hue">Path {p.number}, {p.place}</span>
                      <span className="path-card__title">{p.title}</span>
                      <span className="path-card__tag">{p.tagline}</span>
                      <span className="path-card__sum">{p.summary}</span>
                      <span className="path-card__meta">
                        <span>{p.lessons.length} lessons, about {p.lessons.reduce((a, l) => a + l.minutes, 0)} min</span>
                        <span>{prog.done} of {prog.total} finished</span>
                      </span>
                      <Meter value={prog.pct} label={`${p.title} progress, ${prog.pct} percent`} />
                      <span className="btn btn--hue btn--sm path-card__cta" aria-hidden="true">
                        {prog.done > 0 ? 'Continue path' : 'Enter path'} <Icon name="arrow-right" className="btn__go" />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section warmup" aria-labelledby="warm-h">
        <div className="wrap warmup__grid">
          <div className="warmup__copy">
            <h2 id="warm-h">Myth or fact?</h2>
            <p className="prose">Thirty seconds, one claim about AI. Call it, then see the reason and the lesson behind it. A new one every day.</p>
            <Kernel mood="think" hold="none" className="warmup__kernel" />
          </div>
          <MythCard />
        </div>
      </section>

      <section className="section how" aria-labelledby="how-h">
        <div className="wrap">
          <h2 id="how-h">How every lesson works</h2>
          <ol className="route">
            {[
              { t: 'Learn', b: 'Short pieces with a diagram and a real-world example.', xp: `${XP.learn} XP` },
              { t: 'Try', b: 'An experiment you run yourself. Train it, break it, fix it.', xp: `up to ${XP.tryMax} XP` },
              { t: 'Check', b: 'Three questions with reasons for every answer.', xp: `up to ${XP.checkPerQuestion * 3 + XP.checkPerfect} XP` },
              { t: 'Seal', b: 'Finish all three and the lesson is sealed. Badges follow real work.', xp: `${XP.lessonDone} XP` },
            ].map((s, i) => (
              <li key={s.t} className="route__stop">
                <span className="route__node" aria-hidden="true">{i + 1}</span>
                <h3>{s.t}</h3>
                <p>{s.b}</p>
                <p className="route__xp">{s.xp}</p>
              </li>
            ))}
          </ol>
          <p className="prose how__fair">XP is paid once for each step and only again when you improve a score, so repeating things gets you nothing. Badges are checked against what you have actually finished.</p>
        </div>
      </section>

      <section className="section toolkit" aria-labelledby="kit-h">
        <div className="wrap">
          <h2 id="kit-h">Beyond the lessons</h2>
          <ul className="kit">
            {TOOLKIT.map((t) => (
              <li key={t.to} className={t.big ? 'kit__big' : ''}>
                <Link to={t.to} className="panel panel--lift kit__card">
                  <Spot kind={t.spot} className="kit__art" decorative />
                  <span className="kit__title">{t.title}</span>
                  <span className="kit__body">{t.body}</span>
                  <span className="kit__go">Open <Icon name="arrow-right" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section proof" data-surface="ink" aria-labelledby="proof-h">
        <div className="wrap proof__grid">
          <Kernel mood="cheer" className="proof__kernel" label="Kernel, the guide, cheering" />
          <div>
            <h2 id="proof-h">The experiments are real</h2>
            <p className="prose">
              The neural network you train is a real one, with about sixty lines of code and no libraries. The spam filter learns from examples. The language model counts which words follow which.
              They are tiny on purpose, so you can see the idea instead of taking it on trust.
            </p>
            <LinkBtn to="/learn/understand/u3" variant="primary" go>Train a network now</LinkBtn>
          </div>
        </div>
      </section>
    </>
  );
}
