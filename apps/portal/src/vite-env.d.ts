/// <reference types="vite/client" />

declare module 'virtual:secure-assets' {
  /** Build-time manifest of the encrypted asset table. `plain` is true in dev, where sources ship unencrypted. */
  export interface SecureManifest {
    readonly plain: boolean;
    /** URL of the encrypted blob (empty in dev). */
    readonly url: string;
    readonly nonce: string;
    /** Key split in two shares that must be XORed (obfuscation, not secrecy). */
    readonly shareA: string;
    readonly shareB: string;
    /** name -> [offset, length] inside the decrypted blob. */
    readonly index: Readonly<Record<string, readonly [number, number]>>;
    /** Dev only: name -> plaintext. */
    readonly sources: Readonly<Record<string, string>>;
  }
  export const manifest: SecureManifest;
}

declare module 'virtual:integrity' {
  /** Path (relative to the site base) -> SHA-256 hex, filled in after the bundle is written. */
  export const checksums: Readonly<Record<string, string>>;
  export const buildId: string;
}
