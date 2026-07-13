import { useAnimatedBackground } from '../hooks/useAnimatedBackground';

export default function AnimatedBackground() {
  const canvasRef = useAnimatedBackground();

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      aria-hidden="true"
      data-testid="animated-background"
    />
  );
}
