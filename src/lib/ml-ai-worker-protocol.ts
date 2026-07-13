import { z } from 'zod';
import type { WasmMLResponse } from './bindings';

const RequestIdSchema = z.number().int().positive();

const MLMoveEvaluationSchema = z
  .object({
    column: z.number().int().min(0).max(6),
    score: z.number().finite(),
    moveType: z.string(),
  })
  .strict();

export const MLResponseSchema: z.ZodType<WasmMLResponse> = z
  .object({
    move: z.number().int().min(0).max(6).nullable(),
    evaluation: z.number().finite(),
    thinking: z.string(),
    diagnostics: z
      .object({
        validMoves: z.array(z.number().int().min(0).max(6)),
        moveEvaluations: z.array(MLMoveEvaluationSchema),
        valueNetworkOutput: z.number().finite(),
        policyNetworkOutputs: z.array(z.number().finite()),
      })
      .strict(),
  })
  .strict();

export type MLWorkerRequest = {
  id: number;
  state: unknown;
};

export const MLWorkerRequestSchema: z.ZodType<MLWorkerRequest> = z
  .object({
    id: RequestIdSchema,
    state: z.unknown(),
  })
  .strict();

export type MLWorkerResponse =
  { id: number; response: WasmMLResponse } | { id: number; error: string };

export const MLWorkerResponseSchema: z.ZodType<MLWorkerResponse> = z.union([
  z.object({ id: RequestIdSchema, response: MLResponseSchema }).strict(),
  z.object({ id: RequestIdSchema, error: z.string() }).strict(),
]);

export function workerMessageId(value: unknown): number | null {
  if (!value || typeof value !== 'object') return null;

  const id = (value as Record<string, unknown>).id;
  const result = RequestIdSchema.safeParse(id);
  return result.success ? result.data : null;
}
