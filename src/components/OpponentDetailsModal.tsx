import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { OPPONENTS } from '@/lib/opponents';
import type { AIType, Difficulty } from '@/lib/types';
import { MOTION } from '@/lib/visuals/motion';
import OpponentTechnicalContent from './OpponentTechnicalContent';

interface OpponentDetailsModalProps {
  opponent: AIType | null;
  difficulty: Difficulty;
  onClose: () => void;
}

export default function OpponentDetailsModal({
  opponent,
  difficulty,
  onClose,
}: OpponentDetailsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const profile = opponent ? OPPONENTS[opponent] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!opponent) {
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) dialog.showModal();
  }, [opponent]);

  return (
    <dialog
      ref={dialogRef}
      id="opponent-details-dialog"
      className="opponent-dialog"
      aria-labelledby="opponent-details-title"
      onCancel={event => {
        event.preventDefault();
        onClose();
      }}
      onClick={event => {
        if (event.target === event.currentTarget) onClose();
      }}
      data-testid="opponent-details-modal"
    >
      {opponent && profile && (
        <motion.div
          className={`modal-card modal-card--scroll opponent-modal opponent-modal--${opponent}`}
          initial={{ scale: 0.95, opacity: 0, y: 18 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={MOTION.spring}
          onClick={event => event.stopPropagation()}
        >
          <header className="modal-header">
            <div>
              <span className="modal-eyebrow">{profile.technicalName}</span>
              <h2 id="opponent-details-title">How {profile.name} thinks</h2>
            </div>
            <motion.button
              type="button"
              className="modal-close"
              onClick={onClose}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label="Close technical details"
              data-testid="opponent-details-close"
            >
              <X aria-hidden="true" />
            </motion.button>
          </header>

          <OpponentTechnicalContent opponent={opponent} difficulty={difficulty} />

          <button
            type="button"
            className="primary-action"
            onClick={onClose}
            data-testid="opponent-details-done"
          >
            Done
          </button>
        </motion.div>
      )}
    </dialog>
  );
}
