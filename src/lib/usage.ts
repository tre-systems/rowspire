export const USAGE_EVENTS = ['game_started', 'game_completed'] as const;

export type UsageEvent = (typeof USAGE_EVENTS)[number];

export function isUsageEvent(value: unknown): value is UsageEvent {
  return typeof value === 'string' && USAGE_EVENTS.some(event => event === value);
}

export function usageDataPoint(event: UsageEvent) {
  return {
    indexes: ['rowspire'],
    blobs: [event],
    doubles: [1],
  };
}

export function reportUsage(event: UsageEvent): void {
  const body = JSON.stringify({ event });

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.sendBeacon === 'function' &&
    navigator.sendBeacon('/api/usage', new Blob([body], { type: 'application/json' }))
  ) {
    return;
  }

  if (typeof fetch === 'function') {
    void fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }
}
