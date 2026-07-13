import { useRef } from 'react';
import type { GameState, GameMode } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameActions, useGameStore } from '@/lib/game-store';

import VictoryCelebration from './animations/VictoryCelebration';
import WinningLineBurst from './animations/WinningLineBurst';
import GameSquare from './game/GameSquare';
import GameCompletionOverlay from './game/GameCompletionOverlay';
import GameControls from './game/GameControls';
import GameStatus from './game/GameStatus';
import DroppingPiece from './game/DroppingPiece';
import { useGameAnimations } from '@/hooks/useGameAnimations';
import { soundEffects } from '@/lib/sound-effects';
import { isHumanTurn } from '@/lib/game-state-machine';
import { MOTION } from '@/lib/visuals/motion';

interface GameBoardProps {
  gameState: GameState;
  aiThinking?: boolean;
  onResetGame: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onShowHowToPlay: () => void;
  watchMode?: boolean;
  gameMode?: GameMode;
}

export default function GameBoard({
  gameState,
  aiThinking = false,
  onResetGame,
  soundEnabled,
  onToggleSound,
  onShowHowToPlay,
  watchMode = false,
  gameMode = 'human-vs-ai',
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const actions = useGameActions();
  const pendingMove = useGameStore(state => state.pendingMove);
  const showWinnerModal = useGameStore(state => state.showWinnerModal);

  const { celebrations, droppingPieces, showWinAnimation, handleWinAnimationComplete } =
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

  return (
    <>
      <AnimatePresence>
        {celebrations.map(celebration => (
          <VictoryCelebration
            key={celebration.id}
            position={celebration.position}
            player={celebration.player}
          />
        ))}
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
              {gameState.board.map((column, colIndex) => {
                const hasSpace = column.some(cell => cell === null);
                const isClickable =
                  isHumanTurn(gameState, gameMode) && !pendingMove && !watchMode && hasSpace;

                return (
                  <motion.button
                    type="button"
                    key={colIndex}
                    className="game-column"
                    onClick={() => handleColumnClick(colIndex)}
                    disabled={!isClickable}
                    aria-label={`Drop counter in column ${colIndex + 1}`}
                    whileTap={isClickable ? { scale: 0.975 } : {}}
                    transition={MOTION.spring}
                    data-testid={`column-${colIndex}`}
                  >
                    {column.map((cell, rowIndex) => (
                      <GameSquare
                        key={`${colIndex}-${rowIndex}`}
                        column={colIndex}
                        row={rowIndex}
                        player={cell}
                        isWinning={winningSet.has(`${colIndex},${rowIndex}`)}
                      />
                    ))}
                  </motion.button>
                );
              })}
            </div>

            <div className="game-drop-layer" aria-hidden="true">
              <AnimatePresence>
                {droppingPieces.map(drop => (
                  <DroppingPiece
                    key={drop.id}
                    column={drop.column}
                    row={drop.row}
                    player={drop.player}
                  />
                ))}
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
