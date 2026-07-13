import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from '../../worker';

function environment(writeDataPoint = vi.fn()): Env {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('asset')) },
    APP_USAGE: { writeDataPoint },
  };
}

function usageRequest(body: string, headers: Record<string, string> = {}) {
  return new Request('https://rowspire.com/api/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://rowspire.com',
      ...headers,
    },
    body,
  });
}

describe('Rowspire Worker', () => {
  it('records known same-origin usage events', async () => {
    const writeDataPoint = vi.fn();
    const request = usageRequest(JSON.stringify({ event: 'game_started' }));

    const result = await worker.fetch(request, environment(writeDataPoint));

    expect(result.status).toBe(202);
    expect(writeDataPoint).toHaveBeenCalledWith({
      indexes: ['rowspire'],
      blobs: ['game_started'],
      doubles: [1],
    });
  });

  it.each([
    { body: '{', origin: 'https://rowspire.com' },
    { body: JSON.stringify({ event: 'page_view' }), origin: 'https://rowspire.com' },
    {
      body: JSON.stringify({ event: 'game_started', user: 'someone' }),
      origin: 'https://rowspire.com',
    },
  ])('rejects invalid usage payloads', async ({ body, origin }) => {
    const writeDataPoint = vi.fn();
    const request = new Request('https://rowspire.com/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body,
    });

    const result = await worker.fetch(request, environment(writeDataPoint));

    expect(result.status).toBe(400);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it('rejects missing origins, unsupported content, and oversized bodies', async () => {
    const writeDataPoint = vi.fn();
    const requests = [
      usageRequest('{}', { Origin: '' }),
      usageRequest('{}', { 'Content-Type': 'text/plain' }),
      usageRequest('x'.repeat(257)),
    ];

    const statuses = await Promise.all(
      requests.map(
        async request => (await worker.fetch(request, environment(writeDataPoint))).status,
      ),
    );

    expect(statuses).toEqual([403, 415, 413]);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it('rejects cross-origin browser submissions', async () => {
    const writeDataPoint = vi.fn();
    const request = new Request('https://rowspire.com/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
      body: JSON.stringify({ event: 'game_completed' }),
    });

    const result = await worker.fetch(request, environment(writeDataPoint));

    expect(result.status).toBe(403);
    expect(result.headers.get('strict-transport-security')).toBe('max-age=31536000');
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it('reports unavailable instrumentation without affecting asset requests', async () => {
    const assets = { fetch: vi.fn().mockResolvedValue(new Response('asset')) };
    const request = usageRequest(JSON.stringify({ event: 'game_started' }));

    expect((await worker.fetch(request, { ASSETS: assets })).status).toBe(503);

    const assetResponse = await worker.fetch(
      new Request('https://rowspire.com/manifest.webmanifest'),
      { ASSETS: assets },
    );
    expect(await assetResponse.text()).toBe('asset');
  });

  it('hardens canonical redirects', async () => {
    const result = await worker.fetch(
      new Request('https://rowspire.net/play?mode=ml'),
      environment(),
    );

    expect(result.status).toBe(301);
    expect(result.headers.get('location')).toBe('https://rowspire.com/play?mode=ml');
    expect(result.headers.get('strict-transport-security')).toBe('max-age=31536000');
  });
});
