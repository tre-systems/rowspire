import { describe, expect, it, vi } from 'vitest';
import worker, { type Env } from '../../worker';

function environment(writeDataPoint = vi.fn()): Env {
  return {
    ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('asset')) },
    APP_USAGE: { writeDataPoint },
  };
}

describe('Rowspire Worker', () => {
  it('records known same-origin usage events', async () => {
    const writeDataPoint = vi.fn();
    const request = new Request('https://rowspire.com/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://rowspire.com' },
      body: JSON.stringify({ event: 'game_started' }),
    });

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

  it('rejects cross-origin browser submissions', async () => {
    const writeDataPoint = vi.fn();
    const request = new Request('https://rowspire.com/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
      body: JSON.stringify({ event: 'game_completed' }),
    });

    const result = await worker.fetch(request, environment(writeDataPoint));

    expect(result.status).toBe(403);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });

  it('reports unavailable instrumentation without affecting asset requests', async () => {
    const assets = { fetch: vi.fn().mockResolvedValue(new Response('asset')) };
    const request = new Request('https://rowspire.com/api/usage', {
      method: 'POST',
      body: JSON.stringify({ event: 'game_started' }),
    });

    expect((await worker.fetch(request, { ASSETS: assets })).status).toBe(503);

    const assetResponse = await worker.fetch(
      new Request('https://rowspire.com/manifest.webmanifest'),
      { ASSETS: assets },
    );
    expect(await assetResponse.text()).toBe('asset');
  });
});
