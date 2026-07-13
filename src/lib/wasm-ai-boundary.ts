import { z } from 'zod';
import { BOARD_COLUMNS, BOARD_ROWS } from './constants';
import type {
  GameState as WasmGameState,
  GeneticParams,
  WasmBestMoveResponse,
  WasmMLResponse,
} from './bindings';

const CellSchema = z.enum(['empty', 'player1', 'player2']);
const PlayerSchema = z.enum(['player1', 'player2']);

export const GeneticParamsSchema: z.ZodType<GeneticParams> = z
  .object({
    id: z.string(),
    parent_ids: z.array(z.string()),
    generation: z.number().int().nonnegative(),
    win_score: z.number().finite(),
    loss_score: z.number().finite(),
    center_column_value: z.number().finite(),
    adjacent_center_value: z.number().finite(),
    outer_column_value: z.number().finite(),
    edge_column_value: z.number().finite(),
    row_height_weight: z.number().finite(),
    center_control_weight: z.number().finite(),
    piece_count_weight: z.number().finite(),
    threat_weight: z.number().finite(),
    mobility_weight: z.number().finite(),
    vertical_control_weight: z.number().finite(),
    horizontal_control_weight: z.number().finite(),
    defensive_weight: z.number().finite(),
  })
  .strict();

export const WasmGameStateSchema: z.ZodType<WasmGameState> = z
  .object({
    board: z.array(z.array(CellSchema).length(BOARD_ROWS)).length(BOARD_COLUMNS),
    current_player: PlayerSchema,
    genetic_params: GeneticParamsSchema,
  })
  .strict();

const MoveEvaluationSchema = z
  .object({
    column: z
      .number()
      .int()
      .min(0)
      .max(BOARD_COLUMNS - 1),
    score: z.number().finite(),
    moveType: z.string(),
  })
  .strict();

export const BestMoveResponseSchema: z.ZodType<WasmBestMoveResponse> = z
  .object({
    move: z
      .number()
      .int()
      .min(0)
      .max(BOARD_COLUMNS - 1)
      .nullable(),
    evaluations: z.array(MoveEvaluationSchema),
    nodesEvaluated: z.number().int().nonnegative(),
    transpositionHits: z.number().int().nonnegative(),
  })
  .strict();

export const MLResponseSchema: z.ZodType<WasmMLResponse> = z
  .object({
    move: z
      .number()
      .int()
      .min(0)
      .max(BOARD_COLUMNS - 1)
      .nullable(),
    evaluation: z.number().finite(),
    thinking: z.string(),
    diagnostics: z
      .object({
        validMoves: z.array(
          z
            .number()
            .int()
            .min(0)
            .max(BOARD_COLUMNS - 1),
        ),
        moveEvaluations: z.array(MoveEvaluationSchema),
        valueNetworkOutput: z.number().finite(),
        policyNetworkOutputs: z.array(z.number().finite()).length(BOARD_COLUMNS),
      })
      .strict(),
  })
  .strict();

export const MLWeightsSchema = z
  .object({
    metadata: z.unknown().optional(),
    value_network: z.object({ weights: z.array(z.number().finite()).length(62_593) }).strict(),
    policy_network: z.object({ weights: z.array(z.number().finite()).length(63_367) }).strict(),
  })
  .strict();

export interface WASMAIInstance {
  clear_transposition_table: () => void;
  get_best_move: (state: WasmGameState, depth: number) => unknown;
  get_ml_move: (state: WasmGameState, simulations: number) => unknown;
  load_ml_weights: (value: number[], policy: number[]) => void;
}

export interface WASMModule {
  default: () => Promise<unknown>;
  RowspireAI: new () => WASMAIInstance;
}
