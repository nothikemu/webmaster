/**
 * Lesson U5: tokens and the context window. This is a deliberately simple tokenizer: words and punctuation,
 * with long words broken into chunks. Real tokenizers (byte-pair encoding and relatives) differ. The point is
 * the idea: text becomes chunks, and only the most recent chunks fit in the window.
 */
export const WINDOW = 48;

export function tokenize(text: string): string[] {
  const rough = text.match(/\s*[A-Za-z0-9']+|\s*[^\sA-Za-z0-9']/g) ?? [];
  const out: string[] = [];
  for (const piece of rough) {
    const lead = piece.match(/^\s*/)![0];
    const body = piece.slice(lead.length);
    if (body.length <= 6) {
      out.push(piece);
      continue;
    }
    // split a long word into chunks of about four characters
    for (let i = 0; i < body.length; i += 4) out.push((i === 0 ? lead : '') + body.slice(i, i + 4));
  }
  return out;
}

/** Tokens kept (the most recent) and tokens that fall out of the window. */
export function fit(text: string, window = WINDOW): { kept: string[]; dropped: string[]; total: number } {
  const all = tokenize(text);
  const cut = Math.max(0, all.length - window);
  return { kept: all.slice(cut), dropped: all.slice(0, cut), total: all.length };
}

export const INSTRUCTION = 'answer in one sentence';

export const STARTER_TEXT =
  'Answer in one sentence: what is the main idea of this passage? The harbor town of Tideweight sits at the mouth of a wide, slow river. Fishing boats leave before dawn and return after dark, and the lighthouse keeper writes down every ship that passes. In spring the tide climbs higher than anyone remembers, and the children of the harbor school learn to read the water the way other children read books.';

export const instructionVisible = (text: string, window = WINDOW): boolean => fit(text, window).kept.join('').toLowerCase().replace(/\s+/g, ' ').includes(INSTRUCTION);
