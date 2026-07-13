import { ChevronDown } from 'lucide-react';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/lib/difficulty';
import type { Difficulty } from '@/lib/types';

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export default function DifficultySelector({ difficulty, onChange }: DifficultySelectorProps) {
  const selected = DIFFICULTIES[difficulty];

  return (
    <section className="difficulty-selector" aria-labelledby="difficulty-title">
      <div className="difficulty-selector__heading">
        <div>
          <span className="ai-card__eyebrow">Game level</span>
          <h3 id="difficulty-title">How challenging?</h3>
        </div>
        <span className="difficulty-selector__choice">{selected.name}</span>
      </div>

      <div className="difficulty-options" role="group" aria-label="Choose game difficulty">
        {DIFFICULTY_ORDER.map(value => {
          const profile = DIFFICULTIES[value];
          return (
            <button
              key={value}
              type="button"
              className={`difficulty-option${value === difficulty ? ' is-selected' : ''}`}
              aria-pressed={value === difficulty}
              onClick={() => onChange(value)}
              data-testid={`difficulty-${value}`}
            >
              {profile.name}
            </button>
          );
        })}
      </div>

      <p className="difficulty-selector__description" data-testid="difficulty-description">
        {selected.description}
      </p>

      <details className="technical-disclosure difficulty-technical">
        <summary data-testid="difficulty-technical-details">
          Strength details
          <ChevronDown aria-hidden="true" />
        </summary>
        <p data-testid="difficulty-technical-content">
          Tactician: {selected.searchDepth}-ply search horizon. Neural challenger:{' '}
          {selected.mlSimulations.toLocaleString()} MCTS simulations per move.
        </p>
      </details>
    </section>
  );
}
