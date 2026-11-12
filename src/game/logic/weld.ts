/**
 * The Weld Test. An "assistant" answer is made of claims. The player has a few tests to spend and must decide which claims to keep.
 * Claims are judged against a source packet written for the game, because that is the skill: checking against a source you can name.
 */
export type Truth = 'supported' | 'contradicted' | 'missing';
export interface Claim {
  id: string;
  text: string;
  truth: Truth;
  /** Revealed when the player tests the claim. */
  evidence: string;
  /** Hurts most if wrong: a date someone will travel on, a rule someone will break. */
  high?: boolean;
  /** Why this claim looks suspicious (or trustworthy), shown at the end. */
  cue?: string;
}
export interface Case {
  round: 1 | 2 | 3;
  title: string;
  question: string;
  packet: { n: number; text: string }[];
  claims: Claim[];
  tests: number;
}

export const CASES: readonly Case[] = [
  {
    round: 1,
    title: 'Gannet Point Light',
    question: 'Tell me about Gannet Point Light.',
    tests: 3,
    packet: [
      { n: 1, text: 'Gannet Point Light was first lit in 1894. Its tower is built of local granite and stands 31 metres tall.' },
      { n: 2, text: 'The lamp changed from oil to electricity in 1956. A diesel generator supplied power until a cable reached the point in 1971.' },
      { n: 3, text: 'The light was automated in 1989, when the last resident keeper left. It is now run by the harbor authority.' },
      { n: 4, text: 'Visitors may climb the tower on weekends from April to October. The climb is 142 steps. Children under 8 must be with an adult.' },
      { n: 5, text: 'In poor visibility a fog signal sounds two blasts every 30 seconds.' },
    ],
    claims: [
      { id: 'c1', text: 'The light was first lit in 1894.', truth: 'supported', evidence: 'Packet 1: "first lit in 1894."', cue: 'A plain date that matches the packet.' },
      { id: 'c2', text: 'The tower is 41 metres tall.', truth: 'contradicted', evidence: 'Packet 1 says 31 metres, not 41. One digit was swapped.', cue: 'An exact number. Specific figures are where small errors hide.' },
      { id: 'c3', text: 'It changed to electric power in 1956.', truth: 'supported', evidence: 'Packet 2: "changed from oil to electricity in 1956."' },
      { id: 'c4', text: 'The last keeper left in 1989 when the light was automated.', truth: 'supported', evidence: 'Packet 3 says the same.' },
      { id: 'c5', text: 'Visitors can climb its 142 steps every day of the week.', truth: 'contradicted', high: true, evidence: 'Packet 4: weekends only, April to October. Someone planning a visit would travel for nothing.', cue: 'A claim about access. If it is wrong, a person acts on it.' },
      { id: 'c6', text: 'A 2003 survey by the Maritime Heritage Institute ranked it the most photographed lighthouse in the region.', truth: 'missing', evidence: 'Nothing in the packet mentions a survey or an institute. The source was invented to sound credible.', cue: 'A named study with a year. Fluent, specific and unchecked is the signature of a made-up source.' },
      { id: 'c7', text: 'The fog signal sounds two blasts every 30 seconds.', truth: 'supported', evidence: 'Packet 5 says the same.' },
    ],
  },
  {
    round: 2,
    title: 'Photosynthesis summary',
    question: 'Summarize photosynthesis for my test.',
    tests: 3,
    packet: [
      { n: 1, text: 'Photosynthesis takes place in chloroplasts, which contain the green pigment chlorophyll.' },
      { n: 2, text: 'Plants take in carbon dioxide and water and, using light energy, make glucose and release oxygen.' },
      { n: 3, text: 'Chlorophyll absorbs mostly red and blue light and reflects green light, which is why leaves look green.' },
      { n: 4, text: 'Gas exchange happens through small pores in the leaf called stomata.' },
      { n: 5, text: 'Plants also respire, using glucose and oxygen to release energy, both day and night.' },
    ],
    claims: [
      { id: 'c1', text: 'Photosynthesis takes place in the chloroplasts.', truth: 'supported', evidence: 'Packet 1 says the same.' },
      { id: 'c2', text: 'During photosynthesis plants take in oxygen and release carbon dioxide.', truth: 'contradicted', high: true, evidence: 'Packet 2 has it the other way round: carbon dioxide in, oxygen out. Written on a test, this loses the point.', cue: 'Smooth and confident, and backwards. Swapped inputs and outputs are a classic error.' },
      { id: 'c3', text: 'Chlorophyll absorbs mostly red and blue light.', truth: 'supported', evidence: 'Packet 3 says the same.' },
      { id: 'c4', text: 'Leaves look green because chlorophyll reflects green light.', truth: 'supported', evidence: 'Packet 3 says the same.' },
      { id: 'c5', text: 'Plants stop all respiration at night.', truth: 'contradicted', evidence: 'Packet 5: plants respire both day and night.', cue: '"All" and "stop": absolute words deserve a check.' },
      { id: 'c6', text: 'A 2019 study of 4,000 plants found that photosynthesis uses exactly 63.4 percent of a leaf’s energy.', truth: 'missing', evidence: 'No such study or figure is in the packet. A precise percentage with a year and a sample size is the shape of an invented statistic.', cue: 'Precision without a source is decoration.' },
      { id: 'c7', text: 'Gas exchange happens through pores called stomata.', truth: 'supported', evidence: 'Packet 4 says the same.' },
    ],
  },
  {
    round: 3,
    title: 'The school AI policy',
    question: 'What does our school’s AI policy say?',
    tests: 3,
    packet: [
      { n: 1, text: 'Students may use AI tools for brainstorming and for checking their own work, if the teacher has allowed it for that assignment.' },
      { n: 2, text: 'Any text, code or image produced by an AI tool and used in submitted work must be identified, with the tool named.' },
      { n: 3, text: 'Students must not enter other people’s names, photographs or grades into AI tools.' },
      { n: 4, text: 'A first violation results in a conference with the teacher and a chance to redo the work. Repeated violations are referred to the Dean.' },
      { n: 5, text: 'The policy takes effect at the start of the next term.' },
    ],
    claims: [
      { id: 'c1', text: 'AI tools may be used for brainstorming if the teacher has allowed it.', truth: 'supported', evidence: 'Packet 1 says the same.' },
      { id: 'c2', text: 'AI-generated text used in submitted work must be identified, with the tool named.', truth: 'supported', evidence: 'Packet 2 says the same.' },
      { id: 'c3', text: 'Students may enter a classmate’s name into an AI tool if the classmate agrees.', truth: 'contradicted', high: true, evidence: 'Packet 3 says students must not enter other people’s names. It does not offer an exception for permission.', cue: 'A rule being loosened. If wrong, someone breaks the policy believing they are allowed.' },
      { id: 'c4', text: 'A first violation means automatic suspension.', truth: 'contradicted', high: true, evidence: 'Packet 4: a first violation means a conference and a chance to redo the work.', cue: 'A heavy consequence. If it is wrong it scares people away from honest questions.' },
      { id: 'c5', text: 'The policy takes effect at the start of the next term.', truth: 'supported', evidence: 'Packet 5 says the same.' },
      { id: 'c6', text: 'The policy was drafted with advice from the state education board.', truth: 'missing', evidence: 'The packet says nothing about who drafted it. Authority borrowed from an official-sounding body.', cue: 'Appeal to authority with nothing behind it.' },
      { id: 'c7', text: 'Repeated violations are referred to the Dean.', truth: 'supported', evidence: 'Packet 4 says the same.' },
    ],
  },
];

export type Flag = 'keep' | 'cut';

export interface Grade {
  right: number;
  total: number;
  wrong: string[];
  /** High-stakes false claims that were kept. */
  missedHigh: string[];
  pass: boolean;
}

/** Keep is right for supported claims; cut is right for the rest. To pass: every high-stakes claim right, and at most one miss overall. */
export function grade(c: Case, flags: Record<string, Flag | undefined>): Grade {
  const wrong = c.claims.filter((cl) => flags[cl.id] !== (cl.truth === 'supported' ? 'keep' : 'cut')).map((cl) => cl.id);
  const missedHigh = wrong.filter((id) => c.claims.find((cl) => cl.id === id)!.high);
  const answered = c.claims.every((cl) => flags[cl.id]);
  return { right: c.claims.length - wrong.length, total: c.claims.length, wrong, missedHigh, pass: answered && missedHigh.length === 0 && wrong.length <= 1 };
}
