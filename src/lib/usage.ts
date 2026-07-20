import { z } from 'zod';
import {
  AITypeSchema,
  DifficultySchema,
  GameModeSchema,
  PlayerSchema,
  type AIType,
  type Difficulty,
  type GameMode,
  type GameState,
  type Player,
} from './types';

const ParticipantSchema = z.enum(['human', ...AITypeSchema.options]);
const ResultSchema = z.enum(['player1', 'player2', 'draw']);
const AnonymousIdSchema = z.string().uuid();
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const DEVICE_ID_KEY = 'rowspire-analytics-device';
const SESSION_KEY = 'rowspire-analytics-session';
const OPT_OUT_KEY = 'rowspire-analytics-optout';
const AUTOMATED_USER_AGENT =
  /bot|crawler|spider|headlesschrome|lighthouse|pagespeed|claude|electron/i;
const UsageContextSchema = z.object({
  mode: GameModeSchema,
  difficulty: DifficultySchema,
  player1: ParticipantSchema,
  player2: ParticipantSchema,
  startedBy: PlayerSchema,
});

const UsageEventUnion = z.discriminatedUnion('event', [
  UsageContextSchema.extend({ event: z.literal('game_started') }).strict(),
  UsageContextSchema.extend({
    event: z.literal('game_completed'),
    result: ResultSchema,
    moves: z.number().int().min(7).max(42),
  }).strict(),
]);

export type UsageEvent = z.infer<typeof UsageEventUnion>;
export type UsagePayload = UsageEvent & { deviceId: string; sessionId: string };
type Participant = z.infer<typeof ParticipantSchema>;
const UsageEventSchema = UsageEventUnion.refine(hasValidParticipants);
const UsagePayloadSchema = z
  .object({ deviceId: AnonymousIdSchema, sessionId: AnonymousIdSchema })
  .passthrough()
  .superRefine((value, context) => {
    const event = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== 'deviceId' && key !== 'sessionId'),
    );
    if (!UsageEventSchema.safeParse(event).success) {
      context.addIssue({ code: 'custom', message: 'Invalid usage event' });
    }
  })
  .transform(value => value as UsagePayload);

export interface GameUsageContext {
  gameMode: GameMode;
  difficulty: Difficulty;
  player1AI: AIType;
  player2AI: AIType;
}

function participants(context: GameUsageContext): [Participant, Participant] {
  if (context.gameMode === 'human-vs-human') return ['human', 'human'];
  if (context.gameMode === 'human-vs-ai') return ['human', context.player2AI];
  return [context.player1AI, context.player2AI];
}

function hasValidParticipants(event: UsageEvent): boolean {
  if (event.mode === 'human-vs-human') {
    return event.player1 === 'human' && event.player2 === 'human';
  }
  if (event.mode === 'human-vs-ai') {
    return event.player1 === 'human' && event.player2 !== 'human';
  }
  return event.player1 !== 'human' && event.player2 !== 'human';
}

function usageContext(context: GameUsageContext, startedBy: Player) {
  const [player1, player2] = participants(context);
  return { mode: context.gameMode, difficulty: context.difficulty, player1, player2, startedBy };
}

export function gameStartedUsage(context: GameUsageContext, startedBy: Player): UsageEvent {
  return { event: 'game_started', ...usageContext(context, startedBy) };
}

export function gameCompletedUsage(context: GameUsageContext, state: GameState): UsageEvent {
  const startedBy = state.history[0]?.player;
  if (!startedBy) throw new Error('A completed game must have a first move');

  return {
    event: 'game_completed',
    ...usageContext(context, startedBy),
    result: state.winner ?? 'draw',
    moves: state.history.length,
  };
}

export function isUsageEvent(value: unknown): value is UsageEvent {
  return UsageEventSchema.safeParse(value).success;
}

export function parseUsageEvent(value: unknown): UsageEvent | null {
  return UsageEventSchema.safeParse(value).data ?? null;
}

export function parseUsagePayload(value: unknown): UsagePayload | null {
  return UsagePayloadSchema.safeParse(value).data ?? null;
}

export function usageDataPoint(event: UsagePayload) {
  return {
    indexes: ['rowspire'],
    blobs: [
      event.event,
      event.mode,
      event.difficulty,
      event.player1,
      event.player2,
      event.startedBy,
      event.event === 'game_completed' ? event.result : '',
      event.deviceId,
      event.sessionId,
      '2',
    ],
    doubles: [1, event.event === 'game_completed' ? event.moves : 0],
  };
}

function analyticsEnabled(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    const preference = new URLSearchParams(window.location.search).get('telemetry');
    if (preference === 'off') localStorage.setItem(OPT_OUT_KEY, '1');
    if (preference === 'on') localStorage.removeItem(OPT_OUT_KEY);
    return (
      localStorage.getItem(OPT_OUT_KEY) !== '1' &&
      !navigator.webdriver &&
      !AUTOMATED_USER_AGENT.test(navigator.userAgent)
    );
  } catch {
    return false;
  }
}

function anonymousId(key: string): string {
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function currentSessionId(): string {
  const now = Date.now();
  const stored = localStorage.getItem(SESSION_KEY);
  const session = stored
    ? (JSON.parse(stored) as { id?: unknown; lastSeenAt?: unknown })
    : undefined;
  const id =
    typeof session?.id === 'string' &&
    typeof session.lastSeenAt === 'number' &&
    now - session.lastSeenAt < SESSION_TIMEOUT_MS
      ? session.id
      : crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id, lastSeenAt: now }));
  return id;
}

export function reportUsage(event: UsageEvent): void {
  if (!analyticsEnabled()) return;

  let body: string;
  try {
    body = JSON.stringify({
      ...event,
      deviceId: anonymousId(DEVICE_ID_KEY),
      sessionId: currentSessionId(),
    } satisfies UsagePayload);
  } catch {
    return;
  }

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
