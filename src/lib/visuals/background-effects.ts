import { createLine, createParticle, createShape } from './background-factory';
import { drawBackground } from './background-renderer';
import type { Line, Particle, Shape } from './background-types';

export type { BaseEntity, Line, Particle, Point, Shape, ShapeType } from './background-types';

type WrappedEntity = {
  x: number;
  y: number;
  size: number;
};

function fadeIn(entity: { opacity: number; targetOpacity: number }) {
  if (entity.targetOpacity <= 0) return;

  entity.opacity = Math.min(entity.opacity + 0.01, entity.targetOpacity);
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

  init() {
    for (let i = 0; i < 30; i++) this.shapes.push(this.createShape());
    for (let i = 0; i < 20; i++) this.lines.push(this.createLine());
    for (let i = 0; i < 40; i++) this.particles.push(this.createParticle());
  }

  createShape(): Shape {
    return createShape(this.width, this.height);
  }

  createLine(): Line {
    return createLine(this.width, this.height);
  }

  createParticle(): Particle {
    return createParticle(this.width, this.height);
  }

  update() {
    this.updateShapes();
    this.updateLines();
    this.updateParticles();
  }

  updateShapes() {
    for (let i = this.shapes.length - 1; i >= 0; i--) {
      const shape = this.shapes[i];
      if (!shape) continue;

      this.moveShape(shape);
      if (shape.life <= 0.1 && !shape.fadeOut) this.startShapeFade(shape);
      if (shape.fadeOut) this.fadeShape(i, shape);
      else this.revealShape(shape);
    }
  }

  updateLines() {
    for (let i = this.lines.length - 1; i >= 0; i--) {
      const line = this.lines[i];
      if (!line) continue;

      line.life -= 0.002;
      if (line.life <= 0.1 && !line.fadeOut) this.startFade(line);
      if (line.fadeOut) this.fadeLine(i, line);
      else fadeIn(line);
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      if (!particle) continue;

      this.moveParticle(particle);
      if (particle.life <= 0.1 && !particle.fadeOut) this.startFade(particle);
      if (particle.fadeOut) this.fadeParticle(i, particle);
      else fadeIn(particle);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    drawBackground(ctx, this.width, this.height, this.particles, this.lines, this.shapes);
  }

  private moveShape(shape: Shape) {
    shape.rotation += shape.speed;
    shape.x += shape.direction.x;
    shape.y += shape.direction.y;
    shape.life -= 0.001;
    shape.pulse += shape.pulseSpeed;
    this.wrap(shape);
  }

  private moveParticle(particle: Particle) {
    particle.x += particle.direction.x;
    particle.y += particle.direction.y;
    particle.life -= 0.001;
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

  private revealShape(shape: Shape) {
    fadeIn(shape);
    shape.size = Math.min(shape.size * 1.01, shape.targetSize);
  }

  private fadeShape(index: number, shape: Shape) {
    shape.opacity = Math.max(0, shape.opacity - 0.02);
    shape.size = Math.max(shape.size * 0.98, shape.targetSize);
    if (shape.opacity > 0) return;

    this.shapes.splice(index, 1);
    this.shapes.push(this.createReplacementShape(shape));
  }

  private fadeLine(index: number, line: Line) {
    line.opacity = Math.max(0, line.opacity - 0.02);
    if (line.opacity > 0) return;

    this.lines.splice(index, 1);
    this.lines.push(this.createHiddenLine());
  }

  private fadeParticle(index: number, particle: Particle) {
    particle.opacity = Math.max(0, particle.opacity - 0.02);
    if (particle.opacity > 0) return;

    this.particles.splice(index, 1);
    this.particles.push(this.createReplacementParticle(particle));
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
