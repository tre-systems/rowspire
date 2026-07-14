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
type Participant = z.infer<typeof ParticipantSchema>;
const UsageEventSchema = UsageEventUnion.refine(hasValidParticipants);

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

export function usageDataPoint(event: UsageEvent) {
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
    ],
    doubles: [1, event.event === 'game_completed' ? event.moves : 0],
  };
}

export function reportUsage(event: UsageEvent): void {
  const body = JSON.stringify(event);

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
