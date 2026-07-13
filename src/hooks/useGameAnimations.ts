import { useState, useEffect } from 'react';
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
  boardRef: React.RefObject<HTMLDivElement | null>,
) {
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [showWinAnimation, setShowWinAnimation] = useState(false);

  const actions = useGameActions();
  const pendingMove = useGameStore(state => state.pendingMove);

  useEffect(() => {
    if (gameState.gameStatus === 'finished' && gameState.winner) {
      const winner = gameState.winner;
      const boardRect = boardRef.current?.getBoundingClientRect();
      const timers: number[] = [];

      if (boardRect) {
        timers.push(
          window.setTimeout(() => {
            setCelebrations(prevCelebrations => [
              ...prevCelebrations,
              {
                id: `celebration-${Date.now()}-${winner}`,
                position: {
                  x: boardRect.left + boardRect.width / 2,
                  y: boardRect.top + boardRect.height / 2,
                },
                player: winner,
              },
            ]);
          }, 0),
        );
      }

      if (gameState.winningLine) {
        timers.push(
          window.setTimeout(() => {
            setShowWinAnimation(true);
          }, 0),
        );
        soundEffects.winAnimation();
      }

      return () => {
        timers.forEach(timer => {
          window.clearTimeout(timer);
        });
      };
    }

    return undefined;
  }, [gameState.gameStatus, gameState.winner, gameState.winningLine, boardRef]);

  useEffect(() => {
    if (celebrations.length === 0) return undefined;

    const cleanupTimer = window.setTimeout(() => {
      setCelebrations([]);
    }, 3000);

    return () => window.clearTimeout(cleanupTimer);
  }, [celebrations.length]);

  const droppingPieces: DroppingPiece[] = (() => {
    if (!pendingMove) return [];
    const column = gameState.board[pendingMove.column];
    if (!column) return [];

    const row = column.lastIndexOf(null);
    if (row === -1) return [];
    return [
      {
        id: `drop-${pendingMove.player}-${pendingMove.column}-${row}`,
        column: pendingMove.column,
        row,
        player: pendingMove.player,
      },
    ];
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
    celebrations,
    droppingPieces,
    showWinAnimation,
    handleWinAnimationComplete,
  };
}
