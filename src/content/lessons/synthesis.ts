import type { Lesson } from '../types';

/** Synthesis: how a model reads a prompt, roles, tasks and constraints, examples, reasoning step by step, evaluating outputs. Five core lessons, then lessons that go further. */
export const synthesisLessons: Lesson[] = [
  {
    id: 's1',
    slug: 'how-a-model-reads-a-prompt',
    module: 'synthesis',
    core: true,
    title: 'How a model reads a prompt',
    kicker: 'Mechanics',
    minutes: 4,
    objective: 'Explain a prompt as the start of a sequence the model continues, say what the context window limits, and say what temperature changes.',
    beats: [
      {
        heading: 'The prompt starts the sequence',
        paragraphs: [
          'A language model predicts the next token given everything before it. Your prompt is the start of that sequence, so it sets the odds for every word that follows. A vague prompt leaves many continuations almost equally likely. A precise prompt narrows them.',
        ],
      },
      {
        heading: 'Tokens and the context window',
        paragraphs: [
          'A token is a chunk of text, often a word or part of one. Models read a limited number of tokens at once, called the context window. Anything outside the window is invisible, so the instructions and the material they apply to must both fit inside it.',
        ],
        visual: { kind: 'tokens', caption: 'One way a sentence might be split into tokens. Real tokenizers differ.', tokens: ['A', ' prompt', ' is', ' the', ' start', ' of', ' the', ' sequence', '.'] },
      },
      {
        heading: 'Temperature sets how adventurous the sampling is',
        paragraphs: [
          'Temperature controls how adventurous the sampling is. Near 0, the model picks the most probable token almost every time, so output is steady and repeatable. Near 1 and above, it takes more risks, which helps brainstorming and hurts exact answers.',
        ],
      },
    ],
    check: [
      {
        kind: 'single',
        prompt: 'You need identical JSON extraction from invoices on every run. Which temperature fits best?',
        options: ['Near 0', 'Around 0.7', 'Around 1.5', 'Temperature does not matter'],
        answer: 0,
        explain: 'Low temperature makes the model choose the most probable token almost every time, which gives repeatable output.',
      },
      {
        kind: 'single',
        prompt: 'What does the context window limit?',
        options: ['How fast the model replies', 'How many tokens the model can consider at once', 'How many users can connect', 'Which languages it supports'],
        answer: 1,
        explain: 'The window is the number of tokens the model can read and use in one pass.',
      },
    ],
    takeaways: ['Output is a sampled continuation of the prompt.', 'The context window caps what the model can see.', 'Low temperature: repeatable. High temperature: varied.'],
    glossary: ['prompt', 'token', 'context-window', 'temperature', 'language-model'],
  },
  {
    id: 't2',
    slug: 'roles-tasks-constraints',
    module: 'synthesis',
    core: true,
    title: 'Roles, tasks and constraints',
    kicker: 'Anatomy of a good prompt',
    minutes: 10,
    objective: 'Write a prompt with a clear task, useful context, an audience, a format and limits, and explain why each part helps.',
    framework: 'CSTA priority: Humans and AI',
    beats: [
      {
        heading: 'Five parts of a strong prompt',
        paragraphs: [
          'Task: what you want made. Context: the background the model cannot guess. Audience or role: who it is for or how it should sound. Format: what shape the answer takes. Constraints: limits you can check.',
          'You will not need all five every time. For anything important, they turn a guess into a plan.',
        ],
        visual: { kind: 'flow', caption: 'The parts, in the order you might write them.', steps: [{ label: 'Task' }, { label: 'Context' }, { label: 'Audience' }, { label: 'Format' }, { label: 'Limits' }] },
      },
      {
        heading: 'Context is what you know and it does not',
        paragraphs: [
          'The model has never met your class. Tell it your grade level, the assignment, and which part confuses you. If you paste your own notes, say so.',
          'Do not paste private details such as passwords, addresses, or classmates\' personal information. The privacy lesson on the third path covers why.',
        ],
      },
      {
        heading: 'Show, do not only tell',
        paragraphs: [
          'Words like "good" or "creative" mean little. A short example of the style you want, a few lines of a sample answer, gives the model something concrete to continue from. This is called few-shot prompting.',
        ],
      },
    ],
    example: {
      title: 'Weak and strong, same job',
      body: 'Weak: "Write about the Civil War." Strong: "Outline a 5-paragraph essay on two causes of the US Civil War for a 10th-grade history class. Use bullet points under each paragraph, and keep it under 200 words."',
      takeaway: 'The strong version states the task, audience, format and a limit. You can also check the result against it.',
    },
    widget: {
      id: 'prompt-builder',
      title: 'Build the prompt',
      intro: 'Your job: a study guide for tomorrow\'s quiz. Pick the best sentence for each part. Your prompt builds as you go.',
      config: {
        steps: [
          { prompt: 'Task: what should the model make?', options: ['Help me with photosynthesis.', 'Write a one-page study guide on photosynthesis for tomorrow\'s 9th-grade biology quiz.', 'Do my biology quiz for me.'], answer: 1, why: 'A clear task says what to produce and why. The third option asks for work that is yours to do and breaks most classroom rules.' },
          { prompt: 'Context: what does the model need to know?', options: ['Our unit covers the light reactions, the Calvin cycle and what plants need. I find the Calvin cycle confusing.', 'I am busy and need this fast.', 'Ignore the unit and just say what you know.'], answer: 0, why: 'Context is background the model cannot guess. Telling it what confuses you lets it spend effort where you need it.' },
          { prompt: 'Audience or role: how should it sound?', options: ['Explain it like a patient tutor talking to a 14-year-old.', 'Write it for a professor of plant biochemistry.', 'Be clever.'], answer: 0, why: 'Naming a reader sets level and tone. "Be clever" gives nothing to act on.' },
          { prompt: 'Format: what shape should the answer take?', options: ['Use a short outline with headings and one practice question per section.', 'Use a format.', 'Make it long and detailed however you like.'], answer: 0, why: 'A format you can picture is a format the model can follow, and it is easy for you to check.' },
          { prompt: 'Limits: what boundaries can you check?', options: ['Keep it under 300 words and tell me which parts you are unsure about.', 'Do not make any mistakes.', 'Use as many words as possible.'], answer: 0, why: 'Good limits are checkable. "Do not make mistakes" cannot be followed, but "say what you are unsure about" invites honesty.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'Which part of a prompt supplies what you know and the model cannot guess?',
        options: ['Format', 'Context', 'Temperature', 'Tokens'],
        answer: 1,
        explain: 'Context is the background: your grade, your assignment, what confuses you.',
      },
      {
        kind: 'tf',
        prompt: 'A longer prompt is always better than a short one.',
        answer: false,
        explain: 'Relevant detail helps. Padding does not. A short prompt with a clear task, audience and format beats a long vague one.',
      },
      {
        kind: 'multi',
        prompt: 'Select every item that belongs in a strong prompt for a study guide.',
        options: ['Your grade level and the topic', 'Your home address and full name', 'The format you want, such as a bulleted outline', 'A limit such as "under 300 words"'],
        answers: [0, 2, 3],
        explain: 'Level, topic, format and limits all help. Personal details do not help the answer and should not be shared.',
      },
    ],
    takeaways: ['Task, context, audience, format, limits.', 'Give the model what it cannot guess, and nothing private.', 'An example of the style you want beats an adjective.'],
    glossary: ['few-shot-prompting'],
  },
  {
    id: 's3',
    slug: 'few-shot-prompting',
    module: 'synthesis',
    core: true,
    title: 'Examples and few-shot prompting',
    kicker: 'Anchoring',
    minutes: 4,
    objective: 'Explain few-shot prompting, say why it does not retrain the model, and build a set of examples that does not lean one way.',
    beats: [
      {
        heading: 'Showing beats telling',
        paragraphs: [
          'Showing beats telling. A few-shot prompt includes two to five worked examples of the input-output pattern you want, then a new input. The model continues the pattern. The 2020 GPT-3 paper showed that large models could pick up tasks from examples placed in the prompt, with no retraining.',
        ],
        visual: {
          kind: 'compare',
          caption: 'The same task, asked two ways.',
          left: { title: 'Telling', items: ['Describe the task in words', 'The model has to guess the format you want'] },
          right: { title: 'Showing (few-shot)', items: ['Two to five worked examples inside the prompt', 'The weights do not change: the examples are just part of the prompt'] },
        },
      },
      {
        heading: 'Good examples are varied and correct',
        paragraphs: [
          'Examples work best when they are varied and correct. If every example is positive, the model may learn that the answer is always positive. Keep the format identical across examples, and put your real input last.',
        ],
      },
    ],
    check: [
      {
        kind: 'single',
        prompt: 'You give three examples, all labelled "positive". What risk does that create?',
        options: ['The model will run out of tokens.', 'The model may lean toward "positive" for new inputs.', 'The model will refuse the task.', 'None: examples never matter.'],
        answer: 1,
        explain: 'A lopsided set of examples teaches a lopsided pattern. Include varied cases.',
      },
      {
        kind: 'single',
        prompt: 'Few-shot prompting steers a model by:',
        options: ['Updating its weights', 'Adding worked examples to the prompt', 'Making the model larger', 'Lowering the temperature'],
        answer: 1,
        explain: 'The examples sit in the prompt. The weights stay the same.',
      },
    ],
    takeaways: ['Few-shot: two to five examples inside the prompt.', 'No retraining: the weights do not change.', 'Vary the examples and keep their format identical.'],
    glossary: ['few-shot-prompting', 'prompt'],
  },
  {
    id: 's4',
    slug: 'reasoning-step-by-step',
    module: 'synthesis',
    core: true,
    title: 'Reasoning step by step',
    kicker: 'Chain of thought',
    minutes: 4,
    objective: 'Explain chain-of-thought prompting, say why visible steps are easier to check, and remember that fluent reasoning can still be wrong.',
    beats: [
      {
        heading: 'Ask for the steps',
        paragraphs: [
          'Models often get multi-step problems wrong when they answer in one jump. Asking for intermediate steps, called chain-of-thought prompting, can raise accuracy on arithmetic and logic tasks. A 2022 study by Wei and colleagues reported large gains on grade-school math benchmarks when models were shown worked reasoning.',
        ],
      },
      {
        heading: 'Steps you can inspect',
        paragraphs: [
          'Written reasoning is also something you can inspect. If a step is wrong, you can see where. Keep one caution in mind: a fluent explanation is not proof that the answer is right. Check the steps, not the tone.',
        ],
        visual: {
          kind: 'flow',
          caption: 'Reading reasoning the way you would read a worked solution.',
          steps: [
            { label: 'Ask for the steps', note: 'before the final answer' },
            { label: 'Read each step', note: 'do not skim the tone' },
            { label: 'Find the first wrong step', note: 'a fluent explanation can still be wrong' },
          ],
        },
      },
    ],
    check: [
      {
        kind: 'single',
        prompt: 'Besides accuracy, what is a benefit of asking a model to show its reasoning?',
        options: ['Shorter answers', 'You can inspect where the logic fails', 'The model uses fewer tokens', 'It guarantees a correct answer'],
        answer: 1,
        explain: 'Visible steps let you find the first wrong step. They do not guarantee correctness.',
      },
      {
        kind: 'single',
        prompt: 'What does chain-of-thought prompting ask the model to do?',
        options: ['Search the web', 'Write out intermediate reasoning steps', 'Answer in one word', 'Repeat the prompt back'],
        answer: 1,
        explain: 'The model writes its intermediate steps before the final answer.',
      },
    ],
    takeaways: ['Ask for steps on multi-step problems.', 'Visible steps are easier to audit.', 'Fluent reasoning can still be wrong.'],
    glossary: ['chain-of-thought', 'prompt'],
  },
  {
    id: 't4',
    slug: 'evaluating-outputs',
    module: 'synthesis',
    core: true,
    title: 'Evaluating outputs',
    kicker: 'Check the answer',
    minutes: 11,
    objective: 'Verify an AI answer by sorting its claims, finding reliable sources, and dropping what cannot be confirmed.',
    framework: 'Common Sense Education: checking whether information is true when AI makes anything look credible',
    beats: [
      {
        heading: 'Fluent is not verified',
        paragraphs: [
          'An AI answer is a pile of claims. Some are common knowledge you can confirm in a minute. Some are specific numbers, names, dates, quotations or citations, and those are the ones models most often get wrong or invent. Some sound too neat to be true.',
        ],
        visual: { kind: 'flow', caption: 'Check each claim, not the whole answer at once.', steps: [{ label: 'Read a claim' }, { label: 'Find a reliable source' }, { label: 'Compare' }, { label: 'Keep, fix or drop' }] },
      },
      {
        heading: 'Read sideways',
        paragraphs: [
          'Lateral reading means leaving the page. Open a new tab, search for the claim, and see what trusted sources say. Look at who runs the source and whether it links to the original. If you cannot find it anywhere reliable, treat it as unconfirmed.',
        ],
      },
      {
        heading: 'A map, not a source',
        paragraphs: [
          'AI is useful early in research. Ask it for search terms, an outline of a debate, or questions to explore. Then go to the library, news reports, government data or the original study, and cite those.',
          'If an AI gives you a citation, find it. A made-up journal article can look perfectly real.',
        ],
      },
    ],
    example: {
      title: 'The missing study',
      body: 'A student asks for sources on sleep and grades. The AI lists three articles. Two are easy to find. The third, with a confident author name and year, does not exist anywhere. Using it would have put a fabricated source in the bibliography.',
      takeaway: 'Never cite a source you have not opened.',
    },
    widget: {
      id: 'claim-review',
      title: 'Review the claims',
      intro: 'An AI wrote this answer about teens and sleep. Decide what to do with each claim. Is it solid, does it need checking, or is it wrong or invented?',
      config: {
        source: 'Teenagers generally need around 8 to 10 hours of sleep per night. A 2019 study by Dr. Helena Marsh at Brookvale University found that students who sleep nine hours score exactly 23.4% higher on exams. Sleep is when the brain consolidates memories, so all-night cramming often backfires. Teenagers\' body clocks tend to shift later during puberty, which makes very early school starts harder. A federal law passed in 2021 requires every US high school to start after 9:30 a.m.',
        claims: [
          { text: 'Teenagers generally need around 8 to 10 hours of sleep per night.', verdict: 'solid', why: 'This matches guidance from health bodies such as the CDC and the American Academy of Sleep Medicine. You would still cite one of them, not the AI.' },
          { text: 'A 2019 study by Dr. Helena Marsh at Brookvale University found that students who sleep nine hours score exactly 23.4% higher on exams.', verdict: 'check', why: 'A named researcher, a year and a very precise number are exactly what models sometimes invent. Search for the study. If you cannot find it, drop the claim.' },
          { text: 'Sleep is when the brain consolidates memories, so all-night cramming often backfires.', verdict: 'solid', why: 'Memory consolidation during sleep is well supported by sleep research. Cite a university or health-agency source for it.' },
          { text: 'Teenagers\' body clocks tend to shift later during puberty, which makes very early school starts harder.', verdict: 'solid', why: 'This shift in the body clock is well documented in adolescent sleep research and is part of the debate over school start times.' },
          { text: 'A federal law passed in 2021 requires every US high school to start after 9:30 a.m.', verdict: 'false', why: 'There is no such federal law. School start times are set by states and districts. A precise-sounding legal claim like this is easy to disprove with one search.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'An AI gives you a citation for a journal article. What should you do?',
        options: ['Copy it into your bibliography', 'Search for it and confirm it exists and says what the AI claims', 'Ask the AI if it is sure', 'Assume it is real because it has a year and author'],
        answer: 1,
        explain: 'AI tools can produce real-looking citations that do not exist. Find the source yourself before using it.',
      },
      {
        kind: 'tf',
        prompt: 'If an AI answer sounds confident and detailed, it is probably accurate.',
        answer: false,
        explain: 'Tone is not evidence. Models are equally fluent when they are right and when they are wrong.',
      },
      {
        kind: 'multi',
        prompt: 'Select every kind of claim that deserves extra checking.',
        options: ['A very precise statistic attributed to a named study', 'A widely known definition from your textbook', 'A direct quotation attributed to a person', 'A claim that sounds almost too neat to be true'],
        answers: [0, 2, 3],
        explain: 'Precise statistics, quotations and too-neat claims are common places for errors. Textbook definitions are easy to confirm but still worth a glance.',
      },
    ],
    takeaways: ['Check claims one at a time.', 'Leave the page: read sideways.', 'Cite sources you opened, never the AI.'],
    glossary: ['hallucination', 'lateral-reading', 'citation'],
  },
  {
    id: 'u4',
    slug: 'the-next-word-machine',
    module: 'synthesis',
    core: false,
    title: 'The next-word machine',
    kicker: 'How generative AI writes',
    minutes: 10,
    objective: 'Explain how a language model writes one token at a time by predicting what usually comes next, and why that can produce fluent mistakes.',
    framework: 'AI4K12 Big Idea 4: Natural Interaction (updated for generative AI by CSTA)',
    beats: [
      {
        heading: 'Predict, append, repeat',
        paragraphs: [
          'A language model reads the text so far and produces a probability for every possible next token. One is picked and added to the text. Then the model reads the longer text and does it again.',
          'Your phone\'s autocomplete is a tiny cousin of this idea. Large language models are trained on enormous amounts of text, so their predictions are far richer.',
        ],
        visual: {
          kind: 'flow',
          caption: 'One step of generation.',
          steps: [{ label: 'Text so far' }, { label: 'Probabilities', note: 'quiet 31%, busy 18%, ...' }, { label: 'Pick one token' }, { label: 'Add it, repeat' }],
        },
      },
      {
        heading: 'Patterns, not a lookup',
        paragraphs: [
          'The model learned which words tend to follow which, across many topics. It is not searching a database of verified facts unless the product around it adds a search tool.',
          'That is why generated text can sound confident and still be wrong. Fluent and true are different things. Image generators work differently inside, but follow the same idea: learn patterns from many examples, then produce something that fits.',
        ],
      },
      {
        heading: 'Temperature: safe or surprising',
        paragraphs: [
          'Many tools let the system pick less likely tokens on purpose. A low temperature almost always picks the top candidate, so answers are steady and repeat. A high temperature gives variety, and also more risk of nonsense.',
        ],
      },
    ],
    example: {
      title: 'The book that does not exist',
      body: 'Ask a language model for a book on a niche topic and it may give a title and author that sound right but do not exist. It is not lying on purpose. It built the most likely-looking answer.',
      takeaway: 'Treat generated facts, names and citations as leads to check, never as sources.',
    },
    widget: {
      id: 'next-token',
      title: 'Next-word lab',
      intro: 'This tiny model learned from a short story about a school and its library. Watch its probabilities, then see what temperature does.',
    },
    check: [
      {
        kind: 'single',
        prompt: 'At each step, what does a language model do?',
        options: ['Looks up the answer in a fact database', 'Predicts probabilities for the next token and picks one', 'Searches the whole internet live', 'Asks a human to confirm'],
        answer: 1,
        explain: 'Generation is repeated next-token prediction. Some products add search or tools around the model, but the model itself predicts text.',
      },
      {
        kind: 'tf',
        prompt: 'By default, a language model checks a database of verified facts before it answers.',
        answer: false,
        explain: 'It generates plausible text from learned patterns. Verification has to come from you, or from a tool the product adds.',
      },
      {
        kind: 'single',
        prompt: 'Raising the temperature setting does what?',
        options: ['Makes the model always pick the most likely word', 'Makes word choices more varied and riskier', 'Makes the model faster', 'Deletes its training data'],
        answer: 1,
        explain: 'Higher temperature spreads probability toward less likely tokens: more variety, more chance of odd or wrong output.',
      },
    ],
    takeaways: ['Generation is predicting the next token, again and again.', 'Fluent is not the same as true.', 'Temperature trades steadiness for variety.'],
    glossary: ['generative-ai', 'language-model', 'inference', 'temperature'],
  },
  {
    id: 'u5',
    slug: 'tokens-and-context',
    module: 'synthesis',
    core: false,
    title: 'Tokens, context and prompts',
    kicker: 'What the model can see',
    minutes: 9,
    objective: 'Explain tokens and the context window, and why the prompt you write shapes what you get back.',
    framework: 'AI4K12 Big Idea 4: Natural Interaction',
    beats: [
      {
        heading: 'Text becomes tokens',
        paragraphs: [
          'Models do not read letters or whole words. They read tokens: chunks of text, often a short word or part of a longer one. In English a token is roughly four characters, or about three quarters of a word, though it varies by model.',
        ],
        visual: { kind: 'tokens', caption: 'One way a sentence might be split. Real tokenizers differ.', tokens: ['The', ' library', ' at', ' dawn', ' is', ' qu', 'iet', '.'] },
      },
      {
        heading: 'The context window is the desk',
        paragraphs: [
          'A model can only use what fits in its context window: your message, earlier turns of the chat, and any text you attach. Anything outside the window is simply not seen.',
          'In a very long chat, early details can fall out of the window. And a model does not remember your other chats unless the product adds a memory feature.',
        ],
      },
      {
        heading: 'The prompt is a briefing',
        paragraphs: [
          'The prompt is the text the model continues from, so clearer instructions and the right background give it more to work with. Even then, remember the limits: it can be wrong, it can reflect biases in its data, its knowledge can be out of date, and different wording can change the answer.',
        ],
      },
    ],
    example: {
      title: 'The pasted article',
      body: 'A student pastes a very long article and asks for a summary. If the text is longer than the tool\'s window, some of it may be cut off, and the summary comes only from what was kept. The exact behavior depends on the tool.',
      takeaway: 'Put the important instruction where the model will see it, and do not assume it has read everything you gave it.',
    },
    widget: {
      id: 'token-window',
      title: 'Fit the window',
      intro: 'The model can only see the last 48 tokens of this message. Edit it so the instruction is still visible. This is a simplified model of how windows work.',
    },
    check: [
      {
        kind: 'single',
        prompt: 'Which statement best describes a context window?',
        options: ['The amount of text, in tokens, a model can consider at once', 'The list of websites a model may visit', 'The time limit on a chat', 'The size of the training data'],
        answer: 0,
        explain: 'The window is the model\'s working space for one response. Text outside it is not part of what the model reads.',
      },
      {
        kind: 'multi',
        prompt: 'Select every real limitation of language models.',
        options: ['They can state false things confidently', 'They know everything that happened today', 'They can reflect biases found in their training data', 'They can see text that falls outside their context window'],
        answers: [0, 2],
        explain: 'Confident mistakes and inherited bias are real limits. Models do not automatically know today\'s events, and they cannot use text outside the window.',
      },
      {
        kind: 'tf',
        prompt: 'A token is always exactly one word.',
        answer: false,
        explain: 'A token can be a whole short word, part of a longer word, or punctuation. On average English runs about three quarters of a word per token.',
      },
    ],
    takeaways: ['Models read tokens, not words or letters.', 'Only what fits in the context window is seen.', 'Clear briefs help, but the limits stay: errors, bias and stale knowledge.'],
    glossary: ['token', 'context-window', 'prompt'],
  },
  {
    id: 't1',
    slug: 'picking-a-tool',
    module: 'synthesis',
    core: false,
    title: 'Pick the right tool',
    kicker: 'Different tools, different jobs',
    minutes: 8,
    objective: 'Match a task to the kind of AI tool that suits it, and name the first question to ask before using any tool for schoolwork.',
    framework: 'CSTA priority: Humans and AI',
    beats: [
      {
        heading: 'Seven kinds of helper',
        paragraphs: [
          'Chat assistants explain, brainstorm and draft. Research assistants search the web and show their sources. Writing aids polish grammar and clarity. Coding assistants suggest and explain code. Image generators turn descriptions into pictures. Study tools turn your notes into flashcards or quizzes. Data tools summarize tables and make charts.',
          'Many products blend several of these. The question is what you need done, and what could go wrong if the tool gets it wrong.',
        ],
      },
      {
        heading: 'Read the access rules first',
        paragraphs: [
          'Minimum ages, account types and costs differ from tool to tool. One major chatbot requires users to be 18 or older. Others allow ages 13 and up with conditions, and school accounts may need an administrator to switch a tool on. The Tool Atlas in this portal lists dated facts, and you should always re-check the vendor\'s own page.',
        ],
      },
      {
        heading: 'Rules for the assignment come first',
        paragraphs: [
          'Before you open any tool for schoolwork, ask: is AI allowed on this assignment, and under what rules? A tool that is fine for brainstorming can be off limits for the graded part. Your teacher\'s instructions decide, not the tool.',
        ],
        visual: { kind: 'flow', caption: 'Four questions before and after any tool.', steps: [{ label: 'What is the job?' }, { label: 'Which kind of tool?' }, { label: 'What do the rules allow?', note: 'assignment, class, school' }, { label: 'How will I check it?' }] },
      },
    ],
    example: {
      title: 'Ana\'s four jobs',
      body: 'Ana wants to understand photosynthesis, find recent articles on microplastics, work out why her Python loop never ends, and turn her notes into flashcards. A chat assistant, a research assistant, a coding assistant and a study tool each fit one job best.',
      takeaway: 'Start from the job. A search-based tool shows sources you can open and check; a chat-only tool may not.',
    },
    widget: {
      id: 'sorter',
      title: 'Match the task',
      intro: 'Choose the kind of tool that suits each job best.',
      config: {
        bins: [
          { id: 'chat', label: 'Chat assistant' },
          { id: 'research', label: 'Research assistant (shows sources)' },
          { id: 'coding', label: 'Coding assistant' },
          { id: 'study', label: 'Study tool' },
          { id: 'image', label: 'Image generator' },
        ],
        items: [
          { text: 'Explain photosynthesis in simpler words', bin: 'chat', why: 'A conversational explainer is exactly what chat assistants do well. Check any facts against your textbook.' },
          { text: 'Find recent articles about microplastics and list their sources', bin: 'research', why: 'You want links you can open. Research assistants search and show where claims came from. You still read the sources yourself.' },
          { text: 'My Python loop never stops. Explain why.', bin: 'coding', why: 'Coding assistants read code and explain errors. Run their fix and make sure you understand it.' },
          { text: 'Turn my biology notes into 20 flashcards', bin: 'study', why: 'Study tools work from your own notes and format them for practice.' },
          { text: 'Make an illustration of the water cycle for a poster', bin: 'image', why: 'Image generators turn a description into a picture. Check your class rules and credit the tool if images are allowed at all.' },
          { text: 'Brainstorm ten topic ideas for my history paper', bin: 'chat', why: 'Open-ended brainstorming is a chat assistant strength. You choose the topic, not the tool.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'What is the most important question to ask before using AI for a graded assignment?',
        options: ['Which tool is most popular?', 'Is AI allowed on this assignment, and under what rules?', 'Which tool answers fastest?', 'Which tool is free?'],
        answer: 1,
        explain: 'Your assignment\'s rules decide what is allowed. Popularity, speed and price do not change that.',
      },
      {
        kind: 'tf',
        prompt: 'All AI tools share the same minimum age and account rules.',
        answer: false,
        explain: 'They vary by tool, by account type, and by whether a school has enabled the tool. Read the vendor\'s own page.',
      },
      {
        kind: 'multi',
        prompt: 'Select every job that suits a coding assistant.',
        options: ['Explaining an error message', 'Removing your need to understand your own code', 'Suggesting a first draft of a function that you will then test', 'Deciding whether you may submit the code as your own work'],
        answers: [0, 2],
        explain: 'A coding assistant can explain and draft. Whether you may submit its work is your teacher\'s call, and you still need to understand and test the code.',
      },
    ],
    takeaways: ['Start from the job, then pick the kind of tool.', 'Access rules differ by tool, so check the vendor\'s page.', 'Your assignment\'s rules come before any tool.'],
    glossary: ['chatbot'],
  },
  {
    id: 't3',
    slug: 'refine-do-not-restart',
    module: 'synthesis',
    core: false,
    title: 'Refine, do not restart',
    kicker: 'Treat the first answer as a draft',
    minutes: 8,
    objective: 'Improve a weak answer by changing the prompt on purpose, and compare outputs to see what a change did.',
    framework: 'CSTA priority: Humans and AI',
    beats: [
      {
        heading: 'The first answer is a draft',
        paragraphs: [
          'Rarely is the first response the best one. Say what to change: shorter, simpler, a different format, a counter-argument. You can also ask what assumptions the model made.',
          'Vague complaints like "make it better" give the model nothing to act on.',
        ],
      },
      {
        heading: 'Change one thing at a time',
        paragraphs: [
          'If you change the task, the audience and the format in one go, you cannot tell which change helped. Adjust one part, look, then adjust the next. This is iteration, the same habit behind good writing and good code.',
        ],
      },
      {
        heading: 'Compare, then decide',
        paragraphs: [
          'You can ask for two different versions and choose between them. Choosing is a judgment only you can make, because you know the assignment, your voice and your teacher\'s expectations.',
        ],
        visual: { kind: 'flow', caption: 'The refine loop. You are the one who decides.', steps: [{ label: 'First answer', note: 'a draft' }, { label: 'Name what is wrong' }, { label: 'Change one thing' }, { label: 'Compare versions' }, { label: 'You choose' }] },
      },
    ],
    example: {
      title: 'The chapter summary',
      body: 'A student asks for a summary and gets six paragraphs at college level. Rewriting the request as "five bullets for a 9th-grade reader, defining technical terms once" gives something usable in one step.',
      takeaway: 'Say exactly what is wrong (length, level, format) and re-ask.',
    },
    widget: {
      id: 'chooser',
      title: 'Pick the better revision',
      intro: 'Three weak answers. Choose the follow-up that would actually fix each one.',
      config: {
        steps: [
          { prompt: 'The answer is accurate but a wall of text. Which follow-up fixes it?', options: ['Try again.', 'Rewrite that as five bullet points, each under 15 words.', 'Make it better.', 'Why are you so wordy?'], answer: 1, why: 'It names the format and a limit, so the model knows exactly what to change and you can check the result.' },
          { prompt: 'The answer uses college vocabulary for a 9th-grade audience. Best revision?', options: ['Use simpler words.', 'Rewrite for a 9th-grade reader and define any technical term the first time you use it.', 'That is too hard.', 'Dumb it down.'], answer: 1, why: 'It names the audience and a concrete rule. "Simpler" is vague, and the last option is unhelpful.' },
          { prompt: 'You asked for an essay outline and got something off topic. What do you check first?', options: ['Whether your prompt stated the topic and the assignment\'s requirements', 'Nothing. The model must be broken.', 'Ask the same question ten times.', 'Add more exclamation points.'], answer: 0, why: 'Off-topic answers usually trace back to missing context. Fix the briefing before you blame the tool.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'What is the best way to improve an unsatisfying AI answer?',
        options: ['Ask again with no changes', 'Say specifically what to change, such as length, level or format, and re-ask', 'Tell it to try harder', 'Switch tools every time'],
        answer: 1,
        explain: 'Specific feedback gives the model something to act on.',
      },
      {
        kind: 'tf',
        prompt: 'If the first answer is poor, the tool is broken.',
        answer: false,
        explain: 'Often the prompt left out context or format. Revising the prompt is the normal workflow.',
      },
      {
        kind: 'single',
        prompt: 'Why change only one part of a prompt at a time?',
        options: ['It is faster to type', 'So you can tell which change made the difference', 'Models cannot handle more than one change', 'It uses fewer tokens'],
        answer: 1,
        explain: 'One change at a time shows cause and effect. Several at once hides which one worked.',
      },
    ],
    takeaways: ['The first answer is a draft.', 'Name what is wrong, then re-ask.', 'You judge which version is best.'],
    glossary: ['iteration'],
  },
  {
    id: 't5',
    slug: 'study-brainstorm-code',
    module: 'synthesis',
    core: false,
    title: 'Study, brainstorm, code',
    kicker: 'AI as partner, not substitute',
    minutes: 9,
    objective: 'Use AI to practice, brainstorm and debug in ways that build your own skill, and spot uses that skip the learning.',
    framework: 'CSTA priority: Humans and AI',
    beats: [
      {
        heading: 'Practice, do not skip',
        paragraphs: [
          'Good study uses: ask it to quiz you from your own notes, explain a hard idea a second way, point out gaps in your outline, or play a skeptical reader. Poor uses: do the problem set for you. The thinking is the point of homework, and if the AI does it, you lose the practice.',
        ],
        visual: { kind: 'compare', caption: 'Same tool, two very different uses.', left: { title: 'Builds your skill', items: ['Quiz me from my own notes', 'Explain it a second way', 'Find the gaps in my outline', 'Explain this error, then I fix it'] }, right: { title: 'Skips your skill', items: ['Do my problem set', 'Write my essay', 'Write my whole program', 'Hand in code I cannot explain'] } },
      },
      {
        heading: 'Brainstorm wide, choose yourself',
        paragraphs: [
          'Ask for ten angles, not one answer. Then pick one and write down why. Ask for the strongest opposing view. The choosing and justifying are your own thinking.',
        ],
      },
      {
        heading: 'Code you can explain',
        paragraphs: [
          'Ask it to explain an error, then fix it yourself. Ask for test cases. Run the code and read it. Never submit code you cannot explain, and never paste secrets such as API keys or passwords into a chat.',
        ],
      },
    ],
    example: {
      title: 'Two ways to use the same tool',
      body: 'Jordan types "write my essay on the French Revolution" and gets a draft. Sam types "quiz me on the causes of the French Revolution from my notes, then tell me what I missed". Sam leaves knowing more. Jordan leaves with something that is not their work.',
      takeaway: 'Ask the question that makes you do the thinking.',
    },
    widget: {
      id: 'sorter',
      title: 'Partner, solo, or ask first?',
      intro: 'Decide how each request should be handled.',
      config: {
        bins: [
          { id: 'help', label: 'Good use: AI as a partner' },
          { id: 'self', label: 'Do it yourself: the thinking is the assignment' },
          { id: 'rules', label: 'Ask first: depends on your class rules' },
        ],
        items: [
          { text: 'Explain photosynthesis a second way because the textbook lost me', bin: 'help', why: 'Asking for another explanation builds understanding and replaces nothing you are graded on.' },
          { text: 'Generate a full lab report from my data and submit it', bin: 'self', why: 'Submitting generated work as your own misrepresents who did it, and you skip the learning.' },
          { text: 'Give me ten possible topics, then I will pick one and explain why', bin: 'help', why: 'You make the real decision. Brainstorming is a common allowed use, though you should still check your class rules.' },
          { text: 'Check the grammar and clarity of my own paragraph', bin: 'rules', why: 'Many classes allow this, some do not. Ask, and say what you used if asked.' },
          { text: 'Explain why my loop never ends, and then I will fix it', bin: 'help', why: 'You get an explanation, then do the fix yourself. You can explain the result.' },
          { text: 'Write the whole program for my project and I will hand it in', bin: 'self', why: 'The program is the assignment. Handing in generated code you cannot explain is not your work.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'Which request uses AI as a learning partner?',
        options: ['Write my essay', 'Quiz me on this chapter and tell me what I missed', 'Solve my problem set and show only the answers', 'Do my project'],
        answer: 1,
        explain: 'Quizzing makes you recall and shows your gaps. The others hand the thinking to the tool.',
      },
      {
        kind: 'tf',
        prompt: 'It is fine to paste an API key or password into a chatbot to get debugging help.',
        answer: false,
        explain: 'Secrets pasted into a chat can be stored or exposed. Replace them with placeholders before sharing code.',
      },
      {
        kind: 'multi',
        prompt: 'Select every good habit when using AI to help with code.',
        options: ['Read and run the code before trusting it', 'Ask it to explain what each part does', 'Submit code you cannot explain', 'Test it with examples where you already know the answer'],
        answers: [0, 1, 3],
        explain: 'Reading, understanding and testing are what make AI help safe. Submitting code you cannot explain is the one habit to avoid.',
      },
    ],
    takeaways: ['Ask questions that make you think.', 'Brainstorm wide, then choose and justify yourself.', 'Understand, test and explain every line you submit.'],
    glossary: ['academic-integrity'],
  },
];
