import type { ReactNode } from 'react';
import { ABOUT } from '../content/site';
import { Doc } from './Doc';

export default function About(): ReactNode {
  return <Doc page={ABOUT} />;
}
