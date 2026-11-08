import type { WidgetProps } from './types';
import { Chooser, ClaimReview, Sorter } from './Generic';
import { BiasAudit, Classifier, NetPlayground, NextToken, SpamLearner, TokenWindow } from './Bespoke';

/** Picks the interactive experiment for a lesson. Every one reports a 0-100 score through `onScore`. */
export function Widget(props: WidgetProps) {
  switch (props.spec.id) {
    case 'spam-learner':
      return <SpamLearner {...props} />;
    case 'classifier':
      return <Classifier {...props} />;
    case 'network':
      return <NetPlayground {...props} />;
    case 'next-token':
      return <NextToken {...props} />;
    case 'token-window':
      return <TokenWindow {...props} />;
    case 'sorter':
      return <Sorter {...props} />;
    case 'chooser':
      return <Chooser {...props} />;
    case 'prompt-builder':
      return <Chooser {...props} assemble />;
    case 'claim-review':
      return <ClaimReview {...props} />;
    case 'bias-audit':
      return <BiasAudit {...props} />;
  }
}
