import type { Player } from '@/lib/types';

interface CounterGlyphProps {
  player: Player;
}

export default function CounterGlyph({ player }: CounterGlyphProps) {
  const colour = player === 'player1' ? 'game-piece--teal' : 'game-piece--violet';

  return (
    <span className={`game-piece counter-glyph ${colour}`} aria-hidden="true">
      <span className="game-piece__face" />
      <span className="game-piece__mark" />
      <span className="game-piece__shine" />
    </span>
  );
}
