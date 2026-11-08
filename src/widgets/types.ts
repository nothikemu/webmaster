import type { WidgetSpec } from '@/content/types';

export interface WidgetProps {
  spec: WidgetSpec;
  /** The player's saved best score for this experiment (0-100). */
  best: number;
  /** Report a score (0-100). The engine keeps only the best and pays XP for improvement. */
  onScore: (score: number) => void;
}
