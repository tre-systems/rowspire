import { useEffect, useState, type RefObject } from 'react';
import type { Player, GameState } from '@/lib/types';
import { useGameActions, useGameStore } from '@/lib/game-store';
import { soundEffects } from '@/lib/sound-effects';
import { PIECE_DROP_DURATION_MS } from '@/lib/visuals/motion';

interface Celebration {
  id: string;
  position: { x: number; y: number };
  player: Player;
}

interface DroppingPiece {
  id: string;
  column: number;
  row: number;
  player: Player;
}

export function useGameAnimations(
  gameState: GameState,
  boardRef: RefObject<HTMLDivElement | null>,
) {
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  const actions = useGameActions();
  const pendingMove = useGameStore(state => state.pendingMove);

  useEffect(() => {
    if (gameState.gameStatus === 'finished' && gameState.winner) {
      const winner = gameState.winner;
      const boardRect = boardRef.current?.getBoundingClientRect();
      const animationFrame = requestAnimationFrame(() => {
        if (boardRect) {
          setCelebration({
            id: `celebration-${Date.now()}-${winner}`,
            position: {
              x: boardRect.left + boardRect.width / 2,
              y: boardRect.top + boardRect.height / 2,
            },
            player: winner,
          });
        }

        setShowWinAnimation(Boolean(gameState.winningLine));
      });

      if (gameState.winningLine) soundEffects.winAnimation();

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }

    return undefined;
  }, [gameState.gameStatus, gameState.winner, gameState.winningLine, boardRef]);

  useEffect(() => {
    if (!celebration) return undefined;

    const cleanupTimer = window.setTimeout(() => {
      setCelebration(null);
    }, 3000);

    return () => window.clearTimeout(cleanupTimer);
  }, [celebration]);

  const droppingPiece: DroppingPiece | null = (() => {
    if (!pendingMove) return null;
    const column = gameState.board[pendingMove.column];
    if (!column) return null;

    const row = column.lastIndexOf(null);
    if (row === -1) return null;

    return {
      id: `drop-${pendingMove.player}-${pendingMove.column}-${row}`,
      column: pendingMove.column,
      row,
      player: pendingMove.player,
    };
  })();

  useEffect(() => {
    if (!pendingMove) return undefined;

    if (pendingMove.source === 'ai') {
      void soundEffects.pieceMove();
    }

    const completeMoveTimer = window.setTimeout(() => {
      actions.completeMove();
    }, PIECE_DROP_DURATION_MS);

    return () => {
      window.clearTimeout(completeMoveTimer);
    };
  }, [pendingMove, actions]);

  const handleWinAnimationComplete = () => {
    setShowWinAnimation(false);
    actions.showWinnerModal();
  };

  return {
    celebration,
    droppingPiece,
    showWinAnimation,
    handleWinAnimationComplete,
  };
}
