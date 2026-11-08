import { useMemo, useState } from 'react';
import { CERT_PASS, CERT_QUESTIONS } from '@/content/certification';
import { PATHS } from '@/content/paths';
import { dispatch, useProgress } from '@/engine/store';
import { rng } from '@/widgets/logic/random';
import { Quiz } from '@/widgets/Quiz';
import { Btn, Callout, LinkBtn, PageHead, Panel } from '@/ui/primitives';
import { Kernel } from '@/art/Kernel';
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
    <div className="wrap page">
      {phase === 'intro' ? (
        <>
          <PageHead title="Final certification" kicker="Optional" lead={`Twenty-four questions across all three paths, eight from each. You need ${CERT_PASS} percent to pass, and you can retake it as often as you like.`} />
          <div className="cert-intro">
            <Panel lift>
              <h2>What to expect</h2>
              <ul>
                <li>Each question shows the reason for the answer straight after you check it.</li>
                <li>None of the questions repeat a lesson check, so this tests whether you can apply the ideas.</li>
                <li>Passing earns 300 XP, the AI Literacy Master badge and a printable certificate of completion.</li>
              </ul>
              {cert?.passed ? <Callout icon="check" tone="good"><p>You have already passed. Your best score is {cert.best}. You can still retake it for practice. It will not pay XP twice.</p></Callout> : cert ? <p>Your best score so far is <strong>{cert.best}</strong> over {cert.plays} {cert.plays === 1 ? 'try' : 'tries'}.</p> : null}
              <div className="row">
                <Btn variant="primary" go onClick={start}>Start the certification</Btn>
                <LinkBtn to="/learn" variant="quiet">Review the lessons first</LinkBtn>
              </div>
            </Panel>
            <Kernel mood="think" className="cert-intro__kernel" />
          </div>
        </>
      ) : null}

      {phase === 'exam' ? (
        <>
          <PageHead title="Certification" kicker={`Attempt ${attempt}`} />
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
          <PageHead title={passed ? 'You passed' : 'Not yet'} kicker="Result" lead={`You scored ${score} percent. The pass mark is ${CERT_PASS}.`} />
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
                <div className="certificate" role="group" aria-label="Certificate of completion">
                  <Logo />
                  <p className="label">Certificate of completion</p>
                  <p className="certificate__name">{name.trim() || 'Learner'}</p>
                  <p>completed the Tideweight AI literacy course across three paths (Understand AI, Use AI, and Use AI Responsibly) and passed the final certification with <strong>{score} percent</strong>.</p>
                  <p className="small">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}. This is a certificate of completion from a learning portal. It is not an official credential.</p>
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
