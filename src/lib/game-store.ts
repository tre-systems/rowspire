import { useStore, type UseBoundStore } from 'zustand';
import { createStore, type Mutate, type StoreApi } from 'zustand/vanilla';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { makeAIMove } from './logic/ai-logic';
import { createGameStoreState, type GameStoreDependencies } from './game-store-core';
import {
  LATEST_VERSION,
  parsePersistedState,
  persistedStateFrom,
  type GameStore,
} from './game-store-state';
import { useUIStore } from './ui-store';
import { initializeWASMAI } from './wasm-ai-service';

export type { GameStoreDependencies } from './game-store-core';

function defaultDependencies(): GameStoreDependencies {
  return {
    ai: { initialize: initializeWASMAI, chooseMove: makeAIMove },
    wait: duration => new Promise(resolve => setTimeout(resolve, duration)),
    random: Math.random,
    reportError: message => useUIStore.getState().actions.showError(message),
  };
}

export type GameStoreApi = Mutate<StoreApi<GameStore>, [['zustand/immer', never]]>;

export function createGameStore(
  dependencies = defaultDependencies(),
  storage?: StateStorage,
): GameStoreApi {
  const state = createGameStoreState(dependencies);
  if (!storage) return createStore<GameStore>()(state);

  return createStore<GameStore>()(
    persist(state, {
      name: 'rowspire-game-storage',
      storage: createJSONStorage(() => storage),
      version: LATEST_VERSION,
      partialize: persistedStateFrom,
      migrate: parsePersistedState,
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...parsePersistedState(persistedState),
      }),
      onRehydrateStorage: () => (restoredState, error) => {
        if (error) console.error('Failed to restore the saved game:', error);
        restoredState?.actions.initialize();
      },
    }),
  ) as GameStoreApi;
}

const gameStore = createGameStore(
  defaultDependencies(),
  typeof window === 'undefined' ? undefined : window.localStorage,
);

export const useGameStore = Object.assign(
  <T>(selector: (state: GameStore) => T) => useStore(gameStore, selector),
  gameStore,
) as UseBoundStore<GameStoreApi>;

export const useGameState = () => useGameStore(state => state.gameState);
export const useGameActions = () => useGameStore(state => state.actions);
