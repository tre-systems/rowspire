import { describe, expect, it, vi } from 'vitest';
import {
  BackgroundEffects,
  type Line,
  type Particle,
  type Shape,
} from '../visuals/background-effects';
import { drawBackground } from '../visuals/background-renderer';
import { createLine, createParticle, createShape } from '../visuals/background-factory';

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

    expect(effects.shapes).toHaveLength(18);
    expect(effects.lines).toHaveLength(10);
    expect(effects.particles).toHaveLength(28);
    expect(effects.shapes.every(shape => shape.targetOpacity > 0)).toBe(true);
    expect(effects.lines.every(line => line.targetOpacity > 0)).toBe(true);
    expect(effects.particles.every(particle => particle.targetOpacity > 0)).toBe(true);

    effects.update();

    expect(effects.shapes.some(shape => shape.opacity > 0)).toBe(true);
    expect(effects.lines.some(line => line.opacity > 0)).toBe(true);
    expect(effects.particles.some(particle => particle.opacity > 0)).toBe(true);
  });

  it('normalizes movement to elapsed frame time', () => {
    const effects = new BackgroundEffects(800, 600);
    const particle = effects.particles[0]!;
    particle.x = 100;
    particle.y = 100;
    particle.direction = { x: 2, y: -2 };

    effects.update(0.5);

    expect(particle.x).toBe(101);
    expect(particle.y).toBe(99);
  });

  it('renders every background entity and shape type', () => {
    const gradient = { addColorStop: vi.fn() };
    const context = {
      fillRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      strokeRect: vi.fn(),
      closePath: vi.fn(),
      createRadialGradient: vi.fn(() => gradient),
    } as unknown as CanvasRenderingContext2D;
    const shapeTypes = ['circle', 'square', 'triangle', 'line', 'star'] as const;
    const shapes = shapeTypes.map(type => ({ ...createShape(800, 600), type }));

    drawBackground(context, 800, 600, [createParticle(800, 600)], [createLine(800, 600)], shapes);

    expect(context.fillRect).toHaveBeenCalledTimes(2);
    expect(context.createRadialGradient).toHaveBeenCalledOnce();
    expect(context.stroke).toHaveBeenCalled();
    expect(context.strokeRect).toHaveBeenCalledOnce();
    expect(gradient.addColorStop).toHaveBeenCalledTimes(2);
  });
});
