import type { ReactNode } from 'react';
import CounterGlyph from './CounterGlyph';

interface FixtureProps {
  home: string;
  away: string;
  humanPlaysHome?: boolean;
  description: string;
  meta?: ReactNode;
  action: ReactNode;
}

export default function Fixture({
  home,
  away,
  humanPlaysHome = false,
  description,
  meta,
  action,
}: FixtureProps) {
  return (
    <li className="fixture">
      <h3 className="fixture__title">
        <span className={`fixture__side${humanPlaysHome ? ' fixture__side--you' : ''}`}>
          <CounterGlyph player="player1" />
          {home}
        </span>{' '}
        <span className="fixture__versus">
          <span aria-hidden="true">v</span>
          <span className="sr-only">versus</span>
        </span>{' '}
        <span className="fixture__side">
          <CounterGlyph player="player2" />
          {away}
        </span>
      </h3>
      <div className="fixture__body">
        <p className="fixture__description">{description}</p>
        {meta}
      </div>
      {action}
    </li>
  );
}
