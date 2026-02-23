import { createLogger } from "@repo/logger";
import { z } from "zod";

const logger = createLogger("config");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  MONGO_POOL_SIZE: z.coerce.number().default(500),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  WORKERS: z.coerce.number().default(1),
  /** FEATURE FLAGS */
  FEATURE_FLAG_DISABLE_REDIS_ATOMIC_OPERATIONS: z.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.fatal({ errors: result.error.flatten().fieldErrors }, "Invalid environment variables");
    process.exit(1);
  }

  return result.data;
}

export const env: Env = loadEnv();
