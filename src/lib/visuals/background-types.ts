export interface Point {
  x: number;
  y: number;
}

export interface BaseEntity {
  opacity: number;
  color: string;
  life: number;
  fadeOut: boolean;
  targetOpacity: number;
}

export type ShapeType = 'line' | 'circle' | 'triangle' | 'square' | 'star';

export interface Shape extends BaseEntity {
  type: ShapeType;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  direction: Point;
  pulse: number;
  pulseSpeed: number;
  targetSize: number;
}

export interface Line extends BaseEntity {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

export interface Particle extends BaseEntity {
  x: number;
  y: number;
  size: number;
  direction: Point;
}

export const SHAPE_TYPES = [
  'line',
  'circle',
  'triangle',
  'square',
  'star',
] as const satisfies readonly ShapeType[];

export const COLORS = [
  'rgba(99, 102, 241, 0.5)',
  'rgba(236, 72, 153, 0.5)',
  'rgba(251, 191, 36, 0.5)',
  'rgba(34, 197, 94, 0.5)',
  'rgba(147, 51, 234, 0.5)',
  'rgba(59, 130, 246, 0.5)',
] as const;
