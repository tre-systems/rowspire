import { motion } from 'framer-motion';
import { RotateCw, Wifi, WifiOff } from 'lucide-react';
import { APP_NAME, SHORT_DESCRIPTION } from '@/lib/brand';
import { MOTION } from '@/lib/visuals/motion';

export default function OfflinePage() {
  return (
    <>
      <main className="offline-stage" data-testid="offline-page">
        <motion.section
          className="offline-card"
          initial={{ opacity: 0, scale: 0.96, y: 22 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={MOTION.entrance}
        >
          <div className="offline-icon">
            <WifiOff aria-hidden="true" />
          </div>
          <span className="modal-eyebrow">Connection paused</span>
          <h1>You&apos;re offline</h1>
          <p>
            {SHORT_DESCRIPTION} {APP_NAME} is ready to keep playing on this device.
          </p>
          <div className="offline-note">
            <Wifi aria-hidden="true" />
            Your game and AI remain available offline
          </div>
          <motion.button
            type="button"
            className="primary-action"
            onClick={() => window.location.reload()}
            whileTap={{ scale: 0.97 }}
            transition={MOTION.spring}
            data-testid="offline-retry"
          >
            <RotateCw aria-hidden="true" />
            Try again
          </motion.button>
          <small>Progress stays safely on this device.</small>
        </motion.section>
      </main>
    </>
  );
}
