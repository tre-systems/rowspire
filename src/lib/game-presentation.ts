import { DIFFICULTIES } from './difficulty';
import { OPPONENTS } from './opponents';
import type { AIType, Difficulty, GameMode, GameState, Player } from './types';

export type GameIcon = 'brain' | 'cpu' | 'crown' | 'trophy' | 'x-circle' | 'zap';
type GameTone = 'gray' | 'green' | 'pink' | 'teal' | 'violet';

type PresentationContext = {
  gameState: GameState;
  gameMode: GameMode;
  player1AI: AIType;
  player2AI: AIType;
  difficulty: Difficulty;
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
  return OPPONENTS[aiType].shortName;
}

function aiWinnerText(context: PresentationContext, winner: Player): string {
  const ai = aiForPlayer(context, winner);
  return `${getAITypeLabel(ai)} wins as ${winner === 'player1' ? 'Teal' : 'Violet'}!`;
}

function aiMatchup(context: PresentationContext): string {
  const opponents =
    context.gameMode === 'ai-vs-ai'
      ? `${getAITypeLabel(context.player1AI)} vs ${getAITypeLabel(context.player2AI)}`
      : getAITypeLabel(context.player2AI);
  return `${DIFFICULTIES[context.difficulty].name} · ${opponents}`;
}

function finishedStatus(context: StatusPresentationContext): GamePresentation {
  const { winner } = context.gameState;
  if (!winner) {
    return { text: "It's a draw!", icon: 'x-circle', tone: 'gray', matchup: aiMatchup(context) };
  }

  const isPlayer1 = winner === 'player1';
  return {
    text:
      context.gameMode === 'ai-vs-ai'
        ? aiWinnerText(context, winner)
        : isPlayer1
          ? 'You win!'
          : 'Your opponent wins',
    icon: isPlayer1 ? 'trophy' : 'zap',
    tone: isPlayer1 ? 'teal' : 'violet',
    matchup: aiMatchup(context),
  };
}

function playingStatus(context: StatusPresentationContext): GamePresentation {
  const player = context.gameState.currentPlayer;
  const isPlayer1 = player === 'player1';
  const tone = isPlayer1 ? 'teal' : 'violet';

  if (context.gameMode === 'ai-vs-ai') {
    const ai = aiForPlayer(context, player);
    const turn = context.aiThinking ? ' is thinking…' : ' to move';
    return {
      text: `${getAITypeLabel(ai)} (${isPlayer1 ? 'Teal' : 'Violet'})${turn}`,
      icon: aiIcon(ai),
      tone,
      matchup: aiMatchup(context),
    };
  }

  if (!isPlayer1) {
    return { text: 'Your opponent is thinking…', icon: 'zap', tone, matchup: aiMatchup(context) };
  }
  return {
    text: "Your turn — you're Teal",
    icon: 'crown',
    tone,
    matchup: aiMatchup(context),
  };
}

export function presentGameStatus(context: StatusPresentationContext): GamePresentation {
  if (context.gameState.gameStatus === 'not_started') {
    return {
      text: 'Choose an opponent to start',
      icon: 'crown',
      tone: 'gray',
      matchup: aiMatchup(context),
    };
  }
  if (context.gameState.gameStatus === 'finished') return finishedStatus(context);
  return playingStatus(context);
}

export function presentGameCompletion(context: PresentationContext): CompletionPresentation {
  const { winner } = context.gameState;
  if (!winner) {
    return {
      title: "It's a draw",
      message: 'No spaces left—that was a close game.',
      icon: null,
      tone: 'gray',
      matchup: aiMatchup(context),
    };
  }

  const isPlayer1 = winner === 'player1';
  const isWatchMode = context.gameMode === 'ai-vs-ai';
  return {
    title: isWatchMode
      ? aiWinnerText(context, winner)
      : isPlayer1
        ? 'You win!'
        : 'Your opponent wins',
    message: isWatchMode
      ? 'The match is complete.'
      : isPlayer1
        ? 'Great game—you made four in a row.'
        : 'Close one—ready for another round?',
    icon: isWatchMode ? aiIcon(aiForPlayer(context, winner)) : isPlayer1 ? 'trophy' : 'zap',
    tone: isWatchMode ? (isPlayer1 ? 'teal' : 'violet') : isPlayer1 ? 'green' : 'pink',
    matchup: aiMatchup(context),
  };
}
