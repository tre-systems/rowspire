import { useEffect, useRef, useState } from 'react';
import {
  activateWaitingServiceWorker,
  checkForServiceWorkerUpdate,
  installUpdateCheckTriggers,
  shouldRunUpdateCheck,
} from '@/lib/pwa-update-lifecycle';

function listenForInstall(worker: ServiceWorker | null, onInstalled: () => void) {
  if (!worker) return () => {};

  const handleStateChange = () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) onInstalled();
  };

  worker.addEventListener('statechange', handleStateChange);
  return () => worker.removeEventListener('statechange', handleStateChange);
}

export default function ServiceWorkerUpdate() {
  const [state, setState] = useState<'hidden' | 'ready' | 'deferred' | 'updating'>('hidden');
  const activateRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let disposed = false;
    let checking = false;
    let lastCheckAt = 0;
    let registration: ServiceWorkerRegistration | undefined;
    const cleanups: Array<() => void> = [];

    const showUpdate = () => {
      if (disposed) return;
      setState(current => (current === 'deferred' || current === 'updating' ? current : 'ready'));
    };
    const checkForUpdate = async (force = false) => {
      if (
        disposed ||
        checking ||
        !registration ||
        !navigator.onLine ||
        document.visibilityState !== 'visible'
      )
        return;

      const now = Date.now();
      if (!force && !shouldRunUpdateCheck(now, lastCheckAt)) return;
      lastCheckAt = now;
      checking = true;
      const result = await checkForServiceWorkerUpdate({ registration, swUrl: '/sw.js' });
      checking = false;
      if (result === 'waiting') showUpdate();
    };
    const register = async () => {
      const nextRegistration = await navigator.serviceWorker.register('/sw.js', { type: 'module' });
      registration = nextRegistration;
      if (disposed) return;

      if (nextRegistration.waiting) showUpdate();

      const track = (worker: ServiceWorker | null) => {
        cleanups.push(listenForInstall(worker, showUpdate));
      };
      const handleUpdateFound = () => track(nextRegistration.installing);

      track(nextRegistration.installing);
      nextRegistration.addEventListener('updatefound', handleUpdateFound);
      cleanups.push(() => nextRegistration.removeEventListener('updatefound', handleUpdateFound));
      await checkForUpdate(true);
    };

    cleanups.push(
      installUpdateCheckTriggers({
        check: () => void checkForUpdate(),
      }),
    );
    void register().catch(error => console.warn('Service worker registration failed:', error));

    activateRef.current = async () => {
      if (!registration) return;
      setState('updating');
      const activated = await activateWaitingServiceWorker({ registration });
      if (activated || disposed) return;
      await checkForUpdate(true);
      setState('ready');
    };

    return () => {
      disposed = true;
      cleanups.forEach(cleanup => cleanup());
    };
  }, []);

  if (state === 'hidden') return null;
  if (state === 'deferred')
    return (
      <button
        type="button"
        className="update-ready-chip"
        onClick={() => setState('ready')}
        data-testid="service-worker-update-ready"
      >
        Update ready
      </button>
    );

  return (
    <aside
      className="update-prompt"
      role="status"
      aria-live="polite"
      data-testid="service-worker-update"
    >
      <p>{state === 'updating' ? 'Applying update…' : 'Update ready. Restart at a safe point.'}</p>
      <div className="update-prompt__actions">
        <button
          type="button"
          className="primary-action"
          disabled={state === 'updating'}
          onClick={() => void activateRef.current()}
          data-testid="service-worker-update-now"
        >
          {state === 'updating' ? 'Updating…' : 'Restart and update'}
        </button>
        {state !== 'updating' && (
          <button
            type="button"
            className="secondary-action"
            onClick={() => setState('deferred')}
            data-testid="service-worker-update-later"
          >
            Later
          </button>
        )}
      </div>
    </aside>
  );
}
