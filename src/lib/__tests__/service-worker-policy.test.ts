import { describe, expect, it } from 'vitest';
import { isCacheable, isCacheFirst, OFFLINE_URL, PRECACHE_ASSETS } from '../service-worker-policy';

describe('service worker policy', () => {
  it('precaches the offline shell and AI runtime', () => {
    expect(PRECACHE_ASSETS).toContain(OFFLINE_URL);
    expect(PRECACHE_ASSETS).toContain('/wasm/rowspire_ai_core_bg.wasm');
    expect(PRECACHE_ASSETS).toContain('/ml/data/weights/ml_ai_weights_best.json');
  });

  it.each(['/assets/app.js', '/wasm/core.wasm', '/ml/model.json'])(
    'uses cache-first for %s',
    path => {
      expect(isCacheFirst(new URL(path, window.location.origin))).toBe(true);
    },
  );

  it('uses network-first for documents', () => {
    expect(isCacheFirst(new URL('/play', window.location.origin))).toBe(false);
  });

  it('only caches successful same-origin reads', () => {
    const local = new Request(`${window.location.origin}/asset.js`);
    const remote = new Request('https://example.com/asset.js');

    expect(isCacheable(local, new Response('ok'))).toBe(true);
    expect(isCacheable(remote, new Response('ok'))).toBe(false);
    expect(isCacheable(local, new Response('no', { status: 500 }))).toBe(false);
  });
});
