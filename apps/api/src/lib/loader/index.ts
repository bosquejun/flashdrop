import initOrderSubscribers from "@/app/orders/subscribers.js";
import { initProductsRepository } from "@/app/products/repository.js";
import initProductSubscribers from "@/app/products/subscribers.js";
import { connectMongo, disconnectMongo } from "@/lib/db/client.js";
import { connectRedis, disconnectRedis } from "@/lib/redis.js";
import { createLogger } from "@repo/logger";

const logger = createLogger("loader");

const STARTUP_RETRIES = 10;
const STARTUP_RETRY_DELAY_MS = 2000;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= STARTUP_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < STARTUP_RETRIES) {
        logger.warn(
          { err, attempt, maxAttempts: STARTUP_RETRIES, nextAttemptMs: STARTUP_RETRY_DELAY_MS },
          `${label} failed, retrying...`
        );
        await new Promise((r) => setTimeout(r, STARTUP_RETRY_DELAY_MS));
      }
    }
  }
  throw lastErr;
}

/**
 * Connects to MongoDB
 * Call once before starting the HTTP server.
 */
export async function loadDatabase(): Promise<void> {
  await withRetry(connectMongo, "MongoDB connection");

  logger.debug("Initializing products repository...");
  await initProductsRepository();
  logger.info("Products repository initialized");

  logger.info("Database loaded");
}

export default async function loaders(): Promise<void> {
  logger.debug("Loading database...");
  await loadDatabase();

  logger.debug("Connecting to Redis...");
  await withRetry(connectRedis, "Redis connection");
  logger.info("Redis connected");

  logger.debug("Initializing subscribers...");
  initSubscribers();
  logger.info("Subscribers initialized");

  logger.info("Loaders completed");
}

export async function gracefulShutdown(): Promise<void> {
  logger.info("Shutting down gracefully...");
  await disconnectMongo();
  logger.info("Database closed");
  await disconnectRedis();
  logger.info("Redis disconnected");
  logger.info("Graceful shutdown completed");
}

export function initSubscribers(): void {
  initProductSubscribers();
  initOrderSubscribers();
  logger.info("Subscribers initialized");
}
