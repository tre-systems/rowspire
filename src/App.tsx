import RowspireGame from '@/components/RowspireGame';
import NetworkStatus from '@/components/NetworkStatus';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ServiceWorkerUpdate from '@/components/ServiceWorkerUpdate';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import OfflinePage from '@/components/OfflinePage';
import { MotionConfig } from 'framer-motion';

export default function App() {
  const content = window.location.pathname === '/offline' ? <OfflinePage /> : <RowspireGame />;

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>{content}</div>
        <PWAInstallPrompt />
        <NetworkStatus />
        <ServiceWorkerUpdate />
      </MotionConfig>
    </AppErrorBoundary>
  );
}
