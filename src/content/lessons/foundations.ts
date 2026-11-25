import type { Lesson } from '../types';

/** Foundations: what AI is and is not, rules versus learning, neural networks, training and inference, data and features. Five core lessons, then lessons that go further. */
export const foundationsLessons: Lesson[] = [
  {
    id: 'f1',
    slug: 'what-ai-is',
    module: 'foundations',
    core: true,
    title: "What AI is, and what it isn't",
    kicker: 'Definitions',
    minutes: 4,
    objective: "Say what the word AI covers, what it does not mean, and why a score on one task says little about any other.",
    beats: [
      {
        heading: 'A family of techniques',
        paragraphs: [
          'Artificial intelligence is software that performs tasks we associate with human judgment: recognizing speech, ranking search results, spotting a tumor in a scan. The term covers a wide range, from a chess engine that searches millions of positions a second to a model that writes paragraphs. It does not mean a machine that thinks or understands the way a person does.',
        ],
        visual: {
          kind: 'compare',
          caption: 'The word covers a lot of ground, and it promises less than it sounds like.',
          left: { title: 'AI is', items: ['Software that performs tasks we link with human judgment', 'A wide range, from chess search to text generation', 'Measured by a score, such as accuracy on a test set'] },
          right: { title: 'AI is not', items: ['A machine that thinks the way a person does', 'One general-purpose mind', 'A system that improves by itself after release'] },
        },
      },
      {
        heading: 'Narrow by design',
        paragraphs: [
          'Most AI in use today is narrow. A model that reads handwritten digits cannot translate French. It does one job, measured by one kind of score, and it fails in ways that are often surprising because it has no common sense to fall back on.',
        ],
      },
    ],
    check: [
      {
        kind: 'single',
        prompt: 'A model reads handwritten digits with 99% accuracy. Which claim is best supported?',
        options: ['It can read any handwriting in any language.', 'It performs well on the narrow task it was built and tested for.', 'It understands what numbers mean.', 'It will keep improving by itself after release.'],
        answer: 1,
        explain: '99% is a score on one task and one test set. It says nothing about other tasks, and a deployed model does not improve unless it is retrained.',
      },
      {
        kind: 'single',
        prompt: "Which statement about today's AI systems is most accurate?",
        options: ['They are general-purpose and understand context like people.', 'They are mostly narrow: built and tested for specific tasks.', 'They always improve with use.', 'They cannot make mistakes on familiar inputs.'],
        answer: 1,
        explain: 'Current systems are narrow. Each is built, trained and scored for particular tasks.',
      },
    ],
    takeaways: ['AI is a family of techniques, not one machine.', "Today's systems are narrow: one task, one kind of input.", 'Performance is a score, such as accuracy on a held-out test set.'],
    glossary: ['ai', 'algorithm'],
  },
  {
    id: 'u1',
    slug: 'rules-versus-learning',
    module: 'foundations',
    core: true,
    title: 'Rules versus learning',
    kicker: 'Rules or examples?',
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
    glossary: ['ai', 'algorithm', 'machine-learning'],
  },
  {
    id: 'u3',
    slug: 'neural-networks',
    module: 'foundations',
    core: true,
    title: 'Neural networks',
    kicker: 'Neural networks, gently',
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
      intro: 'Pick a dataset, set how many hidden units to use, and train. Watch the boundary bend. The Ring and Corners patterns cannot be split by a straight line, so they show what hidden units are for.',
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
    glossary: ['neural-network', 'weight', 'loss', 'gradient-descent'],
  },
  {
    id: 'f4',
    slug: 'training-and-inference',
    module: 'foundations',
    core: true,
    title: 'Training and inference',
    kicker: 'Two phases',
    minutes: 4,
    objective: 'Tell training, which changes the weights, from inference, which only reads them, and name what loss and gradient descent do.',
    beats: [
      {
        heading: 'Training is the slow phase',
        paragraphs: [
          'Training is the slow, expensive phase. The model makes predictions on training examples, a loss function measures how wrong they are, and an optimizer nudges every weight to reduce that loss. Gradient descent does the nudging, and backpropagation works out which direction each weight should move. This repeats over millions of examples.',
        ],
        visual: {
          kind: 'flow',
          caption: 'One round of training. It repeats over millions of examples.',
          steps: [
            { label: 'Predict', note: 'on a training example' },
            { label: 'Measure loss', note: 'how wrong was it?' },
            { label: 'Backpropagate', note: 'which way should each weight move?' },
            { label: 'Nudge the weights', note: 'gradient descent' },
          ],
        },
      },
      {
        heading: 'Inference is the fast phase',
        paragraphs: [
          'Inference is the fast phase. The weights are frozen. You feed in new input and read out a prediction, which is what runs when you unlock a phone with your face. Training happens once on large hardware. Inference happens constantly, often on the device in your hand.',
        ],
      },
    ],
    widget: {
      id: 'sorter',
      title: 'Rules, training or inference?',
      intro: 'Eight situations. For each one, decide what is happening: a rule a person wrote, a training step, or inference on a finished model. Every answer explains itself, and you can sort them again.',
      config: {
        bins: [
          { id: 'rule', label: 'A rule a person wrote' },
          { id: 'training', label: 'Training' },
          { id: 'inference', label: 'Inference' },
        ],
        items: [
          { text: 'A bank engineer writes: if a transfer exceeds $10,000, flag it for review.', bin: 'rule', why: 'A person wrote the condition. Nothing is learned from data.' },
          { text: 'A speech model adjusts its weights after scoring 2 million transcribed clips.', bin: 'training', why: 'Weights are changing in response to loss. That is training.' },
          { text: 'A phone compares your face with its stored model and unlocks in under a second.', bin: 'inference', why: 'A frozen model is making a prediction on new input. That is inference.' },
          { text: "A spam filter's weights are updated overnight using this week's reported spam.", bin: 'training', why: 'New labelled examples are changing the weights. That is training.' },
          { text: 'A game character walks toward the player whenever the distance is under 10 meters.', bin: 'rule', why: 'A hand-written threshold, not a learned pattern.' },
          { text: 'A hospital runs a trained model on a new scan to estimate tumor risk.', bin: 'inference', why: 'The model is already trained. It is only producing a prediction.' },
          { text: 'Engineers compute loss on a batch, then backpropagate to update 175 billion parameters.', bin: 'training', why: 'Backpropagation and parameter updates are the core of training.' },
          { text: 'A translation app converts a sentence using a model that was frozen before release.', bin: 'inference', why: 'Frozen weights, new input: inference.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'When your phone suggests the next word as you type, which phase produces the suggestion?',
        options: ['Training, because it is learning your voice', 'Inference, using weights that are already fixed', 'Backpropagation', 'Data labelling'],
        answer: 1,
        explain: 'Producing a suggestion is a forward pass through fixed weights, which is inference.',
      },
      {
        kind: 'single',
        prompt: "Which step changes a model's weights?",
        options: ['Inference', 'Deployment', 'Training', 'Prompting'],
        answer: 2,
        explain: 'Training updates the weights. Inference only reads them.',
      },
    ],
    takeaways: ['Training changes the weights. Inference does not.', 'Loss measures error. Gradient descent reduces it.', 'Evaluate on data the model never trained on.'],
    glossary: ['training', 'inference', 'loss', 'gradient-descent', 'backpropagation'],
  },
  {
    id: 'f5',
    slug: 'data-and-features',
    module: 'foundations',
    core: true,
    title: 'Data and features',
    kicker: 'Inputs',
    minutes: 4,
    objective: 'Name what a feature is, and recognize the three data problems that cause most failures: too little data, unrepresentative data, and wrong labels.',
    beats: [
      {
        heading: 'A model learns what its data shows',
        paragraphs: [
          "A model can only learn what its data shows. A feature is a measurable property fed to the model: a pixel value, a word count, a patient's age. Deep networks learn useful features themselves, but they still depend on the examples they are given.",
        ],
      },
      {
        heading: 'Three ways data goes wrong',
        paragraphs: [
          'Three data problems cause most failures. Too little data, so the model memorizes instead of generalizing, which is called overfitting. Unrepresentative data, so it fails on people or situations it has never seen. Wrong labels, so it confidently learns the wrong thing. ImageNet, the roughly 1.2 million image dataset behind the 2012 AlexNet breakthrough, showed how far scale can go. Later audits of it also found mislabelled images.',
        ],
        visual: {
          kind: 'compare',
          caption: 'The three problems, and what to look at for each.',
          left: { title: 'What goes wrong', items: ['Too little data: the model memorizes (overfitting)', 'Unrepresentative data: it fails on people it has never seen', 'Wrong labels: it confidently learns the wrong thing'] },
          right: { title: 'What to look at', items: ['Performance on data the model never trained on', 'Who and what is missing from the examples', 'The labels themselves: audits of ImageNet found mislabelled images'] },
        },
      },
    ],
    check: [
      {
        kind: 'single',
        prompt: 'A model scores 99% on its training set and 61% on new data. What is the likeliest problem?',
        options: ['Underfitting', 'Overfitting', 'Too few output classes', 'A slower GPU'],
        answer: 1,
        explain: 'A large gap between training and new-data performance means the model memorized examples instead of learning a pattern that generalizes.',
      },
      {
        kind: 'single',
        prompt: 'A hiring model trained mostly on résumés from one demographic performs worse on others. Which data problem is this?',
        options: ['Overfitting to noise', 'Unrepresentative training data', 'Too many features', 'Slow inference'],
        answer: 1,
        explain: 'The training data did not cover the people the model is later used on.',
      },
    ],
    takeaways: ['Features are the measurable inputs.', 'Overfitting: memorizing training data instead of the pattern.', 'Skewed or mislabelled data produces a skewed model.'],
    glossary: ['feature', 'overfitting', 'training-data', 'label'],
  },
  {
    id: 'u2',
    slug: 'learning-from-examples',
    module: 'foundations',
    core: false,
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
    glossary: ['training-data', 'model', 'feature', 'label', 'overfitting'],
  },
];
