/**
 * Two integrity layers, both tamper-evidence rather than security (the client holds every key):
 *  1. Signed state: HMAC-SHA-256 over canonical state plus a per-device salt. WebAssembly first,
 *     SubtleCrypto second, pure TypeScript last. All three agree byte for byte.
 *  2. Boot guard: SHA-256 of the WebAssembly binaries, the encrypted asset blob and app chunks
 *     compared with build-time checksums. A mismatch degrades to the static view.
 */
import type { Caps } from './caps';
import { constantTimeEqual, hmacSha256Subtle, hmacSha256Ts, toHex, utf8 } from './crypto';
import { signingPayload, type PersistedState } from './schema';
import type { Kernels } from './wasm';

const STATE_KEY_PREFIX = 'tsa-ai-portal/state-v1';

export type SignerKind = 'wasm' | 'subtle' | 'ts';

export interface Signer {
  readonly kind: SignerKind;
  sign(payload: string, saltHex: string): Promise<string>;
}

export function createSigner(kernels: Kernels, caps: Caps, force?: SignerKind): Signer {
  const keyFor = (salt: string): Uint8Array => utf8(`${STATE_KEY_PREFIX}:${salt}`);
  const useWasm = force ? force === 'wasm' : kernels.tier !== 'ts';
  const useSubtle = force ? force === 'subtle' : caps.subtleCrypto;
  if (useWasm && kernels.tier !== 'ts') {
    return { kind: 'wasm', sign: async (p, s) => toHex(kernels.hmacSha256(keyFor(s), utf8(p))) };
  }
  if (useSubtle) {
    return {
      kind: 'subtle',
      sign: async (p, s) => {
        try {
          return toHex(await hmacSha256Subtle(keyFor(s), utf8(p)));
        } catch {
          return toHex(hmacSha256Ts(keyFor(s), utf8(p)));
        }
      },
    };
  }
  return { kind: 'ts', sign: async (p, s) => toHex(hmacSha256Ts(keyFor(s), utf8(p))) };
}

export async function signState(signer: Signer, state: PersistedState): Promise<PersistedState> {
  return { ...state, sig: await signer.sign(signingPayload(state), state.salt) };
}

export async function verifyState(signer: Signer, state: PersistedState): Promise<boolean> {
  if (state.sig.length !== 64) return false;
  const expected = await signer.sign(signingPayload(state), state.salt);
  return constantTimeEqual(expected, state.sig);
}

// ---- boot guard -------------------------------------------------------------------------------
export type ChecksumManifest = Readonly<Record<string, string>>;
export type GuardResult = 'ok' | 'mismatch' | 'skipped';

/**
 * Fetches each listed file (normally already in the HTTP cache) and compares its SHA-256.
 * A network failure never counts as tampering: offline visitors keep working.
 */
export async function verifyChecksums(
  manifest: ChecksumManifest,
  kernels: Kernels,
  base: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GuardResult> {
  const entries = Object.entries(manifest);
  if (entries.length === 0) return 'skipped';
  const outcomes = await Promise.all(
    entries.map(async ([path, expected]): Promise<'ok' | 'bad' | 'skip'> => {
      try {
        const res = await fetchImpl(new URL(path, base).toString(), { cache: 'force-cache' });
        if (!res.ok) return 'skip';
        const bytes = new Uint8Array(await res.arrayBuffer());
        return constantTimeEqual(toHex(kernels.sha256(bytes)), expected) ? 'ok' : 'bad';
      } catch {
        return 'skip'; // offline or blocked: never counts as tampering
      }
    }),
  );
  if (outcomes.includes('bad')) return 'mismatch';
  return outcomes.includes('ok') ? 'ok' : 'skipped';
}
