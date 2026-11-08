import type { ModuleContent } from './types';

export const moduleB: ModuleContent = {
  id: 'synthesis',
  code: 'B',
  index: 2,
  title: 'Synthesis',
  label: 'MOD 02 / SYNTHESIS',
  themeSection: 'Practical AI tools and techniques',
  tagline: 'A prompt is a specification. Write it so it can be tested.',
  objective:
    'Write prompts that state a role, task, constraints and examples; explain what temperature changes; and judge an output against a checklist.',
  centerpiece: {
    name: 'Anamorphic Prompt Console',
    summary:
      'Four sliders on the left, a simulated output on the right, and a divider you can drag to warp both.',
    description:
      'A split-pane workspace. The left pane holds sliders for temperature, specificity, context depth and constraint strictness, plus four presets, and shows the structured prompt they produce. The right pane shows a simulated model response as token-probability bars and a noise field. The divider between the panes moves with the mouse or with the arrow keys. The output is a deterministic simulation, not a real model.',
  },
  lessons: [
    {
      id: 'b1',
      title: 'How a model reads a prompt',
      kicker: 'Mechanics',
      minutes: 4,
      body: [
        'A language model predicts the next token given everything before it. Your prompt is the start of that sequence, so it sets the odds for every word that follows. A vague prompt leaves many continuations almost equally likely. A precise prompt narrows them.',
        'A token is a chunk of text, often a word or part of one. Models read a limited number of tokens at once, called the context window. Anything outside the window is invisible, so the instructions and the material they apply to must both fit inside it.',
        'Temperature controls how adventurous the sampling is. Near 0, the model picks the most probable token almost every time, so output is steady and repeatable. Near 1 and above, it takes more risks, which helps brainstorming and hurts exact answers.',
      ],
      keyPoints: [
        'Output is a sampled continuation of the prompt.',
        'The context window caps what the model can see.',
        'Low temperature: repeatable. High temperature: varied.',
      ],
      check: {
        prompt: 'You need identical JSON extraction from invoices on every run. Which temperature fits best?',
        options: ['Near 0', 'Around 0.7', 'Around 1.5', 'Temperature does not matter'],
        answer: 0,
        explain:
          'Low temperature makes the model choose the most probable token almost every time, which gives repeatable output.',
      },
    },
    {
      id: 'b2',
      title: 'Roles, tasks and constraints',
      kicker: 'Structure',
      minutes: 4,
      body: [
        'Strong prompts have four parts. A role tells the model whose perspective to take. A task states the action in one sentence. Context supplies the material. Constraints set limits: length, format, tone, and what to leave out.',
        'Compare "Summarize this" with "You are an incident analyst. Summarize the report below for the on-call engineer in three bullets, each under 20 words. Do not speculate about causes." The second names the audience, the format and a boundary. You can check it against the output, and that is the point.',
      ],
      keyPoints: [
        'Role, task, context, constraints.',
        'Specify format and length so the result can be checked.',
        'Say what to exclude, not only what to include.',
      ],
      check: {
        prompt: 'Which constraint is easiest to verify?',
        options: ['Make it good.', 'Be concise.', 'Use exactly three bullets under 20 words.', 'Sound professional.'],
        answer: 2,
        explain: 'A count and a limit can be checked by anyone. Words like good or professional cannot.',
      },
    },
    {
      id: 'b3',
      title: 'Examples and few-shot prompting',
      kicker: 'Anchoring',
      minutes: 4,
      body: [
        'Showing beats telling. A few-shot prompt includes two to five worked examples of the input-output pattern you want, then a new input. The model continues the pattern. The 2020 GPT-3 paper showed that large models could pick up tasks from examples placed in the prompt, with no retraining.',
        'Examples work best when they are varied and correct. If every example is positive, the model may learn that the answer is always positive. Keep the format identical across examples, and put your real input last.',
      ],
      keyPoints: [
        'Few-shot: two to five examples inside the prompt.',
        'No retraining: the weights do not change.',
        'Vary the examples and keep their format identical.',
      ],
      check: {
        prompt: 'You give three examples, all labelled "positive". What risk does that create?',
        options: [
          'The model will run out of tokens.',
          'The model may lean toward "positive" for new inputs.',
          'The model will refuse the task.',
          'None: examples never matter.',
        ],
        answer: 1,
        explain: 'A lopsided set of examples teaches a lopsided pattern. Include varied cases.',
      },
    },
    {
      id: 'b4',
      title: 'Reasoning step by step',
      kicker: 'Chain of thought',
      minutes: 4,
      body: [
        'Models often get multi-step problems wrong when they answer in one jump. Asking for intermediate steps, called chain-of-thought prompting, can raise accuracy on arithmetic and logic tasks. A 2022 study by Wei and colleagues reported large gains on grade-school math benchmarks when models were shown worked reasoning.',
        'Written reasoning is also something you can inspect. If a step is wrong, you can see where. Keep one caution in mind: a fluent explanation is not proof that the answer is right. Check the steps, not the tone.',
      ],
      keyPoints: [
        'Ask for steps on multi-step problems.',
        'Visible steps are easier to audit.',
        'Fluent reasoning can still be wrong.',
      ],
      check: {
        prompt: 'Besides accuracy, what is a benefit of asking a model to show its reasoning?',
        options: [
          'Shorter answers',
          'You can inspect where the logic fails',
          'The model uses fewer tokens',
          'It guarantees a correct answer',
        ],
        answer: 1,
        explain: 'Visible steps let you find the first wrong step. They do not guarantee correctness.',
      },
    },
    {
      id: 'b5',
      title: 'Evaluating outputs',
      kicker: 'Quality control',
      minutes: 4,
      body: [
        'Treat model output as a draft from a fast, confident intern. Check it against criteria you wrote before you read it: is it correct, complete, in the requested format, and within the constraints? A written checklist beats a gut feeling.',
        'Models can state false facts in a fluent tone, a failure called hallucination. Verify names, numbers, quotes and citations against a source. For repeated tasks, keep a small test set of inputs with known good outputs, and rerun it whenever you change the prompt.',
      ],
      keyPoints: [
        'Write the acceptance criteria first.',
        'Verify facts against a source.',
        'Keep a test set and rerun it after every prompt change.',
      ],
      check: {
        prompt: 'A model cites a study you cannot find. What should you do?',
        options: [
          'Trust it: models cite correctly.',
          'Treat the citation as unverified until you find the source.',
          'Ask the model if it is sure and accept its answer.',
          'Delete the topic.',
        ],
        answer: 1,
        explain: 'Fabricated citations are a known failure. Confirm against the original source.',
      },
    },
  ],
  quiz: [
    {
      id: 'qb1',
      lesson: 'b1',
      prompt: 'What does the context window limit?',
      options: [
        'How fast the model replies',
        'How many tokens the model can consider at once',
        'How many users can connect',
        'Which languages it supports',
      ],
      answer: 1,
      explain: 'The window is the number of tokens the model can read and use in one pass.',
    },
    {
      id: 'qb2',
      lesson: 'b2',
      prompt: 'Which prompt contains a role, a task and a checkable constraint?',
      options: [
        'Summarize this.',
        'You are a nurse educator. Explain insulin to a 9th grader in four sentences.',
        'Write something good about insulin.',
        'Insulin?',
      ],
      answer: 1,
      explain: 'It names a role, a task, an audience and a sentence count.',
    },
    {
      id: 'qb3',
      lesson: 'b3',
      prompt: 'Few-shot prompting steers a model by:',
      options: [
        'Updating its weights',
        'Adding worked examples to the prompt',
        'Making the model larger',
        'Lowering the temperature',
      ],
      answer: 1,
      explain: 'The examples sit in the prompt. The weights stay the same.',
    },
    {
      id: 'qb4',
      lesson: 'b4',
      prompt: 'What does chain-of-thought prompting ask the model to do?',
      options: [
        'Search the web',
        'Write out intermediate reasoning steps',
        'Answer in one word',
        'Repeat the prompt back',
      ],
      answer: 1,
      explain: 'The model writes its intermediate steps before the final answer.',
    },
    {
      id: 'qb5',
      lesson: 'b5',
      prompt: 'What is the best first step when evaluating output for a repeated task?',
      options: [
        'Read it once and approve it',
        'Write acceptance criteria and a small test set',
        'Raise the temperature',
        'Shorten the prompt',
      ],
      answer: 1,
      explain: 'Criteria and a test set make results comparable from one prompt version to the next.',
    },
  ],
  challenge: {
    kind: 'tuning',
    title: 'Tune to the brief',
    intro:
      'Three jobs. Set the four sliders so each one lands inside the range the job needs, then lock it in. Mistakes cost time in timed mode.',
    parSeconds: 90,
    passMark: 3,
    scenarios: [
      {
        id: 'cb1',
        goal: 'Extract invoice totals as JSON for an accounting system.',
        hint: 'Exact output wants low randomness, tight constraints and a precise ask.',
        ranges: {
          temperature: [0, 25],
          specificity: [70, 100],
          context: [30, 100],
          strictness: [70, 100],
        },
      },
      {
        id: 'cb2',
        goal: 'Brainstorm twenty product names for a student startup.',
        hint: 'Variety wants more randomness and looser limits.',
        ranges: {
          temperature: [60, 100],
          specificity: [0, 60],
          context: [0, 100],
          strictness: [0, 40],
        },
      },
      {
        id: 'cb3',
        goal: 'Summarize a 40-page policy document for a board memo.',
        hint: 'A long source needs deep context and steady, moderately strict output.',
        ranges: {
          temperature: [0, 40],
          specificity: [50, 100],
          context: [70, 100],
          strictness: [40, 100],
        },
      },
    ],
  },
  requiredActions: [
    { id: 'preset-role', label: 'Apply Role Framing' },
    { id: 'preset-cot', label: 'Apply Chain-of-Thought' },
    { id: 'preset-constraint', label: 'Apply Constraint Stacking' },
    { id: 'preset-fewshot', label: 'Apply Few-Shot Anchoring' },
  ],
  badge: {
    name: 'Prompt Architect',
    criteria:
      'Practice 4 of 5 lessons, apply all four presets, score 4 of 5 on the knowledge check, and tune all three briefs.',
  },
};
