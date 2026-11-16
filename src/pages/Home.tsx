import { useMemo } from 'react';
import { Link } from '@/router';
import { Harbor, type HarborPlace } from '@/art/Harbor';
import { RankCrest } from '@/art/Ranks';
import { LESSONS, PATHS, lessonById } from '@/content/paths';
import { levelInfo, overallProgress, pathProgress, recommendNext } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { LinkBtn, Meter } from '@/ui/primitives';

/** Home: one idea per screen. Who this is for, the two things to do, where you are, and the three paths. Nothing else. */
export default function Home() {
  const state = useProgress((s) => s);
  const lv = levelInfo(state.xp);
  const overall = overallProgress(state);
  const rec = recommendNext(state);
  const started = state.xp > 0;
  const recLesson = rec.lesson ? lessonById(rec.lesson) : undefined;
  const name = state.settings.name.trim();
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
      <section className="home-hero" aria-labelledby="hero-h">
        <div className="wrap home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">{name ? `Welcome back, ${name}` : 'An AI learning game for grades 9 to 12'}</p>
            <h1 id="hero-h">Learn how AI works. Use it well. Know when not to.</h1>
            <p className="lead">Fifteen short lessons and a harbor to explore. Train a real neural network, catch an AI making things up, and decide what is fair.</p>
            <div className="row">
              <LinkBtn to="/play" variant="primary" icon="play" go>Play Parameter</LinkBtn>
              {recLesson ? (
                <LinkBtn to={`/learn/${recLesson.path}/${recLesson.id}`} go>{started ? 'Continue learning' : 'Start learning'}</LinkBtn>
              ) : (
                <LinkBtn to="/certification" go>{certified ? 'Retake the certification' : 'Take the certification'}</LinkBtn>
              )}
            </div>
          </div>
          <div className="home-hero__art" role="group" aria-label="The harbor of Parameter. Each lantern lights when you finish a lesson.">
            <Harbor className="home-hero__svg" lit={lit} places={places} certified={certified} />
          </div>
        </div>
      </section>

      {started ? (
        <section className="wrap home-progress" aria-label="Your progress">
          <Link to="/logbook" className="home-progress__card">
            <RankCrest level={lv.level} className="home-progress__crest" />
            <span className="home-progress__who">
              <span className="eyebrow">Level {lv.level}</span>
              <span className="home-progress__name">{lv.name}</span>
            </span>
            <span className="home-progress__meter">
              <span className="small">
                <strong>{state.xp} XP</strong>
                {lv.next ? `, ${lv.remaining} to level ${lv.level + 1}` : ', top rank'}
              </span>
              <Meter value={lv.pct} label={`Progress to the next level, ${lv.pct} percent`} />
            </span>
            <span className="home-progress__lamps">
              <strong>{overall.done}</strong> of {overall.total} lanterns lit
            </span>
            <span className="visually-hidden">. Open your logbook.</span>
          </Link>
        </section>
      ) : null}

      <section className="section" aria-labelledby="paths-h">
        <div className="wrap">
          <h2 id="paths-h">Three paths</h2>
          <p className="lead lead--tight">Open in any order. About {Math.round(LESSONS.reduce((a, l) => a + l.minutes, 0) / 60)} hours in all.</p>
          <ul className="path-list">
            {PATHS.map((p) => {
              const prog = pathProgress(state, p.id);
              return (
                <li key={p.id} data-path={p.id}>
                  <Link to={`/learn/${p.id}`} className="path-tile">
                    <span className="eyebrow">Path {p.number} · {p.place}</span>
                    <span className="path-tile__title">{p.title}</span>
                    <span className="path-tile__tag">{p.tagline}</span>
                    <span className="path-tile__foot">
                      <Meter value={prog.pct} label={`${p.title} progress, ${prog.pct} percent`} />
                      <span className="small">{prog.done} of {prog.total} lessons</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section section--tight" aria-labelledby="more-h">
        <div className="wrap more-band">
          <div>
            <h2 id="more-h">Then put it to work</h2>
            <p className="lead lead--tight">A prompt lab, six school scenarios, a tool atlas, a glossary and a final certification.</p>
          </div>
          <LinkBtn to="/practice" go>Open Practice</LinkBtn>
        </div>
      </section>
    </>
  );
}
