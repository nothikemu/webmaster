import { createCipheriv } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Caps } from '../src/core/caps';
import {
  chacha20XorTs,
  constantTimeEqual,
  fromHex,
  hmacSha256Subtle,
  hmacSha256Ts,
  sha256Ts,
  toHex,
  utf8,
} from '../src/core/crypto';
import { createSigner } from '../src/core/integrity';
import { tsKernels } from '../src/core/wasm';

const hex = (b: Uint8Array): string => toHex(b);

describe('sha256Ts', () => {
  it('matches FIPS vectors', () => {
    expect(hex(sha256Ts(utf8('')))).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(hex(sha256Ts(utf8('abc')))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(hex(sha256Ts(utf8('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')))).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('agrees with Node on lengths around the block boundary', async () => {
    const { createHash } = await import('node:crypto');
    for (const n of [0, 1, 54, 55, 56, 57, 63, 64, 65, 119, 120, 1000]) {
      const data = new Uint8Array(n).map((_, i) => (i * 31 + 7) & 255);
      expect(hex(sha256Ts(data))).toBe(createHash('sha256').update(data).digest('hex'));
    }
  });
});

describe('hmacSha256', () => {
  it('matches RFC 4231 cases 1, 2 and 6 (long key)', () => {
    expect(hex(hmacSha256Ts(new Uint8Array(20).fill(0x0b), utf8('Hi There')))).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
    expect(hex(hmacSha256Ts(utf8('Jefe'), utf8('what do ya want for nothing?')))).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
    expect(
      hex(hmacSha256Ts(new Uint8Array(131).fill(0xaa), utf8('Test Using Larger Than Block-Size Key - Hash Key First'))),
    ).toBe('60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54');
  });

  it('SubtleCrypto and TypeScript produce identical signatures', async () => {
    const key = utf8('some key');
    const msg = utf8('{"a":1}');
    expect(hex(await hmacSha256Subtle(key, msg))).toBe(hex(hmacSha256Ts(key, msg)));
  });

  it('all three signer implementations agree', async () => {
    const caps = { subtleCrypto: true } as Caps;
    const payload = '{"xp":10}';
    const salt = '00112233445566778899aabbccddeeff';
    const fakeWasm = { ...tsKernels, tier: 'wasm' as const };
    const ts = await createSigner(tsKernels, { subtleCrypto: false } as Caps).sign(payload, salt);
    const subtle = await createSigner(tsKernels, caps, 'subtle').sign(payload, salt);
    const wasm = await createSigner(fakeWasm, caps, 'wasm').sign(payload, salt);
    expect(subtle).toBe(ts);
    expect(wasm).toBe(ts);
    expect(ts).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('chacha20XorTs', () => {
  const key = Uint8Array.from({ length: 32 }, (_, i) => i);
  const nonce = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 0x4a, 0, 0, 0, 0]);
  const plain = utf8(
    "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.",
  );

  it('matches RFC 8439 section 2.4.2', () => {
    const ct = chacha20XorTs(key, nonce, 1, plain);
    expect(hex(ct.subarray(0, 16))).toBe('6e2e359a2568f98041ba0728dd0d6981');
    expect(hex(ct.subarray(ct.length - 4))).toBe('5e42874d');
    expect(chacha20XorTs(key, nonce, 1, ct)).toEqual(plain);
  });

  it('agrees with OpenSSL across several blocks', () => {
    const data = new Uint8Array(300).map((_, i) => (i * 13) & 255);
    const iv = Buffer.concat([Buffer.from([5, 0, 0, 0]), Buffer.from(nonce)]);
    const expected = createCipheriv('chacha20', Buffer.from(key), iv).update(Buffer.from(data));
    expect(hex(chacha20XorTs(key, nonce, 5, data))).toBe(expected.toString('hex'));
  });

  it('rejects wrong key or nonce lengths', () => {
    expect(chacha20XorTs(new Uint8Array(31), nonce, 0, plain)).toHaveLength(0);
    expect(chacha20XorTs(key, new Uint8Array(8), 0, plain)).toHaveLength(0);
  });
});

describe('helpers', () => {
  it('round-trips hex and rejects bad input', () => {
    expect(hex(fromHex('00ff10'))).toBe('00ff10');
    expect(() => fromHex('abc')).toThrow();
    expect(() => fromHex('zz')).toThrow();
  });

  it('constantTimeEqual compares strings', () => {
    expect(constantTimeEqual('abc', 'abc')).toBe(true);
    expect(constantTimeEqual('abc', 'abd')).toBe(false);
    expect(constantTimeEqual('abc', 'ab')).toBe(false);
  });
});
