import { TTL_ONE_MINUTE_MS } from "@/config/constants.js";
import { env } from "@/config/env.js";
import { errorResponseSchema } from "@repo/schema";
import rateLimit from "express-rate-limit";

function createRateLimitResponse(error: string) {
  return errorResponseSchema.parse({
    status: "error",
    data: null,
    error,
    timestamp: new Date().toISOString(),
  });
}

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createRateLimitResponse("Too many requests, please try again later"),
});

export const purchaseLimiter = rateLimit({
  windowMs: TTL_ONE_MINUTE_MS,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: createRateLimitResponse("Too many purchase attempts, please try again later"),
});
