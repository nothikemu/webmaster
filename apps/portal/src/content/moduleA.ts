import type { ModuleContent } from './types';

export const moduleA: ModuleContent = {
  id: 'foundations',
  code: 'A',
  index: 1,
  title: 'Foundations',
  label: 'MOD 01 / FOUNDATIONS',
  themeSection: 'Fundamental AI concepts',
  tagline: 'Rules write the program. Examples write the model.',
  objective:
    'Explain how a machine learning system differs from hand-written rules, name the parts of a neural network, and tell training apart from inference.',
  centerpiece: {
    name: 'Neural Topology Swarm',
    summary:
      '6,000 particles arranged as a layered network. Move through it and watch the weights spring back.',
    description:
      'A particle field arranged in five layers of nodes, joined by faint lines between near neighbours. Pointing at the field pushes, pulls or spins nearby particles depending on the selected mode. When the pointer leaves, particles spring back to their layered positions. Use the mode buttons or the left and right arrow keys to change mode, and the arrow keys on the field to move the virtual pointer.',
  },
  lessons: [
    {
      id: 'a1',
      title: "What AI is, and what it isn't",
      kicker: 'Definitions',
      minutes: 3,
      body: [
        'Artificial intelligence is software that performs tasks we associate with human judgment: recognizing speech, ranking search results, spotting a tumor in a scan. The term covers a wide range, from a chess engine that searches millions of positions a second to a model that writes paragraphs. It does not mean a machine that thinks or understands the way a person does.',
        'Most AI in use today is narrow. A model that reads handwritten digits cannot translate French. It does one job, measured by one kind of score, and it fails in ways that are often surprising because it has no common sense to fall back on.',
      ],
      keyPoints: [
        'AI is a family of techniques, not one machine.',
        "Today's systems are narrow: one task, one kind of input.",
        'Performance is a score, such as accuracy on a held-out test set.',
      ],
      check: {
        prompt: 'A model reads handwritten digits with 99% accuracy. Which claim is best supported?',
        options: [
          'It can read any handwriting in any language.',
          'It performs well on the narrow task it was built and tested for.',
          'It understands what numbers mean.',
          'It will keep improving by itself after release.',
        ],
        answer: 1,
        explain:
          '99% is a score on one task and one test set. It says nothing about other tasks, and a deployed model does not improve unless it is retrained.',
      },
    },
    {
      id: 'a2',
      title: 'Rules versus learning',
      kicker: 'Machine learning',
      minutes: 4,
      body: [
        "A rule-based program follows instructions a person wrote: if the email contains a banned phrase, mark it as spam. This works when you can state the rules. It breaks when you can't. Nobody can write down the rules for recognizing a cat in a photo.",
        'Machine learning flips the workflow. You provide examples with the right answers, and an algorithm searches for a function that maps inputs to answers. The result is a model: a set of numbers, called parameters, that encodes the pattern. Change the examples and you change the model, with no new code.',
      ],
      keyPoints: [
        'Rules: a person writes the logic. Learning: examples produce the logic.',
        'A model is a function defined by learned parameters.',
        'Better examples often beat more rules.',
      ],
      check: {
        prompt:
          'A thermostat turns on heat below 68°F. A spam filter learns from 50,000 labelled emails. Which is machine learning?',
        options: ['Only the thermostat', 'Only the spam filter', 'Both', 'Neither'],
        answer: 1,
        explain:
          'The thermostat executes a rule a person wrote. The spam filter derives its decision boundary from labelled examples.',
      },
    },
    {
      id: 'a3',
      title: 'Neural networks',
      kicker: 'Architecture',
      minutes: 4,
      body: [
        'A neural network is a stack of layers. Each artificial neuron takes numbers in, multiplies each by a weight, adds them up, and passes the sum through a nonlinear function. One neuron is weak. Thousands arranged in layers can represent very complicated patterns.',
        'The input layer holds the raw numbers, such as the 784 brightness values of a 28 by 28 handwritten digit. Hidden layers combine them into progressively more abstract features. The output layer produces the answer, often ten scores, one per digit. The weights are the model, and a large language model has billions of them.',
      ],
      keyPoints: [
        'Layers: input, hidden, output.',
        'Each neuron computes a weighted sum, then a nonlinearity.',
        'The weights are what training adjusts.',
      ],
      check: {
        prompt: 'A 28 by 28 grayscale image feeds a network. How many input values does the first layer receive?',
        options: ['28', '56', '784', '10'],
        answer: 2,
        explain: '28 × 28 = 784 pixel values, one input per pixel.',
      },
    },
    {
      id: 'a4',
      title: 'Training and inference',
      kicker: 'Two phases',
      minutes: 4,
      body: [
        'Training is the slow, expensive phase. The model makes predictions on training examples, a loss function measures how wrong they are, and an optimizer nudges every weight to reduce that loss. Gradient descent does the nudging, and backpropagation works out which direction each weight should move. This repeats over millions of examples.',
        'Inference is the fast phase. The weights are frozen. You feed in new input and read out a prediction, which is what runs when you unlock a phone with your face. Training happens once on large hardware. Inference happens constantly, often on the device in your hand.',
      ],
      keyPoints: [
        'Training changes the weights. Inference does not.',
        'Loss measures error. Gradient descent reduces it.',
        'Evaluate on data the model never trained on.',
      ],
      check: {
        prompt: 'When your phone suggests the next word as you type, which phase produces the suggestion?',
        options: [
          'Training, because it is learning your voice',
          'Inference, using weights that are already fixed',
          'Backpropagation',
          'Data labelling',
        ],
        answer: 1,
        explain: 'Producing a suggestion is a forward pass through fixed weights, which is inference.',
      },
    },
    {
      id: 'a5',
      title: 'Data and features',
      kicker: 'Inputs',
      minutes: 4,
      body: [
        'A model can only learn what its data shows. A feature is a measurable property fed to the model: a pixel value, a word count, a patient\'s age. Deep networks learn useful features themselves, but they still depend on the examples they are given.',
        'Three data problems cause most failures. Too little data, so the model memorizes instead of generalizing, which is called overfitting. Unrepresentative data, so it fails on people or situations it has never seen. Wrong labels, so it confidently learns the wrong thing. ImageNet, the roughly 1.2 million image dataset behind the 2012 AlexNet breakthrough, showed how far scale can go. Later audits of it also found mislabelled images.',
      ],
      keyPoints: [
        'Features are the measurable inputs.',
        'Overfitting: memorizing training data instead of the pattern.',
        'Skewed or mislabelled data produces a skewed model.',
      ],
      check: {
        prompt: 'A model scores 99% on its training set and 61% on new data. What is the likeliest problem?',
        options: ['Underfitting', 'Overfitting', 'Too few output classes', 'A slower GPU'],
        answer: 1,
        explain:
          'A large gap between training and new-data performance means the model memorized examples instead of learning a pattern that generalizes.',
      },
    },
  ],
  quiz: [
    {
      id: 'qa1',
      lesson: 'a1',
      prompt: "Which statement about today's AI systems is most accurate?",
      options: [
        'They are general-purpose and understand context like people.',
        'They are mostly narrow: built and tested for specific tasks.',
        'They always improve with use.',
        'They cannot make mistakes on familiar inputs.',
      ],
      answer: 1,
      explain: 'Current systems are narrow. Each is built, trained and scored for particular tasks.',
    },
    {
      id: 'qa2',
      lesson: 'a2',
      prompt: 'What is the main difference between a rule-based program and a machine learning model?',
      options: [
        'Rule-based programs are always slower.',
        'In machine learning, examples determine the logic instead of a person writing it.',
        'Machine learning never needs data.',
        'Rule-based programs use neural networks.',
      ],
      answer: 1,
      explain: 'Rules are written by people. A learned model derives its behaviour from examples.',
    },
    {
      id: 'qa3',
      lesson: 'a3',
      prompt: 'In a neural network, what are the weights?',
      options: [
        'The number of layers',
        "Learned numbers that scale each connection's signal",
        'The training dataset',
        'The output labels',
      ],
      answer: 1,
      explain: 'Weights scale the signal on each connection. Training adjusts them.',
    },
    {
      id: 'qa4',
      lesson: 'a4',
      prompt: "Which step changes a model's weights?",
      options: ['Inference', 'Deployment', 'Training', 'Prompting'],
      answer: 2,
      explain: 'Training updates the weights. Inference only reads them.',
    },
    {
      id: 'qa5',
      lesson: 'a5',
      prompt:
        'A hiring model trained mostly on résumés from one demographic performs worse on others. Which data problem is this?',
      options: [
        'Overfitting to noise',
        'Unrepresentative training data',
        'Too many features',
        'Slow inference',
      ],
      answer: 1,
      explain: 'The training data did not cover the people the model is later used on.',
    },
  ],
  challenge: {
    kind: 'choice',
    title: 'Rules, training or inference',
    intro:
      'Eight systems. For each, name what is happening: a person-written rule, a training step, or inference on a finished model.',
    parSeconds: 75,
    passMark: 7,
    options: ['Rule-based', 'Training', 'Inference'],
    items: [
      {
        id: 'ca1',
        prompt: 'A bank engineer writes: if a transfer exceeds $10,000, flag it for review.',
        answer: 0,
        explain: 'A person wrote the condition. Nothing is learned from data.',
      },
      {
        id: 'ca2',
        prompt: 'A speech model adjusts its weights after scoring 2 million transcribed clips.',
        answer: 1,
        explain: 'Weights are changing in response to loss. That is training.',
      },
      {
        id: 'ca3',
        prompt: 'A phone compares your face with its stored model and unlocks in under a second.',
        answer: 2,
        explain: 'A frozen model is making a prediction on new input. That is inference.',
      },
      {
        id: 'ca4',
        prompt: "A spam filter's weights are updated overnight using this week's reported spam.",
        answer: 1,
        explain: 'New labelled examples are changing the weights. That is training.',
      },
      {
        id: 'ca5',
        prompt: 'A game character walks toward the player whenever the distance is under 10 meters.',
        answer: 0,
        explain: 'A hand-written threshold, not a learned pattern.',
      },
      {
        id: 'ca6',
        prompt: 'A hospital runs a trained model on a new scan to estimate tumor risk.',
        answer: 2,
        explain: 'The model is already trained. It is only producing a prediction.',
      },
      {
        id: 'ca7',
        prompt: 'Engineers compute loss on a batch, then backpropagate to update 175 billion parameters.',
        answer: 1,
        explain: 'Backpropagation and parameter updates are the core of training.',
      },
      {
        id: 'ca8',
        prompt: 'A translation app converts a sentence using a model that was frozen before release.',
        answer: 2,
        explain: 'Frozen weights, new input: inference.',
      },
    ],
  },
  requiredActions: [
    { id: 'mode-deflect', label: 'Try Deflect' },
    { id: 'mode-attract', label: 'Try Attract' },
    { id: 'mode-orbit', label: 'Try Orbit' },
  ],
  badge: {
    name: 'Neural Topology',
    criteria:
      'Practice 4 of 5 lessons, use all three pointer modes, score 4 of 5 on the knowledge check, and clear the challenge.',
  },
};
