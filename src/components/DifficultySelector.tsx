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
        <h3 id="difficulty-title">Difficulty</h3>
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
    </section>
  );
}
