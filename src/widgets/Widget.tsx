import type { WidgetProps } from './types';
import { Chooser, ClaimReview, Sorter } from './Generic';
import { BiasAudit, Classifier, NetPlayground, NextToken, SpamLearner, TokenWindow } from './Bespoke';

/** Picks the guided experiment for a lesson. Experiments keep no score: they show what happens and why. */
export function Widget(props: WidgetProps) {
  switch (props.spec.id) {
    case 'spam-learner':
      return <SpamLearner />;
    case 'classifier':
      return <Classifier />;
    case 'network':
      return <NetPlayground />;
    case 'next-token':
      return <NextToken />;
    case 'token-window':
      return <TokenWindow />;
    case 'sorter':
      return <Sorter {...props} />;
    case 'chooser':
      return <Chooser {...props} />;
    case 'prompt-builder':
      return <Chooser {...props} assemble />;
    case 'claim-review':
      return <ClaimReview {...props} />;
    case 'bias-audit':
      return <BiasAudit />;
  }
}
