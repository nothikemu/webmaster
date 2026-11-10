/**
 * Myth or fact: one quick statement on the home page each day.
 * Every item links to the lesson that explains it. No XP is paid for these: they are an invitation, not a score.
 */
export interface Myth {
  id: string;
  statement: string;
  /** true when the statement is correct. */
  fact: boolean;
  why: string;
  /** The lesson that covers it. */
  lesson: string;
}

export const MYTHS: readonly Myth[] = [
  { id: 'm-lookup', statement: 'A chatbot looks up its answers in a database of facts.', fact: false, why: 'A language model builds its answer one token at a time from patterns in the text it was trained on. Unless a search tool is switched on, nothing is being looked up, which is why it can sound sure and still be wrong.', lesson: 'u4' },
  { id: 'm-bias', statement: 'A model can be unfair even if nobody programmed it to be.', fact: true, why: 'Models learn from examples. If the examples leave people out or repeat an old unfairness, the model learns that too.', lesson: 'r1' },
  { id: 'm-cite', statement: 'If an AI gives you a citation, the source exists.', fact: false, why: 'Models can produce citations that look perfect and point to nothing. Find the source yourself before you use it.', lesson: 't4' },
  { id: 'm-overfit', statement: 'A model that scores 99 percent on its training examples can still do badly on new ones.', fact: true, why: 'That is overfitting: memorizing the examples instead of learning the pattern. Only a test on examples it has never seen will show it.', lesson: 'u2' },
  { id: 'm-twice', statement: 'Asking the same question twice can give two different answers.', fact: true, why: 'Most chat tools choose each next token with a little randomness, so the wording, and sometimes the content, changes from one try to the next.', lesson: 'u4' },
  { id: 'm-detector', statement: 'An AI detector can prove that a student used AI.', fact: false, why: 'A detector gives a guess, not proof, and detectors do flag writing that people wrote themselves. A flag is a reason for a person to look closer. It is never a verdict.', lesson: 'r5' },
  { id: 'm-stored', statement: 'What you type into a chat tool may be stored by the company that runs it.', fact: true, why: 'Many tools keep conversations, and some use them to improve their models unless you change a setting. Check before you paste anything personal.', lesson: 'r4' },
  { id: 'm-brain', statement: 'A neural network works the way a human brain does.', fact: false, why: 'It borrows one loose idea from the brain. In practice it is layers of simple arithmetic: weighted sums passed through small functions.', lesson: 'u3' },
  { id: 'm-long', statement: 'A longer prompt is always a better prompt.', fact: false, why: 'Specific beats long. A short prompt with a clear task, context, audience, format and limits does better than a long vague one.', lesson: 't2' },
  { id: 'm-window', statement: 'A model can only take in a limited amount of text at once.', fact: true, why: 'That limit is the context window, counted in tokens. In a very long chat the earliest parts can fall outside it.', lesson: 'u5' },
  { id: 'm-blame', statement: 'If AI helped with your assignment, its mistakes are the tool\'s responsibility.', fact: false, why: 'You chose to hand the work in, so you answer for it. That is why you check it, and why you say what the tool did.', lesson: 'r5' },
  { id: 'm-photo', statement: 'A realistic photo or voice clip is good evidence that something happened.', fact: false, why: 'Convincing images, audio and video can be made or altered with AI. Look for where it came from and whether reliable sources confirm it.', lesson: 'r3' },
];

/** The statement for a given day. The same day always gives the same one, so it is a daily card rather than a slot machine. */
export function mythForDay(now: number, offset = 0): Myth {
  const day = Math.floor(now / 86_400_000);
  return MYTHS[(((day + offset) % MYTHS.length) + MYTHS.length) % MYTHS.length]!;
}
