import { createLine, createParticle, createShape } from './background-factory';
import { drawBackground } from './background-renderer';
import type { Line, Particle, Shape } from './background-types';

type WrappedEntity = {
  x: number;
  y: number;
  size: number;
};

function fadeIn(entity: { opacity: number; targetOpacity: number }, step: number) {
  if (entity.targetOpacity <= 0) return;

  entity.opacity = Math.min(entity.opacity + 0.01 * step, entity.targetOpacity);
}

export class BackgroundEffects {
  shapes: Shape[] = [];
  lines: Line[] = [];
  particles: Particle[] = [];
  width = 0;
  height = 0;

  constructor(width: number, height: number) {
    this.resize(width, height);
    this.init();
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  private init() {
    this.shapes = Array.from({ length: 18 }, () => this.createShape());
    this.lines = Array.from({ length: 10 }, () => this.createLine());
    this.particles = Array.from({ length: 28 }, () => this.createParticle());
  }

  private createShape(): Shape {
    return createShape(this.width, this.height);
  }

  private createLine(): Line {
    return createLine(this.width, this.height);
  }

  private createParticle(): Particle {
    return createParticle(this.width, this.height);
  }

  update(step = 1) {
    const normalizedStep = Math.min(Math.max(step, 0), 2);

    this.updateShapes(normalizedStep);
    this.updateLines(normalizedStep);
    this.updateParticles(normalizedStep);
  }

  private updateShapes(step: number) {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      if (!shape) continue;

      this.moveShape(shape, step);
      if (shape.life <= 0.1 && !shape.fadeOut) this.startShapeFade(shape);
      if (shape.fadeOut) this.fadeShape(i, shape, step);
      else this.revealShape(shape, step);
    }
  }

  private updateLines(step: number) {
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const line = this.lines[i];
      if (!line) continue;

      line.life -= 0.002 * step;
      if (line.life <= 0.1 && !line.fadeOut) this.startFade(line);
      if (line.fadeOut) this.fadeLine(i, line, step);
      else fadeIn(line, step);
    }
  }

  private updateParticles(step: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle) continue;

      this.moveParticle(particle, step);
      if (particle.life <= 0.1 && !particle.fadeOut) this.startFade(particle);
      if (particle.fadeOut) this.fadeParticle(i, particle, step);
      else fadeIn(particle, step);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    drawBackground(ctx, this.width, this.height, this.particles, this.lines, this.shapes);
  }

  private moveShape(shape: Shape, step: number) {
    shape.rotation += shape.speed * step;
    shape.x += shape.direction.x * step;
    shape.y += shape.direction.y * step;
    shape.life -= 0.001 * step;
    shape.pulse += shape.pulseSpeed * step;
    this.wrap(shape);
  }

  private moveParticle(particle: Particle, step: number) {
    particle.x += particle.direction.x * step;
    particle.y += particle.direction.y * step;
    particle.life -= 0.001 * step;
    this.wrap(particle);
  }

  private wrap(entity: WrappedEntity) {
    if (entity.x < -entity.size) entity.x = this.width + entity.size;
    if (entity.x > this.width + entity.size) entity.x = -entity.size;
    if (entity.y < -entity.size) entity.y = this.height + entity.size;
    if (entity.y > this.height + entity.size) entity.y = -entity.size;
  }

  private startShapeFade(shape: Shape) {
    this.startFade(shape);
    shape.targetSize = shape.size * 0.5;
  }

  private startFade(entity: { fadeOut: boolean; targetOpacity: number }) {
    entity.fadeOut = true;
    entity.targetOpacity = 0;
  }

  private revealShape(shape: Shape, step: number) {
    fadeIn(shape, step);
    shape.size = Math.min(shape.size * 1.01 ** step, shape.targetSize);
  }

  private fadeShape(index: number, shape: Shape, step: number) {
    shape.opacity = Math.max(0, shape.opacity - 0.02 * step);
    shape.size = Math.max(shape.size * 0.98 ** step, shape.targetSize);
    if (shape.opacity > 0) return;

    this.shapes[index] = this.createReplacementShape(shape);
  }

  private fadeLine(index: number, line: Line, step: number) {
    line.opacity = Math.max(0, line.opacity - 0.02 * step);
    if (line.opacity > 0) return;

    this.lines[index] = this.createHiddenLine();
  }

  private fadeParticle(index: number, particle: Particle, step: number) {
    particle.opacity = Math.max(0, particle.opacity - 0.02 * step);
    if (particle.opacity > 0) return;

    this.particles[index] = this.createReplacementParticle(particle);
  }

  private createReplacementShape(previous: Shape) {
    const shape = this.createShape();

    shape.x = previous.x;
    shape.y = previous.y;
    shape.opacity = 0;
    shape.size = shape.targetSize * 0.5;

    return shape;
  }

  private createHiddenLine() {
    const line = this.createLine();

    line.opacity = 0;

    return line;
  }

  private createReplacementParticle(previous: Particle) {
    const particle = this.createParticle();

    particle.x = previous.x;
    particle.y = previous.y;
    particle.opacity = 0;

    return particle;
  }
}
