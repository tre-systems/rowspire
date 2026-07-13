import { Wifi, WifiOff } from 'lucide-react';
import { APP_NAME, SHORT_DESCRIPTION } from '@/lib/brand';

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4"
      data-testid="offline-page"
    >
      <div className="max-w-md mx-auto text-center">
        <WifiOff className="h-24 w-24 text-slate-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">You&apos;re Offline</h1>
        <p className="text-slate-300 text-lg mb-8">No internet connection detected</p>
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-3">{APP_NAME}</h2>
          <p className="text-slate-300 mb-4">
            {SHORT_DESCRIPTION} You can keep playing against AI opponents offline.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
            <Wifi className="h-4 w-4" />
            <span>Reconnect for updates</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          data-testid="offline-retry"
        >
          Try Again
        </button>
        <p className="mt-6 text-sm text-slate-400">
          Game data stays on this device, ready for your next visit.
        </p>
      </div>
    </main>
  );
}
