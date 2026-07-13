import { MotionConfig } from 'framer-motion';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import NetworkStatus from '@/components/NetworkStatus';
import OfflinePage from '@/components/OfflinePage';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import RowspireGame from '@/components/RowspireGame';
import ServiceWorkerUpdate from '@/components/ServiceWorkerUpdate';

export default function App() {
  const content = window.location.pathname === '/offline' ? <OfflinePage /> : <RowspireGame />;

  return (
    <AppErrorBoundary>
      <MotionConfig reducedMotion="user">
        {content}
        <PWAInstallPrompt />
        <NetworkStatus />
        <ServiceWorkerUpdate />
      </MotionConfig>
    </AppErrorBoundary>
  );
}
