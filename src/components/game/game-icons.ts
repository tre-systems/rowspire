import { Brain, Cpu, Crown, Trophy, XCircle, Zap, type LucideIcon } from 'lucide-react';
import type { GameIcon } from '@/lib/game-presentation';

export const GAME_ICONS = {
  brain: Brain,
  cpu: Cpu,
  crown: Crown,
  trophy: Trophy,
  'x-circle': XCircle,
  zap: Zap,
} satisfies Record<GameIcon, LucideIcon>;
