import type { GameState, AIType } from '../types';
import { MLMoveEvaluation, MoveEvaluationWasm } from '../bindings';
import { SEARCH_AI_DEPTH } from '../constants';
import { getWASMAIService, initializeWASMAI } from '../wasm-ai-service';
import { getValidMoves, printBoard } from './board-logic';

function isValidColumn(move: number | null | undefined): move is number {
  return move !== null && move !== undefined && move >= 0 && move < 7;
}

async function fallbackMove(gameState: GameState): Promise<number | null> {
  const wasmAI = getWASMAIService();

  try {
    const fallback = await wasmAI.getBestMove(gameState, 3);
    if (isValidColumn(fallback.move)) {
      console.log(`🤖 Search AI fallback chose column ${fallback.move}`);
      return fallback.move;
    }
  } catch (fallbackError) {
    console.error('Search AI fallback failed:', fallbackError);
  }

  const validMoves = getValidMoves(gameState.board);
  if (validMoves.length > 0) {
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    if (randomMove === undefined) return null;

    console.log(`🤖 Random fallback chose column ${randomMove}`);
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

export async function makeAIMove(gameState: GameState, aiType: AIType = 'search'): Promise<number> {
  try {
    const wasmAI = await loadWasmAI();

    console.log(`\n🤖 ${aiType.toUpperCase()} AI thinking...`);
    printBoard(gameState.board, 'Current board before AI move');

    wasmAI.clearTranspositionTable();

    let response;
    switch (aiType) {
      case 'search':
        response = await wasmAI.getBestMove(gameState, SEARCH_AI_DEPTH);
        break;
      case 'ml': {
        const mlResponse = await wasmAI.getMLMove(gameState);
        if (mlResponse.thinking) {
          console.log(`🧠 ML AI Thinking: ${mlResponse.thinking}`);
        }
        response = {
          move: mlResponse.move,
          evaluations:
            mlResponse.diagnostics?.moveEvaluations?.map((e: MLMoveEvaluation) => ({
              column: e.column,
              score: e.score,
              moveType: e.moveType,
            })) || [],
          nodesEvaluated: 0,
          transpositionHits: 0,
        };
        break;
      }
    }

    if (isValidColumn(response.move)) {
      const chosenCol = response.move;
      const moveTime =
        response.nodesEvaluated > 0
          ? `(${response.nodesEvaluated} nodes, ${response.transpositionHits || 0} cache hits)`
          : '';

      let scoreTable = '';
      let bestReason = '';
      if (response.evaluations && response.evaluations.length > 0) {
        const bestType =
          response.evaluations.find((e: MoveEvaluationWasm) => e.column === chosenCol)?.moveType ||
          '';
        bestReason = bestType ? ` (${bestType})` : '';

        scoreTable = '\nAI Evaluation Table:';
        scoreTable += '\n-------------------------------------------';
        scoreTable += '\n Col |   Score   |   Type';
        scoreTable += '\n-------------------------------------------';
        response.evaluations.forEach((e: MoveEvaluationWasm) => {
          const highlight = e.column === chosenCol ? ' <==' : '';
          const moveType = e.moveType || 'normal';
          scoreTable += `\n  ${e.column}  | ${String(e.score).padStart(8)} | ${moveType.padEnd(8)}${highlight}`;
        });
        scoreTable += '\n-------------------------------------------';
      }

      console.log(`🤖 AI chose column ${chosenCol} ${moveTime}${bestReason}`);
      if (scoreTable) console.log(scoreTable);
      return chosenCol;
    }

    console.error('WASM AI returned invalid move:', response.move);
    console.log('🤖 Falling back to Search AI...');
    const fallback = await fallbackMove(gameState);
    if (fallback !== null) return fallback;
  } catch (error) {
    console.error('WASM AI failed:', error);
    const fallback = await fallbackMove(gameState);
    if (fallback !== null) return fallback;
    throw new Error(`AI calculation failed: ${error}`);
  }

  throw new Error('No valid move found');
}
