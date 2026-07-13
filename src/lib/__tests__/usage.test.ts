import { afterEach, describe, expect, it, vi } from 'vitest';
import { isUsageEvent, reportUsage, usageDataPoint } from '../usage';

describe('usage reporting', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts only the supported product events', () => {
    expect(isUsageEvent('game_started')).toBe(true);
    expect(isUsageEvent('game_completed')).toBe(true);
    expect(isUsageEvent('page_view')).toBe(false);
  });

  it('builds the shared Antenna Analytics Engine contract', () => {
    expect(usageDataPoint('game_completed')).toEqual({
      indexes: ['rowspire'],
      blobs: ['game_completed'],
      doubles: [1],
    });
  });

  it('uses sendBeacon when the browser accepts the event', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchMock);

    reportUsage('game_started');

    expect(sendBeacon).toHaveBeenCalledWith('/api/usage', expect.any(Blob));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to a keepalive request when sendBeacon declines', () => {
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => false) });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    reportUsage('game_completed');

    expect(fetchMock).toHaveBeenCalledWith('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'game_completed' }),
      keepalive: true,
    });
  });
});
