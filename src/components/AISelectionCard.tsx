import { motion } from 'framer-motion';
import { ArrowRight, Info, type LucideIcon } from 'lucide-react';
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
  onInfo: (trigger: HTMLButtonElement) => void;
  infoOpen: boolean;
  icon: LucideIcon;
  'data-testid': string;
}

export default function AISelectionCard({
  aiType,
  profile,
  onClick,
  onInfo,
  infoOpen,
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
      <header className="ai-card__header">
        <span className="ai-card__identity">
          <span className="ai-card__icon">
            <Icon aria-hidden="true" />
          </span>
          <h3 className="ai-card__title">{profile.name}</h3>
        </span>
        <motion.button
          type="button"
          className="ai-card__info"
          onClick={event => onInfo(event.currentTarget)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          aria-label={`Technical details about ${profile.name}`}
          aria-haspopup="dialog"
          aria-controls="opponent-details-dialog"
          aria-expanded={infoOpen}
          title={`Technical details about ${profile.name}`}
          data-testid={`ai-info-${aiType}`}
        >
          <Info aria-hidden="true" />
        </motion.button>
      </header>
      <p className="ai-card__description">{profile.description}</p>
      <ul className="ai-card__tags" aria-hidden="true">
        {profile.tags.map(tag => (
          <li key={tag} className="ai-card__tag">
            {tag}
          </li>
        ))}
      </ul>
      <footer className="ai-card__footer">
        <motion.button
          type="button"
          onClick={onClick}
          className="ai-card__play"
          whileTap={{ scale: 0.97 }}
          aria-label={profile.action}
          data-testid={dataTestId}
        >
          <span>Play</span>
          <ArrowRight aria-hidden="true" />
        </motion.button>
      </footer>
    </motion.article>
  );
}
