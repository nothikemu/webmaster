export interface StationProps {
  /** 1-based round the player picked. */
  round: number;
  /** Call once when the round is won. */
  onClear: () => void;
}
