import { env } from "@/config/env.js";
import { instrumentRedis } from "@/lib/metrics/index.js";
import { createLogger } from "@repo/logger";
import { Redis } from "ioredis";

const logger = createLogger("redis");

let redis: Redis | null = null;

/**
 * Connects to the Redis server.
 * If already connected, returns the existing client.
 * @returns The Redis client.
 */
export async function connectRedis(): Promise<Redis> {
  if (redis) return redis;

  const url = env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required");
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    db: 0,
  });

  instrumentRedis(client);

  client.on("error", (err: Error) => logger.error({ err }, "Redis connection error"));

  try {
    await client.connect();
  } catch (err) {
    client.removeAllListeners();
    client.disconnect();
    throw err;
  }

  redis = client;
  logger.info("Connected to Redis");
  return redis;
}

/**
 * Gets the Redis client.
 * @returns The Redis client.
 */
export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis not connected. Call connectRedis() first.");
  }
  return redis;
}

/**
 * Disconnects from the Redis server.
 * @returns The Redis client.
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export default getRedis;
