import { env } from "@/config/env.js";
import { Redis } from "ioredis";

/**
 * For simplicity, we use a single Redis instance for both pubsub and caching.
 * This is a simplified approach and may not be suitable for production environments.
 */
const pub = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  db: 1,
});

const sub = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  db: 1,
});

type BaseEventMetadata = {
  timestamp: number;
  traceId?: string;
};

export interface EventMetadata<TMeta extends Record<string, unknown> = Record<string, unknown>>
  extends BaseEventMetadata {
  meta: TMeta;
}

// 1. Base structure that every event must have
interface EventEnvelope<TPayload, TMeta extends Record<string, unknown>> {
  payload: TPayload;
  metadata: EventMetadata<TMeta>;
}

/**
 * @template TMap - The map of event names to payload shapes
 * @template TMeta - The global shape for custom metadata across this domain
 */
export function createEventsHub<
  TMap,
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(prefix: string) {
  const registry = new Map<
    string,
    Array<(payload: TMap[keyof TMap], metadata: EventMetadata<TMeta>) => void>
  >();

  const pattern = `${prefix}.*`;
  sub.psubscribe(pattern);

  sub.on("pmessage", (recvPattern, channel, message) => {
    if (recvPattern !== pattern) return;
    const handlers = registry.get(channel);
    if (handlers) {
      // The receiving side now knows the shape of TMeta
      const { payload, metadata }: EventEnvelope<TMap[keyof TMap], TMeta> = JSON.parse(message);
      // Flatten the metadata: merge timestamp, traceId, and ...meta
      const flatMeta: EventMetadata<TMeta> = {
        timestamp: metadata.timestamp,
        ...(metadata.traceId ? { traceId: metadata.traceId } : {}),
        meta: metadata.meta,
      };

      for (const fn of handlers) {
        fn(payload, flatMeta);
      }
    }
  });

  return {
    on: <K extends keyof TMap & string>(
      action: K,
      cb: (payload: TMap[K], meta: EventMetadata<TMeta>) => void
    ) => {
      const channel = `${prefix}.${action}`;
      const existing = registry.get(channel) || [];
      registry.set(channel, [
        ...existing,
        (payload, meta) => cb(payload as TMap[typeof action], meta as EventMetadata<TMeta>),
      ]);
    },

    publish: async <K extends keyof TMap & string>(
      action: K,
      payload: TMap[K],
      metadata?: Partial<EventMetadata<TMeta>> // Now mandatory and typed!
    ) => {
      const channel = `${prefix}.${action}`;
      const envelope: EventEnvelope<TMap[K], TMeta> = {
        payload,
        metadata: {
          timestamp: metadata?.timestamp ?? Date.now(),
          traceId: metadata?.traceId,
          meta: metadata?.meta ?? ({} as TMeta),
        },
      };
      await pub.publish(channel, JSON.stringify(envelope));
    },
  };
}
