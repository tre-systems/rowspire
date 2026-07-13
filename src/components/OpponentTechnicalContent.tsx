import { Check } from 'lucide-react';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '@/lib/difficulty';
import { OPPONENTS } from '@/lib/opponents';
import type { AIType, Difficulty } from '@/lib/types';

interface OpponentTechnicalContentProps {
  opponent: AIType;
  difficulty: Difficulty;
}

function workBudget(opponent: AIType, difficulty: Difficulty): string {
  const profile = DIFFICULTIES[difficulty];
  return opponent === 'search'
    ? `${profile.searchDepth} ply`
    : `${profile.mlSimulations.toLocaleString()} simulations`;
}

export default function OpponentTechnicalContent({
  opponent,
  difficulty,
}: OpponentTechnicalContentProps) {
  const technical = OPPONENTS[opponent].technical;

  return (
    <>
      <p className="opponent-modal__summary">{technical.summary}</p>

      <div className="opponent-modal__grid">
        <section className="opponent-modal__section">
          <h3>How it decides</h3>
          {technical.decision.map(paragraph => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {technical.training && (
            <>
              <h3>How it was trained</h3>
              <p>{technical.training}</p>
              <p>Its weights are fixed: it does not train during play or retain your games.</p>
            </>
          )}
        </section>

        <section className="opponent-modal__section opponent-modal__character">
          <h3>What to expect</h3>
          <p>{technical.character}</p>
          <h3>Runs on your device</h3>
          <p>
            Rust and WebAssembly run in a background worker. Board positions and moves stay in your
            browser; product metrics count only anonymous game starts and completions.
          </p>
        </section>
      </div>

      <section className="opponent-modal__levels" aria-labelledby="opponent-levels-title">
        <h3 id="opponent-levels-title">What difficulty changes</h3>
        <p>
          {opponent === 'search'
            ? 'One ply is one counter drop by either player. Higher levels examine longer sequences.'
            : 'Every level uses the same model and immediate win/block safeguard. Higher levels explore more continuations.'}
        </p>
        <table>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">Work per move</th>
              <th scope="col">Selected</th>
            </tr>
          </thead>
          <tbody>
            {DIFFICULTY_ORDER.map(level => (
              <tr key={level} className={level === difficulty ? 'is-selected' : undefined}>
                <th scope="row">{DIFFICULTIES[level].name}</th>
                <td>{workBudget(opponent, level)}</td>
                <td>
                  {level === difficulty && (
                    <span className="opponent-modal__selected">
                      <Check aria-hidden="true" /> Current
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
