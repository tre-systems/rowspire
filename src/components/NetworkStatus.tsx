import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setShowStatus(true);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setShowStatus(false), 3000);
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div
      className="fixed top-4 left-4 z-50 p-2 rounded-full shadow-lg transition-all duration-300 bg-white/10 backdrop-blur-sm flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={isOnline ? 'Online' : 'Offline'}
      data-testid="network-status"
    >
      {isOnline ? (
        <Wifi className="h-5 w-5 text-green-400" />
      ) : (
        <WifiOff className="h-5 w-5 text-red-400" />
      )}
    </div>
  );
}
