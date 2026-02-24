import { TTL_ONE_MINUTE_MS } from "@/config/constants.js";
import { env } from "@/config/env.js";
import { errorResponseSchema } from "@repo/schema";

export function createRateLimitResponse(error: string) {
  return errorResponseSchema.parse({
    status: "error",
    data: null,
    error,
    timestamp: new Date().toISOString(),
  });
}

/** @fastify/rate-limit throws this; must be an Error with statusCode so the error handler sends 429. */
function rateLimitExceededError(message: string, statusCode = 429): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

export const globalRateLimitConfig = {
  max: env.RATE_LIMIT_MAX,
  timeWindow: env.RATE_LIMIT_WINDOW_MS,
  errorResponseBuilder: (_req: unknown, context: { statusCode: number }) =>
    rateLimitExceededError("Too many requests, please try again later", context.statusCode),
} as const;

export const purchaseRateLimitConfig = {
  max: 5,
  timeWindow: TTL_ONE_MINUTE_MS,
  errorResponseBuilder: (_req: unknown, context: { statusCode: number }) =>
    rateLimitExceededError("Too many purchase attempts, please try again later", context.statusCode),
} as const;
