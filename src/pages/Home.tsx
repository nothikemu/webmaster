import { Link } from '@/router';
import { MODULES, coreLessons, furtherLessons, lessonPath } from '@/content/modules';
import { GLOSSARY } from '@/content/glossary';
import { useLearning } from '@/learning/store';
import { hasAnyData, suggestNext } from '@/learning/state';
import { GoLink, LinkBtn } from '@/ui/primitives';
import { HeroPlate } from '@/art/field/HeroPlate';
import { ModulePlate } from '@/art/field/ModulePlates';
import { TuneRule } from '@/art/field/Marks';

const FAILURES = [
  { name: 'Bias', text: 'The model treats groups unequally, or starts to as the world shifts.' },
  { name: 'Leakage', text: 'Private data comes out, from training or from what users paste in.' },
  { name: 'Attack', text: 'A crafted input makes the model fail, or hidden text takes over a prompt.' },
  { name: 'Opacity', text: 'People affected cannot find out what drove a decision, or whom to ask.' },
];

const STEPS = [
  { no: '1', name: 'Read', text: 'A few minutes of writing with the key ideas set apart in the margin. Terms are defined as they appear.' },
  { no: '2', name: 'Try', text: 'Where an idea can be felt with your hands, a small experiment lets you change something and see what happens.' },
  { no: '3', name: 'Check', text: 'Short questions that explain every answer. They are untimed and unscored, and you can try them again.' },
];

export default function Home() {
  const learner = useLearning((s) => s);
  const any = hasAnyData(learner);
  const next = suggestNext(learner);
  const [foundations, synthesis, ethics] = MODULES as [(typeof MODULES)[number], (typeof MODULES)[number], (typeof MODULES)[number]];
  const first = coreLessons(foundations)[0]!;
  const lessonCount = MODULES.reduce((a, m) => a + coreLessons(m).length, 0);

  return (
    <div className="home">
      <section className="hero" aria-labelledby="home-h">
        <div className="wrap hero__grid">
          <div className="hero__copy">
            <p className="kicker">A field guide to how machines learn · grades 9 to 12</p>
            <h1 id="home-h" className="hero__title">
              Learn how <em>machines</em> learn.
            </h1>
            <p className="hero__lead">
              Parameter is a free, illustrated guide to artificial intelligence. Three modules, {lessonCount} core lessons, and three small instruments you can turn by hand. No accounts, no scores, nothing locked.
            </p>
            <div className="row hero__actions">
              <LinkBtn to={lessonPath(first)} variant="primary" go>
                Begin with lesson 1
              </LinkBtn>
              <LinkBtn to="/modules">See the three modules</LinkBtn>
            </div>
            {any && next ? (
              <p className="hero__resume">
                <span className="label">Where you left off</span>
                <Link to={lessonPath(next)}>{next.title}</Link>
              </p>
            ) : null}
          </div>
          <div className="hero__art">
            <HeroPlate />
          </div>
        </div>
        <div className="wrap hero__facts">
          <dl>
            <div>
              <dt>Core lessons</dt>
              <dd className="num">{lessonCount}</dd>
            </div>
            <div>
              <dt>Optional lessons</dt>
              <dd className="num">{MODULES.reduce((a, m) => a + furtherLessons(m).length, 0)}</dd>
            </div>
            <div>
              <dt>Instruments</dt>
              <dd className="num">3</dd>
            </div>
            <div>
              <dt>Glossary terms</dt>
              <dd className="num">{GLOSSARY.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="wrap intro" aria-labelledby="intro-h">
        <div className="grid">
          <div className="intro__label">
            <p className="kicker">Contents</p>
          </div>
          <div className="intro__text">
            <h2 id="intro-h">
              Three questions, answered one lesson at a time.
            </h2>
            <p>
              What is a machine learning system actually doing? How do you ask one for what you need? And where does it fail the people it is meant to serve? Each module takes one of those questions seriously, with drawings, a little arithmetic, and an instrument to turn.
            </p>
          </div>
        </div>
      </section>

      {/* Module 1: the drawing leads, the text sits beside it */}
      <section className="feature feature--foundations hue-foundations" aria-labelledby="f-h">
        <div className="wrap grid feature__grid">
          <div className="feature__art" aria-hidden="true">
            <ModulePlate module="foundations" />
          </div>
          <div className="feature__copy">
            <p className="feature__no num">01</p>
            <h2 id="f-h">{foundations.title}</h2>
            <p className="feature__tag">{foundations.tagline}</p>
            <p>{foundations.summary}</p>
            <ol className="feature__list">
              {coreLessons(foundations).map((l) => (
                <li key={l.id}>
                  <Link to={lessonPath(l)}>{l.title}</Link>
                </li>
              ))}
            </ol>
            <GoLink to="/modules/foundations">Open Foundations</GoLink>
          </div>
        </div>
      </section>

      {/* Module 2: text first, a wide specimen below it, on a tinted band */}
      <section className="feature feature--synthesis hue-synthesis" aria-labelledby="s-h">
        <div className="wrap feature__stack">
          <div className="feature__head">
            <p className="feature__no num">02</p>
            <div>
              <h2 id="s-h">{synthesis.title}</h2>
              <p className="feature__tag">{synthesis.tagline}</p>
            </div>
          </div>
          <div className="feature__art feature__art--wide" aria-hidden="true">
            <ModulePlate module="synthesis" />
          </div>
          <div className="feature__cols">
            <p>{synthesis.summary}</p>
            <ol className="feature__list feature__list--cols">
              {coreLessons(synthesis).map((l) => (
                <li key={l.id}>
                  <Link to={lessonPath(l)}>{l.title}</Link>
                </li>
              ))}
            </ol>
            <GoLink to="/modules/synthesis">Open Synthesis</GoLink>
          </div>
        </div>
      </section>

      {/* Module 3: a dark plate with the four ways a system fails */}
      <section className="feature feature--ethics hue-ethics" aria-labelledby="e-h" data-surface="night">
        <div className="wrap">
          <div className="feature__head feature__head--ethics">
            <p className="feature__no num">03</p>
            <div>
              <h2 id="e-h">{ethics.title}</h2>
              <p className="feature__tag">{ethics.tagline}</p>
            </div>
          </div>
          <div className="grid ethics__grid">
            <div className="ethics__art" aria-hidden="true">
              <ModulePlate module="ethics" />
            </div>
            <div className="ethics__copy">
              <p>{ethics.summary}</p>
              <GoLink to="/modules/ethics">Open Ethics</GoLink>
            </div>
          </div>
          <ul className="failures">
            {FAILURES.map((f, i) => (
              <li key={f.name}>
                <span className="num failures__no">{String(i + 1).padStart(2, '0')}</span>
                <h3>{f.name}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap method" aria-labelledby="m-h">
        <div className="method__head">
          <p className="kicker">How a lesson works</p>
          <h2 id="m-h">
            Read, try, check. <em>In any order.</em>
          </h2>
        </div>
        <ol className="method__steps">
          {STEPS.map((s) => (
            <li key={s.name}>
              <span className="method__no num" aria-hidden="true">
                {s.no}
              </span>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <TuneRule className="method__rule" at={0.62} />
        <div className="method__close">
          <p className="method__quote">
            There are no points, levels or timers here, and no lesson is locked behind another. The only thing saved is which lessons you marked complete, and it stays on this device.
          </p>
          <div className="row">
            <LinkBtn to={lessonPath(first)} variant="primary" go>
              Start reading
            </LinkBtn>
            <LinkBtn to="/glossary">Browse the glossary</LinkBtn>
          </div>
        </div>
      </section>
    </div>
  );
}
