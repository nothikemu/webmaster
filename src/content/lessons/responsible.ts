import type { Lesson } from '../types';

export const responsibleLessons: Lesson[] = [
  {
    id: 'r1',
    path: 'responsible',
    title: 'Bias in, bias out',
    kicker: 'How unfair patterns get learned',
    minutes: 10,
    objective: 'Explain how biased data and design lead to unfair AI results, and spot a proxy variable that carries the bias back in.',
    framework: 'AI4K12 Big Idea 5: Societal Impact',
    beats: [
      {
        heading: 'Models copy the patterns they are given',
        paragraphs: [
          'A model learns from past examples. If those examples reflect past unfairness, such as who got hired or whose photos were collected, the model can learn that unfairness and repeat it at scale. In AI, "bias" means a systematic unfairness in how a system treats people or cases.',
        ],
      },
      {
        heading: 'Hidden helpers: proxy variables',
        paragraphs: [
          'Removing an obvious feature such as gender or race does not fix the problem if other features track it closely. A ZIP code, a school, or a club can act as a stand-in, called a proxy. The model finds the pattern anyway.',
        ],
        visual: {
          kind: 'compare',
          caption: 'Taking out the obvious feature is not enough.',
          left: { title: 'What you removed', items: ['Name', 'Gender'] },
          right: { title: 'What can still leak it', items: ['Neighborhood', 'Clubs and hobbies', 'Word choices'] },
        },
      },
      {
        heading: 'Ask who is in the data',
        paragraphs: [
          'Responsible teams check how a system performs for different groups, not just on average. They ask who is in the training data and who is missing, who tested it, who is affected, and whether a person can appeal the result.',
        ],
      },
    ],
    example: {
      title: 'Two documented cases',
      body: 'A 2018 study by Joy Buolamwini and Timnit Gebru found commercial face-analysis tools made far more errors on darker-skinned women, up to about 35 percent, than on lighter-skinned men, under 1 percent. That same year, Reuters reported that Amazon dropped an experimental hiring tool after it learned to mark down resumes that included the word "women\'s".',
      takeaway: 'Average accuracy can hide a group that the system fails. Test for each group.',
    },
    widget: {
      id: 'bias-audit',
      title: 'Audit the screener',
      intro: 'A hiring model trained on past hires picks six of twelve applicants. Switch features off and see who it picks. Aim for a fair spread without dropping real skill.',
      pass: 80,
    },
    check: [
      {
        kind: 'single',
        prompt: 'Why can deleting a feature like gender still leave a model biased?',
        options: ['Models ignore deleted features anyway', 'Other features, called proxies, can still track it', 'Gender is not a real variable', 'Deleting data slows the model down'],
        answer: 1,
        explain: 'ZIP code, clubs or word choice can correlate with the removed feature, so the pattern survives. That is why audits compare outcomes across groups.',
      },
      {
        kind: 'tf',
        prompt: 'AI systems are neutral because they are just math.',
        answer: false,
        explain: 'The math runs on data and design choices made by people. Biased data or goals produce biased results.',
      },
      {
        kind: 'multi',
        prompt: 'Select every good question to ask about the fairness of an AI system.',
        options: ['Who is in the training data and who is missing?', 'Does it work equally well for different groups?', 'Does the logo look trustworthy?', 'Can a person challenge or appeal a decision?'],
        answers: [0, 1, 3],
        explain: 'Representation, group-by-group performance and a path to appeal are core fairness checks. A logo says nothing about fairness.',
      },
    ],
    takeaways: ['Models can learn and repeat unfair patterns.', 'Proxies can carry bias back in after you remove the obvious feature.', 'Check results for each group, not only the average.'],
    codex: ['bias', 'proxy-variable'],
  },
  {
    id: 'r2',
    path: 'responsible',
    title: 'When AI makes things up',
    kicker: 'Spotting hallucinations',
    minutes: 9,
    objective: 'Recognize a hallucination by its warning signs and respond by verifying instead of trusting.',
    framework: 'AI4K12 Big Idea 5: Societal Impact',
    beats: [
      {
        heading: 'Fluent and false',
        paragraphs: [
          'A hallucination is output that sounds right and is not: an invented citation, a wrong date, a quotation nobody said, a detail that cannot be true. The model is not lying. It predicts likely-looking text, and sometimes the likely-looking text is false.',
        ],
      },
      {
        heading: 'Warning signs',
        paragraphs: [
          'Be extra careful when you see exact page numbers, quotations, statistics or legal and scientific citations you cannot find, claims that contradict each other, or confident answers about very obscure topics.',
          'Asking the same question a different way and comparing answers can expose a shaky claim. So can asking where a claim came from, then checking.',
        ],
        visual: { kind: 'compare', caption: 'What to notice, and what to do about it.', left: { title: 'Warning signs', items: ['A citation you cannot find', 'An exact number with no source', 'A quotation with no origin', 'Confidence about a very obscure topic'] }, right: { title: 'Your response', items: ['Search for the source', 'Check a reliable reference', 'Find where it was really said', 'Ask a teacher or expert'] } },
      },
      {
        heading: 'What to do instead of trusting',
        paragraphs: [
          'Verify the claim in a reliable source, use tools that show their sources and then open them, and ask a teacher or expert when the stakes are high. For grades, health, safety, money or law, an AI answer alone is never enough.',
        ],
      },
    ],
    example: {
      title: 'The fake court cases',
      body: 'In 2023, a federal judge in New York sanctioned two lawyers who filed a brief containing court cases that an AI tool had invented. They had not checked that the cases existed.',
      takeaway: 'A confident tone and a proper-looking citation prove nothing. Open the source.',
    },
    widget: {
      id: 'claim-review',
      title: 'Hallucination hunt',
      intro: 'An AI wrote this paragraph about the Apollo 11 mission. Some claims are solid. Some need checking. Some are wrong. Sort every claim to earn a perfect score.',
      pass: 100,
      config: {
        source: 'Apollo 11 landed on the Moon on July 20, 1969. The crew were Neil Armstrong, Buzz Aldrin and Michael Collins. The mission launched from Mission Control in Houston, Texas. Collins joined Armstrong and Aldrin on the surface for a two-hour walk. According to Nguyen and Fairweather (2004), "Lunar Dust and Courage," Annals of Space History 41(2), moon dust damaged most of the astronauts\' equipment. The whole mission lasted about eight days from launch to splashdown.',
        claims: [
          { text: 'Apollo 11 landed on the Moon on July 20, 1969.', verdict: 'solid', why: 'This is well documented, for example by NASA. Cite NASA or another reliable source, not the AI.' },
          { text: 'The crew were Neil Armstrong, Buzz Aldrin and Michael Collins.', verdict: 'solid', why: 'Correct, and easy to confirm from NASA\'s mission pages.' },
          { text: 'The mission launched from Mission Control in Houston, Texas.', verdict: 'false', why: 'Apollo 11 launched from Kennedy Space Center in Florida. Mission Control in Houston ran the flight but is not a launch site.' },
          { text: 'Collins joined Armstrong and Aldrin on the surface for a two-hour walk.', verdict: 'false', why: 'Only Armstrong and Aldrin walked on the Moon. Collins stayed in lunar orbit in the command module.' },
          { text: 'According to Nguyen and Fairweather (2004), "Lunar Dust and Courage," Annals of Space History 41(2), moon dust damaged most of the astronauts\' equipment.', verdict: 'check', why: 'A named citation with a volume and issue is a classic place for invention. We made this one up for the exercise. In real life, search for it. If you cannot find it, drop the claim.' },
          { text: 'The whole mission lasted about eight days from launch to splashdown.', verdict: 'solid', why: 'Apollo 11 lasted a little over eight days. NASA\'s mission summary confirms it.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'Why did a federal judge sanction two lawyers over an AI-assisted court filing in 2023?',
        options: ['The filing was too long', 'It cited court cases that did not exist, and nobody had checked', 'The lawyers used a computer', 'It was filed late'],
        answer: 1,
        explain: 'An AI tool had invented the cases, and the lawyers submitted them without confirming they were real.',
      },
      {
        kind: 'tf',
        prompt: 'A hallucination means the AI is lying on purpose.',
        answer: false,
        explain: 'The model has no intent. It generates likely-looking text, and sometimes that text is false.',
      },
      {
        kind: 'multi',
        prompt: 'Select every warning sign of a possible hallucination.',
        options: ['A citation you cannot find anywhere', 'A very exact statistic with no source', 'A claim that three trusted sources also state', 'A direct quotation with a page number the AI cannot point to'],
        answers: [0, 1, 3],
        explain: 'Unfindable citations, unsourced exact numbers and untraceable quotations are warning signs. Agreement with trusted sources is what you want to see.',
      },
    ],
    takeaways: ['Fluent does not mean true.', 'Be extra careful with citations, quotes, numbers and legal or medical claims.', 'Verify first. For high stakes, never rely on AI alone.'],
    codex: ['hallucination'],
  },
  {
    id: 'r3',
    path: 'responsible',
    title: 'Real or synthetic?',
    kicker: 'Misinformation and deepfakes',
    minutes: 10,
    objective: 'Evaluate suspicious media and posts with a repeatable method that checks source and context, not just how real something looks.',
    framework: 'Common Sense Education: AI literacy, trust and deepfakes',
    beats: [
      {
        heading: 'Convincing fakes are cheap now',
        paragraphs: [
          'AI can create realistic images, voices and video of events that never happened. Such fakes are called deepfakes. Misinformation is false information shared by mistake. Disinformation is false information shared on purpose. Both do harm.',
        ],
      },
      {
        heading: 'Looks real is not a test',
        paragraphs: [
          'Old tells, like strange hands, fade as tools improve, and AI-detection tools are unreliable. A better question is where the item came from. Some tools add provenance information, such as content credentials, but it can be removed, and a missing label does not prove something is fake.',
        ],
      },
      {
        heading: 'Stop, then investigate',
        paragraphs: [
          'A four-move habit called SIFT works for text, images and video: Stop. Investigate the source. Find better coverage. Trace claims, quotes and media to the original context.',
        ],
        visual: { kind: 'flow', caption: 'SIFT, a method by Mike Caulfield.', steps: [{ label: 'Stop' }, { label: 'Investigate the source' }, { label: 'Find better coverage' }, { label: 'Trace to the original' }] },
      },
    ],
    example: {
      title: 'The robocall',
      body: 'In January 2024, voters in New Hampshire received a robocall with an AI-generated voice imitating President Biden, urging them not to vote in the primary. The calls were investigated, and the Federal Communications Commission later ruled that AI-generated voices in robocalls fall under existing rules against artificial voices.',
      takeaway: 'A familiar voice is not proof. Check who is calling and what reliable sources say.',
    },
    widget: {
      id: 'chooser',
      title: 'Run the SIFT check',
      intro: 'A shocking video of a local mayor "confessing" is flooding your group chats. Work through it one move at a time.',
      pass: 75,
      config: {
        steps: [
          { prompt: 'Stop. What do you do first?', options: ['Forward it so others can see', 'Pause and ask who posted it and whether you know the source', 'Decide it is fake because the lighting looks odd', 'Decide it is real because so many people shared it'], answer: 1, why: 'Stopping first keeps you from spreading it. Judging by lighting or popularity is not a reliable test.' },
          { prompt: 'Investigate the source. What helps most?', options: ['Check who runs the account and what else it posts', 'Count the likes', 'See how sharp the video is', 'Ask the account to promise it is real'], answer: 0, why: 'Knowing who is speaking and what they usually share tells you how much weight to give the post. Likes and sharpness say nothing about truth.' },
          { prompt: 'Find better coverage. Where do you look?', options: ['Search for the claim in reputable news outlets and fact-checkers', 'Search only on the app where you found it', 'Trust an AI detector\'s verdict alone', 'Wait to see how many more shares it gets'], answer: 0, why: 'If something big happened, reliable outlets will report it. One detector result is not proof either way.' },
          { prompt: 'Trace it. What is the goal?', options: ['Find the original full clip and context, not a cropped repost', 'Trust the caption', 'Trust the thumbnail', 'Check the comments for opinions'], answer: 0, why: 'Edited clips and fake captions travel far from the original. The original context often changes the story.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'What is the most reliable way to judge a suspicious video?',
        options: ['Trust how realistic it looks', 'Trace it to its original source and check what reliable outlets report', 'Count how many people shared it', 'Run one AI detector and accept the answer'],
        answer: 1,
        explain: 'Source and context beat appearance. Realism can be faked, popularity can be manufactured, and detectors are not reliable.',
      },
      {
        kind: 'tf',
        prompt: 'AI-detection tools can reliably tell real media from fake media.',
        answer: false,
        explain: 'Detectors make mistakes in both directions. Treat their output as one clue, never as proof.',
      },
      {
        kind: 'multi',
        prompt: 'Select every move that is part of the SIFT method.',
        options: ['Stop', 'Investigate the source', 'Share it right away so friends can help judge', 'Find better coverage', 'Trace to the original'],
        answers: [0, 1, 3, 4],
        explain: 'SIFT is Stop, Investigate the source, Find better coverage, Trace to the original. Sharing right away is the habit it exists to interrupt.',
      },
    ],
    takeaways: ['Realistic is not the same as real.', 'Check the source and the original context.', 'Stop before you share.'],
    codex: ['misinformation', 'deepfake', 'provenance'],
  },
  {
    id: 'r4',
    path: 'responsible',
    title: 'Your data and theirs',
    kicker: 'Privacy and data protection',
    minutes: 8,
    objective: 'Decide what should never be pasted into an AI tool, and explain why settings, school rules and other people\'s privacy matter.',
    framework: 'UNESCO guidance on generative AI: protect data privacy',
    beats: [
      {
        heading: 'Assume what you type may be kept',
        paragraphs: [
          'What happens to your chats depends on the tool, the plan and your settings. Conversations can be stored, reviewed by staff for safety, or used to improve a model unless a setting or plan says otherwise. The only way to know is to read the tool\'s privacy settings and policy. School accounts often follow different rules.',
        ],
      },
      {
        heading: 'What counts as personal data',
        paragraphs: [
          'Names with details, addresses, phone numbers, ID numbers, health information, photos of people, passwords and API keys, and anything private about someone else are personal or sensitive. School records are protected for a reason.',
        ],
        visual: { kind: 'compare', caption: 'A quick test before you paste.', left: { title: 'Fine to share', items: ['A general question', 'Public text you will cite', 'Your own draft, with identifying details removed'] }, right: { title: 'Keep out', items: ['Passwords and API keys', 'Addresses and phone numbers', 'Student IDs and records', 'Other people\'s private messages'] } },
      },
      {
        heading: 'Safer habits',
        paragraphs: [
          'Describe the situation without names. Replace secrets with placeholders. Use school-approved tools where your school has chosen some. Check the data settings. Ask: would I be fine if this text became public? And remember that privacy applies to other people too, so do not upload a friend\'s photo or messages without their permission.',
        ],
      },
    ],
    example: {
      title: 'The pasted email',
      body: 'A student wants help answering a stressful message from a classmate. Pasting the whole private thread, names included, shares someone else\'s words and details. Describing the situation without names gets the same help with none of the exposure.',
      takeaway: 'You can nearly always get the help you need without the personal details.',
    },
    widget: {
      id: 'sorter',
      title: 'Paste, replace or protect?',
      intro: 'Decide what to do with each piece of text before it goes anywhere near a chatbot.',
      pass: 80,
      config: {
        bins: [
          { id: 'safe', label: 'Safe to paste' },
          { id: 'replace', label: 'Remove or replace details first' },
          { id: 'never', label: 'Never paste' },
        ],
        items: [
          { text: 'A paragraph from a public news article you want summarized', bin: 'safe', why: 'Public text, no personal data. You should still cite the article, not the summary.' },
          { text: 'A general question: how do vaccines train the immune system?', bin: 'safe', why: 'A general question contains nothing personal.' },
          { text: 'Your essay draft, when your class allows AI feedback', bin: 'replace', why: 'Take out your name, student ID and anything else that identifies you before sharing.' },
          { text: 'Code you want debugged that contains an API key', bin: 'replace', why: 'Swap the key for a placeholder first. The code is fine to share once the secret is gone.' },
          { text: 'Your test results with your student ID attached', bin: 'replace', why: 'Remove the ID. School records are protected, and the ID adds nothing to the help you want.' },
          { text: 'Your home address and phone number', bin: 'never', why: 'There is no good reason to give a chatbot contact details.' },
          { text: 'A classmate\'s name and a private message they sent you', bin: 'never', why: 'It is someone else\'s private information. You do not have the right to share it.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'Which is safest to share with an AI chatbot?',
        options: ['Your home address', 'A general question about how volcanoes form', 'A classmate\'s private message', 'Your password'],
        answer: 1,
        explain: 'General questions hold no personal data. The others expose you or someone else.',
      },
      {
        kind: 'tf',
        prompt: 'Conversations with an AI tool are always private and never stored.',
        answer: false,
        explain: 'Storage and use depend on the tool, plan and settings. Read the privacy policy and settings rather than assuming.',
      },
      {
        kind: 'multi',
        prompt: 'Select every step to take before sharing code with a chatbot.',
        options: ['Replace API keys and passwords with placeholders', 'Remove other people\'s personal data', 'Check the tool\'s data settings', 'Paste everything exactly as it is'],
        answers: [0, 1, 2],
        explain: 'Strip secrets and personal data and check the settings. Pasting everything as is skips all three.',
      },
    ],
    takeaways: ['Assume chats may be stored, and check the settings.', 'Describe, do not disclose.', 'Other people\'s privacy counts too.'],
    codex: ['personal-data'],
  },
  {
    id: 'r5',
    path: 'responsible',
    title: 'Credit, copyright and honesty',
    kicker: 'Attribution, disclosure and human judgment',
    minutes: 10,
    objective: 'Explain how attribution, copyright and disclosure apply to AI-assisted work, and keep a human accountable for the result.',
    framework: 'UNESCO: human-centred AI in education. NIST AI RMF: accountable, trustworthy use',
    beats: [
      {
        heading: 'Whose work is it?',
        paragraphs: [
          'AI output is built from patterns in other people\'s work, and courts and regulators are still working out how copyright applies. In the United States, the Copyright Office has said that material produced purely by AI, without human authorship, is not protected, while a person\'s own creative contribution can be. Rules differ by country and keep changing.',
          '"Free to use" never means "no credit needed". Check the terms and credit what you use.',
        ],
      },
      {
        heading: 'Say what you used',
        paragraphs: [
          'Academic integrity means being honest about who did the work. Follow your teacher\'s policy. A good disclosure names the tool, what you used it for, and what you did yourself. Style guides such as APA and MLA publish formats for citing AI tools. Facts should be cited to the real sources you checked, not to the AI.',
        ],
      },
      {
        heading: 'A person stays responsible',
        paragraphs: [
          'If an AI error ends up in your work, it is still your error. For decisions that affect people, such as grades, health, safety or money, a person who can explain the decision should be accountable for it. Keeping a human in the loop is how trustworthy systems are built.',
        ],
        visual: { kind: 'flow', caption: 'Responsible use, start to finish.', steps: [{ label: 'Use the tool' }, { label: 'Check the facts' }, { label: 'Credit sources and say what you used' }, { label: 'You decide and answer for it' }] },
      },
    ],
    example: {
      title: 'Two notes',
      body: 'Two students used AI to brainstorm. One adds: "I used an AI chat tool to brainstorm topic ideas. I chose the topic and wrote the essay myself." The other says nothing and submits generated paragraphs as their own. Only the first is being honest.',
      takeaway: 'Transparency protects you. Hiding use is the problem, not the tool.',
    },
    widget: {
      id: 'chooser',
      title: 'Make the call',
      intro: 'Four situations where honesty and judgment matter. Pick the responsible move in each.',
      pass: 75,
      config: {
        steps: [
          { prompt: 'Your teacher allows AI for brainstorming only. You brainstormed with it, then wrote the essay yourself. What do you do?', options: ['Add a short note naming the tool and what you used it for', 'Say nothing. Brainstorming does not count.', 'Claim you used no tools', 'Quote the AI as your source for facts'], answer: 0, why: 'A short, honest note shows what happened and keeps you inside the rules. Facts still need real sources.' },
          { prompt: 'You want to put an AI-generated image in a slideshow. What is responsible?', options: ['Check the class rules and the tool\'s terms, and credit the tool', 'Assume AI images belong to nobody, so credit is pointless', 'Say you drew it', 'Leave off the credit to keep slides clean'], answer: 0, why: 'Rules and terms vary. Following them and crediting the tool keeps you honest.' },
          { prompt: 'An AI summary says "a study found X." Before you cite it, what should you do?', options: ['Find and read the study, then cite the study', 'Cite the AI summary', 'Cite "the internet"', 'Skip the citation'], answer: 0, why: 'You cite what you verified. The AI summary is a lead, not a source.' },
          { prompt: 'A school app uses AI to flag possible cheating. Who should make the final decision?', options: ['A person who reviews the evidence and can be held accountable', 'The AI, because it is faster', 'Whoever complains first', 'Nobody. The flag is final.'], answer: 0, why: 'Automated flags can be wrong. A person who can explain and be answerable for the decision should have the last word.' },
        ],
      },
    },
    check: [
      {
        kind: 'single',
        prompt: 'What makes a good disclosure of AI use?',
        options: ['It names the tool, what you used it for, and what you did yourself', 'It says "AI was used" and nothing else', 'It is hidden in a footnote nobody reads', 'It blames the tool for mistakes'],
        answer: 0,
        explain: 'Specific and honest: which tool, for what, and what remained your own work.',
      },
      {
        kind: 'tf',
        prompt: 'If a tool says its output is free to use, you never need to credit or check anything.',
        answer: false,
        explain: 'Free to use does not remove your duty to check accuracy, follow class rules and give credit where required.',
      },
      {
        kind: 'single',
        prompt: 'Who is responsible for mistakes in AI-assisted work you submit?',
        options: ['The AI tool', 'The company that made the tool', 'You', 'Nobody'],
        answer: 2,
        explain: 'You choose what to submit, so you answer for it.',
      },
    ],
    takeaways: ['Credit what you used, and cite sources you checked.', 'Be honest and specific about AI help.', 'A person stays accountable for decisions that affect people.'],
    codex: ['copyright', 'disclosure', 'human-in-the-loop'],
  },
];
