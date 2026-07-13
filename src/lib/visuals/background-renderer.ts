import type { Line, Particle, Shape } from './background-types';

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  lines: Line[],
  shapes: Shape[],
) {
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, width, height);

  drawParticles(ctx, particles);
  drawLines(ctx, lines);
  drawShapes(ctx, shapes);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(99, 102, 241, 0.02)';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const particle of particles) {
    ctx.save();
    ctx.globalAlpha = particle.opacity * particle.life;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawLines(ctx: CanvasRenderingContext2D, lines: Line[]) {
  for (const line of lines) {
    ctx.save();
    ctx.globalAlpha = line.opacity * line.life;
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[]) {
  for (const shape of shapes) {
    drawShape(ctx, shape);
  }
}

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  const pulseScale = 1 + Math.sin(shape.pulse) * 0.2;

  ctx.save();
  ctx.globalAlpha = shape.opacity * shape.life;
  ctx.fillStyle = shape.color;
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = 2;
  ctx.translate(shape.x, shape.y);
  ctx.rotate(shape.rotation);
  ctx.scale(pulseScale, pulseScale);
  drawShapeBody(ctx, shape, shape.size);
  ctx.restore();
}

function drawShapeBody(ctx: CanvasRenderingContext2D, shape: Shape, size: number) {
  switch (shape.type) {
    case 'circle':
      drawCircle(ctx, shape, size);
      break;
    case 'square':
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      break;
    case 'triangle':
      drawTriangle(ctx, size);
      break;
    case 'line':
      drawLineShape(ctx, size);
      break;
    case 'star':
      drawStar(ctx, size);
      break;
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, shape: Shape, size: number) {
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);

  gradient.addColorStop(0, shape.color);
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shape.color;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawTriangle(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(-size / 2, size / 2);
  ctx.lineTo(size / 2, size / 2);
  ctx.closePath();
  ctx.stroke();
}

function drawLineShape(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(-size / 2, 0);
  ctx.lineTo(size / 2, 0);
  ctx.stroke();
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = (Math.cos(angle) * size) / 2;
    const y = (Math.sin(angle) * size) / 2;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}
