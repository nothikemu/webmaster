import type { PathId } from './types';

/**
 * The three mentors. Each keeps one place in the harbor and teaches one path.
 * `hooks` holds one short line for every lesson: the mentor sets the lesson's question in the terms of their own trade,
 * so the idea has something to hang on before the explanation starts.
 */
export interface Mentor {
  path: PathId;
  name: string;
  trade: string;
  /** One sentence shown on the certification page. */
  asks: string;
  hooks: Record<string, string>;
}

export const MENTORS: Record<PathId, Mentor> = {
  understand: {
    path: 'understand',
    name: 'Wren',
    trade: 'the weaver',
    asks: 'Wren asks how models learn and what they are really doing.',
    hooks: {
      u1: 'I could write you a rule for every knot, or show you a hundred finished cloths and let you find the pattern yourself. Today you find out which of those a computer is doing.',
      u2: 'A loom can only repeat the patterns it was threaded with. Bring me your examples, and we will see what the cloth learns and what it never saw.',
      u3: 'Every thread on this frame pulls on the next with its own strength. Change the strengths and the whole pattern changes. That is all the weights in a network are.',
      u4: 'Give me the start of a pattern and I can guess the next row. I am usually right, and I have no idea what the cloth is for. Keep that in mind today.',
      u5: 'My frame only holds so many rows at once. What rolls off the top, I can no longer see. A model has the same limit, and it has a name.',
    },
  },
  use: {
    path: 'use',
    name: 'Brannock',
    trade: 'the foundry-master',
    asks: 'Brannock asks whether you can get good work out of a tool and check it.',
    hooks: {
      t1: 'You would not drive a nail with a saw. Tell me the job first, then we choose the tool. And we read the shop rules before anything is lit.',
      t2: 'Hand me a vague order and you get a vague casting. I need five things: what to make, what you already know, who it is for, what shape, and what limits.',
      t3: 'Nothing comes off the anvil finished. Look at it, change one thing, strike again. That is how a first try becomes good work.',
      t4: 'I test every weld before it leaves this shop. An answer that sounds right is not a tested answer. Sort the claims, then check the ones that matter.',
      t5: 'A good apprentice uses the tools to get stronger, not to skip the lifting. Let us find the uses that build your own skill.',
    },
  },
  responsible: {
    path: 'responsible',
    name: 'Sedge',
    trade: 'the beacon-keeper',
    asks: 'Sedge asks what could go wrong, and who answers for it.',
    hooks: {
      r1: 'A chart drawn from one coast will run every other ship aground. Before you trust the map, ask who the data left out.',
      r2: 'Fog can look exactly like a headland. A model can say something false as smoothly as something true. Your job is to tell them apart.',
      r3: 'On a dark night any lamp can pretend to be the beacon. Before you steer by a picture or a voice, find out where it came from.',
      r4: 'What you hand to a stranger on the dock, you do not get back. Decide what stays in your own pocket, and guard what belongs to other people too.',
      r5: 'A keeper signs the log every night in their own hand. Say what the tool did and what you did. The work, and the answer for it, stay yours.',
    },
  },
};

export const mentorFor = (path: PathId): Mentor => MENTORS[path];
export const hookFor = (path: PathId, lessonId: string): string | undefined => MENTORS[path].hooks[lessonId];
