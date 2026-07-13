import { aiForTurn, isAITurn, isSameTurn } from './game-state-machine';
import type { GameGeneration, GameStoreDependencies, StoreAccess } from './game-store-core';
import type { GameStore } from './game-store-state';
import { ColumnIndexSchema, type ColumnIndex, type GameState } from './types';

const AI_DELAY_MS = 500;

function validateAIMove(state: GameState, column: number): ColumnIndex {
  const result = ColumnIndexSchema.safeParse(column);
  if (!result.success || !state.board[result.data]?.includes(null)) {
    throw new Error(`AI returned invalid column: ${column}`);
  }
  return result.data;
}

function clearThinking(set: StoreAccess['set']) {
  set(state => {
    state.aiThinking = false;
  });
}

export function createAIActions(
  { set, get }: StoreAccess,
  dependencies: GameStoreDependencies,
  generation: GameGeneration,
): Pick<GameStore['actions'], 'makeAIMove'> {
  return {
    makeAIMove: async () => {
      const initial = get();
      if (initial.aiThinking || initial.pendingMove) return;
      if (!isAITurn(initial.gameState, initial.gameMode)) return;

      const requestGeneration = generation.value;
      set(state => {
        state.aiThinking = true;
      });

      await dependencies.wait(AI_DELAY_MS);
      const current = get();
      if (requestGeneration !== generation.value) return;
      if (!isAITurn(current.gameState, current.gameMode)) return clearThinking(set);

      const aiType = aiForTurn(
        current.gameState,
        current.gameMode,
        current.selectedAI,
        current.player1AI,
        current.player2AI,
      );

      try {
        const selectedColumn = await dependencies.ai.chooseMove(
          current.gameState,
          aiType,
          dependencies.random,
        );
        const column = validateAIMove(current.gameState, selectedColumn);
        const latest = get();
        if (requestGeneration !== generation.value) return;
        if (!isSameTurn(current.gameState, latest.gameState)) return clearThinking(set);
        if (!isAITurn(latest.gameState, latest.gameMode)) return clearThinking(set);

        set(state => {
          state.pendingMove = {
            column,
            player: current.gameState.currentPlayer,
            source: 'ai',
          };
          state.aiThinking = false;
        });
      } catch (error) {
        if (requestGeneration !== generation.value) return;

        console.error('AI move calculation failed:', error);
        const detail = error instanceof Error ? error.message : 'Unknown error';
        dependencies.reportError(`AI calculation failed: ${detail}.`);
        clearThinking(set);
      }
    },
  };
}
