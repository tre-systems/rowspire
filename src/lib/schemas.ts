import { z } from 'zod';
import { BOARD_COLUMNS, BOARD_ROWS } from './constants';
import { gameStateInvariantErrors } from './logic/game-state-invariants';

export const PlayerSchema = z.enum(['player1', 'player2']);
export type Player = z.infer<typeof PlayerSchema>;

const GameStatusSchema = z.enum(['not_started', 'playing', 'finished']);

const BoardSchema = z
  .array(z.array(PlayerSchema.nullable()).length(BOARD_ROWS))
  .length(BOARD_COLUMNS);
export type Board = z.infer<typeof BoardSchema>;

export const ColumnIndexSchema = z
  .number()
  .int()
  .min(0)
  .max(BOARD_COLUMNS - 1);
export type ColumnIndex = z.infer<typeof ColumnIndexSchema>;

const RowIndexSchema = z
  .number()
  .int()
  .min(0)
  .max(BOARD_ROWS - 1);

const BoardPositionSchema = z.object({
  column: ColumnIndexSchema,
  row: RowIndexSchema,
});
export type BoardPosition = z.infer<typeof BoardPositionSchema>;

export const MoveRecordSchema = z.object({
  player: PlayerSchema,
  column: ColumnIndexSchema,
  row: RowIndexSchema,
});
export type MoveRecord = z.infer<typeof MoveRecordSchema>;

const MoveSourceSchema = z.enum(['human', 'ai']);

export const PendingMoveSchema = z.object({
  player: PlayerSchema,
  column: ColumnIndexSchema,
  source: MoveSourceSchema,
});
export type PendingMove = z.infer<typeof PendingMoveSchema>;

export const WinningLineSchema = z.object({
  positions: z.array(BoardPositionSchema).min(4).max(BOARD_COLUMNS),
  direction: z.enum(['horizontal', 'vertical', 'diagonal']),
});
export type WinningLine = z.infer<typeof WinningLineSchema>;

export const GameStateSchema = z
  .object({
    board: BoardSchema,
    currentPlayer: PlayerSchema,
    gameStatus: GameStatusSchema,
    winner: PlayerSchema.nullable(),
    history: z.array(MoveRecordSchema),
    winningLine: WinningLineSchema.nullable(),
  })
  .superRefine((state, context) => {
    for (const message of gameStateInvariantErrors(state)) {
      context.addIssue({ code: 'custom', message });
    }
  });
export type GameState = z.infer<typeof GameStateSchema>;

export const AITypeSchema = z.enum(['search', 'ml']);
export type AIType = z.infer<typeof AITypeSchema>;

export const DifficultySchema = z.enum(['relaxed', 'standard', 'expert']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const GameModeSchema = z.enum(['human-vs-human', 'human-vs-ai', 'ai-vs-ai']);
export type GameMode = z.infer<typeof GameModeSchema>;

export type PersistedGameStore = {
  gameState: GameState;
  selectedAI: AIType;
  player1AI: AIType;
  player2AI: AIType;
  difficulty: Difficulty;
  gameMode: GameMode;
};
