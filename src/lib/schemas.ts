import { z } from 'zod';

export const PlayerSchema = z.enum(['player1', 'player2']);
export type Player = z.infer<typeof PlayerSchema>;

export const GameStatusSchema = z.enum(['not_started', 'waiting', 'playing', 'finished']);
export type GameStatus = z.infer<typeof GameStatusSchema>;

export const BoardSchema = z.array(z.array(PlayerSchema.nullable()).length(6)).length(7);
export type Board = z.infer<typeof BoardSchema>;

export const ColumnIndexSchema = z.number().int().min(0).max(6);
export type ColumnIndex = z.infer<typeof ColumnIndexSchema>;

export const RowIndexSchema = z.number().int().min(0).max(5);
export type RowIndex = z.infer<typeof RowIndexSchema>;

export const MoveRecordSchema = z.object({
  player: PlayerSchema,
  column: ColumnIndexSchema,
  row: RowIndexSchema,
});
export type MoveRecord = z.infer<typeof MoveRecordSchema>;

export const MoveSourceSchema = z.enum(['human', 'ai']);
export type MoveSource = z.infer<typeof MoveSourceSchema>;

export const PendingMoveSchema = z.object({
  player: PlayerSchema,
  column: ColumnIndexSchema,
  source: MoveSourceSchema,
});
export type PendingMove = z.infer<typeof PendingMoveSchema>;

export const WinningLineSchema = z.object({
  positions: z.array(
    z.object({
      column: ColumnIndexSchema,
      row: RowIndexSchema,
    }),
  ),
  direction: z.enum(['horizontal', 'vertical', 'diagonal']),
});
export type WinningLine = z.infer<typeof WinningLineSchema>;

export const GameStateSchema = z.object({
  board: BoardSchema,
  currentPlayer: PlayerSchema,
  gameStatus: GameStatusSchema,
  winner: PlayerSchema.nullable(),
  history: z.array(MoveRecordSchema),
  winningLine: WinningLineSchema.nullable(),
});
export type GameState = z.infer<typeof GameStateSchema>;

export const AITypeSchema = z.enum(['search', 'ml']);
export type AIType = z.infer<typeof AITypeSchema>;

export const GameModeSchema = z.enum(['human-vs-human', 'human-vs-ai', 'ai-vs-ai']);
export type GameMode = z.infer<typeof GameModeSchema>;
