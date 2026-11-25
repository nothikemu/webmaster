import { useRef, useState } from 'react';
import { Link } from '@/router';
import { MODULES, coreLessons, furtherLessons, lessonById, lessonPath } from '@/content/modules';
import { eraseAll, importLearning, getState, storageInfo, useLearning } from '@/learning/store';
import { exportJson } from '@/learning/persistence';
import { hasAnyData, moduleProgress, statusOf, suggestNext } from '@/learning/state';
import { Btn, Callout, GoLink, LinkBtn, Status } from '@/ui/primitives';

/** A calm summary of which lessons have been opened or marked complete on this device. It grades nothing and ranks nothing. */
export default function Overview() {
  const learner = useLearning((s) => s);
  const info = storageInfo();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const last = learner.last ? lessonById(learner.last) : undefined;
  const next = suggestNext(learner);
  const any = hasAnyData(learner);

  const download = () => {
    const blob = new Blob([exportJson(getState())], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `parameter-learning-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMessage({ tone: 'good', text: 'Your file has been downloaded. It lists only which lessons you opened or completed.' });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const r = importLearning(await file.text());
    setMessage(r.ok ? { tone: 'good', text: `Imported. ${r.carried} completed ${r.carried === 1 ? 'lesson was' : 'lessons were'} restored.` } : { tone: 'bad', text: r.reason });
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <div className="wrap page overview">
      <header className="page-head">
        <p className="kicker">Your overview</p>
        <h1>
          Where you have <em>been</em>
        </h1>
        <p className="page-head__lead">
          A quiet record of the lessons you have opened or marked complete on this device. It does not grade, rank or reward anything, and no lesson depends on it.
        </p>
      </header>

      {info.loadStatus === 'migrated' ? (
        <Callout icon="info">
          <p>
            This overview carries over {info.carried} finished {info.carried === 1 ? 'lesson' : 'lessons'} from an earlier version of Parameter. Points, levels and badges no longer exist. Your earlier save is still stored in this browser, untouched, until you choose to erase it below.
          </p>
        </Callout>
      ) : null}
      {!info.persistent ? (
        <Callout icon="warning">
          <p>This browser is not letting the site save anything, so this overview will be empty again next time. Downloading your data below still works.</p>
        </Callout>
      ) : null}

      <section aria-labelledby="place-h" className="overview__place">
        <h2 id="place-h">Your place</h2>
        {!any ? (
          <>
            <p className="reading">You have not opened a lesson on this device yet. A good first one is the opening lesson of Foundations.</p>
            <LinkBtn to={lessonPath(coreLessons(MODULES[0]!)[0]!)} variant="primary" go>
              Begin with lesson 1
            </LinkBtn>
          </>
        ) : (
          <div className="place-grid">
            {last ? (
              <div>
                <p className="label">Last opened</p>
                <p className="place__title">
                  <Link to={lessonPath(last)}>{last.title}</Link>
                </p>
              </div>
            ) : null}
            {next ? (
              <div>
                <p className="label">A lesson you have not finished</p>
                <p className="place__title">
                  <Link to={lessonPath(next)}>{next.title}</Link>
                </p>
              </div>
            ) : (
              <div>
                <p className="label">All five core lessons in every module are marked complete</p>
                <p className="place__title">
                  <GoLink to="/modules">Look at the go-further lessons</GoLink>
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="mods-h" className="overview__mods">
        <h2 id="mods-h">By module</h2>
        <div className="overview__cols">
          {MODULES.map((m) => {
            const p = moduleProgress(learner, m);
            return (
              <article key={m.id} className={`ov-mod hue-${m.id}`} aria-labelledby={`ov-${m.id}`}>
                <p className="kicker">
                  <span className="num">{String(m.number).padStart(2, '0')}</span>
                </p>
                <h3 id={`ov-${m.id}`}>
                  <Link to={`/modules/${m.id}`}>{m.title}</Link>
                </h3>
                <p className="ov-mod__count">
                  <span className="num">
                    {p.coreDone} of {p.coreTotal}
                  </span>{' '}
                  core lessons complete
                </p>
                <ol className="ov-mod__list">
                  {coreLessons(m).map((l) => (
                    <li key={l.id}>
                      <Link to={lessonPath(l)}>{l.title}</Link>
                      <Status status={statusOf(learner, l.id)} />
                    </li>
                  ))}
                </ol>
                {furtherLessons(m).length ? (
                  <p className="small">
                    Go further: {p.furtherDone} of {p.furtherTotal} complete.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="data-h" className="overview__data">
        <h2 id="data-h">Your data on this device</h2>
        <p className="reading">
          Parameter has no accounts and no server. The only thing it stores is which lessons you opened and which you marked complete, kept in this browser. You can take a copy, load a copy, or erase it.
        </p>
        <div className="row">
          <Btn icon="download" onClick={download}>
            Download my data
          </Btn>
          <Btn icon="upload" onClick={() => fileInput.current?.click()}>
            Load a saved file
          </Btn>
          <input ref={fileInput} type="file" accept="application/json,.json" className="visually-hidden" tabIndex={-1} aria-label="Choose a saved Parameter file" onChange={(e) => void upload(e.target.files?.[0])} />
        </div>
        {message ? (
          <div role="status">
            <Callout icon={message.tone === 'good' ? 'check' : 'warning'} tone={message.tone}>
              <p>{message.text}</p>
            </Callout>
          </div>
        ) : null}
        <div className="erase">
          {!confirming ? (
            <Btn variant="quiet" icon="reset" onClick={() => setConfirming(true)}>
              Erase everything stored here
            </Btn>
          ) : (
            <div className="callout callout--bad" role="alertdialog" aria-labelledby="erase-h" aria-describedby="erase-d">
              <div>
                <p id="erase-h">
                  <strong>Erase what this site has saved in this browser?</strong>
                </p>
                <p id="erase-d">This removes your list of opened and completed lessons, and any earlier Parameter save, from this browser. It cannot be undone, but you can download a copy first.</p>
                <div className="row">
                  <Btn
                    variant="primary"
                    onClick={() => {
                      eraseAll();
                      setConfirming(false);
                      setMessage({ tone: 'good', text: 'Everything stored in this browser has been erased.' });
                    }}
                  >
                    Yes, erase it
                  </Btn>
                  <Btn variant="quiet" onClick={() => setConfirming(false)}>
                    Keep it
                  </Btn>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
