import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, X } from 'lucide-react';
import { useDismissOnEscape } from '@/hooks/useDismissOnEscape';
import { MOTION } from '@/lib/visuals/motion';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

export default function ErrorModal({ isOpen, onClose, error }: ErrorModalProps) {
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
          data-testid="error-modal"
        >
          <motion.div
            className="modal-card modal-card--compact"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="error-title"
            aria-describedby="error-message"
            initial={{ scale: 0.94, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 12 }}
            transition={MOTION.spring}
            onClick={event => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <span className="modal-eyebrow modal-eyebrow--warning">Game paused</span>
                <h2 id="error-title">
                  <AlertTriangle aria-hidden="true" /> We hit a small snag
                </h2>
              </div>
              <motion.button
                type="button"
                autoFocus
                className="modal-close"
                onClick={onClose}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                aria-label="Close error"
                data-testid="error-close"
              >
                <X aria-hidden="true" />
              </motion.button>
            </header>
            <p id="error-message" className="modal-message">
              No worries—close this message and keep playing. If it happens again, try a new game.
            </p>
            <details className="technical-disclosure error-technical">
              <summary data-testid="error-technical-details">
                Technical details
                <ChevronDown aria-hidden="true" />
              </summary>
              <p data-testid="error-message">{error}</p>
            </details>
            <button
              type="button"
              className="primary-action"
              onClick={onClose}
              data-testid="error-close-bottom"
            >
              Back to the game
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
