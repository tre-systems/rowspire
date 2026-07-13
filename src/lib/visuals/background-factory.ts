import { COLORS, SHAPE_TYPES, type Line, type Particle, type Shape } from './background-types';

function randomItem<T>(items: readonly [T, ...T[]]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

export function createShape(width: number, height: number): Shape {
  const opacity = Math.random() * 0.35 + 0.18;
  const size = Math.random() * 42 + 20;

  return {
    type: randomItem(SHAPE_TYPES),
    x: Math.random() * width,
    y: Math.random() * height,
    size,
    rotation: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.009 + 0.003,
    opacity,
    color: randomItem(COLORS),
    life: 1,
    direction: {
      x: (Math.random() - 0.5) * 0.38,
      y: (Math.random() - 0.5) * 0.38,
    },
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: Math.random() * 0.025 + 0.01,
    fadeOut: false,
    targetSize: size,
    targetOpacity: opacity,
  };
}

export function createLine(width: number, height: number): Line {
  const opacity = Math.random() * 0.12 + 0.05;

  return {
    x1: Math.random() * width,
    y1: Math.random() * height,
    x2: Math.random() * width,
    y2: Math.random() * height,
    opacity,
    color: randomItem(COLORS),
    life: 1,
    width: Math.random() + 0.5,
    fadeOut: false,
    targetOpacity: opacity,
  };
}

export function createParticle(width: number, height: number): Particle {
  const opacity = Math.random() * 0.35 + 0.12;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2.5 + 0.8,
    opacity,
    color: randomItem(COLORS),
    life: 1,
    direction: {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2,
    },
    fadeOut: false,
    targetOpacity: opacity,
  };
}
