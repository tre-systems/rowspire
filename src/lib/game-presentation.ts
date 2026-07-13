import type { AIType, GameMode, GameState, Player } from './types';

export type GameIcon = 'brain' | 'cpu' | 'crown' | 'trophy' | 'x-circle' | 'zap';
type GameTone = 'gray' | 'green' | 'pink' | 'teal' | 'violet';

const AI_TYPE_LABELS = {
  search: 'Search AI',
  ml: 'ML AI',
} satisfies Record<AIType, string>;

type PresentationContext = {
  gameState: GameState;
  gameMode: GameMode;
  player1AI: AIType;
  player2AI: AIType;
};

type StatusPresentationContext = PresentationContext & {
  aiThinking: boolean;
};

type GamePresentation = {
  text: string;
  icon: GameIcon;
  tone: GameTone;
  matchup: string | null;
};

type CompletionPresentation = {
  title: string;
  message: string;
  icon: GameIcon | null;
  tone: GameTone;
  matchup: string | null;
};

function aiForPlayer(context: PresentationContext, player: Player): AIType {
  return player === 'player1' ? context.player1AI : context.player2AI;
}

function aiIcon(aiType: AIType): GameIcon {
  return aiType === 'ml' ? 'brain' : 'cpu';
}

function getAITypeLabel(aiType: AIType): string {
  return AI_TYPE_LABELS[aiType];
}

function aiWinnerText(context: PresentationContext, winner: Player): string {
  const ai = aiForPlayer(context, winner);
  return `${getAITypeLabel(ai)} (${winner === 'player1' ? 'Teal' : 'Violet'}) Wins!`;
}

function aiMatchup(context: PresentationContext): string {
  return `${getAITypeLabel(context.player1AI)} vs ${getAITypeLabel(context.player2AI)}`;
}

function finishedStatus(context: StatusPresentationContext): GamePresentation {
  const { winner } = context.gameState;
  if (!winner) return { text: 'Draw!', icon: 'x-circle', tone: 'gray', matchup: null };

  const isPlayer1 = winner === 'player1';
  return {
    text:
      context.gameMode === 'ai-vs-ai'
        ? aiWinnerText(context, winner)
        : `${isPlayer1 ? 'Teal' : 'Violet'} Wins!`,
    icon: isPlayer1 ? 'trophy' : 'zap',
    tone: isPlayer1 ? 'teal' : 'violet',
    matchup: null,
  };
}

function playingStatus(context: StatusPresentationContext): GamePresentation {
  const player = context.gameState.currentPlayer;
  const isPlayer1 = player === 'player1';
  const tone = isPlayer1 ? 'teal' : 'violet';

  if (context.gameMode === 'ai-vs-ai') {
    const ai = aiForPlayer(context, player);
    const turn = context.aiThinking ? ' thinking...' : "'s turn";
    return {
      text: `${getAITypeLabel(ai)} (${isPlayer1 ? 'Teal' : 'Violet'})${turn}`,
      icon: aiIcon(ai),
      tone,
      matchup: aiMatchup(context),
    };
  }

  if (!isPlayer1 && context.aiThinking) {
    return { text: 'Violet thinking...', icon: 'zap', tone, matchup: null };
  }
  return {
    text: `${isPlayer1 ? 'Teal' : 'Violet'}'s turn`,
    icon: isPlayer1 ? 'crown' : 'zap',
    tone,
    matchup: null,
  };
}

export function presentGameStatus(context: StatusPresentationContext): GamePresentation {
  if (context.gameState.gameStatus === 'not_started') {
    return {
      text: 'Select AI and start game',
      icon: 'crown',
      tone: 'gray',
      matchup: null,
    };
  }
  if (context.gameState.gameStatus === 'finished') return finishedStatus(context);
  return playingStatus(context);
}

export function presentGameCompletion(context: PresentationContext): CompletionPresentation {
  const { winner } = context.gameState;
  if (!winner) {
    return {
      title: 'Draw!',
      message: "The board is full. It's a tie!",
      icon: null,
      tone: 'gray',
      matchup: null,
    };
  }

  const isPlayer1 = winner === 'player1';
  const isWatchMode = context.gameMode === 'ai-vs-ai';
  return {
    title: isWatchMode ? aiWinnerText(context, winner) : isPlayer1 ? 'You Win!' : 'AI Wins!',
    message: isWatchMode
      ? '🎉 AI Battle Complete! 🎉'
      : isPlayer1
        ? '🎉 Congratulations! 🎉'
        : '💫 The AI won this round! 💫',
    icon: isWatchMode ? aiIcon(aiForPlayer(context, winner)) : isPlayer1 ? 'trophy' : 'zap',
    tone: isWatchMode ? (isPlayer1 ? 'teal' : 'violet') : isPlayer1 ? 'green' : 'pink',
    matchup: isWatchMode ? aiMatchup(context) : null,
  };
}
