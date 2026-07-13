import { GameState } from './schemas';
import type { WasmBestMoveResponse, WasmHeuristicResponse, WasmMLResponse } from './bindings';
import { DEFAULT_GENETIC_PARAMS } from './constants';
import { MLAIWorkerClient } from './ml-ai-worker-client';

interface WASMAIInstance {
  get_best_move: (state: unknown, depth: number) => WasmBestMoveResponse;
  get_heuristic_move: (state: unknown) => WasmHeuristicResponse;
  evaluate_position: (state: unknown) => number;
  clear_transposition_table: () => void;
  get_transposition_table_size: () => number;
}

interface WASMModule {
  default: () => Promise<unknown>;
  RowspireAI: new () => WASMAIInstance;
}

class WASMAIService {
  private ai: WASMAIInstance | null = null;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private readonly mlClient = new MLAIWorkerClient();

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._initialize();
    try {
      await this.loadPromise;
    } finally {
      this.loadPromise = null;
    }
  }

  private async _initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      console.log('🔄 Skipping WASM AI initialization in non-browser environment');
      return;
    }

    try {
      const wasmModulePath = '/wasm/rowspire_ai_core.js';
      const wasmModule = (await import(/* webpackIgnore: true */ wasmModulePath)) as WASMModule;

      await wasmModule.default();
      this.ai = new wasmModule.RowspireAI();
      this.isLoaded = true;
      console.log('✅ WASM AI loaded successfully');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load WASM AI: ${detail}`, { cause: error });
    }
  }

  private async convertGameStateToWASM(gameState: GameState): Promise<unknown> {
    const board = gameState.board.map(col => col.map(cell => cell ?? 'empty'));

    const geneticParams = await this.loadGeneticParams();

    return {
      board,
      current_player: gameState.currentPlayer,
      genetic_params: geneticParams,
    };
  }

  private async loadGeneticParams(): Promise<Record<string, string | number | string[]>> {
    try {
      const response = await fetch('/ml/data/genetic_params/evolved.json');
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn('Failed to load evolved genetic parameters, using defaults:', error);
    }
    return DEFAULT_GENETIC_PARAMS;
  }

  async getBestMove(gameState: GameState, depth: number = 1): Promise<WasmBestMoveResponse> {
    if (!this.isLoaded || !this.ai) {
      throw new Error('WASM AI not loaded');
    }

    try {
      const wasmState = await this.convertGameStateToWASM(gameState);
      return this.ai.get_best_move(wasmState, depth);
    } catch (error) {
      throw new Error(`WASM AI failed: ${String(error)}`, { cause: error });
    }
  }

  async getHeuristicMove(gameState: GameState): Promise<WasmHeuristicResponse> {
    if (!this.isLoaded || !this.ai) {
      throw new Error('WASM AI not loaded');
    }

    try {
      const wasmState = await this.convertGameStateToWASM(gameState);
      return this.ai.get_heuristic_move(wasmState);
    } catch (error) {
      throw new Error(`WASM heuristic AI failed: ${String(error)}`, { cause: error });
    }
  }

  async getMLMove(gameState: GameState): Promise<WasmMLResponse> {
    const wasmState = await this.convertGameStateToWASM(gameState);
    return this.mlClient.request(wasmState);
  }

  async evaluatePosition(gameState: GameState): Promise<number> {
    if (!this.isLoaded || !this.ai) {
      throw new Error('WASM AI not loaded');
    }

    try {
      const wasmState = await this.convertGameStateToWASM(gameState);
      return this.ai.evaluate_position(wasmState);
    } catch (error) {
      throw new Error(`WASM position evaluation failed: ${String(error)}`, { cause: error });
    }
  }

  get isReady(): boolean {
    return this.isLoaded;
  }

  clearTranspositionTable(): void {
    if (this.isLoaded && this.ai) {
      this.ai.clear_transposition_table();
    }
  }

  getTranspositionTableSize(): number {
    if (this.isLoaded && this.ai) {
      return this.ai.get_transposition_table_size();
    }
    return 0;
  }
}

let wasmAIInstance: WASMAIService | null = null;

export function getWASMAIService(): WASMAIService {
  if (!wasmAIInstance) {
    wasmAIInstance = new WASMAIService();
  }
  return wasmAIInstance;
}

export function resetWASMAIService(): void {
  wasmAIInstance = null;
}

export async function initializeWASMAI(): Promise<void> {
  await getWASMAIService().initialize();
}

export default WASMAIService;
