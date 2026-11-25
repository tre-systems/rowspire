import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useDismissOnEscape } from '@/hooks/useDismissOnEscape';
import { APP_NAME, LEGAL_DISCLAIMER } from '@/lib/brand';
import type { Player } from '@/lib/types';
import { MOTION } from '@/lib/visuals/motion';
import CounterGlyph from './CounterGlyph';

type GuideItem = string | { text: string; counter: Player };

type GuideEntry = { title: string } & (
  { body: string; items?: never } | { body?: never; items: readonly GuideItem[] }
);

const GUIDE = [
  {
    title: 'Objective',
    body: 'Drop counters into columns and make four in a row horizontally, vertically or diagonally.',
  },
  {
    title: 'Counters',
    items: [
      { text: 'You play the teal ring counters', counter: 'player1' },
      { text: 'Your opponent plays the violet diamond counters', counter: 'player2' },
    ],
  },
  {
    title: 'Taking turns',
    items: [
      'Choose a column to drop your counter',
      'Counters settle in the lowest open space',
      'Your opponent responds after your move lands',
    ],
  },
  {
    title: 'Winning',
    body: 'Line up four counters across, up, or diagonally before your opponent does.',
  },
  {
    title: 'Play smarter',
    items: [
      'Control the centre for more winning lines',
      'Block immediate threats before building your own',
      'Create two threats at once when you can',
    ],
  },
  {
    title: 'Game end',
    body: 'A four-counter line wins. A full grid without a winner is a draw.',
  },
] satisfies readonly GuideEntry[];

function GuideListItem({ item }: { item: GuideItem }) {
  if (typeof item === 'string') return <li>{item}</li>;

  return (
    <li className="has-counter">
      <CounterGlyph player={item.counter} />
      {item.text}
    </li>
  );
}

interface HowToPlayPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayPanel({ isOpen, onClose }: HowToPlayPanelProps) {
  useDismissOnEscape(isOpen, onClose);

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
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-play-title"
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 12 }}
            transition={MOTION.spring}
            onClick={event => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <span className="modal-eyebrow">Quick guide</span>
                <h2 id="how-to-play-title">How to play {APP_NAME}</h2>
              </div>
              <motion.button
                type="button"
                autoFocus
                className="modal-close"
                onClick={onClose}
                aria-label="Close how to play"
                data-testid="help-close"
              >
                <X aria-hidden="true" />
              </motion.button>
            </header>

            <div className="help-grid">
              {GUIDE.map(({ title, body, items }) => (
                <section className="help-section" key={title}>
                  <h3>{title}</h3>
                  {body && <p>{body}</p>}
                  {items && (
                    <ul>
                      {items.map(item => (
                        <GuideListItem
                          key={typeof item === 'string' ? item : item.text}
                          item={item}
                        />
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
