export const OFFLINE_URL = '/offline';

export const PRECACHE_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/wasm/rowspire_ai_core.js',
  '/wasm/rowspire_ai_core_bg.wasm',
  '/ml/data/genetic_params/evolved.json',
  '/ml/data/weights/ml_ai_weights_best.json',
];

export function isCacheFirst(url: URL) {
  return ['/assets/', '/wasm/', '/ml/'].some(prefix => url.pathname.startsWith(prefix));
}

export function isCacheable(request: Request, response: Response) {
  return (
    request.method === 'GET' && response.ok && new URL(request.url).origin === self.location.origin
  );
}
