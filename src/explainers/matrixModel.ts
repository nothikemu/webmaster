/**
 * The vulnerability matrix's content and model. The four failures, their mitigations and the real cases quoted in them come from the Ethics
 * module. The grids use illustrative numbers that show the shape of each problem, and the interface says so.
 */
import type { WidgetSpec } from '@/content/types';

export type FailureId = 'bias' | 'leakage' | 'attack' | 'opacity';

export interface GridCounts {
  /** For each group: how many cells, and how many are harmed (bad) or caught before any harm. */
  groups: { name: string; cells: number; bad: number; caught: number }[];
}

export interface Failure {
  id: FailureId;
  name: string;
  summary: string;
  signs: string[];
  /** What each cell in the grid stands for, and what a harmed one means. */
  cell: string;
  harmed: string;
  caught: string;
  mitigation: string;
  steps: string[];
  before: GridCounts;
  after: GridCounts;
}

export const FAILURES: readonly Failure[] = [
  {
    id: 'bias',
    name: 'Bias drift',
    summary: 'The model treats groups unequally, or starts to as the world shifts away from its training data.',
    signs: ['Accuracy is reported as one overall number', 'Some groups get far more errors than others', 'Results get worse months after launch'],
    cell: 'a person the system makes a decision about',
    harmed: 'wrongly turned down',
    caught: 'sent to a person for review',
    mitigation: 'Measure accuracy per group, not just overall. Audit training data coverage, and re-test on fresh data after launch. The 2018 Gender Shades audit found error rates up to 34.7% for darker-skinned women against 0.8% for lighter-skinned men.',
    steps: ['Measure accuracy for each group, not only overall', 'Check who is missing from the training data and add them', 'Re-test on fresh data after launch, because the world drifts'],
    before: { groups: [{ name: 'Group A', cells: 24, bad: 2, caught: 0 }, { name: 'Group B', cells: 16, bad: 11, caught: 0 }] },
    after: { groups: [{ name: 'Group A', cells: 24, bad: 2, caught: 0 }, { name: 'Group B', cells: 16, bad: 3, caught: 0 }] },
  },
  {
    id: 'leakage',
    name: 'Data leakage',
    summary: 'The model repeats private or proprietary data it saw in training, or users send sensitive text where they should not.',
    signs: ['The model repeats names, numbers or addresses it should not know', 'People paste private text into tools the organization does not control'],
    cell: 'a record the system could reveal',
    harmed: 'exposed',
    caught: 'blocked before it left',
    mitigation: 'Remove personal data and duplicates before training, apply differential privacy where it is practical, and block sensitive input to tools you do not control. In 2021 researchers pulled hundreds of verbatim training sequences out of GPT-2.',
    steps: ['Remove personal data and duplicates before training', 'Apply differential privacy where it is practical', 'Block sensitive input to tools you do not control'],
    before: { groups: [{ name: 'All records', cells: 40, bad: 9, caught: 0 }] },
    after: { groups: [{ name: 'All records', cells: 40, bad: 1, caught: 4 }] },
  },
  {
    id: 'attack',
    name: 'Adversarial input',
    summary: 'An input is crafted to make the model fail: pixel patterns that flip a label, or hidden instructions that override a prompt.',
    signs: ['Tiny changes to an input flip the output', 'Text in a page or document changes what the assistant does'],
    cell: 'an input the system reads',
    harmed: 'misread or obeyed',
    caught: 'flagged for a person to check',
    mitigation: 'Train on adversarial examples, validate input, keep trusted instructions separate from untrusted content, limit what the model may do, and red-team before release.',
    steps: ['Train on adversarial examples', 'Validate input and keep trusted instructions apart from untrusted content', 'Limit what the model may do, and red-team before release'],
    before: { groups: [{ name: 'All inputs', cells: 40, bad: 7, caught: 0 }] },
    after: { groups: [{ name: 'All inputs', cells: 40, bad: 1, caught: 5 }] },
  },
  {
    id: 'opacity',
    name: 'Opaque decisioning',
    summary: 'People affected by a decision cannot find out what drove it, or whom to ask to change it.',
    signs: ['No one can say which factors drove a decision', 'No documentation of what the model is for', 'No one to appeal to'],
    cell: 'a person affected by a decision',
    harmed: 'cannot find out why or appeal',
    caught: 'told a person reviewed it',
    mitigation: 'Publish a model card covering purpose, testing and limits. Record which factors mattered, tell people when automation is involved, and give them a route to a human who can reverse the outcome.',
    steps: ['Publish a model card: purpose, testing and limits', 'Record which factors mattered in each decision', 'Tell people when automation is involved, and give them a route to a human'],
    before: { groups: [{ name: 'All affected people', cells: 40, bad: 36, caught: 0 }] },
    after: { groups: [{ name: 'All affected people', cells: 40, bad: 4, caught: 0 }] },
  },
];

export type CellState = 'ok' | 'bad' | 'caught';

/** Lays the counts out as a row-major list of cells. Bad and caught cells are spread out by a fixed rule, not clustered, so the picture is honest. */
export function layout(c: GridCounts): { group: string; state: CellState }[] {
  const out: { group: string; state: CellState }[] = [];
  for (const g of c.groups) {
    const cells: CellState[] = Array.from({ length: g.cells }, () => 'ok');
    const place = (n: number, s: CellState, offset: number) => {
      const step = g.cells / Math.max(1, n);
      for (let k = 0; k < n; k++) {
        let idx = (Math.floor(k * step + offset) * 7 + k * 3) % g.cells;
        while (cells[idx] !== 'ok') idx = (idx + 1) % g.cells;
        cells[idx] = s;
      }
    };
    place(g.bad, 'bad', 1);
    place(g.caught, 'caught', 2);
    for (const s of cells) out.push({ group: g.name, state: s });
  }
  return out;
}

export const totals = (c: GridCounts): { cells: number; bad: number; caught: number } => ({ cells: c.groups.reduce((a, g) => a + g.cells, 0), bad: c.groups.reduce((a, g) => a + g.bad, 0), caught: c.groups.reduce((a, g) => a + g.caught, 0) });

/** The original "name the failure" exercise, as an untimed and unscored sorting activity. */
export const MATCH_SPEC: WidgetSpec = {
  id: 'sorter',
  title: 'Match each incident to the failure that explains it',
  intro: 'Eight incidents. Decide which of the four failures explains each one, then check your sorting. Every answer has a reason, and you can clear it and try again.',
  config: {
    bins: [
      { id: 'bias', label: 'Bias drift' },
      { id: 'leakage', label: 'Data leakage' },
      { id: 'attack', label: 'Adversarial input' },
      { id: 'opacity', label: 'Opaque decisioning' },
    ],
    items: [
      { text: 'A résumé screener ranks women lower after being trained on ten years of past hiring decisions.', bin: 'bias', why: 'Historical decisions in the data carried their bias into the model.' },
      { text: "A support bot repeats one customer's home address to a different user.", bin: 'leakage', why: 'Private data is escaping to someone who should not see it.' },
      { text: 'A bank denies a loan and cannot say which factors mattered.', bin: 'opacity', why: 'The affected person cannot learn what drove the decision.' },
      { text: "A web page hides white-on-white text telling an assistant to forward the reader's emails.", bin: 'attack', why: 'Hidden instructions in untrusted content are prompt injection, an adversarial input.' },
      { text: 'A fraud model was fair at launch. A year later it flags one region far more often as spending habits shifted.', bin: 'bias', why: 'The world drifted away from the training data, and the model drifted into unfairness.' },
      { text: "A researcher gets a language model to output a real person's phone number from its training set.", bin: 'leakage', why: 'Memorized training data is being extracted.' },
      { text: "A sticker on a road sign makes a car's vision model misread it.", bin: 'attack', why: 'A small crafted change flips the output: an adversarial input.' },
      { text: 'A hospital ranks patients for care but publishes nothing about what the tool was tested on.', bin: 'opacity', why: 'No documentation means no one can judge or challenge the tool.' },
    ],
  },
};
