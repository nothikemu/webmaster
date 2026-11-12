/**
 * The game's content map: where things are, what each place teaches, and what can be found there.
 * Pure data, no React, so the progress engine, the tests and the build can all import it.
 *
 * World: Tideweight harbor, walked left to right along the Quay. Six buildings hang off it.
 * Each building maps to one of the three required TSA learning areas (or to the player's own records).
 */
import type { PathId } from '@/content/types';

export type RoomId = 'quay' | 'loom' | 'foundry' | 'beacon' | 'archive' | 'hall' | 'office';
export type StationId = 'cabinet' | 'frame' | 'anvil' | 'weld' | 'audit' | 'timeline';

export interface Unlock {
  /** Minimum level needed to open the door. */
  level: number;
  /** Plain-language reason shown on the locked door. */
  hint: string;
}

export interface Location {
  id: RoomId;
  name: string;
  /** What the building is, in the game's terms. */
  role: string;
  /** Which TSA learning area it teaches, or null for the player's own records. */
  area: PathId | null;
  areaName: string;
  /** Where the building's door stands on the Quay (world units). */
  doorX: number;
  /** Width of the interior in world units. */
  width: number;
  keeper: string | null;
  blurb: string;
  unlock?: Unlock;
}

export const QUAY_WIDTH = 3600;
export const ROOM_HEIGHT = 600;
export const FLOOR_Y = 520;

export const LOCATIONS: readonly Location[] = [
  { id: 'quay', name: 'The Quay', role: 'Hub', area: null, areaName: 'The harbor', doorX: 0, width: QUAY_WIDTH, keeper: null, blurb: 'Six doors line the Quay. Walk to one and step in.' },
  { id: 'loom', name: 'The Loom House', role: 'Laboratory', area: 'understand', areaName: 'AI fundamentals', doorX: 460, width: 1900, keeper: 'Wren', blurb: 'Where examples become patterns. Train a classifier and tune a tiny network by hand.' },
  { id: 'foundry', name: 'The Foundry Docks', role: 'Workshop', area: 'use', areaName: 'Practical AI tools and techniques', doorX: 1060, width: 1900, keeper: 'Brannock', blurb: 'Where requests are struck into results. Write prompts that work, and test the answers.' },
  { id: 'beacon', name: 'The Beacon', role: 'Ethics Division', area: 'responsible', areaName: 'Ethical and responsible AI', doorX: 1660, width: 1900, keeper: 'Sedge', blurb: 'Where the light is kept honest. Audit a system for bias and decide what is fair.' },
  { id: 'archive', name: 'The Archive', role: 'Archive', area: 'understand', areaName: 'AI fundamentals and history', doorX: 2260, width: 1800, keeper: null, blurb: 'Seventy years of machines that think, in order. Rebuild the timeline.', unlock: { level: 2, hint: 'Reach level 2 (Lamplighter) to open the Archive.' } },
  { id: 'hall', name: 'The Trial Hall', role: 'Simulation Chamber', area: null, areaName: 'Scenarios and certification', doorX: 2860, width: 1800, keeper: null, blurb: 'Six school situations with real consequences, and the final examination.', unlock: { level: 3, hint: 'Reach level 3 (Scribe) to open the Trial Hall.' } },
  { id: 'office', name: "The Harbor Office", role: 'Control Room', area: null, areaName: 'Progress, missions and records', doorX: 3380, width: 1500, keeper: null, blurb: 'Your missions, logbook, codex and the chart. Always open.' },
];

export const locationById = (id: string): Location | undefined => LOCATIONS.find((l) => l.id === id);
export const isRoomId = (v: string): v is RoomId => LOCATIONS.some((l) => l.id === v);

// ---------------------------------------------------------------------------------------------- Stations

export interface StationDef {
  id: StationId;
  room: RoomId;
  title: string;
  /** The TSA area it teaches. */
  area: PathId;
  /** Concept(s) it teaches, in plain words. */
  concept: string;
  /** The lesson that explains the idea in full. */
  lesson: string;
  intro: string;
  objective: string;
  /** What counts as finished, shown before play. */
  criteria: string;
  rounds: number;
  /** What the player is told when they finish a round (the point of the exercise). */
  takeaway: string[];
}

export const STATIONS: readonly StationDef[] = [
  {
    id: 'cabinet',
    room: 'loom',
    title: "The Curator's Cabinet",
    area: 'understand',
    concept: 'Supervised learning, training data and coverage',
    lesson: 'u2',
    intro: 'Wren keeps a cabinet of unsorted moths. A model learns by being shown labeled examples, but every label costs you a look under the glass. You cannot label everything.',
    objective: 'Spend a small budget of labels on the moths that teach the model the most, then see how well it sorts moths it has never been shown.',
    criteria: 'Reach the target accuracy on hidden test moths in each of three rounds.',
    rounds: 3,
    takeaway: [
      'A model is only as good as the examples it was shown. Examples near the boundary between classes teach it far more than ten copies of an obvious one.',
      'Two clusters per class need an example in each cluster, or the model never learns the second one exists.',
      'If your examples all come from one corner of the world, the model is confident and wrong everywhere else. That is a coverage gap, and it is how many real systems fail.',
    ],
  },
  {
    id: 'frame',
    room: 'loom',
    title: 'The Weight Frame',
    area: 'understand',
    concept: 'Neural networks, weights, bias and learning as automatic adjustment',
    lesson: 'u3',
    intro: 'A neuron is a weighted sum with a threshold. On the frame, two weights and a bias decide which side of a line each thread falls on. Turn the dials until the frame sorts the threads.',
    objective: 'Set the two weights and the bias so the line separates the two kinds of thread. Then let the frame learn the same thing by itself.',
    criteria: 'Sort every thread correctly in each of three frames. Learning by itself counts as a solve, but the dials teach more.',
    rounds: 3,
    takeaway: [
      'Each weight says how much one input matters. The bias slides the line without turning it. Together they are the whole model.',
      'Training is just the dials being nudged, over and over, in whichever direction lowers the error. Nothing in it understands threads.',
      'A single neuron can only draw a straight line. That limit is why real networks stack many of them.',
    ],
  },
  {
    id: 'anvil',
    room: 'foundry',
    title: 'The Anvil Orders',
    area: 'use',
    concept: 'Prompting: task, context, audience, format and limits; keeping private data out',
    lesson: 't2',
    intro: 'Brannock takes orders from people who rarely say what they need. You write the request that goes to the forge. The forge is a simulation that follows fixed rules, so you can see exactly why a request worked or failed.',
    objective: 'Read the order, then build a prompt from up to six pieces so that every need in the order is met and nothing private leaves the shop.',
    criteria: 'Meet every need of the order with no private information in the prompt, in each of three orders.',
    rounds: 3,
    takeaway: [
      'A good prompt names the task, gives the background the tool cannot guess, says who it is for, asks for a shape, and sets limits.',
      'Vague pieces ("make it good") add nothing. Specific pieces change the result.',
      'A prompt is a message to a service. Real names, addresses and other people’s details do not belong in it.',
    ],
  },
  {
    id: 'weld',
    room: 'foundry',
    title: 'The Weld Test',
    area: 'use',
    concept: 'Verifying AI output: triage, sources and red flags',
    lesson: 't4',
    intro: 'An assistant has written an answer from a source packet. Some of it is sound and some is not, and you only have time for a few tests. Test the welds that matter, then decide what stays.',
    objective: 'Spend your tests on the claims most likely to be wrong, then mark every claim keep or cut.',
    criteria: 'Mark every claim correctly in each of three cases.',
    rounds: 3,
    takeaway: [
      'You cannot check everything, so check the claims that would hurt most if wrong and the ones that sound too specific.',
      'Invented answers are fluent. A confident tone, an exact number or a neat citation is not evidence.',
      'Checking means going back to a source you can name, not asking the same tool whether it is right.',
    ],
  },
  {
    id: 'audit',
    room: 'beacon',
    title: 'The Fairness Audit',
    area: 'responsible',
    concept: 'Algorithmic bias, proxy variables, and trade-offs when fixing them',
    lesson: 'r1',
    intro: 'A scholarship screener was trained on past decisions. Sedge suspects it treats two districts differently without ever being told the district. Your job is to prove it, find how, and fix it without breaking it.',
    objective: 'Slice the applicants by different traits to find the pattern, then change how the screener works until it is fair and still accurate.',
    criteria: 'In each of three audits, bring the gap between districts down to 15 points or fewer while keeping accuracy at 75 percent or more.',
    rounds: 3,
    takeaway: [
      'A system can be unfair without ever seeing the sensitive trait, because other traits stand in for it. These are proxies.',
      'Bias is found by comparing outcomes between groups, not by reading the code.',
      'Every fix has a cost somewhere. Removing a feature can lose accuracy, and human review costs time. Fairness is a decision, not a switch.',
    ],
  },
  {
    id: 'timeline',
    room: 'archive',
    title: 'The Timeline of Minds',
    area: 'understand',
    concept: 'History of AI and what each step taught us',
    lesson: 'u1',
    intro: 'The Archive’s index cards have been shuffled. Put them back in order. After every guess the Archive tells you how many are in the right place.',
    objective: 'Order the milestones from earliest to latest, using the clue on each card.',
    criteria: 'Order all seven events correctly. Fewer guesses earn more stars.',
    rounds: 1,
    takeaway: [
      'AI is not new. The idea is from the 1950s, and for decades progress came in bursts followed by disappointment.',
      'The jumps came from three things together: new methods, much more data, and much faster hardware.',
      'Chat assistants are one recent step on a long road, not the end of it.',
    ],
  },
];

export const stationById = (id: string): StationDef | undefined => STATIONS.find((s) => s.id === id);
export const STATION_IDS: readonly StationId[] = STATIONS.map((s) => s.id);
export const stationsIn = (room: RoomId): StationDef[] => STATIONS.filter((s) => s.room === room);

// ---------------------------------------------------------------------------------------------- Relics

export interface Relic {
  id: string;
  room: RoomId;
  name: string;
  /** The learning area it belongs to. */
  area: PathId;
  /** What the player sees when they examine it. A real, short explanation. */
  text: string;
  /** A Codex term this relic teaches, if any. */
  term?: string;
  /** Short line shown while examining: where it was found. */
  found: string;
}

export const RELICS: readonly Relic[] = [
  { id: 'rule-card', room: 'loom', area: 'understand', name: 'A card of rules', found: 'Pinned to the loom frame', text: 'Traditional software follows rules a person wrote: if the thread is red, put it left. Machine learning flips it. You supply many examples with the answers, and the computer finds a rule that fits them.' },
  { id: 'thread-weights', room: 'loom', area: 'understand', name: 'Knotted weights', found: 'Hanging from the rafters', text: 'A neural network is lots of small sums. Each connection has a weight, a number saying how much one signal matters to the next. Training adjusts millions of these numbers until the answers improve.' },
  { id: 'test-cloth', room: 'loom', area: 'understand', name: 'The test cloth', found: 'Folded under the bench', text: 'A model must be tested on examples it was never trained on. A model that only memorized its training data scores perfectly on it and badly on anything new. This is called overfitting.' },
  { id: 'toolbox-note', room: 'foundry', area: 'use', name: "Brannock's tool note", found: 'Tucked in the toolbox lid', text: 'Match the tool to the job. A chatbot is good for drafting and explaining. A search engine is better when you need to find a source. A calculator beats both for arithmetic. Reading the age rules and the privacy terms comes before the first prompt.' },
  { id: 'five-parts', room: 'foundry', area: 'use', name: 'The five-part mold', found: 'Hung above the forge', text: 'A strong prompt has five parts: the task, the context the tool cannot guess, the audience, the format you want, and the limits. Leaving one out is the most common reason an answer misses.' },
  { id: 'cracked-weld', room: 'foundry', area: 'use', name: 'A cracked weld', found: 'Behind the barrels', text: 'AI systems can produce fluent statements that are false, including invented sources. This is often called a hallucination. The only fix on your side is to check claims against a source you can name.' },
  { id: 'lens', room: 'beacon', area: 'responsible', name: 'The keeper’s lens', found: 'Wrapped in cloth by the lamp', text: 'Bias in AI usually starts with the data. If past decisions were unfair, a model trained to copy them copies the unfairness, and it does so at scale and with an air of objectivity.' },
  { id: 'forged-letter', room: 'beacon', area: 'responsible', name: 'A forged letter', found: 'In the keeper’s desk', text: 'Synthetic images, voices and video can be made to look real. Before you share or trust something striking, find where it came from, look for the original, and be slow to forward it.' },
  { id: 'sealed-log', room: 'beacon', area: 'responsible', name: 'The sealed log', found: 'Locked in the log chest', text: 'If you used an AI tool for part of your work, say so, and say what it did. Your teacher or competition may have rules about this. Honesty about the process is part of the work, and so is the decision to follow the rules.' },
  { id: 'first-chess', room: 'archive', area: 'understand', name: 'A chess score sheet', found: 'Filed under 1997', text: 'In 1997 IBM’s Deep Blue beat world champion Garry Kasparov. It did it mostly by searching millions of positions a second with hand-written evaluation rules, not by learning, which makes it a different kind of AI from today’s models.' },
  { id: 'eliza-slip', room: 'archive', area: 'understand', name: 'An ELIZA transcript', found: 'Between two ledgers', text: 'In 1966 Joseph Weizenbaum’s ELIZA used simple pattern matching to echo people’s words back as questions. Some users felt it understood them. People have been over-trusting conversational machines ever since.' },
  { id: 'gpu-plate', room: 'archive', area: 'understand', name: 'A graphics-chip plate', found: 'Behind glass', text: 'Graphics chips (GPUs) do many small sums at once, which is exactly what training a neural network needs. Cheap GPUs and large labeled datasets helped turn old ideas into the image and language systems of the 2010s.' },
  { id: 'verdict-form', room: 'hall', area: 'responsible', name: 'A blank verdict form', found: 'On the judge’s bench', text: 'Where a decision affects someone’s grades, job or safety, a person should be able to review it and say why. Human oversight means a human who has the time, the information and the power to overrule.' },
  { id: 'consent-slip', room: 'hall', area: 'responsible', name: 'A consent slip', found: 'Under the witness stand', text: 'Data about real people, including their names, photographs, grades and messages, is not yours to paste into a tool. Once it has left your device you cannot reliably get it back, so the safe default is not to send it.' },
  { id: 'kernel-log', room: 'office', area: 'use', name: "Kernel's first log", found: 'Pinned to the mission board', text: 'Learning with AI works best when you do the thinking first. Try the problem, then use the tool to check, explain or challenge your answer, not to replace the attempt.' },
  { id: 'chart-corner', room: 'quay', area: 'understand', name: 'A torn corner of chart', found: 'Wedged between two crates on the Quay', text: 'A system that only ever saw one coast draws a confident map of every coast. This is the clearest picture of why training data has to cover the cases the system will actually meet.' },
  { id: 'lamp-oil', room: 'quay', area: 'responsible', name: 'A flask of lamp oil', found: 'Under the old signal post', text: 'Responsible use is a habit, not a rule you check once: ask what the tool is for, what it could get wrong, who is affected, and whether you could explain your use to the person you answer to.' },
];

export const RELIC_IDS: readonly string[] = RELICS.map((r) => r.id);
export const relicById = (id: string): Relic | undefined => RELICS.find((r) => r.id === id);
export const relicsIn = (room: RoomId): Relic[] => RELICS.filter((r) => r.room === room);

// ---------------------------------------------------------------------------------------------- Rewards

export const GAME_XP = {
  /** Paid for each round cleared for the first time. */
  round: 40,
  /** Paid for each new relic. */
  relic: 12,
  /** Paid for the first entry into each building. */
  visit: 10,
} as const;
