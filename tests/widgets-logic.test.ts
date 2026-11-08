import { describe, expect, it } from 'vitest';
import { learnFilter, ruleFilter, runBoth, KEYWORDS } from '@/widgets/logic/spam';
import { TEST_SET, isRipe, narrowExamples, predict, testAccuracy, variedExamples } from '@/widgets/logic/knn';
import { Net, makeData } from '@/widgets/logic/nn';
import { candidates, generate, pick } from '@/widgets/logic/lm';
import { fit, instructionVisible, STARTER_TEXT, tokenize, WINDOW } from '@/widgets/logic/tokens';
import { audit } from '@/widgets/logic/bias';
import { rng } from '@/widgets/logic/random';

describe('U1 spam: rules vs learning', () => {
  it('a keyword rule filter flags only messages containing a chosen keyword', () => {
    expect(ruleFilter(['free'], 'Claim your FREE prize')).toBe(true);
    expect(ruleFilter(['free'], 'Hello there')).toBe(false);
  });
  it('the learned filter beats an all-keywords rule list on the new messages', () => {
    const r = runBoth([...KEYWORDS]);
    expect(r.learnedRight).toBeGreaterThan(r.ruleRight);
    expect(r.learnedRight).toBeGreaterThanOrEqual(6);
  });
  it('learns sensible top words from the training set', () => {
    const top = learnFilter().top.map((t) => t.word);
    expect(top.some((w) => ['free', 'click', 'now', 'winner', 'offer'].includes(w))).toBe(true);
  });
});

describe('U2 classifier', () => {
  it('predicts null with no data and learns from examples', () => {
    expect(predict([], 50, 50)).toBeNull();
    expect(predict([{ x: 80, y: 80, ripe: true }], 70, 70)).toBe(true);
  });
  it('the hidden truth labels the test set consistently', () => {
    for (const t of TEST_SET) expect(t.ripe).toBe(isRipe(t.x, t.y));
  });
  it('varied examples generalize better than narrow ones', () => {
    const varied = testAccuracy([...variedExamples(1), ...variedExamples(2)]).pct;
    const narrow = testAccuracy([...narrowExamples(1), ...narrowExamples(2)]).pct;
    expect(varied).toBeGreaterThan(narrow);
    expect(varied).toBeGreaterThanOrEqual(75);
  });
});

describe('U3 neural network', () => {
  it('solves the ring with enough hidden units', () => {
    const data = makeData('ring');
    const net = new Net(5);
    net.train(data, 900);
    expect(net.accuracy(data)).toBeGreaterThanOrEqual(90);
  });
  it('one hidden unit cannot bend a boundary around the ring', () => {
    const data = makeData('ring');
    const net = new Net(1);
    net.train(data, 900);
    expect(net.accuracy(data)).toBeLessThan(90);
  });
  it('training lowers the loss', () => {
    const data = makeData('corners');
    const net = new Net(4);
    const before = net.loss(data);
    net.train(data, 300);
    expect(net.loss(data)).toBeLessThan(before);
  });
});

describe('U4 language model', () => {
  it('probabilities are sorted and sum to at most 1', () => {
    const c = candidates(['the', 'harbor', 'at'], 1);
    expect(c.length).toBeGreaterThan(0);
    expect(c.reduce((s, x) => s + x.p, 0)).toBeLessThanOrEqual(1.0001);
    for (let i = 1; i < c.length; i++) expect(c[i - 1]!.p).toBeGreaterThanOrEqual(c[i]!.p);
  });
  it('low temperature is repeatable, high temperature varies', () => {
    const a = generate(['The', 'students'], 12, 0.2, rng(1));
    const b = generate(['The', 'students'], 12, 0.2, rng(99));
    expect(a).toEqual(b);
    const outs = new Set(Array.from({ length: 12 }, (_, i) => generate(['The', 'students'], 12, 1.8, rng(i + 1)).join(' ')));
    expect(outs.size).toBeGreaterThan(1);
  });
  it('higher temperature flattens the distribution', () => {
    const cold = candidates(['the'], 0.3)[0]!.p;
    const hot = candidates(['the'], 2)[0]!.p;
    expect(hot).toBeLessThan(cold);
  });
  it('always returns a token', () => {
    expect(typeof pick(['unknownword'], 1, rng(3))).toBe('string');
  });
});

describe('U5 token window', () => {
  it('tokenizes words, punctuation and long words', () => {
    expect(tokenize('Hi there.').length).toBe(3);
    expect(tokenize('extraordinarily').length).toBeGreaterThan(1);
  });
  it('the starter text loses its instruction; moving it to the end fixes it', () => {
    expect(instructionVisible(STARTER_TEXT)).toBe(false);
    const body = STARTER_TEXT.replace(/^Answer in one sentence: what is the main idea of this passage\? /, '');
    expect(instructionVisible(`${body} Answer in one sentence: what is the main idea of this passage?`)).toBe(true);
  });
  it('keeps the most recent tokens', () => {
    const f = fit('one two three four five', 2);
    expect(f.kept.length).toBe(2);
    expect(f.dropped.length).toBe(3);
    expect(WINDOW).toBe(48);
  });
});

describe('R1 bias audit', () => {
  it('all features on: heavily skewed and low score', () => {
    const a = audit(new Set(['skill', 'exp', 'club', 'zip'] as const));
    expect(a.gap).toBeGreaterThanOrEqual(80);
    expect(a.score).toBeLessThan(30);
  });
  it('removing only the neighborhood is not enough (the club is a proxy)', () => {
    const a = audit(new Set(['skill', 'exp', 'club'] as const));
    expect(a.score).toBeLessThan(40);
  });
  it('removing both proxies and keeping skill gives a fair, qualified selection', () => {
    const a = audit(new Set(['skill', 'exp'] as const));
    expect(a.gap).toBeLessThanOrEqual(10);
    expect(a.qualified).toBe(6);
    expect(a.score).toBeGreaterThanOrEqual(80);
  });
});
