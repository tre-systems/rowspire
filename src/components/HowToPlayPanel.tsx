import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Circle, Crown, Star, Trophy, X, Zap, type LucideIcon } from 'lucide-react';
import { APP_NAME, LEGAL_DISCLAIMER } from '@/lib/brand';
import { MOTION } from '@/lib/visuals/motion';

const GUIDE = [
  {
    title: 'Objective',
    icon: Crown,
    tone: 'amber',
    body: 'Drop counters into columns and make four in a row horizontally, vertically or diagonally.',
  },
  {
    title: 'Counters',
    icon: Circle,
    tone: 'teal',
    items: ['You play the teal ring counters', 'Your opponent plays the violet diamond counters'],
  },
  {
    title: 'Taking turns',
    icon: ArrowRight,
    tone: 'green',
    items: [
      'Choose a column to drop your counter',
      'Counters settle in the lowest open space',
      'The AI responds after your move lands',
    ],
  },
  {
    title: 'Winning',
    icon: Zap,
    tone: 'violet',
    body: 'Line up four counters across, up, or diagonally before your opponent does.',
  },
  {
    title: 'Play smarter',
    icon: Star,
    tone: 'amber',
    items: [
      'Control the center for more winning lines',
      'Block immediate threats before building your own',
      'Create two threats at once when you can',
    ],
  },
  {
    title: 'Game end',
    icon: Trophy,
    tone: 'violet',
    body: 'A four-counter line wins. A full grid without a winner is a draw.',
  },
] satisfies ReadonlyArray<{
  title: string;
  icon: LucideIcon;
  tone: string;
  body?: string;
  items?: readonly string[];
}>;

interface HowToPlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayPanel({ isOpen, onClose }: HowToPlayPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION.quick}
          onClick={onClose}
          data-testid="help-panel"
        >
          <motion.div
            className="modal-card modal-card--scroll"
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 12 }}
            transition={MOTION.spring}
            onClick={event => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <span className="modal-eyebrow">Quick guide</span>
                <h2>How to play {APP_NAME}</h2>
              </div>
              <motion.button
                type="button"
                className="modal-close"
                onClick={onClose}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Close how to play"
                data-testid="help-close"
              >
                <X aria-hidden="true" />
              </motion.button>
            </header>

            <div className="help-grid">
              {GUIDE.map(({ title, icon: Icon, tone, body, items }) => (
                <section className="help-section" key={title} data-testid={`help-${tone}-${title}`}>
                  <h3>
                    <span className={`help-section__icon help-section__icon--${tone}`}>
                      <Icon aria-hidden="true" />
                    </span>
                    {title}
                  </h3>
                  {body && <p>{body}</p>}
                  {items && (
                    <ul>
                      {items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>

            <p className="modal-legal">{LEGAL_DISCLAIMER}</p>
            <button
              type="button"
              className="primary-action"
              onClick={onClose}
              data-testid="help-close-bottom"
            >
              Ready to play
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
