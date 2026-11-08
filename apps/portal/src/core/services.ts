import { createContext, useContext } from 'react';
import type { Actor } from 'xstate';
import type { Caps, Overrides } from './caps';
import type { Signer } from './integrity';
import type { MasterLoop } from './loop';
import type { StorageLike } from './persistence';
import type { QualityService } from './qualityService';
import type { RootMachine } from './machines/root';
import type { PortalStoreApi } from './store';
import type { Kernels } from './wasm';

export type RootActor = Actor<RootMachine>;

/** Everything the app wires together at boot. Registered in the sealed registry and exposed to React. */
export interface Services {
  readonly caps: Caps;
  readonly overrides: Overrides;
  readonly kernels: Kernels;
  readonly loop: MasterLoop;
  readonly quality: QualityService;
  readonly store: PortalStoreApi;
  readonly actor: RootActor;
  readonly signer: Signer;
  readonly storage: StorageLike;
  readonly persistent: boolean;
  readonly base: string;
}

export const ServicesContext = createContext<Services | null>(null);

export function useServices(): Services {
  const value = useContext(ServicesContext);
  if (!value) throw new Error('useServices must be used inside <ServicesContext.Provider>');
  return value;
}
