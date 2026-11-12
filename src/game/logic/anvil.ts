/**
 * The Anvil Orders. A client brings a job, the player assembles a prompt from pieces, and a fixed-rule "forge" shows what each piece did.
 * Nothing here calls a model. The forge is a deterministic simulation of how prompt parts change a result, and the screen says so.
 */
export type Tag = 'task' | 'context' | 'audience' | 'format' | 'limits';
export const TAG_LABEL: Record<Tag, string> = { task: 'Task', context: 'Context', audience: 'Audience', format: 'Format', limits: 'Limits' };

export interface Piece {
  id: string;
  text: string;
  /** Which part of a prompt this is, or filler that adds nothing. */
  tag: Tag | 'filler';
  /** Whether it suits THIS order. A format piece can be well formed and still wrong for the job. */
  fits: boolean;
  /** True if sending it would hand private information to the tool. */
  leaks?: boolean;
  /** Shown in the review after the forge runs. */
  why: string;
}

export interface Order {
  round: 1 | 2 | 3;
  client: string;
  title: string;
  brief: string;
  needs: Tag[];
  pieces: Piece[];
  /** What the forged result looks like when a need is met or missed. */
  forge: Record<Tag, { met: string; missed: string }>;
  leakNote: string;
}

export const CAP = 6;

const GENERIC: Record<Tag, { met: string; missed: string }> = {
  task: { met: 'The result does the job that was asked.', missed: 'The result wanders: nothing says clearly what job to do.' },
  context: { met: 'The result uses the details it was given.', missed: 'The result is generic, because the tool was never told the details.' },
  audience: { met: 'The result is pitched at the right reader.', missed: 'The result is pitched at nobody in particular.' },
  format: { met: 'The result comes in the shape that was wanted.', missed: 'The result arrives as an unstructured block.' },
  limits: { met: 'The result stays inside the limits.', missed: 'The result runs on past what was wanted.' },
};

export const ORDERS: readonly Order[] = [
  {
    round: 1,
    client: 'Marisol, grade 9',
    title: 'The Friday test',
    brief: 'I have a biology test on photosynthesis on Friday and I only know the word. I need to study it from scratch, and I learn best when I can test myself.',
    needs: ['task', 'audience', 'format'],
    forge: {
      ...GENERIC,
      task: { met: 'The result is about photosynthesis, step by step.', missed: 'The result is about plants in general, not the test topic.' },
      audience: { met: 'The result is written for a ninth grader meeting the topic for the first time.', missed: 'The result is pitched at the wrong level, so Marisol cannot use it.' },
      format: { met: 'The result is five short steps followed by three practice questions, with answers at the end.', missed: 'The result is a long block of text with nothing to practice on.' },
    },
    leakNote: '',
    pieces: [
      { id: 'o1-t1', tag: 'task', fits: true, text: 'Explain photosynthesis step by step.', why: 'A clear task, on the right topic.' },
      { id: 'o1-t2', tag: 'task', fits: false, text: 'Tell me about plants.', why: 'Too broad. It could produce anything from a poem to a seed catalog.' },
      { id: 'o1-a1', tag: 'audience', fits: true, text: 'Explain it for a ninth grader who has not studied it before.', why: 'Names the reader and their starting point.' },
      { id: 'o1-a2', tag: 'audience', fits: false, text: 'Explain it as you would to a university biochemist.', why: 'The wrong reader. The answer would be accurate and useless to Marisol.' },
      { id: 'o1-f1', tag: 'format', fits: true, text: 'Give me five short steps, then three practice questions with the answers at the end.', why: 'Asks for a shape she can study from and test herself with.' },
      { id: 'o1-f2', tag: 'format', fits: false, text: 'Write a long essay with as much detail as possible.', why: 'A wall of text is hard to study from, and she wanted to test herself.' },
      { id: 'o1-c1', tag: 'context', fits: true, text: 'My teacher says to focus on what goes in and what comes out.', why: 'Useful background, but this job did not depend on it.' },
      { id: 'o1-l1', tag: 'limits', fits: true, text: 'Keep it under 250 words.', why: 'A sensible limit, though not required here.' },
      { id: 'o1-x1', tag: 'filler', fits: false, text: 'Please do a really good job.', why: 'Adds no direction. The tool cannot act on "good".' },
      { id: 'o1-x2', tag: 'filler', fits: false, text: 'Make it perfect.', why: 'Perfect is not an instruction. Say what you want it to be.' },
    ],
  },
  {
    round: 2,
    client: 'Devon, student council',
    title: 'The morning bulletin',
    brief: 'We need a short announcement for the morning bulletin about the club fair: Thursday, in the gym, 3 to 4 pm. Under 60 words, friendly, easy to read aloud, and it should ask people to bring a pen to sign up.',
    needs: ['task', 'context', 'format', 'limits'],
    forge: {
      ...GENERIC,
      task: { met: 'The result is an announcement for the morning bulletin.', missed: 'The result is not an announcement. It is something else entirely.' },
      context: { met: 'The result gives the day, the place, the time and the pen.', missed: 'The result says "soon, somewhere". It has no day, place or time.' },
      format: { met: 'The result is two or three plain sentences that read aloud easily.', missed: 'The result is in a shape nobody can read over a loudspeaker.' },
      limits: { met: 'The result is under 60 words and friendly.', missed: 'The result runs long, and the bulletin has no time for it.' },
    },
    leakNote: '',
    pieces: [
      { id: 'o2-t1', tag: 'task', fits: true, text: 'Write a morning bulletin announcement for a school club fair.', why: 'Names the job and where it will be used.' },
      { id: 'o2-t2', tag: 'task', fits: false, text: 'Write an advertisement for the school.', why: 'A different job, with a different purpose and length.' },
      { id: 'o2-c1', tag: 'context', fits: true, text: 'Details: the club fair is on Thursday in the gym from 3 to 4 pm. Students should bring a pen to sign up.', why: 'The tool cannot guess these details. Without them it would invent some.' },
      { id: 'o2-c2', tag: 'context', fits: false, text: 'Details: it is on some day soon, somewhere at school.', why: 'Vague on exactly the facts the announcement needs.' },
      { id: 'o2-a1', tag: 'audience', fits: true, text: 'The audience is students and teachers listening to the morning bulletin.', why: 'Good, though this order did not depend on it.' },
      { id: 'o2-f1', tag: 'format', fits: true, text: 'Format: two or three plain sentences that are easy to read aloud.', why: 'It will be spoken, so it has to be easy to say.' },
      { id: 'o2-f2', tag: 'format', fits: false, text: 'Format: a rhyming poem with six verses.', why: 'Wrong shape, and far too long for a bulletin.' },
      { id: 'o2-l1', tag: 'limits', fits: true, text: 'Limit: under 60 words, with a friendly tone.', why: 'Sets the length and the voice.' },
      { id: 'o2-l2', tag: 'limits', fits: false, text: 'Limit: as long as it needs to be.', why: 'Not a limit. The bulletin has a fixed slot.' },
      { id: 'o2-x1', tag: 'filler', fits: false, text: 'Make it catchy and awesome.', why: '"Catchy" and "awesome" do not tell the tool what to change.' },
    ],
  },
  {
    round: 3,
    client: 'Priya, history project',
    title: 'The interview notes',
    brief: 'My group interviewed a shopkeeper, Mr. Reyes, for a history project. He agreed to be quoted in our project only. My notes include his home address and phone number. I want a summary for our class presentation: about 150 words, neutral tone, one paragraph and a list of the three main themes. Nothing should be added that he did not say.',
    needs: ['task', 'context', 'audience', 'format', 'limits'],
    forge: {
      ...GENERIC,
      task: { met: 'The result is a summary of the interview.', missed: 'The result is not a summary of the interview.' },
      context: { met: 'The result works from the notes that were supplied, with the identifying details left out.', missed: 'The result has no notes to work from, so it invents an interview.' },
      audience: { met: 'The result is written for classmates and a teacher.', missed: 'The result has no reader in mind.' },
      format: { met: 'The result is one paragraph and a three-item list of themes.', missed: 'The result is a single unbroken block.' },
      limits: { met: 'The result is about 150 words, neutral, and adds nothing he did not say.', missed: 'The result drifts and decorates, and some of it was never said.' },
    },
    leakNote: 'The prompt sent a real person’s private details to a tool. He agreed to be quoted in a project, not to have his address sent to a service, and you cannot take it back.',
    pieces: [
      { id: 'o3-t1', tag: 'task', fits: true, text: 'Summarize the interview notes below for a class presentation.', why: 'Clear task with a clear destination.' },
      { id: 'o3-c1', tag: 'context', fits: true, leaks: true, text: 'Here are the full notes, including his name, home address and phone number: [paste]', why: 'It works, but it hands over a private address and number that were never needed.' },
      { id: 'o3-c2', tag: 'context', fits: true, text: 'Here are the notes, with his name, address and phone number removed and replaced by "the shopkeeper": [paste]', why: 'Gives the tool what it needs and keeps the private details with you.' },
      { id: 'o3-a1', tag: 'audience', fits: true, text: 'The audience is my classmates and my teacher.', why: 'Names the reader.' },
      { id: 'o3-a2', tag: 'audience', fits: true, leaks: true, text: 'Include my group members’ full names and our school’s name so it can personalize the summary.', why: 'Personalizing needs none of this, and it is other people’s information.' },
      { id: 'o3-f1', tag: 'format', fits: true, text: 'Format: one paragraph, then a list of the three main themes.', why: 'Matches the presentation.' },
      { id: 'o3-f2', tag: 'format', fits: false, text: 'Format: whatever works.', why: 'Leaves the shape to chance.' },
      { id: 'o3-l1', tag: 'limits', fits: true, text: 'Limit: about 150 words, neutral tone, and add nothing he did not say.', why: 'Sets length, tone, and the rule that protects accuracy.' },
      { id: 'o3-l2', tag: 'limits', fits: false, text: 'Limit: make it as exciting as possible and add details that make it more interesting.', why: 'Asks the tool to invent. In a summary of real notes, invented details become false claims about a real person.' },
      { id: 'o3-x1', tag: 'filler', fits: false, text: 'Be accurate.', why: 'A good wish, but it tells the tool nothing it can act on. "Add nothing he did not say" does.' },
    ],
  },
];

export interface Verdict {
  met: Tag[];
  missed: Tag[];
  leaks: Piece[];
  filler: Piece[];
  lines: { tag: Tag; ok: boolean; text: string }[];
  pass: boolean;
}

export function forge(order: Order, chosen: readonly string[]): Verdict {
  const picked = order.pieces.filter((p) => chosen.includes(p.id));
  const met = order.needs.filter((t) => picked.some((p) => p.tag === t && p.fits && !p.leaks) || picked.some((p) => p.tag === t && p.fits && p.leaks));
  const missed = order.needs.filter((t) => !met.includes(t));
  const leaks = picked.filter((p) => p.leaks);
  const filler = picked.filter((p) => p.tag === 'filler' || !p.fits);
  const lines = order.needs.map((t) => ({ tag: t, ok: met.includes(t), text: met.includes(t) ? order.forge[t].met : order.forge[t].missed }));
  return { met, missed, leaks, filler, lines, pass: missed.length === 0 && leaks.length === 0 };
}
