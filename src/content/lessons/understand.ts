import type { Lesson } from '../types';

export const understandLessons: Lesson[] = [
  {
    id: 'u1',
    path: 'understand',
    title: 'Rules or examples?',
    kicker: 'AI versus ordinary programs',
    minutes: 8,
    objective: 'Explain the difference between a program that follows written rules and an AI system that learns from examples, and pick which one fits a problem.',
    framework: 'AI4K12 Big Idea 3: Learning',
    beats: [
      {
        heading: 'An ordinary program is a recipe',
        paragraphs: [
          'In a traditional program, a person writes every rule. To catch junk mail you might write: if a message says "free prize", move it to spam.',
          'This works well when the rules are simple, stable and easy to say out loud. It is also easy to explain: you can point at the line that made the decision.',
        ],
        visual: {
          kind: 'compare',
          caption: 'Two ways to build a spam filter.',
          left: { title: 'Rules', items: ['A person writes the rules', 'The computer applies them', 'Output follows the rules exactly'] },
          right: { title: 'Learning', items: ['People supply examples with answers', 'The computer finds the pattern', 'Output follows the pattern it found'] },
        },
      },
      {
        heading: 'Some jobs have no rule you can write',
        paragraphs: [
          'Nobody can list the rules for spotting a cat in a photo or understanding a sentence. So instead of writing rules, we show a computer many examples with the right answers and let it find the pattern. That process is called training, and the result is a model.',
          '"Artificial intelligence" is the umbrella term for software that does tasks we usually link with human judgment. Most AI you meet today is built with machine learning.',
        ],
      },
      {
        heading: 'Neither one is magic',
        paragraphs: [
          'Rules are predictable but brittle: change one word and they miss. Learned models are flexible but can surprise you, and they are only as good as their examples.',
          'Many real products use both: a learned model makes a guess, and written rules decide what to do with it.',
        ],
      },
    ],
    example: {
      title: 'The spam filter that had to keep up',
      body: 'Early spam filters leaned on hand-written word lists. Spammers answered by changing spelling, such as "fr3e". Modern filters learn from huge numbers of messages that people mark as spam, so they notice new tricks without anyone rewriting a rule.',
      takeaway: 'When the world changes faster than people can write rules, learning from examples wins. When rules are simple and must be exact, ordinary code wins.',
    },
    widget: {
      id: 'spam-learner',
      title: 'Rules versus learning',
      intro: 'Build a keyword rule filter, predict which filter will do better, then test both on eight new messages.',
      pass: 60,
    },
    check: [
      {
        kind: 'single',
        prompt: 'Which task is the best fit for learning from examples instead of hand-written rules?',
        options: ['Converting miles to kilometers', 'Recognizing handwritten digits', 'Adding sales tax to a price', 'Sorting numbers from small to large'],
        answer: 1,
        explain: 'Nobody can write exact rules for every way a person might write a 7. The other three have clear formulas, so ordinary code does them perfectly.',
      },
      {
        kind: 'tf',
        prompt: 'A machine-learning model is a list of rules that a programmer wrote by hand.',
        answer: false,
        explain: 'A model is a set of numbers found during training. A programmer wrote the training process, not the rules the model ends up using.',
      },
      {
        kind: 'multi',
        prompt: 'Select every advantage of a rule-based program.',
        options: ['It is predictable and easy to explain', 'It can handle patterns nobody can describe', 'Its behavior does not change unless someone edits it', 'It gets better by itself as more data arrives'],
        answers: [0, 2],
        explain: 'Rules give predictability and explainability. Finding patterns nobody can describe, and improving with data, are strengths of learning systems.',
      },
    ],
    takeaways: ['Rules: a person writes them. Learning: examples teach the computer.', 'Choose rules for simple, exact jobs and learning for fuzzy ones.', 'A model is numbers found by training, not hidden code of rules.'],
    codex: ['ai', 'algorithm', 'machine-learning'],
  },
  {
    id: 'u2',
    path: 'understand',
    title: 'Learning from examples',
    kicker: 'Training data, models and testing',
    minutes: 10,
    objective: 'Describe how labeled training data teaches a model, and predict how poor data leads to poor results.',
    framework: 'AI4K12 Big Idea 3: Learning',
    beats: [
      {
        heading: 'Examples with answers',
        paragraphs: [
          'In supervised learning, every training example has features (facts a computer can measure, such as size or word count) and a label (the right answer, such as "spam").',
          'Training searches for a pattern that links features to labels. Once found, that pattern is the model.',
        ],
        visual: {
          kind: 'flow',
          caption: 'The learning loop, left to right.',
          steps: [{ label: 'Labeled examples' }, { label: 'Training', note: 'find the pattern' }, { label: 'Model' }, { label: 'New input' }, { label: 'Prediction' }],
        },
      },
      {
        heading: 'Train, then test on new data',
        paragraphs: [
          'You hide some examples and never train on them. Afterward you test on the hidden ones. That score tells you how the model handles things it has not seen.',
          'A model that memorizes its training set is overfitting: perfect on old examples, shaky on new ones. Testing on the training data hides that problem.',
        ],
      },
      {
        heading: 'Data is the teacher',
        paragraphs: [
          'A model can only learn patterns that are present in its examples. Too few examples, or examples from only one situation, produce a model that fails everywhere else.',
          'So the question to ask of any AI system is not only "how smart is it" but "what was it taught from, and who was left out?"',
        ],
      },
    ],
    example: {
      title: 'Picture this: a leaf-checking app',
      body: 'Imagine a plant app trained mostly on photos taken in bright greenhouse light. It scores very well in testing, because the test photos look the same. Out in a dim garden it keeps getting leaves wrong.',
      takeaway: 'High accuracy on data that looks like the training set says little about the real world. Test on data that looks like where the model will actually be used.',
    },
    widget: {
      id: 'classifier',
      title: 'Teach a model',
      intro: 'Add labeled examples of two kinds of fruit. The model colors the map by what it would predict. Then test it on twelve hidden fruits.',
      pass: 75,
    },
    check: [
      {
        kind: 'single',
        prompt: 'In supervised learning, what is a label?',
        options: ['A measurable property of an example', 'The correct answer attached to an example', 'The name of the model', 'A warning about bias'],
        answer: 1,
        explain: 'A label is the right answer for that example, such as "spam" or "ripe". Measurable properties are called features.',
      },
      {
        kind: 'multi',
        prompt: 'Select every situation that makes a model\'s results less trustworthy.',
        options: ['All training examples come from one neighborhood', 'The training set has thousands of varied examples', 'Accuracy is measured on the same examples used for training', 'A separate test set was kept hidden from training'],
        answers: [0, 2],
        explain: 'Narrow data teaches a narrow model, and scoring on the training examples cannot reveal overfitting. Varied data and a hidden test set are what good practice looks like.',
      },
      {
        kind: 'tf',
        prompt: 'A model that scores 100% on its own training examples will do just as well on new data.',
        answer: false,
        explain: 'That perfect score can mean the model memorized its examples (overfitting). Only a test on unseen data shows how it generalizes.',
      },
    ],
    takeaways: ['Examples have features (inputs) and labels (answers).', 'Always test on data the model never trained on.', 'Thin or one-sided data produces a one-sided model.'],
    codex: ['training-data', 'model', 'feature', 'label', 'overfitting'],
  },
  {
    id: 'u3',
    path: 'understand',
    title: 'Neural networks, gently',
    kicker: 'Units, weights and training',
    minutes: 10,
    objective: 'Describe a neural network as layers of simple units with adjustable weights, tuned by repeated small corrections.',
    framework: 'AI4K12 Big Idea 3: Learning (with Big Idea 2: Representation)',
    beats: [
      {
        heading: 'A unit is a tiny weighted vote',
        paragraphs: [
          'Each unit takes some numbers in, multiplies each by its own weight, adds them up, and passes the total through a simple squashing function. One number comes out.',
          'Stack units into layers and feed each layer into the next, and the whole network can bend a decision boundary into complicated shapes.',
        ],
        visual: { kind: 'layers', caption: 'A small network: 2 inputs, 4 hidden units, 1 output.', sizes: [2, 4, 1], labels: ['Inputs', 'Hidden layer', 'Output'] },
      },
      {
        heading: 'Learning means nudging weights',
        paragraphs: [
          'A new network has random weights and guesses badly. A loss function scores how wrong those guesses are. Training nudges every weight a tiny amount in whichever direction lowers the loss, then repeats thousands of times. That method is called gradient descent, and backpropagation is how the network works out which way each weight should move.',
        ],
      },
      {
        heading: 'Deep, but not brain-like',
        paragraphs: [
          '"Deep learning" just means many layers. Networks were loosely inspired by neurons, but they are arithmetic, not thinking. Today\'s largest models have billions of weights, called parameters.',
          'More units let a network learn more complicated patterns. They do not give it understanding or common sense.',
        ],
      },
    ],
    example: {
      title: 'Reading ZIP codes',
      body: 'In the 1990s, a team at Bell Labs led by Yann LeCun built a neural network that read handwritten ZIP codes on mail. It learned from many labeled digit images rather than from hand-written rules about what a 3 looks like.',
      takeaway: 'Layers of simple weighted units can learn patterns that are too messy for rules.',
    },
    widget: {
      id: 'network',
      title: 'Train a network',
      intro: 'Pick a dataset, set how many hidden units to use, and train. Watch the boundary bend. Reach 90% on the Ring or Corners pattern.',
      pass: 90,
    },
    check: [
      {
        kind: 'single',
        prompt: 'What does training change inside a neural network?',
        options: ['The weights', 'The training examples', 'The programming language', 'The size of the screen'],
        answer: 0,
        explain: 'Training adjusts the weights (parameters). The examples stay the same, and the code that runs the network does not change.',
      },
      {
        kind: 'tf',
        prompt: 'Neural networks work exactly the way human brains do.',
        answer: false,
        explain: 'They were loosely inspired by neurons, but a network is a stack of weighted sums and simple functions. Human brains are far more complex and work differently.',
      },
      {
        kind: 'single',
        prompt: 'What does the loss function measure?',
        options: ['How fast the network runs', 'How far its predictions are from the correct answers', 'How many layers it has', 'How much data it saw'],
        answer: 1,
        explain: 'Loss is the score of "how wrong". Training tries to push it down.',
      },
    ],
    takeaways: ['A network is layers of weighted sums, not a digital brain.', 'Training = many tiny weight nudges that lower the loss.', 'More hidden units can bend more complicated boundaries.'],
    codex: ['neural-network', 'weight', 'loss', 'gradient-descent'],
  },
  {
    id: 'u4',
    path: 'understand',
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
      intro: 'This tiny model learned from a short story about a harbor town. Watch its probabilities, then see what temperature does.',
      pass: 66,
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
    codex: ['generative-ai', 'language-model', 'inference', 'temperature'],
  },
  {
    id: 'u5',
    path: 'understand',
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
        visual: { kind: 'tokens', caption: 'One way a sentence might be split. Real tokenizers differ.', tokens: ['The', ' harbor', ' at', ' dawn', ' is', ' qu', 'iet', '.'] },
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
      pass: 100,
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
    codex: ['token', 'context-window', 'prompt'],
  },
];
