import { useEffect, useState } from 'react';

function listenForInstall(worker: ServiceWorker | null, onInstalled: () => void) {
  if (!worker) return () => {};

  const handleStateChange = () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) onInstalled();
  };

  worker.addEventListener('statechange', handleStateChange);
  return () => worker.removeEventListener('statechange', handleStateChange);
}

export default function ServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];

    const register = async () => {
      const registration = await navigator.serviceWorker.register('/sw.js', { type: 'module' });
      if (disposed) return;

      if (registration.waiting) setWaiting(registration.waiting);

      const track = (worker: ServiceWorker | null) => {
        cleanups.push(listenForInstall(worker, () => worker && setWaiting(worker)));
      };
      const handleUpdateFound = () => track(registration.installing);

      track(registration.installing);
      registration.addEventListener('updatefound', handleUpdateFound);
      cleanups.push(() => registration.removeEventListener('updatefound', handleUpdateFound));
      await registration.update();
    };

    void register().catch(error => console.warn('Service worker registration failed:', error));

    return () => {
      disposed = true;
      cleanups.forEach(cleanup => cleanup());
    };
  }, []);

  const applyUpdate = () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    });
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waiting) return null;

  return (
    <aside className="update-prompt" role="status" data-testid="service-worker-update">
      <p>A new version is available.</p>
      <div className="update-prompt__actions">
        <button
          type="button"
          className="primary-action"
          onClick={applyUpdate}
          data-testid="service-worker-update-now"
        >
          Update now
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => setWaiting(null)}
          data-testid="service-worker-update-later"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
