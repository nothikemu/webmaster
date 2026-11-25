import type { CaseStudy } from './types';

/**
 * Six situations from school life. Each choice explains what follows from it and is marked as one that holds up, holds up in part,
 * or does not. The mark is a judgement with a reason, not a score: nothing is added up, and you can read every branch.
 */
export const CASES: readonly CaseStudy[] = [
  {
    id: 'sc1',
    title: 'The all-nighter essay',
    setting: 'It is 11 p.m. and your essay is due at 8 a.m. The syllabus says: "AI may be used to brainstorm and to check grammar. The writing must be yours."',
    lesson: 't5',
    steps: [
      {
        prompt: 'You are stuck on the opening paragraph. What do you do?',
        choices: [
          { text: 'Ask the AI to write the introduction and paste it in.', fit: 'weak', response: 'The syllabus says the writing must be yours. A pasted introduction is not, and you skip the exact skill the assignment is practicing.' },
          { text: 'Ask for three different ways an essay like this could open, then write your own.', fit: 'strong', response: 'Brainstorming is allowed, and you made the choice and did the writing. This is the kind of use the syllabus describes.' },
          { text: 'Stare at the screen and do nothing until 2 a.m.', fit: 'mixed', response: 'No rule broken, but you passed up help that was explicitly allowed.' },
        ],
      },
      {
        prompt: 'Your draft is done. You want a grammar check. What do you do?',
        choices: [
          { text: 'Paste the whole essay, with your name and student ID on it, into a chatbot.', fit: 'weak', response: 'Grammar help is allowed, but your name and ID do not need to leave your device. Remove them first.' },
          { text: 'Paste the essay with your name and ID removed, accept only fixes you understand, and add a one-line note about the grammar check.', fit: 'strong', response: 'Allowed use, minimal data, and honest. Accepting only changes you understand keeps the voice yours.' },
          { text: 'Ask the AI to rewrite the whole essay to sound smarter, and submit that.', fit: 'weak', response: 'A rewrite is not a grammar check. The essay would no longer be your writing.' },
        ],
      },
    ],
  },
  {
    id: 'sc2',
    title: 'The source that does not exist',
    setting: 'You are writing a research paper. An AI assistant gave you four citations that look perfect.',
    lesson: 't4',
    steps: [
      {
        prompt: 'What do you do with the four citations?',
        choices: [
          { text: 'Put all four in your bibliography.', fit: 'weak', response: 'AI tools can invent real-looking citations. Listing sources you have not opened is a serious problem.' },
          { text: 'Search for each one. Two cannot be found, so you drop them.', fit: 'strong', response: 'Exactly right. You verified before citing, and you caught fabricated sources.' },
          { text: 'Ask the AI whether the citations are real, and trust its "yes".', fit: 'weak', response: 'The same tool that may have made them up cannot reliably vouch for them. Check outside the chat.' },
        ],
      },
      {
        prompt: 'You find one real study, but you can only open the abstract. What now?',
        choices: [
          { text: 'Cite it as though you read the whole paper.', fit: 'weak', response: 'Citing more than you read overstates your research. Say only what the abstract supports.' },
          { text: 'Read the paper, or limit your claim to what the abstract supports.', fit: 'strong', response: 'Your claim matches what you actually read. That is honest research.' },
          { text: 'Ask the AI to summarize the whole paper, then cite that summary.', fit: 'mixed', response: 'The summary may not match the paper. Cite the paper, and only what you have read.' },
        ],
      },
    ],
  },
  {
    id: 'sc3',
    title: 'The group-chat photo',
    setting: 'A friend sends a classmate\'s photo to the group chat and says, "Let\'s make a funny AI video of them."',
    lesson: 'r3',
    steps: [
      {
        prompt: 'What do you do?',
        choices: [
          { text: 'Make it and post it to the chat. It is only a joke.', fit: 'weak', response: 'Making a fake video of someone without their permission can embarrass or hurt them, and once it is shared you cannot take it back.' },
          { text: 'Say no, and explain that you will not make AI content of someone without their okay.', fit: 'strong', response: 'You protected the classmate\'s privacy and set a clear line. Others often follow when one person speaks up.' },
          { text: 'Make it, but only share it with the three of you.', fit: 'weak', response: 'Small groups still leak. The classmate\'s image was used without permission either way.' },
        ],
      },
      {
        prompt: 'Later, a fake clip of a teacher is going around school. What do you do?',
        choices: [
          { text: 'Forward it. It is hilarious.', fit: 'weak', response: 'Sharing helps a fake spread. It may be false and it can harm the person in it.' },
          { text: 'Do not share it. Report it to a trusted adult or the platform.', fit: 'strong', response: 'Stopping the spread and reporting it is the responsible move. Use SIFT if you are unsure whether it is real.' },
          { text: 'Ask in the comments whether it is real.', fit: 'mixed', response: 'Comments are not a reliable check, and engaging can push it further. Investigate the source instead.' },
        ],
      },
    ],
  },
  {
    id: 'sc4',
    title: 'The study-buddy bot',
    setting: 'You have a chemistry exam on Friday, and your school lets you use an AI tutor.',
    lesson: 't5',
    steps: [
      {
        prompt: 'How do you start studying?',
        choices: [
          { text: 'Ask it to solve every practice problem and copy the answers.', fit: 'weak', response: 'Copied answers feel productive and teach nothing. The exam will not have the answer key.' },
          { text: 'Try the problems first, then have it check your reasoning and explain your mistakes.', fit: 'strong', response: 'Attempting first is how learning sticks. The AI becomes a coach, not a crutch.' },
          { text: 'Ask it to predict the exam questions and memorize those answers.', fit: 'mixed', response: 'It cannot know the exam. Predictions can leave real gaps.' },
        ],
      },
      {
        prompt: 'The tutor gives a formula that does not match your textbook. What do you do?',
        choices: [
          { text: 'Trust the AI. It sounded sure.', fit: 'mixed', response: 'Confidence is not evidence. A conflict with your textbook is a flag.' },
          { text: 'Check the textbook, then ask the AI to explain the difference.', fit: 'strong', response: 'You used a reliable source to settle it and learned why the two differ.' },
          { text: 'Ignore both and guess on the exam.', fit: 'mixed', response: 'You skipped a real chance to learn which one is right.' },
        ],
      },
    ],
  },
  {
    id: 'sc5',
    title: 'The crashing program',
    setting: 'Your programming assignment must be your own work. The teacher allows AI only to explain errors.',
    lesson: 't5',
    steps: [
      {
        prompt: 'Your program crashes. How do you ask for help?',
        choices: [
          { text: 'Paste the whole project, API key included, and ask for a full fix.', fit: 'weak', response: 'The key is a secret that should never be pasted, and a "full fix" goes beyond explaining errors.' },
          { text: 'Paste the error and the few relevant lines with the key replaced by a placeholder, and ask what the error means.', fit: 'strong', response: 'Secrets protected, help limited to an explanation, and you do the fixing. This matches the rule.' },
          { text: 'Ask the AI to write the whole program from scratch and submit it.', fit: 'weak', response: 'The program is the assignment. Submitting generated code breaks the rule and skips the learning.' },
        ],
      },
      {
        prompt: 'The AI suggests a fix you do not understand. What now?',
        choices: [
          { text: 'Paste it in and hope it works.', fit: 'weak', response: 'Code you cannot explain is a risk. It may hide new bugs, and you could not defend it.' },
          { text: 'Ask it to explain each line, test it, then write the fix yourself in your own style.', fit: 'strong', response: 'You understand it and the fix is yours. Explaining errors is exactly what the teacher allows.' },
          { text: 'Copy it in without a word.', fit: 'weak', response: 'The rule allows explanations only. Copying a fix and staying quiet is the opposite of transparent.' },
        ],
      },
    ],
  },
  {
    id: 'sc6',
    title: 'The flagged essay',
    setting: 'You sit on the student council. A school tool flagged a classmate\'s essay as "likely AI-written", and the council is asked what the policy should be.',
    lesson: 'r5',
    steps: [
      {
        prompt: 'What should happen after a flag?',
        choices: [
          { text: 'Treat the flag as proof and fail the essay.', fit: 'weak', response: 'AI-writing detectors make mistakes in both directions. A flag alone is not evidence, and failing someone on it is unfair.' },
          { text: 'A person reviews the flag with other evidence and the student gets to explain.', fit: 'strong', response: 'Keeping a human in the loop, with a way to respond, is the fair process for a tool that can be wrong.' },
          { text: 'Ban the tool with no discussion.', fit: 'mixed', response: 'Skipping discussion loses the chance to design a fairer process and to hear from teachers and students.' },
        ],
      },
      {
        prompt: 'What should the policy say about students\' data in the tool?',
        choices: [
          { text: 'Upload every student essay with names attached.', fit: 'weak', response: 'Names and essays are personal data and school records. Collect less.' },
          { text: 'Collect the minimum, tell families what is stored and for how long, and let them ask questions.', fit: 'strong', response: 'Data minimization and transparency are the core of responsible data use in schools.' },
          { text: 'Say nothing. It is not the council\'s job.', fit: 'mixed', response: 'Silence leaves students unprotected. The council can at least ask the questions.' },
        ],
      },
    ],
  },
];

/** Lowest and highest total a scenario can produce, for scoring. */
