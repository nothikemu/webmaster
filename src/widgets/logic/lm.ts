/**
 * Lesson U4: a very small language model. It counts which word follows which pair of words in a short story
 * (a trigram model, with fallbacks) and turns the counts into probabilities. A large language model is a vastly
 * bigger, learned version of the same job: predict the next token.
 */
export const CORPUS = `
The harbor at dawn is quiet. The fishing boats rock on the water. The lighthouse keeper climbs the stairs and lights the lamp.
The harbor at dawn is busy. The students walk to school along the dock. The students carry their books and their lunches.
The teacher at the harbor school asks a question. The students raise their hands. The teacher smiles and calls on a student.
The harbor at night is calm. The lighthouse beam sweeps across the water. The boats return to the dock before the storm.
The students at the school build a small robot. The robot learns to carry a lantern. The robot waves at the boats on the water.
The lighthouse keeper writes in a notebook. The keeper checks the lamp and the bell. The keeper watches the boats on the water.
The students at the harbor school read about the sea. The teacher explains how the tide moves. The students ask a question about the moon.
`;

const tokenize = (text: string): string[] => text.replace(/\s+/g, ' ').trim().match(/[A-Za-z']+|[.,]/g) ?? [];
const TOKENS = tokenize(CORPUS).map((t) => (t === '.' || t === ',' ? t : t.toLowerCase()));

const tri = new Map<string, Map<string, number>>();
const bi = new Map<string, Map<string, number>>();
const bump = (m: Map<string, Map<string, number>>, key: string, next: string) => {
  const inner = m.get(key) ?? new Map<string, number>();
  inner.set(next, (inner.get(next) ?? 0) + 1);
  m.set(key, inner);
};
for (let i = 2; i < TOKENS.length; i++) {
  bump(tri, `${TOKENS[i - 2]} ${TOKENS[i - 1]}`, TOKENS[i]!);
  bump(bi, TOKENS[i - 1]!, TOKENS[i]!);
}

export interface Candidate {
  token: string;
  p: number;
}

/** The next-token distribution after the given words, sharpened or flattened by temperature. */
export function candidates(context: readonly string[], temperature: number, top = 6): Candidate[] {
  const c = context.map((t) => t.toLowerCase());
  const key2 = c.length >= 2 ? `${c[c.length - 2]} ${c[c.length - 1]}` : '';
  const counts = tri.get(key2) ?? bi.get(c[c.length - 1] ?? '') ?? bi.get('.') ?? new Map<string, number>();
  const T = Math.max(0.1, temperature);
  const weights = [...counts.entries()].map(([token, n]) => ({ token, w: Math.pow(n, 1 / T) }));
  const total = weights.reduce((s, x) => s + x.w, 0) || 1;
  return weights
    .map((x) => ({ token: x.token, p: x.w / total }))
    .sort((a, b) => b.p - a.p)
    .slice(0, top);
}

/** Pick the next token. At low temperature it always takes the most likely one. */
export function pick(context: readonly string[], temperature: number, random: () => number): string {
  const cands = candidates(context, temperature, 50);
  if (cands.length === 0) return '.';
  if (temperature <= 0.3) return cands[0]!.token;
  let r = random();
  for (const c of cands) {
    r -= c.p;
    if (r <= 0) return c.token;
  }
  return cands[cands.length - 1]!.token;
}

export function generate(start: readonly string[], words: number, temperature: number, random: () => number): string[] {
  const out = [...start];
  for (let i = 0; i < words; i++) out.push(pick(out, temperature, random));
  return out;
}

export const STARTS: { label: string; tokens: string[] }[] = [
  { label: 'The harbor at', tokens: ['The', 'harbor', 'at'] },
  { label: 'The students', tokens: ['The', 'students'] },
  { label: 'The lighthouse keeper', tokens: ['The', 'lighthouse', 'keeper'] },
];

/** Join tokens into readable text. */
export const render = (tokens: readonly string[]): string => tokens.join(' ').replace(/ ([.,])/g, '$1');
