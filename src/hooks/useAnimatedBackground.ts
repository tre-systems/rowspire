import { useEffect, useRef } from 'react';
import { BackgroundEffects } from '@/lib/visuals/background-effects';

const FRAME_DURATION = 1000 / 60;

export function useAnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const effects = new BackgroundEffects(window.innerWidth, window.innerHeight);
    let animationFrameId = 0;
    let previousTime = performance.now();

    const draw = () => effects.draw(ctx);

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      effects.resize(width, height);
      draw();
    };

    const animate = (time: number) => {
      const step = Math.min((time - previousTime) / FRAME_DURATION, 3);
      previousTime = time;
      effects.update(step);
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    const start = () => {
      cancelAnimationFrame(animationFrameId);
      previousTime = performance.now();

      if (document.hidden || reducedMotion.matches) {
        draw();
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', start);
    reducedMotion.addEventListener('change', start);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', start);
      reducedMotion.removeEventListener('change', start);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return canvasRef;
}
