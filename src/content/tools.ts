import type { Tool } from './types';

/**
 * The Tool Atlas data.
 * `access.verified` is true only when the age and account facts were read on the vendor's own page on the date in `checkedOn`.
 * Everything else is marked unverified in the interface and tells the student to confirm on the vendor's page.
 * Image, writing and data tools are not listed yet because their official pages have not been read.
 * Vendors change age rules, plans and features often. The date on each entry is the point of the check.
 */
export const TOOLS: readonly Tool[] = [
  {
    id: 'claude',
    name: 'Claude',
    maker: 'Anthropic',
    category: 'chat',
    does: 'A conversational assistant for explaining, drafting, summarizing, brainstorming and coding help.',
    goodFor: ['Explaining a hard idea a second way', 'Giving feedback on your own draft', 'Talking through a coding error'],
    limits: ['Can state false things confidently', 'Knowledge has a cutoff date', 'Cannot check its own claims against the world'],
    access: { age: '18 or older to create and use a Claude account', account: 'Account required', cost: 'Check the vendor page for current plans', verified: true, source: 'https://support.claude.com/en/articles/13117299-minimum-age-requirement-access-restriction' },
    checkedOn: '2026-11-10',
    privacy: 'Read the privacy and data-controls settings before pasting anything personal.',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    maker: 'Google',
    category: 'chat',
    does: 'Google\'s conversational assistant, available in a web app, a phone app and some Google Workspace tools.',
    goodFor: ['Brainstorming and outlining', 'Explaining concepts', 'Working inside a Google account you already use'],
    limits: ['Can state false things confidently', 'Some features are not available to under-18 accounts', 'School accounts only work if the school has turned Gemini on'],
    access: { age: '13 or older (or the age in your country) with a personal or school Google Account; 18 or older for a work account', account: 'Google Account required. A school account needs an administrator to enable it. Family Link-managed accounts cannot use the web app.', cost: 'Check the vendor page for current plans', verified: true, source: 'https://support.google.com/gemini/answer/13278668' },
    checkedOn: '2026-11-10',
    privacy: 'School and personal accounts follow different rules. Ask your school which one to use.',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    maker: 'OpenAI',
    category: 'chat',
    does: 'A conversational assistant for explaining, drafting, brainstorming and coding help.',
    goodFor: ['Brainstorming topics', 'Practicing with quiz questions', 'Explaining code'],
    limits: ['Can state false things confidently', 'Knowledge has a cutoff date unless a search tool is on', 'Answers vary with wording'],
    access: { age: 'Reported: not meant for children under 13, and ages 13 to 18 need a parent\'s consent. The vendor page blocked our check, so this comes from a search excerpt of it.', account: 'Account required for most features', cost: 'Check the vendor page for current plans', verified: false, source: 'https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages' },
    checkedOn: '2026-11-10',
    privacy: 'Check the data controls in settings. Teen accounts have extra protections and parental controls.',
  },
  {
    id: 'copilot-chat',
    name: 'Microsoft Copilot',
    maker: 'Microsoft',
    category: 'chat',
    does: 'Microsoft\'s assistant, available as an app and, for many schools, inside Microsoft 365 with a school sign-in.',
    goodFor: ['Drafting and outlining', 'Asking questions about your school Microsoft apps', 'Brainstorming'],
    limits: ['Can state false things confidently', 'Access depends on your school\'s settings', 'Features differ between personal and school accounts'],
    access: { age: 'Reported: 13 or older in most countries, higher in some, with fewer features for under-18 accounts. School access depends on how the school has set each age group.', account: 'Microsoft account or school account', cost: 'Check the vendor page for current plans', verified: false, source: 'https://support.microsoft.com/en-US/microsoft-copilot/microsoft-copilot-age-limits-and-parental-controls' },
    checkedOn: '2026-11-10',
    privacy: 'Your school administrator controls many settings on a school account. Ask them.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    maker: 'Perplexity AI',
    category: 'research',
    does: 'An answer engine that searches the web and shows numbered sources next to its answer.',
    goodFor: ['Finding starting sources on a topic', 'Seeing where a claim came from', 'Comparing what several sites say'],
    limits: ['The answer can still misread or misquote its sources', 'You must open the sources yourself', 'Source quality varies'],
    access: { age: 'Reported: 13 or older under its terms, and under 18 needs a parent or guardian\'s permission. Not read directly from the vendor.', account: 'Reported as usable without an account, with more features when signed in', cost: 'A free plan is reported, with daily limits on deeper searches. Check the vendor page.', verified: false, source: 'https://www.perplexity.ai/hub/legal/terms-of-service' },
    checkedOn: '2026-11-10',
    privacy: 'Searches can be stored. Do not search with personal details.',
  },
  {
    id: 'notebooklm',
    name: 'Gemini Notebook',
    maker: 'Google',
    category: 'study',
    does: 'A study tool that works from sources you upload, such as your notes or articles, and answers questions about them. Many guides still call it by its earlier name, NotebookLM.',
    goodFor: ['Turning your own notes into practice questions', 'Asking where in your sources something is said', 'Summarizing material you provide'],
    limits: ['Only as good as the sources you give it', 'It can still summarize incorrectly', 'Check your teacher\'s rules before uploading class materials'],
    access: { age: 'Google says it is open to "all users above the age of consent (or applicable in your country)". Check the age for your country.', account: 'A personal Google Account, or a school account if your school has turned it on.', cost: 'Free to sign up. Without a paid plan the page lists 100 notebooks and 50 sources in each.', verified: true, source: 'https://support.google.com/notebooklm/answer/16213268' },
    checkedOn: '2026-11-10',
    privacy: 'Google says your data is not used to train the tool unless you send feedback, and that school accounts are not reviewed by people or used for training.',
  },
  {
    id: 'khanmigo',
    name: 'Khanmigo',
    maker: 'Khan Academy',
    category: 'study',
    does: 'An AI tutor and teaching assistant built into Khan Academy that is designed to guide with questions rather than hand over answers.',
    goodFor: ['Getting unstuck on a math or science problem', 'Practicing writing with feedback', 'Learning through a school or district program'],
    limits: ['Student access is usually through a school, a district program or a paid subscription', 'It can still make mistakes', 'Availability and price change'],
    access: { age: 'Reported: 18 or older to sign up yourself. Under 18, a parent or guardian signs up for you, or you get it through a school or district. Not read directly.', account: 'Khan Academy account', cost: 'Reported as free for teachers. Students typically need a paid plan or a school program. Prices vary by source, so check Khan Academy.', verified: false, source: 'https://support.khanacademy.org/hc/en-us/articles/13982227159437' },
    checkedOn: '2026-11-10',
    privacy: 'Ask your school what data a school-provided account shares.',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    maker: 'GitHub',
    category: 'coding',
    does: 'A coding assistant that suggests code, explains it and helps debug inside your editor and on GitHub.',
    goodFor: ['Explaining an error message', 'Suggesting a first draft you will test', 'Learning unfamiliar syntax'],
    limits: ['Suggested code can be wrong or insecure', 'You must understand and test what you keep', 'Never share secrets such as API keys'],
    access: { age: 'See GitHub\'s terms for age rules', account: 'GitHub account. Free access for verified GitHub Education students through the Copilot Student plan, re-checked monthly.', cost: 'Free for verified students. Approval and activation are separate steps and can take days.', verified: true, source: 'https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students' },
    checkedOn: '2026-11-10',
    privacy: 'Review the Copilot use policies you set when you activate it, and keep secrets out of your code.',
  },
];

export const TOOL_CATEGORIES: { id: Tool['category']; label: string }[] = [
  { id: 'chat', label: 'Chat assistants' },
  { id: 'research', label: 'Research' },
  { id: 'study', label: 'Study' },
  { id: 'coding', label: 'Coding' },
];
