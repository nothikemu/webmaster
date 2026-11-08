/**
 * Sealed service registry. Services are declared with `define`, created lazily on first
 * `require`, and the registry is sealed before the first render so nothing can be swapped later.
 * State lives in #private fields; nothing is attached to `window`.
 */

type Factory<T> = (get: <U>(name: string) => U) => T;

interface Definition {
  factory: Factory<unknown>;
  created: boolean;
  value: unknown;
}

export class Registry {
  readonly #defs = new Map<string, Definition>();
  readonly #resolving = new Set<string>();
  #sealed = false;

  define<T>(name: string, factory: Factory<T>): void {
    if (this.#sealed) throw new Error(`registry sealed: cannot define "${name}"`);
    if (this.#defs.has(name)) throw new Error(`registry: "${name}" is already defined`);
    this.#defs.set(name, { factory: factory as Factory<unknown>, created: false, value: undefined });
  }

  /** Registers an already-created value, for results of async boot steps. */
  provide<T>(name: string, value: T): void {
    this.define(name, () => value);
  }

  require<T>(name: string): T {
    const def = this.#defs.get(name);
    if (!def) throw new Error(`registry: "${name}" is not defined`);
    if (def.created) return def.value as T;
    if (this.#resolving.has(name)) throw new Error(`registry: dependency cycle at "${name}"`);
    this.#resolving.add(name);
    try {
      def.value = def.factory(<U>(dep: string): U => this.require<U>(dep));
      def.created = true;
    } finally {
      this.#resolving.delete(name);
    }
    return def.value as T;
  }

  has(name: string): boolean {
    return this.#defs.has(name);
  }

  seal(): void {
    this.#sealed = true;
  }

  get sealed(): boolean {
    return this.#sealed;
  }
}

export function createRegistry(): Readonly<Registry> {
  return Object.freeze(new Registry());
}

/** The app-wide registry (module scope, not a global). */
export const registry: Readonly<Registry> = createRegistry();
export const define = <T>(name: string, factory: Factory<T>): void => registry.define(name, factory);
export const provide = <T>(name: string, value: T): void => registry.provide(name, value);
export const require_ = <T>(name: string): T => registry.require<T>(name);
