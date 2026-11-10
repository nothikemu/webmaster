import { useMemo, useState } from 'react';
import { CERT_PASS, CERT_QUESTIONS } from '@/content/certification';
import { LESSONS, PATHS } from '@/content/paths';
import { MENTORS } from '@/content/cast';
import { overallProgress } from '@/engine/progress';
import { dispatch, useProgress } from '@/engine/store';
import { rng } from '@/widgets/logic/random';
import { Quiz } from '@/widgets/Quiz';
import { Btn, Callout, LinkBtn, PageHead, Panel } from '@/ui/primitives';
import { MentorCard } from '@/art/PageScenes';
import { CertSeal, CornerFlourish, Signature } from '@/art/Certificate';
import { Logo } from '@/ui/Shell';
import type { PathId } from '@/content/types';

type Phase = 'intro' | 'exam' | 'result';

export default function Certification() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [attempt, setAttempt] = useState(0);
  const [score, setScore] = useState(0);
  const [byPath, setByPath] = useState<Record<PathId, number>>({ understand: 0, use: 0, responsible: 0 });
  const cert = useProgress((s) => s.challenges['certification']);
  const name = useProgress((s) => s.settings.name);
  const lessonsDone = useProgress((s) => overallProgress(s).done);

  const order = useMemo(() => {
    const r = rng(Date.now() + attempt);
    const a = [...CERT_QUESTIONS];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const start = () => {
    setByPath({ understand: 0, use: 0, responsible: 0 });
    setAttempt((a) => a + 1);
    setPhase('exam');
  };

  const passed = score >= CERT_PASS;

  return (
    <div className="wrap page cert">
      {phase === 'intro' ? (
        <>
          <header className="cert-head">
            <h1>Final certification</h1>
            <p className="page-head__lead">The three keepers of the harbor each ask eight questions. Answer {CERT_PASS} percent of the twenty-four correctly and the seal is yours. Retake it as often as you like.</p>
          </header>
          <ul className="triptych">
            {PATHS.map((p) => (
              <li key={p.id} data-path={p.id} className={`triptych__card triptych__card--${p.number}`}>
                <MentorCard who={p.id} className="triptych__art" />
                <p className="triptych__name">
                  <strong>{MENTORS[p.id].name}</strong> <span>{MENTORS[p.id].trade}</span>
                </p>
                <p className="triptych__asks">{MENTORS[p.id].asks}</p>
              </li>
            ))}
          </ul>
          <Panel lift className="cert-brief">
            <h2>What to expect</h2>
            <ul>
              <li>Each question shows the reason for the answer straight after you check it.</li>
              <li>None of the questions repeat a lesson check, so this tests whether you can apply the ideas.</li>
              <li>Passing earns 300 XP, the AI Literacy Master badge and a printable certificate.</li>
            </ul>
            {lessonsDone < LESSONS.length ? <p className="small">You have finished {lessonsDone} of {LESSONS.length} lessons. You can sit the certification at any time, but it is built on all fifteen.</p> : null}
            {cert?.passed ? <Callout icon="check" tone="good"><p>You have already passed. Your best score is {cert.best}. You can still retake it for practice. It will not pay XP twice.</p></Callout> : cert ? <p>Your best score so far is <strong>{cert.best}</strong> over {cert.plays} {cert.plays === 1 ? 'try' : 'tries'}.</p> : null}
            <div className="row">
              <Btn variant="primary" go onClick={start}>Start the certification</Btn>
              <LinkBtn to="/learn" variant="quiet">Review the lessons first</LinkBtn>
            </div>
          </Panel>
        </>
      ) : null}

      {phase === 'exam' ? (
        <>
          <PageHead title="Certification" lead={`Attempt ${attempt}. Twenty-four questions, no time limit.`} />
          <Panel className="bench" lift>
            <Quiz
              key={attempt}
              questions={order.map((o) => o.q)}
              label="Certification"
              doneLabel="See my result"
              onAnswer={(i, ok) => {
                if (ok) setByPath((b) => ({ ...b, [order[i]!.path]: b[order[i]!.path] + 1 }));
              }}
              onDone={(correct) => {
                const pct = Math.round((correct / order.length) * 100);
                setScore(pct);
                dispatch({ type: 'certification', score: pct, passMark: CERT_PASS });
                setPhase('result');
              }}
            />
          </Panel>
        </>
      ) : null}

      {phase === 'result' ? (
        <>
          <PageHead title={passed ? 'You passed' : 'Not yet'} lead={`You scored ${score} percent. The pass mark is ${CERT_PASS}.`} />
          <div className="stack">
            <Panel>
              <h2>By path</h2>
              <ul className="result-paths">
                {PATHS.map((p) => (
                  <li key={p.id}>{p.title}: <strong>{byPath[p.id]} of 8</strong></li>
                ))}
              </ul>
              {!passed ? <p>Review the path with the lowest score, then try again. Each question you got wrong already showed you the reason.</p> : null}
              <div className="row">
                <Btn variant={passed ? 'quiet' : 'primary'} icon="reset" onClick={start}>Retake</Btn>
                <LinkBtn to="/learn" variant="quiet">Back to the lessons</LinkBtn>
              </div>
            </Panel>
            {passed ? (
              <>
                <div className="field no-print">
                  <label htmlFor="cert-n">Name on your certificate</label>
                  <input id="cert-n" className="input" value={name} maxLength={60} autoComplete="off" onChange={(e) => dispatch({ type: 'settings', patch: { name: e.target.value } })} />
                  <span className="field__hint">Kept on this device only.</span>
                </div>
                <div className="certificate" role="group" aria-label="Certificate">
                  <CornerFlourish className="certificate__corner certificate__corner--tl" />
                  <CornerFlourish className="certificate__corner certificate__corner--tr" />
                  <CornerFlourish className="certificate__corner certificate__corner--bl" />
                  <CornerFlourish className="certificate__corner certificate__corner--br" />
                  <Logo />
                  <p className="certificate__kind">Certificate of AI literacy</p>
                  <p className="certificate__lead">This certifies that</p>
                  <p className="certificate__name">{name.trim() || 'Learner'}</p>
                  <p>
                    passed the Tideweight final certification, twenty-four questions across Understand AI, Use AI and Use AI Responsibly, with <strong>{score} percent</strong>, having finished {lessonsDone} of {LESSONS.length} lessons.
                  </p>
                  <div className="certificate__foot">
                    <ul className="certificate__signs">
                      {PATHS.map((p) => (
                        <li key={p.id}>
                          <Signature name={MENTORS[p.id].name} className="certificate__sig" />
                          <strong>{MENTORS[p.id].name}</strong>
                          <span>{p.place}</span>
                        </li>
                      ))}
                    </ul>
                    <CertSeal score={score} className="certificate__seal" />
                  </div>
                  <p className="small">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}. A certificate of completion from a learning portal. The keepers who sign it are characters, and it is not an official credential.</p>
                </div>
                <div className="row no-print">
                  <Btn variant="primary" icon="download" onClick={() => window.print()}>Print or save as PDF</Btn>
                </div>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
