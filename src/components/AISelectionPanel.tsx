import { useRef, useState } from 'react';
import { useGameActions, useGameStore } from '@/lib/game-store';
import { OPPONENT_ORDER, OPPONENTS } from '@/lib/opponents';
import type { AIType } from '@/lib/types';
import DifficultySelector from './DifficultySelector';
import Fixture from './Fixture';
import OpponentDetailsModal from './OpponentDetailsModal';

interface AISelectionPanelProps {
  onStartGame?: () => void;
}

export default function AISelectionPanel({ onStartGame }: AISelectionPanelProps) {
  const actions = useGameActions();
  const difficulty = useGameStore(state => state.difficulty);
  const [detailsOpponent, setDetailsOpponent] = useState<AIType | null>(null);
  const detailsTrigger = useRef<HTMLButtonElement | null>(null);

  const launchGame = () => {
    actions.reset();
    onStartGame?.();
  };

  const handleAISelection = (aiType: AIType) => {
    actions.setAI(aiType);
    actions.setGameMode('human-vs-ai');
    launchGame();
  };

  const handleWatchGame = () => {
    actions.setPlayer1AI('search');
    actions.setPlayer2AI('ml');
    actions.setGameMode('ai-vs-ai');
    launchGame();
  };

  const openDetails = (aiType: AIType, trigger: HTMLButtonElement) => {
    detailsTrigger.current = trigger;
    setDetailsOpponent(aiType);
  };

  const closeDetails = () => {
    setDetailsOpponent(null);
    requestAnimationFrame(() => detailsTrigger.current?.focus());
  };

  return (
    <div className="selection-panel" data-testid="ai-selection-panel">
      <DifficultySelector difficulty={difficulty} onChange={actions.setDifficulty} />

      <div className="selection-heading">
        <h2 className="section-label">Choose your opponent</h2>
      </div>

      <ul className="fixture-list">
        {OPPONENT_ORDER.map(aiType => {
          const profile = OPPONENTS[aiType];

          return (
            <Fixture
              key={aiType}
              home="You"
              away={profile.name}
              humanPlaysHome
              description={profile.description}
              meta={
                <p className="fixture__meta">
                  <span>{profile.tags.join(' · ')}</span>
                  <button
                    type="button"
                    className="fixture__info"
                    onClick={event => openDetails(aiType, event.currentTarget)}
                    aria-label={`How it thinks: ${profile.name}`}
                    aria-haspopup="dialog"
                    aria-controls="opponent-details-dialog"
                    aria-expanded={detailsOpponent === aiType}
                    data-testid={`ai-info-${aiType}`}
                  >
                    How it thinks
                  </button>
                </p>
              }
              action={
                <button
                  type="button"
                  onClick={() => handleAISelection(aiType)}
                  className="primary-action fixture__action"
                  aria-label={profile.action}
                  data-testid={`ai-selection-${aiType}`}
                >
                  Play
                </button>
              }
            />
          );
        })}

        <Fixture
          home={OPPONENTS.search.shortName}
          away={OPPONENTS.ml.shortName}
          description="Sit out and watch the two opponents play each other."
          action={
            <button
              type="button"
              onClick={handleWatchGame}
              className="secondary-action fixture__action"
              aria-label="Watch the two opponents"
              data-testid="ai-vs-ai-button"
            >
              Watch
            </button>
          }
        />
      </ul>

      <OpponentDetailsModal
        opponent={detailsOpponent}
        difficulty={difficulty}
        onClose={closeDetails}
      />
    </div>
  );
}
