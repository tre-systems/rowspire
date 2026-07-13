import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameActions, useGameStore } from '@/lib/game-store';
import { isHumanTurn } from '@/lib/game-state-machine';
import { soundEffects } from '@/lib/sound-effects';
import type { GameMode, GameState } from '@/lib/types';
import { MOTION } from '@/lib/visuals/motion';
import { useGameAnimations } from '@/hooks/useGameAnimations';

import VictoryCelebration from './animations/VictoryCelebration';
import WinningLineBurst from './animations/WinningLineBurst';
import DroppingPiece from './game/DroppingPiece';
import GameColumn from './game/GameColumn';
import GameCompletionOverlay from './game/GameCompletionOverlay';
import GameControls from './game/GameControls';
import GameStatus from './game/GameStatus';

interface GameBoardProps {
  gameState: GameState;
  aiThinking: boolean;
  onResetGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  watchMode: boolean;
  gameMode: GameMode;
}

export default function GameBoard({
  gameState,
  aiThinking,
  onResetGame,
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  watchMode,
  gameMode,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const actions = useGameActions();
  const pendingMove = useGameStore(state => state.pendingMove);
  const showWinnerModal = useGameStore(state => state.showWinnerModal);

  const { celebration, droppingPiece, showWinAnimation, handleWinAnimationComplete } =
    useGameAnimations(gameState, boardRef);

  const handleColumnClick = (column: number) => {
    if (isHumanTurn(gameState, gameMode) && !pendingMove && !watchMode) {
      void soundEffects.pieceMove();
      actions.makeMove(column);
    }
  };

  const winningSet = new Set(
    Array.isArray(gameState.winningLine?.positions)
      ? gameState.winningLine.positions.map(pos => `${pos.column},${pos.row}`)
      : [],
  );
  const canPlay = isHumanTurn(gameState, gameMode) && !pendingMove && !watchMode;

  return (
    <>
      <AnimatePresence>
        {celebration && (
          <VictoryCelebration
            key={celebration.id}
            position={celebration.position}
            player={celebration.player}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {gameState.gameStatus === 'finished' && showWinnerModal && (
          <GameCompletionOverlay
            gameState={gameState}
            onResetGame={onResetGame}
            gameMode={gameMode}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="mx-auto w-full max-w-md"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={MOTION.entrance}
        data-testid="game-board"
      >
        <motion.div ref={boardRef} className="game-board-shell" layout>
          <div className="mb-3 text-center">
            <GameStatus gameState={gameState} aiThinking={aiThinking} gameMode={gameMode} />
          </div>
          <div className="game-grid">
            <div className="game-grid__columns">
              {gameState.board.map((cells, column) => (
                <GameColumn
                  key={column}
                  cells={cells}
                  column={column}
                  canPlay={canPlay}
                  winningPositions={winningSet}
                  onSelect={handleColumnClick}
                />
              ))}
            </div>

            <div className="game-drop-layer" aria-hidden="true">
              <AnimatePresence>
                {droppingPiece && (
                  <DroppingPiece
                    key={droppingPiece.id}
                    column={droppingPiece.column}
                    row={droppingPiece.row}
                    player={droppingPiece.player}
                  />
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showWinAnimation && gameState.winningLine && gameState.winner && (
                <WinningLineBurst onComplete={handleWinAnimationComplete} />
              )}
            </AnimatePresence>
          </div>
          <GameControls
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            onShowHowToPlay={onShowHowToPlay}
            onResetGame={onResetGame}
          />
        </motion.div>
      </motion.div>
    </>
  );
}
