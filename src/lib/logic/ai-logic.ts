import type { GameState, AIType } from '../types';
import { BOARD_COLUMNS, SEARCH_AI_DEPTH } from '../constants';
import { getWASMAIService, initializeWASMAI } from '../wasm-ai-service';
import { getValidMoves } from './board-logic';

type RandomSource = () => number;

function isValidMove(gameState: GameState, move: number | null | undefined): move is number {
  return (
    move !== null &&
    move !== undefined &&
    Number.isInteger(move) &&
    move >= 0 &&
    move < BOARD_COLUMNS &&
    gameState.board[move]?.includes(null) === true
  );
}

async function fallbackMove(gameState: GameState, random: RandomSource): Promise<number | null> {
  const wasmAI = getWASMAIService();

  try {
    const fallback = await wasmAI.getBestMove(gameState, 3);
    if (isValidMove(gameState, fallback.move)) return fallback.move;
  } catch (fallbackError) {
    console.error('Search AI fallback failed:', fallbackError);
  }

  const validMoves = getValidMoves(gameState.board);
  if (validMoves.length === 0) return null;

  const index = Math.min(Math.floor(random() * validMoves.length), validMoves.length - 1);
  return validMoves[index] ?? null;
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

    if (isValidMove(gameState, move)) return move;

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
