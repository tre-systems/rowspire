import type { GameState, AIType } from '../types';
import { SEARCH_AI_DEPTH } from '../constants';
import { getWASMAIService, initializeWASMAI } from '../wasm-ai-service';
import { getValidMoves } from './board-logic';

type RandomSource = () => number;

function isValidColumn(move: number | null | undefined): move is number {
  return move !== null && move !== undefined && move >= 0 && move < 7;
}

async function fallbackMove(gameState: GameState, random: RandomSource): Promise<number | null> {
  const wasmAI = getWASMAIService();

  try {
    const fallback = await wasmAI.getBestMove(gameState, 3);
    if (isValidColumn(fallback.move)) return fallback.move;
  } catch (fallbackError) {
    console.error('Search AI fallback failed:', fallbackError);
  }

  const validMoves = getValidMoves(gameState.board);
  if (validMoves.length > 0) {
    const randomMove = validMoves[Math.floor(random() * validMoves.length)];
    if (randomMove === undefined) return null;

    return randomMove;
  }

  return null;
}

async function loadWasmAI() {
  const wasmAI = getWASMAIService();
  if (!wasmAI.isReady) {
    await initializeWASMAI();
  }
  return wasmAI;
}

export async function makeAIMove(
  gameState: GameState,
  aiType: AIType = 'search',
  random: RandomSource = Math.random,
): Promise<number> {
  try {
    const wasmAI = await loadWasmAI();

    let move: number | null;
    switch (aiType) {
      case 'search':
        move = (await wasmAI.getBestMove(gameState, SEARCH_AI_DEPTH)).move;
        break;
      case 'ml':
        move = (await wasmAI.getMLMove(gameState)).move;
        break;
    }

    if (isValidColumn(move)) return move;

    console.error('WASM AI returned invalid move:', move);
    const fallback = await fallbackMove(gameState, random);
    if (fallback !== null) return fallback;
  } catch (error) {
    console.error('WASM AI failed:', error);
    const fallback = await fallbackMove(gameState, random);
    if (fallback !== null) return fallback;
    throw new Error(`AI calculation failed: ${error}`);
  }

  throw new Error('No valid move found');
}
