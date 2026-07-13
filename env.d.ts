import type {
  WasmBestMoveResponse,
  WasmHeuristicResponse,
  WasmMLResponse,
} from './src/lib/bindings';

declare module '/wasm/rowspire_ai_core.js' {
  export class RowspireAI {
    free(): void;
    constructor();
    get_best_move(board_state: unknown, depth: number): WasmBestMoveResponse;
    get_heuristic_move(board_state: unknown): WasmHeuristicResponse;
    get_ml_move(board_state: unknown): WasmMLResponse;
    evaluate_position(board_state: unknown): number;
    evaluate_position_ml(board_state: unknown): number;
    get_valid_moves(board_state: unknown): unknown;
    make_move(board_state: unknown, column: number): unknown;
    is_game_over(board_state: unknown): boolean;
    get_winner(board_state: unknown): unknown;
    create_new_game(): unknown;
    create_game_with_params(params: unknown): unknown;
    clear_transposition_table(): void;
    get_transposition_table_size(): number;
    load_ml_weights(value_weights: unknown, policy_weights: unknown): void;
  }

  export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

  export interface InitOutput {
    readonly memory: WebAssembly.Memory;
  }

  export type SyncInitInput = BufferSource | WebAssembly.Module;

  export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

  export default function __wbg_init(
    module_or_path?:
      { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>,
  ): Promise<InitOutput>;
}
