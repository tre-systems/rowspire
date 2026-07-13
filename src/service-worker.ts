/// <reference lib="webworker" />

import {
  isCacheable,
  isCacheFirst,
  OFFLINE_URL,
  PRECACHE_ASSETS,
} from './lib/service-worker-policy';

declare const __CACHE_VERSION__: string;

const scope = self as unknown as ServiceWorkerGlobalScope;
const cacheName = `rowspire-${__CACHE_VERSION__}`;

async function cacheFirst(request: Request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(request, response))
    await (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function networkFirst(request: Request) {
  try {
    const response = await fetch(request);
    if (isCacheable(request, response))
      await (await caches.open(cacheName)).put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.destination === 'document')
      return (await caches.match(OFFLINE_URL)) ?? Response.error();
    throw error;
  }
}

scope.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(PRECACHE_ASSETS)));
});

scope.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(names =>
        Promise.all(names.filter(name => name !== cacheName).map(name => caches.delete(name))),
      ),
  );
  void scope.clients.claim();
});

scope.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  event.respondWith(
    isCacheFirst(new URL(request.url)) ? cacheFirst(request) : networkFirst(request),
  );
});

scope.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') void scope.skipWaiting();
});
