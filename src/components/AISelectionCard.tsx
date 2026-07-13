import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, type LucideIcon } from 'lucide-react';
import type { OpponentProfile } from '@/lib/opponents';
import type { AIType } from '@/lib/types';
import { MOTION } from '@/lib/visuals/motion';

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface AISelectionCardProps {
  aiType: AIType;
  profile: OpponentProfile;
  onClick: () => void;
  icon: LucideIcon;
  'data-testid': string;
}

export default function AISelectionCard({
  aiType,
  profile,
  onClick,
  icon: Icon,
  'data-testid': dataTestId,
}: AISelectionCardProps) {
  return (
    <motion.article
      className={`ai-card ai-card--${aiType}`}
      variants={CARD_VARIANTS}
      transition={MOTION.entrance}
      whileHover={{ y: -6, scale: 1.01 }}
    >
      <span className="ai-card__glow" aria-hidden="true" />
      <span className="ai-card__icon">
        <Icon aria-hidden="true" />
      </span>
      <span className="ai-card__content">
        <span className="ai-card__eyebrow">Opponent</span>
        <span className="ai-card__title">{profile.name}</span>
        <span className="ai-card__description">{profile.description}</span>
        <motion.button
          type="button"
          onClick={onClick}
          className="ai-card__play"
          whileTap={{ scale: 0.97 }}
          data-testid={dataTestId}
        >
          {profile.action}
          <ArrowRight aria-hidden="true" />
        </motion.button>
        <details className="technical-disclosure ai-card__details">
          <summary data-testid={`ai-details-${aiType}`}>
            How it works
            <ChevronDown aria-hidden="true" />
          </summary>
          <div data-testid={`ai-details-content-${aiType}`}>
            <strong>{profile.technicalName}</strong>
            <p>{profile.technicalSummary}</p>
          </div>
        </details>
      </span>
    </motion.article>
  );
}
