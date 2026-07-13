import type { GameState } from './types';
import type {
  GameState as WasmGameState,
  GeneticParams,
  WasmBestMoveResponse,
  WasmMLResponse,
} from './bindings';
import { DEFAULT_GENETIC_PARAMS } from './constants';
import { AIWorkerClient } from './ai-worker-client';
import { GeneticParamsSchema, WasmGameStateSchema } from './wasm-ai-boundary';

export default class WASMAIService {
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;
  private geneticParamsPromise: Promise<GeneticParams> | null = null;

  constructor(private readonly client = new AIWorkerClient()) {}

  async initialize(): Promise<void> {
    if (this.isLoaded || typeof window === 'undefined') return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this.client.initialize();
    try {
      await this.loadPromise;
      this.isLoaded = true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load WASM AI: ${detail}`, { cause: error });
    } finally {
      this.loadPromise = null;
    }
  }

  async getBestMove(gameState: GameState, depth = 1): Promise<WasmBestMoveResponse> {
    await this.initialize();
    const state = await this.convertGameState(gameState);
    return this.client.search(state, depth);
  }

  async getMLMove(gameState: GameState): Promise<WasmMLResponse> {
    await this.initialize();
    const state = await this.convertGameState(gameState);
    return this.client.ml(state);
  }

  get isReady(): boolean {
    return this.isLoaded;
  }

  private async convertGameState(gameState: GameState): Promise<WasmGameState> {
    return WasmGameStateSchema.parse({
      board: gameState.board.map(column => column.map(cell => cell ?? 'empty')),
      current_player: gameState.currentPlayer,
      genetic_params: await this.loadGeneticParams(),
    });
  }

  private loadGeneticParams(): Promise<GeneticParams> {
    this.geneticParamsPromise ??= this.fetchGeneticParams();
    return this.geneticParamsPromise;
  }

  private async fetchGeneticParams(): Promise<GeneticParams> {
    try {
      const response = await fetch('/ml/data/genetic_params/evolved.json');
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      return GeneticParamsSchema.parse(await response.json());
    } catch (error) {
      console.warn('Failed to load evolved genetic parameters, using defaults:', error);
      return GeneticParamsSchema.parse(DEFAULT_GENETIC_PARAMS);
    }
  }
}

let wasmAIInstance: WASMAIService | null = null;

export function getWASMAIService(): WASMAIService {
  wasmAIInstance ??= new WASMAIService();
  return wasmAIInstance;
}

export function resetWASMAIService(): void {
  wasmAIInstance = null;
}

export async function initializeWASMAI(): Promise<void> {
  await getWASMAIService().initialize();
}
