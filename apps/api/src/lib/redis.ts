import { env } from "@/config/env.js";
import { createLogger } from "@repo/logger";
import { Redis } from "ioredis";

const logger = createLogger("redis");

let redis: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  if (redis) return redis;

  const url = env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is required");
  }

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    db: 0,
  });

  redis.on("error", (err: Error) => logger.error({ err }, "Redis connection error"));

  await redis.connect();
  logger.info("Connected to Redis");
  return redis;
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis not connected. Call connectRedis() first.");
  }
  return redis;
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

/**
 * Creates a event hooks handler using a simple callback registry.
 */
export function createEventHooks<
  TData,
  THooks extends Record<string, string> = Record<string, string>,
>(hooks: THooks) {
  const redis = getRedis();
  // Simple object to store our callbacks: { "product.created": [callback1, callback2] }
  const registry: Record<string, Array<(data: TData) => void>> = {};

  // 1. Determine the prefix/pattern from the hook values
  const firstChannel = Object.values(hooks)[0];
  if (!firstChannel) {
    throw new Error("No hooks provided");
  }
  const prefix = firstChannel.split(".")[0];
  const pattern = `${prefix}.*`;

  // 2. Subscribe to Redis pattern
  redis.psubscribe(pattern);

  // 3. Central Redis listener that routes to our registry
  redis.on("pmessage", (receivedPattern, channel, message) => {
    if (receivedPattern === pattern && registry[channel]) {
      let parsed: TData | string;
      try {
        parsed = JSON.parse(message) as TData;
      } catch {
        parsed = message as TData;
      }

      // Execute all registered callbacks for this specific channel
      for (const callback of registry[channel]) {
        callback(parsed);
      }
    }
  });

  return {
    /**
     * Listen for a specific hook. High inference support.
     */
    on: <K extends keyof THooks>(event: THooks[K], callback: (data: TData) => void) => {
      if (!registry[event]) registry[event] = [];
      registry[event].push(callback);
    },
  };
}

export default getRedis;
