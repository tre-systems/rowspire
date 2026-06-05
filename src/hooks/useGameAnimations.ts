import { useState, useEffect } from 'react';
import { Player, GameState } from '@/lib/types';
import { useGameStore } from '@/lib/game-store';
import { soundEffects } from '@/lib/sound-effects';

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

  const { actions, pendingMove } = useGameStore();

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
    celebrations.forEach(celebration => {
      setTimeout(() => {
        setCelebrations(prev => prev.filter(c => c.id !== celebration.id));
      }, 3000);
    });
  }, [celebrations]);

  // The piece currently dropping is derived directly from the pending move, so it
  // appears the moment a move starts and disappears the instant the move is
  // committed (pendingMove clears). Deriving it — rather than mirroring it into
  // separate state driven by timers — means an AI move committed by the store can
  // never leave a ghost piece stranded at the top of the board.
  const droppingPieces: DroppingPiece[] = (() => {
    if (!pendingMove) return [];
    const row = gameState.board[pendingMove.column].lastIndexOf(null);
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

  // Play the drop sound for AI moves, and commit human moves once the drop
  // animation has played. AI moves are committed by the store on its own timer.
  useEffect(() => {
    if (!pendingMove) return undefined;

    if (pendingMove.source === 'ai') {
      void soundEffects.pieceMove();
      return undefined;
    }

    const completeMoveTimer = window.setTimeout(() => {
      actions.completeMove();
    }, 800);

    return () => {
      window.clearTimeout(completeMoveTimer);
    };
  }, [pendingMove, actions]);

  const handleWinAnimationComplete = () => {
    setShowWinAnimation(false);
    setTimeout(() => {
      actions.showWinnerModal();
    }, 500);
  };

  return {
    celebrations,
    droppingPieces,
    showWinAnimation,
    handleWinAnimationComplete,
  };
}
