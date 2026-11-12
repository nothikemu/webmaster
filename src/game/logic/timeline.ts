/**
 * The Timeline of Minds: seven milestones to put in order. After each guess the Archive says how many cards are in the right place,
 * which is all the information a player gets, like a code-breaking game.
 */
export interface Milestone {
  id: string;
  year: number;
  title: string;
  /** Shown on the card. Never contains the year. */
  clue: string;
  /** Shown once the card is placed correctly. */
  lesson: string;
}

export const MILESTONES: readonly Milestone[] = [
  { id: 'turing', year: 1950, title: 'The imitation game', clue: 'A mathematician asks whether a machine could be said to think, and proposes a test based on conversation.', lesson: 'Alan Turing published "Computing Machinery and Intelligence", which replaced a vague question (can machines think?) with a testable one.' },
  { id: 'dartmouth', year: 1956, title: 'The summer workshop', clue: 'A group of researchers meet at a college in New Hampshire, and the field gets its name.', lesson: 'The Dartmouth workshop is where "artificial intelligence" became the name of a research field.' },
  { id: 'eliza', year: 1966, title: 'A program that listens', clue: 'A chat program at MIT turns your sentences into questions, and some people confide in it anyway.', lesson: 'Joseph Weizenbaum’s ELIZA used simple pattern matching. People over-read it, an effect that has never gone away.' },
  { id: 'deepblue', year: 1997, title: 'Chess falls', clue: 'A purpose-built computer defeats the reigning world chess champion in a match.', lesson: 'IBM’s Deep Blue beat Garry Kasparov mostly by searching enormous numbers of moves, not by learning.' },
  { id: 'alexnet', year: 2012, title: 'Deep learning wins', clue: 'A neural network trained on graphics chips wins an image-recognition contest by a wide margin.', lesson: 'AlexNet won the ImageNet challenge by a large margin, and deep neural networks became the main approach to AI.' },
  { id: 'transformer', year: 2017, title: 'Attention', clue: 'Researchers publish a new network design for language that reads whole passages at once.', lesson: 'The transformer ("Attention Is All You Need") is the design behind today’s large language models.' },
  { id: 'chatgpt', year: 2022, title: 'Chat for everyone', clue: 'A chat assistant built on a large language model is released free to the public and spreads within weeks.', lesson: 'ChatGPT, released in November 2022, put a large language model in everyone’s browser.' },
];

export const CORRECT_ORDER: readonly string[] = [...MILESTONES].sort((a, b) => a.year - b.year).map((m) => m.id);

/** A fixed shuffle that is never already in order, so every player starts from the same puzzle. */
export const START_ORDER: readonly string[] = ['chatgpt', 'eliza', 'alexnet', 'turing', 'transformer', 'dartmouth', 'deepblue'];

export function placed(order: readonly string[]): boolean[] {
  return order.map((id, i) => id === CORRECT_ORDER[i]);
}
export const correctCount = (order: readonly string[]): number => placed(order).filter(Boolean).length;
export const isSolved = (order: readonly string[]): boolean => order.length === CORRECT_ORDER.length && correctCount(order) === CORRECT_ORDER.length;

/** Stars for the number of guesses used (a guess is pressing Check). */
export const starsFor = (guesses: number): 1 | 2 | 3 => (guesses <= 4 ? 3 : guesses <= 8 ? 2 : 1);

export function move(order: readonly string[], from: number, to: number): string[] {
  const next = [...order];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x!);
  return next;
}
