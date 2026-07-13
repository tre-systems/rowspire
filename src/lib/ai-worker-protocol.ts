import { z } from 'zod';
import type { WasmBestMoveResponse, WasmMLResponse } from './bindings';
import { BestMoveResponseSchema, MLResponseSchema, WasmGameStateSchema } from './wasm-ai-boundary';

const RequestIdSchema = z.number().int().positive();

export const AIWorkerRequestSchema = z.discriminatedUnion('type', [
  z.object({ id: RequestIdSchema, type: z.literal('initialize') }).strict(),
  z
    .object({
      id: RequestIdSchema,
      type: z.literal('search'),
      state: WasmGameStateSchema,
      depth: z.number().int().positive(),
    })
    .strict(),
  z.object({ id: RequestIdSchema, type: z.literal('ml'), state: WasmGameStateSchema }).strict(),
]);

export type AIWorkerRequest = z.infer<typeof AIWorkerRequestSchema>;

export type AIWorkerResponse =
  | { id: number; type: 'initialize' }
  | { id: number; type: 'search'; response: WasmBestMoveResponse }
  | { id: number; type: 'ml'; response: WasmMLResponse }
  | { id: number; error: string };

export const AIWorkerResponseSchema: z.ZodType<AIWorkerResponse> = z.union([
  z.object({ id: RequestIdSchema, type: z.literal('initialize') }).strict(),
  z
    .object({
      id: RequestIdSchema,
      type: z.literal('search'),
      response: BestMoveResponseSchema,
    })
    .strict(),
  z.object({ id: RequestIdSchema, type: z.literal('ml'), response: MLResponseSchema }).strict(),
  z.object({ id: RequestIdSchema, error: z.string() }).strict(),
]);

export function workerMessageId(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null;

  const id = (value as Record<string, unknown>).id;
  const result = RequestIdSchema.safeParse(id);
  return result.success ? result.data : null;
}
