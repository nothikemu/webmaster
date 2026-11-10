import { useEffect, useMemo, useRef, useState } from 'react';
import { dispatch, useProgress } from '@/engine/store';
import { Callout, Panel } from '@/ui/primitives';
import { Icon } from '@/art/Icons';
import { LabFrieze } from '@/art/PageScenes';

type Tier = 'low' | 'mid' | 'high';
interface Task {
  id: string;
  title: string;
  brief: string;
  weak: string;
  out: Record<Tier, string>;
}

/**
 * The Lab is a demonstration, not a connected AI. For each task there are three pre-written sample responses,
 * and the one shown depends on how many parts of your prompt are filled in. That is a deliberate simplification:
 * it shows the pattern (more context in, more useful answer out) without pretending to be a live model.
 */
const TASKS: Task[] = [
  {
    id: 'study',
    title: 'Study guide',
    brief: 'Tomorrow you have a 9th-grade biology quiz on photosynthesis. You want a study guide.',
    weak: 'Help me with photosynthesis.',
    out: {
      low: 'Photosynthesis is the process by which plants make food. It involves sunlight, water, carbon dioxide and chlorophyll. It is very important for life on Earth and happens in the chloroplasts of plant cells. There are many details to learn about photosynthesis and it is a big topic in biology.',
      mid: 'Photosynthesis study guide: (1) Plants turn light energy into chemical energy. (2) The light reactions happen in the thylakoids and make ATP and NADPH. (3) The Calvin cycle uses them to build sugar from carbon dioxide. Remember: inputs are light, water and CO2; outputs are glucose and oxygen.',
      high: 'Study guide: Photosynthesis (about 250 words)\n\nPart 1. Light reactions (thylakoids): light energy makes ATP and NADPH and releases oxygen. Quick check: where does the oxygen come from?\n\nPart 2. Calvin cycle (stroma), the part you said confuses you: think of it as a factory that uses the ATP and NADPH to turn CO2 into sugar, going around in a loop. Quick check: what two products from Part 1 does it need?\n\nPart 3. What plants need: light, water, CO2. Quick check: what happens if a plant gets no light?\n\nNote: I may be missing details your teacher emphasizes. Compare this with your notes.',
    },
  },
  {
    id: 'email',
    title: 'Email to a teacher',
    brief: 'You were sick and need two extra days on a lab report. You want a polite, honest email.',
    weak: 'Write an email to my teacher.',
    out: {
      low: 'Dear Teacher, I hope this email finds you well. I am writing to ask about something. Please let me know if you have any questions. Thank you for your time and consideration. Sincerely, Student.',
      mid: 'Dear Ms. Rivera, I was sick this week and I am behind on my lab report. Could I please have more time to finish it? Thank you for understanding. Sincerely, Alex.',
      high: 'Subject: Request for a two-day extension on the lab report\n\nDear Ms. Rivera,\n\nI was home sick with the flu on Monday and Tuesday and missed the class time I needed to finish my lab report on enzyme activity. Would it be possible to submit it by Friday instead of Wednesday? I can bring a note from home, and I will have the data tables ready to show you on Thursday.\n\nThank you for considering this.\n\nAlex Kim, Period 3',
    },
  },
  {
    id: 'code',
    title: 'Fix a loop',
    brief: 'Your Python program never stops. The code is:  i = 0 / while i < 5: / print(i)',
    weak: 'Fix my code.',
    out: {
      low: 'I would need to see your code to help. In general, programs that never stop usually have a loop whose condition never becomes false. Check your loops and conditions carefully.',
      mid: 'Your while loop likely never ends because the condition stays true. Make sure the variable in the condition changes inside the loop, for example by increasing it.',
      high: 'The loop never ends because `i` never changes. `while i < 5` checks the condition every time, but nothing inside the loop updates `i`, so it stays 0 and the condition stays true.\n\nFix: add `i += 1` as the last line inside the loop. Try tracing it by hand: i is 0, then 1, 2, 3, 4, then the loop stops at 5.\n\nTry it, and tell me what the output is, so we can check you understand why.',
    },
  },
];

const PARTS = [
  { key: 'task', label: 'Task', hint: 'What should it make?' },
  { key: 'context', label: 'Context', hint: 'What does it need to know that it cannot guess?' },
  { key: 'audience', label: 'Audience or role', hint: 'Who is it for, or how should it sound?' },
  { key: 'format', label: 'Format', hint: 'What shape should the answer take?' },
  { key: 'limits', label: 'Limits', hint: 'Length, rules, or what to avoid. Anything you can check.' },
] as const;
type Key = (typeof PARTS)[number]['key'];

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function Lab() {
  const [taskId, setTaskId] = useState(TASKS[0]!.id);
  const [vals, setVals] = useState<Record<Key, string>>({ task: '', context: '', audience: '', format: '', limits: '' });
  const task = TASKS.find((t) => t.id === taskId)!;
  const passed = useProgress((s) => s.challenges['lab-refine']?.passed === true);
  const filled = PARTS.filter((p) => words(vals[p.key]) >= 3).length;
  const tier: Tier = filled >= 4 ? 'high' : filled >= 2 ? 'mid' : 'low';
  const prompt = useMemo(() => PARTS.map((p) => vals[p.key].trim()).filter(Boolean).join(' '), [vals]);
  const awarded = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (tier === 'high' && !awarded.current.has(taskId)) {
      awarded.current.add(taskId);
      dispatch({ type: 'challenge', id: 'lab-refine', score: 100, passMark: 100, xp: 60, label: 'Prompt Lab: wrote a strong prompt' });
    }
  }, [tier, taskId]);

  return (
    <div data-path="use">
      <header className="frieze">
        <LabFrieze className="frieze__art" />
        <div className="wrap">
          <Panel lift className="frieze__sign">
            <h1>Prompt Lab</h1>
            <p className="page-head__lead">Fill in the five parts of a prompt and watch the sample answer change.</p>
            <p className="fact">
              <Icon name="info" />
              <span>A demonstration with pre-written responses, not a connected AI. Nothing you type is saved or sent.</span>
            </p>
          </Panel>
        </div>
      </header>
      <div className="wrap page page--after-head">
      <div className="lab-tasks">
        <p className="label" id="lab-pick">Choose a job</p>
        <div className="tabs" role="group" aria-labelledby="lab-pick">
          {TASKS.map((t) => (
            <button key={t.id} type="button" className="key" aria-pressed={t.id === taskId} onClick={() => { setTaskId(t.id); setVals({ task: '', context: '', audience: '', format: '', limits: '' }); }}>
              {t.title}
            </button>
          ))}
        </div>
      </div>
      <Callout icon="target"><p><strong>The job:</strong> {task.brief}</p></Callout>
      <div className="lab-grid">
        <Panel lift className="lab-form">
          <h2>Build your prompt</h2>
          {PARTS.map((p) => (
            <div className="field" key={p.key}>
              <label htmlFor={`lab-${p.key}`}>{p.label} {words(vals[p.key]) >= 3 ? <Icon name="check" title="filled in" /> : null}</label>
              <span className="field__hint" id={`lab-${p.key}-h`}>{p.hint}</span>
              <textarea id={`lab-${p.key}`} aria-describedby={`lab-${p.key}-h`} className="textarea textarea--sm" rows={2} value={vals[p.key]} onChange={(e) => setVals((v) => ({ ...v, [p.key]: e.target.value }))} />
            </div>
          ))}
          <p className="small">A part counts once it has at least three words. Do not type private details. Nothing here is saved or sent.</p>
        </Panel>
        <div className="lab-out">
          <ol className="parts" aria-label={`Parts of your prompt filled in: ${filled} of 5`}>
            {PARTS.map((p) => {
              const on = words(vals[p.key]) >= 3;
              return (
                <li key={p.key} className={on ? 'is-on' : ''} data-part={p.key}>
                  <span className="parts__mark" aria-hidden="true">{on ? <Icon name="check" /> : null}</span>
                  {p.label === 'Audience or role' ? 'Audience' : p.label}
                  <span className="visually-hidden">{on ? ', filled in' : ', empty'}</span>
                </li>
              );
            })}
          </ol>
          <div className="lab-compare">
            <Panel tone="shade">
              <p className="label">A typical first prompt</p>
              <p className="prompt-sheet__text">{task.weak}</p>
              <p className="label">Sample response</p>
              <p className="response">{task.out.low}</p>
            </Panel>
            <Panel hue>
              <p className="label">Your prompt: {filled} of 5 parts</p>
              <p className="prompt-sheet__text">{prompt || 'Your prompt appears here as you type.'}</p>
              <p className="label">Sample response</p>
              <p className="response" aria-live="polite">{task.out[tier]}</p>
            </Panel>
          </div>
          <Callout icon="warning"><p>Demonstration only. A real AI would write something different each time and could still be wrong. Always check the result against your own notes and sources.</p></Callout>
          {passed || tier === 'high' ? (
            <Callout icon="check" tone="good"><p><strong>Strong prompt.</strong> You gave it a task, context, an audience, a format and limits. That clears the Lab challenge, which counts toward the Prompt Smith badge.</p></Callout>
          ) : (
            <Callout icon="info"><p>Fill in at least four parts to see the strongest sample response and clear the Lab challenge.</p></Callout>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
