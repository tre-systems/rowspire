import RowspireGame from '@/components/RowspireGame';
import NetworkStatus from '@/components/NetworkStatus';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ServiceWorkerUpdate from '@/components/ServiceWorkerUpdate';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import OfflinePage from '@/components/OfflinePage';

export default function App() {
  const content = window.location.pathname === '/offline' ? <OfflinePage /> : <RowspireGame />;

  return (
    <AppErrorBoundary>
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>{content}</div>
      <PWAInstallPrompt />
      <NetworkStatus />
      <ServiceWorkerUpdate />
    </AppErrorBoundary>
  );
}
