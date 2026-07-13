import { useEffect, useState } from 'react';

export default function ServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    void navigator.serviceWorker
      .register('/sw.js', { type: 'module' })
      .then(registration => {
        if (registration.waiting) setWaiting(registration.waiting);

        const track = (worker: ServiceWorker | null) => {
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller)
              setWaiting(worker);
          });
        };

        track(registration.installing);
        registration.addEventListener('updatefound', () => track(registration.installing));
        void registration.update();
      })
      .catch(error => console.warn('Service worker registration failed:', error));
  }, []);

  if (!waiting) return null;

  return (
    <aside
      className="fixed left-1/2 top-4 z-[10000] flex -translate-x-1/2 flex-col items-center gap-4 rounded-2xl bg-slate-800/95 px-6 py-5 text-white shadow-2xl"
      data-testid="service-worker-update"
    >
      <p className="text-center font-medium">A new version is available.</p>
      <div className="flex gap-3">
        <button
          type="button"
          className="rounded-lg bg-cyan-400 px-5 py-2 font-semibold hover:bg-cyan-500"
          onClick={() => {
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              () => window.location.reload(),
              { once: true },
            );
            waiting.postMessage({ type: 'SKIP_WAITING' });
          }}
          data-testid="service-worker-update-now"
        >
          Update now
        </button>
        <button
          type="button"
          className="px-3 py-2 underline"
          onClick={() => setWaiting(null)}
          data-testid="service-worker-update-later"
        >
          Later
        </button>
      </div>
    </aside>
  );
}
