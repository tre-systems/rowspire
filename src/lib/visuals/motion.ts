export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const MOTION = {
  entrance: { duration: 0.5, ease: EASE_OUT },
  quick: { duration: 0.22, ease: EASE_OUT },
  spring: { type: 'spring' as const, stiffness: 420, damping: 32 },
};

export const PIECE_DROP_DURATION_MS = 560;
export const WIN_REVEAL_DURATION_MS = 1100;
