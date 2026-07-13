import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';
import { APP_NAME } from '@/lib/brand';
import { MOTION } from '@/lib/visuals/motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;

    const handleBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);

      if (showTimer) clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        if (!window.localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (showTimer) clearTimeout(showTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    window.localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.aside
          className="install-prompt"
          aria-labelledby="install-prompt-title"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={MOTION.spring}
          data-testid="pwa-install-prompt"
        >
          <div className="install-prompt__icon">
            <Download aria-hidden="true" />
          </div>
          <div className="install-prompt__content">
            <span className="modal-eyebrow">Play anywhere</span>
            <h3 id="install-prompt-title">Add {APP_NAME} to your device</h3>
            <p>Add it to your home screen for instant access and offline play.</p>
            <div className="install-prompt__actions">
              <motion.button
                type="button"
                className="primary-action"
                onClick={handleInstallClick}
                whileTap={{ scale: 0.97 }}
                data-testid="install-pwa"
              >
                Add game
              </motion.button>
              <button
                type="button"
                className="secondary-action"
                onClick={handleDismiss}
                data-testid="dismiss-pwa"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="install-prompt__close"
            aria-label="Dismiss install prompt"
            data-testid="close-pwa"
          >
            <X aria-hidden="true" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
