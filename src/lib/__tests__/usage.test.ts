import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  gameCompletedUsage,
  gameStartedUsage,
  isUsageEvent,
  parseUsageEvent,
  reportUsage,
  usageDataPoint,
  type UsageEvent,
} from '../usage';
import { makeMove, initializeGame } from '../game-logic';

const startedEvent = {
  event: 'game_started',
  mode: 'human-vs-ai',
  difficulty: 'standard',
  player1: 'human',
  player2: 'ml',
  startedBy: 'player1',
} satisfies UsageEvent;

describe('usage reporting', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('accepts only the supported product events', () => {
    expect(isUsageEvent(startedEvent)).toBe(true);
    expect(isUsageEvent({ ...startedEvent, difficulty: 'impossible' })).toBe(false);
    expect(isUsageEvent({ ...startedEvent, player1: 'search' })).toBe(false);
  });

  it('accepts only an exact usage payload', () => {
    expect(parseUsageEvent(startedEvent)).toEqual(startedEvent);
    expect(parseUsageEvent({ ...startedEvent, user: 'someone' })).toBeNull();
    expect(parseUsageEvent({ event: 'page_view' })).toBeNull();
    expect(parseUsageEvent(null)).toBeNull();
  });

  it('builds the shared Antenna Analytics Engine contract', () => {
    const completedEvent = {
      ...startedEvent,
      event: 'game_completed',
      result: 'player1',
      moves: 15,
    } satisfies UsageEvent;
    expect(usageDataPoint(completedEvent)).toEqual({
      indexes: ['rowspire'],
      blobs: ['game_completed', 'human-vs-ai', 'standard', 'human', 'ml', 'player1', 'player1'],
      doubles: [1, 15],
    });
  });

  it('derives participants, result, starter, and move count from game state', () => {
    const context = {
      gameMode: 'ai-vs-ai' as const,
      difficulty: 'expert' as const,
      player1AI: 'search' as const,
      player2AI: 'ml' as const,
    };
    let game = initializeGame(() => 0);
    for (const column of [0, 6, 1, 6, 2, 5, 3]) game = makeMove(game, column);

    expect(gameStartedUsage(context, 'player1')).toMatchObject({
      player1: 'search',
      player2: 'ml',
      startedBy: 'player1',
    });
    expect(gameCompletedUsage(context, game)).toMatchObject({
      result: 'player1',
      moves: 7,
      startedBy: 'player1',
    });
  });

  it('uses sendBeacon when the browser accepts the event', () => {
    const sendBeacon = vi.fn(() => true);
    const fetchMock = vi.fn();
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('fetch', fetchMock);

    reportUsage(startedEvent);

    expect(sendBeacon).toHaveBeenCalledWith('/api/usage', expect.any(Blob));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to a keepalive request when sendBeacon declines', () => {
    vi.stubGlobal('navigator', { sendBeacon: vi.fn(() => false) });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);

    reportUsage(startedEvent);

    expect(fetchMock).toHaveBeenCalledWith('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(startedEvent),
      keepalive: true,
    });
  });
});
