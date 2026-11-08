import { useRef, useState, type ReactNode } from 'react';
import type { ModuleContent } from '../../content';
import { challengeHref } from '../../content';
import { t } from '../../core/assets';
import { BADGE_QUIZ_MIN } from '../../core/gamification';
import { Link } from '../../router';
import { useGame } from '../../ui/hooks';
import { Verdict } from '../../ui/Verdict';

/** Five questions, scored together. Only an improvement over the best score earns XP. */
export function Quiz({ module }: { module: ModuleContent }): ReactNode {
  const game = useGame();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const answered = Object.keys(answers).length;
  const total = module.quiz.length;

  const submit = (): void => {
    const correct = module.quiz.filter((q) => answers[q.id] === q.answer);
    setScore(correct.length);
    game({
      type: 'QUIZ_SUBMITTED',
      module: module.id,
      score: correct.length,
      correctLessons: correct.map((q) => q.lesson),
    });
    requestAnimationFrame(() => resultRef.current?.focus());
  };

  return (
    <section className="quiz" aria-labelledby="quiz-h">
      <h2 id="quiz-h" className="lesson-title sr-only">
        {t('quiz.title')}
      </h2>

      {score !== null && (
        <Verdict
          innerRef={resultRef}
          passed={score >= BADGE_QUIZ_MIN}
          score={score}
          total={total}
          note={score >= BADGE_QUIZ_MIN ? t('quiz.passed') : t('quiz.retry')}
          actions={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setAnswers({});
                  setScore(null);
                }}
              >
                {t('quiz.retake')}
              </button>
              <Link to={challengeHref(module.id)} className="btn">
                {t('quiz.toChallenge')}
              </Link>
            </>
          }
        />
      )}

      <ol className="quiz-list">
        {module.quiz.map((q) => {
          const chosen = answers[q.id];
          const marked = score !== null;
          return (
            <li key={q.id}>
              <fieldset className="check" disabled={marked}>
                <legend className="check-prompt">{q.prompt}</legend>
                <div className="options" role="radiogroup" aria-label={q.prompt}>
                  {q.options.map((option, i) => (
                    <label
                      key={option}
                      className="option"
                      data-chosen={chosen === i}
                      data-right={marked && i === q.answer}
                      data-wrong={marked && chosen === i && i !== q.answer}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={chosen === i}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                {marked && (
                  <p className="feedback" data-result={chosen === q.answer ? 'right' : 'wrong'}>
                    <strong>
                      {chosen === q.answer
                        ? t('lesson.correct')
                        : t('quiz.answerWas', { answer: q.options[q.answer]! })}
                    </strong>{' '}
                    {q.explain}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>

      {score === null && (
        <div className="check-actions">
          <button type="button" className="btn" disabled={answered < total} onClick={submit}>
            {t('quiz.submit')}
          </button>
          <p className="muted" aria-live="polite">
            {t('quiz.progress', { n: answered, total })}
          </p>
        </div>
      )}
    </section>
  );
}
