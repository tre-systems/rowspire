import { describe, expect, it } from 'vitest';
import {
  BackgroundEffects,
  type Line,
  type Particle,
  type Shape,
} from '../visuals/background-effects';

function expireEntity(entity: Shape | Line | Particle) {
  entity.opacity = 0.01;
  entity.life = 0.05;
  entity.fadeOut = true;
}

describe('BackgroundEffects', () => {
  it('respawns faded entities with visible targets', () => {
    const effects = new BackgroundEffects(800, 600);

    effects.shapes.forEach(expireEntity);
    effects.lines.forEach(expireEntity);
    effects.particles.forEach(expireEntity);

    effects.update();

    expect(effects.shapes).toHaveLength(30);
    expect(effects.lines).toHaveLength(20);
    expect(effects.particles).toHaveLength(40);
    expect(effects.shapes.every(shape => shape.targetOpacity > 0)).toBe(true);
    expect(effects.lines.every(line => line.targetOpacity > 0)).toBe(true);
    expect(effects.particles.every(particle => particle.targetOpacity > 0)).toBe(true);

    effects.update();

    expect(effects.shapes.some(shape => shape.opacity > 0)).toBe(true);
    expect(effects.lines.some(line => line.opacity > 0)).toBe(true);
    expect(effects.particles.some(particle => particle.opacity > 0)).toBe(true);
  });
});
