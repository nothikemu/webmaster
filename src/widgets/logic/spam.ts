/**
 * Lesson U1: rules versus learning.
 * `ruleFilter` is a hand-written keyword list. `learnFilter` is a tiny naive Bayes classifier trained on labeled messages.
 * Both are real; the learned one just finds its own word weights from examples.
 */
export interface Msg {
  text: string;
  spam: boolean;
}

export const TRAIN: readonly Msg[] = [
  { text: 'Claim your free prize now', spam: true },
  { text: 'You are a winner click here', spam: true },
  { text: 'Urgent verify your password today', spam: true },
  { text: 'Free gift card offer just for you', spam: true },
  { text: 'Win money fast click now', spam: true },
  { text: 'Limited offer free entry winner', spam: true },
  { text: 'Are we still meeting after school today', spam: false },
  { text: 'Can you send me the chemistry notes', spam: false },
  { text: 'Library closes early on Friday', spam: false },
  { text: 'Happy birthday see you at the party', spam: false },
  { text: 'Your essay draft looks good nice work', spam: false },
  { text: 'Bring your calculator for the quiz', spam: false },
];

export const TEST: readonly Msg[] = [
  { text: 'fr33 pr1ze waiting, c1ick here to claim', spam: true },
  { text: 'Congratulations winner, collect your gift card', spam: true },
  { text: 'Verify your account password urgently', spam: true },
  { text: 'Earn money from home fast', spam: true },
  { text: 'Is the library free on Saturday?', spam: false },
  { text: 'Please click the link in the class email to join', spam: false },
  { text: 'Can you send the notes now? Quiz is tomorrow', spam: false },
  { text: 'Thanks for the gift, see you at the party', spam: false },
];

export const KEYWORDS = ['free', 'prize', 'winner', 'click', 'urgent', 'offer', 'money', 'password', 'gift', 'now'] as const;

const words = (t: string): string[] => t.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function ruleFilter(keywords: readonly string[], text: string): boolean {
  const w = new Set(words(text));
  return keywords.some((k) => w.has(k));
}

export interface Learned {
  isSpam: (text: string) => boolean;
  /** The words with the strongest learned weight, for display. */
  top: { word: string; weight: number }[];
}

export function learnFilter(train: readonly Msg[] = TRAIN): Learned {
  const spamCount = new Map<string, number>();
  const hamCount = new Map<string, number>();
  let spamTotal = 0;
  let hamTotal = 0;
  const vocab = new Set<string>();
  for (const m of train) {
    for (const w of words(m.text)) {
      vocab.add(w);
      if (m.spam) {
        spamCount.set(w, (spamCount.get(w) ?? 0) + 1);
        spamTotal++;
      } else {
        hamCount.set(w, (hamCount.get(w) ?? 0) + 1);
        hamTotal++;
      }
    }
  }
  const V = vocab.size;
  const weight = (w: string) => Math.log(((spamCount.get(w) ?? 0) + 1) / (spamTotal + V)) - Math.log(((hamCount.get(w) ?? 0) + 1) / (hamTotal + V));
  const top = [...vocab]
    .map((word) => ({ word, weight: weight(word) }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6);
  return {
    top,
    isSpam: (text) => {
      // Only words the model has seen count. Unseen words carry no evidence either way.
      const total = words(text)
        .filter((w) => vocab.has(w))
        .reduce((sum, w) => sum + weight(w), 0);
      return total > 0;
    },
  };
}

export interface SpamResult {
  rowVerdicts: { text: string; spam: boolean; rule: boolean; learned: boolean }[];
  ruleRight: number;
  learnedRight: number;
}

export function runBoth(keywords: readonly string[]): SpamResult {
  const learned = learnFilter();
  const rowVerdicts = TEST.map((m) => ({ text: m.text, spam: m.spam, rule: ruleFilter(keywords, m.text), learned: learned.isSpam(m.text) }));
  return {
    rowVerdicts,
    ruleRight: rowVerdicts.filter((r) => r.rule === r.spam).length,
    learnedRight: rowVerdicts.filter((r) => r.learned === r.spam).length,
  };
}
