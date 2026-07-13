import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { MOTION } from '@/lib/visuals/motion';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [showStatus, setShowStatus] = useState(() => !navigator.onLine);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowStatus(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowStatus(false), 3000);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  const Icon = isOnline ? Wifi : WifiOff;

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          className={`network-status network-status--${isOnline ? 'online' : 'offline'}`}
          role="status"
          aria-live="polite"
          aria-label={isOnline ? 'Online' : 'Offline'}
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={MOTION.spring}
          data-testid="network-status"
        >
          <Icon aria-hidden="true" />
          <span>{isOnline ? 'Back online' : 'Playing offline'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
