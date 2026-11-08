/** localStorage persistence with in-memory fallback, signature checks, migration and export/import. */
import { randomBytes, toHex } from './crypto';
import { signState, verifyState, type Signer } from './integrity';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  createInitialState,
  migrate,
  validateState,
  type PersistedState,
} from './schema';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

/** Uses localStorage when it actually works (private windows and blocked storage can throw). */
export function createStorage(): { storage: StorageLike; persistent: boolean } {
  try {
    const ls = globalThis.localStorage;
    const probe = `${STORAGE_KEY}/probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { storage: ls, persistent: true };
  } catch {
    return { storage: createMemoryStorage(), persistent: false };
  }
}

export const newSalt = (): string => toHex(randomBytes(16));

export type LoadStatus = 'fresh' | 'ok' | 'migrated' | 'recovered';

export interface LoadResult {
  state: PersistedState;
  status: LoadStatus;
}

/**
 * Reads stored progress. Anything that fails parsing, validation or the signature check is
 * replaced by a fresh state without surfacing an error to the visitor.
 */
export async function loadState(storage: StorageLike, signer: Signer, now: number): Promise<LoadResult> {
  let text: string | null = null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    text = null;
  }
  const fresh = async (status: LoadStatus): Promise<LoadResult> => ({
    state: await signState(signer, createInitialState(now, newSalt())),
    status,
  });
  if (text === null) return fresh('fresh');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fresh('recovered');
  }
  const upgraded = migrate(raw, now, newSalt());
  if (!upgraded) return fresh('recovered');
  const checked = validateState(upgraded.data);
  if (!checked.ok) return fresh('recovered');
  if (upgraded.migrated) return { state: await signState(signer, checked.state), status: 'migrated' };
  if (!(await verifyState(signer, checked.state))) return fresh('recovered');
  return { state: checked.state, status: 'ok' };
}

export async function saveState(storage: StorageLike, signer: Signer, state: PersistedState): Promise<PersistedState> {
  const signed = await signState(signer, state);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(signed));
  } catch {
    /* quota or blocked storage: progress stays in memory for this visit */
  }
  return signed;
}

export function clearState(storage: StorageLike): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

// ---- export / import --------------------------------------------------------------------------
export const EXPORT_FORMAT = 'tsa-ai-portal-progress';

export async function exportProgress(signer: Signer, state: PersistedState, now: number): Promise<string> {
  const signed = await signState(signer, state);
  return JSON.stringify({ format: EXPORT_FORMAT, version: SCHEMA_VERSION, exportedAt: now, state: signed }, null, 2);
}

export type ImportResult = { ok: true; state: PersistedState } | { ok: false; reason: string };

/**
 * Accepts an export file. The signature must verify under the salt stored in the file; the
 * accepted state is then re-signed under a new salt so the import becomes this device's own.
 */
export async function parseImport(text: string, signer: Signer, now: number): Promise<ImportResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'That file is not valid JSON.' };
  }
  const body =
    typeof raw === 'object' && raw !== null && (raw as { format?: unknown }).format === EXPORT_FORMAT
      ? (raw as { state?: unknown }).state
      : raw;
  const upgraded = migrate(body, now, newSalt());
  if (!upgraded) return { ok: false, reason: 'That file is not a progress export.' };
  const checked = validateState(upgraded.data);
  if (!checked.ok) return { ok: false, reason: 'The file is missing fields or has values out of range.' };
  if (!upgraded.migrated && !(await verifyState(signer, checked.state))) {
    return { ok: false, reason: 'The signature does not match. The file was edited or is damaged.' };
  }
  const rehomed: PersistedState = { ...checked.state, salt: newSalt(), updatedAt: now };
  return { ok: true, state: await signState(signer, rehomed) };
}
