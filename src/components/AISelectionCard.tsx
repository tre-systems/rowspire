import { motion } from 'framer-motion';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import type { AIType } from '@/lib/types';
import { MOTION } from '@/lib/visuals/motion';

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface AISelectionCardProps {
  aiType: AIType;
  title: string;
  description: string;
  subtitle: string;
  onClick: () => void;
  icon: LucideIcon;
  'data-testid': string;
}

export default function AISelectionCard({
  aiType,
  title,
  description,
  subtitle,
  onClick,
  icon: Icon,
  'data-testid': dataTestId,
}: AISelectionCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`ai-card ai-card--${aiType}`}
      variants={CARD_VARIANTS}
      transition={MOTION.entrance}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      data-testid={dataTestId}
    >
      <span className="ai-card__glow" aria-hidden="true" />
      <span className="ai-card__icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="ai-card__content">
        <span className="ai-card__eyebrow">Choose your challenger</span>
        <span className="ai-card__title">{title}</span>
        <span className="ai-card__subtitle">{subtitle}</span>
        <span className="ai-card__description">{description}</span>
        <span className="ai-card__action">
          Play now
          <ArrowUpRight aria-hidden="true" />
        </span>
      </span>
    </motion.button>
  );
}
