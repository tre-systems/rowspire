import { GameState, Player, AIType, Board } from '../schemas';
import { MLMoveEvaluation, MoveEvaluationWasm } from '../bindings';
import { SEARCH_AI_DEPTH } from '../constants';
import { getWASMAIService, initializeWASMAI } from '../wasm-ai-service';
import { getValidMoves, printBoard, checkWin } from './board-logic';

export function otherPlayer(player: Player): Player {
  return player === 'player1' ? 'player2' : 'player1';
}

function isValidColumn(move: number | null | undefined): move is number {
  return move !== null && move !== undefined && move >= 0 && move < 7;
}

function wouldWin(board: Board, col: number, player: Player): boolean {
  const row = board[col]?.lastIndexOf(null) ?? -1;
  if (row === -1) return false;
  const newBoard = board.map((c, i) =>
    i === col ? [...c.slice(0, row), player, ...c.slice(row + 1)] : c,
  );
  return checkWin(newBoard, col, row, player) !== null;
}

export function immediateTacticalMove(gameState: GameState): number | null {
  const me = gameState.currentPlayer;
  const opponent = otherPlayer(me);
  const valid = getValidMoves(gameState.board);

  for (const col of valid) {
    if (wouldWin(gameState.board, col, me)) return col;
  }
  for (const col of valid) {
    if (wouldWin(gameState.board, col, opponent)) return col;
  }
  return null;
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
        const tactical = immediateTacticalMove(gameState);
        if (tactical !== null) {
          console.log(`🛡️ ML AI: forced tactical move at column ${tactical}`);
          return tactical;
        }

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
      default:
        response = await wasmAI.getBestMove(gameState, 1);
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
