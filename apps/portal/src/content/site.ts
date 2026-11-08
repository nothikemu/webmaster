/** Site-level copy. Shared by the React pages and the build-time static page generator. */

export const SITE = {
  name: 'Parameter',
  title: 'Parameter: Interactive AI Learning Portal',
  description:
    'An interactive AI learning portal for grades 9 to 12. Three modules, fifteen lessons, a live neural network, a prompt console and a vulnerability lab. Progress stays on your device.',
  event: 'TSA Webmaster 2026-2027',
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: readonly NavItem[] = [
  { label: 'Modules', href: '/modules' },
  { label: 'Progress', href: '/progress' },
  { label: 'Achievements', href: '/achievements' },
  { label: 'Glossary', href: '/glossary' },
  { label: 'About', href: '/about' },
];

export const FOOTER_LINKS: readonly NavItem[] = [
  { label: 'Glossary', href: '/glossary' },
  { label: 'About', href: '/about' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Credits', href: '/credits' },
];

/** The realm each module is drawn as: a name for the picture, never a replacement for the module's own title. */
export const REALM = {
  foundations: 'The Lattice',
  synthesis: 'The Forge',
  ethics: 'The Gate',
} as const;

export const HOME = {
  kicker: 'Interactive AI learning portal',
  headline: ['Learn how', 'machines learn.'],
  lead: 'Push a neural network around. Tune a prompt until it behaves. Break a model, then fix it. Nothing leaves your device.',
  map: {
    heading: 'The whole course, on one page',
    body: 'Fifteen lessons in three chains, each ending in a knowledge check, a challenge and a badge. Every node is a link, and every node shows where you are.',
  },
  method: {
    heading: 'How a module works',
    steps: [
      {
        name: 'Read',
        body: 'Each lesson is a few minutes of text with the key points set apart. Opening one for a few seconds marks it seen.',
      },
      {
        name: 'Try',
        body: 'Every module has one interactive centerpiece. You change a real parameter and watch what happens, and each one has a text alternative.',
      },
      {
        name: 'Check',
        body: 'A one-question check closes every lesson. A five-question knowledge check closes the module, and only a better score pays XP.',
      },
      {
        name: 'Earn',
        body: 'A challenge and a badge finish the module. A badge needs a lesson set, the centerpiece, a 4-of-5 check and a cleared challenge, not just visits.',
      },
    ],
  },
  bento: {
    heading: 'Three modules. Three different ways to touch an idea.',
  },
  gamification: {
    heading: 'Points for finishing, not for refreshing.',
    body: [
      'XP is paid once per step, so rereading earns nothing. A knowledge check pays only for improvement. After 400 XP in one day the rate drops to a quarter.',
      'A streak counts days when you learned something, not days you opened the tab. Each module ends in a badge, and a badge needs a lesson set, a centerpiece, a 4-of-5 check and a cleared challenge.',
    ],
  },
} as const;

export interface DocSection {
  heading: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

export interface DocPageContent {
  title: string;
  lead: string;
  sections: readonly DocSection[];
}

export const ABOUT: DocPageContent = {
  title: 'About this portal',
  lead: 'Parameter is a competition entry for the TSA Webmaster event, 2026-2027. The assignment: an interactive AI learning portal for high school students with at least three learning sections and a gamified, progress-tracking interface.',
  sections: [
    {
      heading: 'How the theme maps to the site',
      items: [
        'Fundamental AI concepts: Module 01, Foundations.',
        'Practical AI tools and techniques: Module 02, Synthesis (prompt engineering).',
        'Ethical AI usage: Module 03, Ethics (bias, privacy, adversarial input, transparency, accountability).',
        'Gamification: XP, levels, streaks, mastery states and three badges.',
        'Progress tracking: a dashboard with completion by module, XP history, a streak calendar, a mastery heatmap and a next-step recommendation.',
      ],
    },
    {
      heading: 'Design brief',
      paragraphs: [
        'The site looks like the front end of a competitive game, built for reading and for doing: one dark, full-width screen, thin lines and small capitals for the interface, and a single red for the call to action. Each module has its own hue (teal, violet or red) that grades its whole screen. Everything you can press is a filled shape with an edge under it, so you never have to hover to find out; links in running text are underlined. The pictures are drawn in code from the lesson content and from your saved progress: the lattice lights up as you move through Foundations, the faders stand where your applied presets put them, and each bracket on the lens is a vulnerability you have inspected. They are generated, not hand-drawn. The look was inspired by the VALORANT interface; no artwork, logo, character or typeface from any game is used.',
        'Every interactive scene has a text alternative and a keyboard path. Motion respects the reduced-motion setting. The site is a set of static files and runs from any web host.',
      ],
    },
    {
      heading: 'Your data',
      paragraphs: [
        'There are no accounts and no server. Progress is stored in your browser under one key and is signed so accidental or manual edits are detected. You can export it as a JSON file, import it on another device, or reset it from the Progress page.',
      ],
    },
    {
      heading: 'How it was built',
      paragraphs: [
        'The process log, planning documents, rubric matrix and compliance notes live in the repository under docs/. They record what the team decided and why.',
      ],
    },
  ],
};

export const ACCESSIBILITY: DocPageContent = {
  title: 'Accessibility statement',
  lead: 'The target is WCAG 2.2 level AA. This page lists what is built in, how it is checked, and what is still imperfect.',
  sections: [
    {
      heading: 'What is built in',
      items: [
        'Semantic landmarks, one h1 per page, a skip link, and focus moved to the page heading on every route change.',
        'Every control works from the keyboard, with a 3 pixel focus ring that is kept clear of the header and the floating progress control.',
        'Buttons, tabs, chips, sliders and menu links are at least 44 by 44 CSS pixels. Whole cards act as one large target.',
        'Pages reflow without sideways scrolling down to 320 CSS pixels wide and at 200 percent zoom. Only the mastery heatmap and the credits table scroll sideways, inside labelled regions you can reach with the keyboard.',
        'Every canvas has an accessible name and a plain-text description next to it. Each centerpiece also has a text alternative with the same controls.',
        'Pointer-only interactions have keyboard equivalents: arrow keys move the particle pointer, the prompt divider and the sliders; Enter and Space activate vulnerability markers; 1, 2, 3 and M switch pointer modes.',
        'Progress changes are announced through a polite live region.',
        'Text and interface colors meet AA contrast on the dark ground. Progress is never shown by color alone: every state also has a word or a shape.',
        'The prefers-reduced-motion setting turns off the moving background, page transitions, scroll reveals, the pull of buttons toward the pointer, camera movement, tilt, particle bursts and spring overshoot.',
        'Without JavaScript, every page still shows its text content.',
      ],
    },
    {
      heading: 'How it is checked',
      paragraphs: [
        'Each build runs an automated browser test that loads the site, opens all three modules and runs an axe-core scan on key pages. Automated checks catch only part of what matters, so keyboard-only and screen reader passes are listed in the team test plan in docs/.',
      ],
    },
    {
      heading: 'Known limitations',
      items: [
        'The particle and wireframe scenes are visual by nature. The text alternative explains them but cannot replace seeing the motion.',
        'The Module B output panel is a simulation. It is described in text but the noise field has no audio or tactile equivalent.',
        'External reading links open third-party sites that have their own accessibility.',
      ],
    },
    {
      heading: 'Feedback',
      paragraphs: [
        'If something here blocks you, tell your teacher or the team through the channel named in the competition submission, and describe the page and the assistive technology you used.',
      ],
    },
  ],
};

export interface CreditEntry {
  name: string;
  version: string;
  license: string;
  use: string;
}

export const CREDIT_LIBRARIES: readonly CreditEntry[] = [
  { name: 'React and React DOM', version: '18.3.1', license: 'MIT', use: 'Interface components' },
  { name: 'three', version: '0.187.0', license: 'MIT', use: 'WebGL2 and WebGPU rendering' },
  { name: 'XState', version: '5.33.3', license: 'MIT', use: 'State machines' },
  { name: 'Zustand', version: '5.0.16', license: 'MIT', use: 'Application store' },
  { name: 'Comlink', version: '4.4.2', license: 'Apache-2.0', use: 'Web Worker messaging' },
  {
    name: 'Big Shoulders Display, Barlow',
    version: '5.3.0 (each, as @fontsource packages)',
    license: 'SIL Open Font License 1.1',
    use: 'Typefaces: headlines, labels and numerals, and reading text. Served from this site, Latin subset only',
  },
  {
    name: 'wasm-bindgen',
    version: '0.2.130',
    license: 'MIT or Apache-2.0',
    use: 'Rust to WebAssembly bindings',
  },
  {
    name: 'Vite, Tailwind CSS, TypeScript',
    version: '7.3.7 / 4.3.3 / 5.9.3',
    license: 'MIT, MIT, Apache-2.0',
    use: 'Build tooling',
  },
  {
    name: 'javascript-obfuscator, Terser, Binaryen',
    version: '5.9.1 / 5.51.2 / 132.0.0',
    license: 'BSD-2-Clause, BSD-2-Clause, Apache-2.0',
    use: 'Build-time hardening and optimisation',
  },
  {
    name: 'Vitest, Playwright, @axe-core/playwright',
    version: '3.2.7 / 1.64.1 / 4.14.0',
    license: 'MIT, Apache-2.0, MPL-2.0',
    use: 'Tests',
  },
  {
    name: 'Simplex noise GLSL (Ashima Arts, Stefan Gustavson)',
    version: 'n/a',
    license: 'MIT',
    use: 'Wireframe displacement in the Module C vertex shader',
  },
];

export const CREDITS: DocPageContent = {
  title: 'Credits',
  lead: 'Everything on this site that is not a library was written or drawn for this project: the copy, the lesson content, the icons, the badges, the shaders and the 3D geometry. No stock photography, video or audio is used.',
  sections: [
    {
      heading: 'Research cited in the lessons',
      items: [
        'Buolamwini and Gebru, Gender Shades, 2018: per-group error rates of commercial face-analysis systems.',
        'Carlini et al., Extracting Training Data from Large Language Models, 2021.',
        'Eykholt et al., Robust Physical-World Attacks on Deep Learning Models, 2018.',
        'Brown et al., Language Models are Few-Shot Learners, 2020.',
        'Wei et al., Chain-of-Thought Prompting Elicits Reasoning in Large Language Models, 2022.',
        'Mitchell et al., Model Cards for Model Reporting, 2019.',
        'Regulation (EU) 2024/1689, the EU AI Act.',
      ],
    },
  ],
};
