import { COLORS, SHAPE_TYPES, type Line, type Particle, type Shape } from './background-types';

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function createShape(width: number, height: number): Shape {
  const opacity = Math.random() * 0.7 + 0.3;
  const size = Math.random() * 50 + 25;

  return {
    type: randomItem(SHAPE_TYPES),
    x: Math.random() * width,
    y: Math.random() * height,
    size,
    rotation: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.03 + 0.008,
    opacity,
    color: randomItem(COLORS),
    life: 1,
    direction: {
      x: (Math.random() - 0.5) * 0.8,
      y: (Math.random() - 0.5) * 0.8,
    },
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.05 + 0.02,
    fadeOut: false,
    targetSize: size,
    targetOpacity: opacity,
  };
}

export function createLine(width: number, height: number): Line {
  const opacity = Math.random() * 0.3 + 0.1;

  return {
    x1: Math.random() * width,
    y1: Math.random() * height,
    x2: Math.random() * width,
    y2: Math.random() * height,
    opacity,
    color: randomItem(COLORS),
    life: 1,
    width: Math.random() * 2 + 1,
    fadeOut: false,
    targetOpacity: opacity,
  };
}

export function createParticle(width: number, height: number): Particle {
  const opacity = Math.random() * 0.6 + 0.2;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 4 + 1,
    opacity,
    color: randomItem(COLORS),
    life: 1,
    direction: {
      x: (Math.random() - 0.5) * 0.3,
      y: (Math.random() - 0.5) * 0.3,
    },
    fadeOut: false,
    targetOpacity: opacity,
  };
}
