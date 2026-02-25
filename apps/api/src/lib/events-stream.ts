import { randomUUID } from "node:crypto";
import { env } from "@/config/env.js";
import { Redis } from "ioredis";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  db: 1,
});

type BaseEventMetadata = {
  timestamp: number;
  traceId: string;
};

export interface EventMetadata<TMeta extends Record<string, unknown> = Record<string, unknown>>
  extends BaseEventMetadata {
  meta: TMeta;
}

/** A single item in a batch passed to a handler. */
export interface EventBatchItem<K, TMeta extends Record<string, unknown>> {
  payload: K;
  metadata: EventMetadata<TMeta>;
}

type StreamReadResponse = [string, [string, string[]][]][];

/**
 * Creates an events stream. It uses Redis Streams to implement a pub/sub pattern
 * while maintaining durability, throughput and handling concurrency safety.
 * It can handle horizontal scaling by creating multiple consumers and workers.
 * Handlers are invoked once per batch (grouped by action), not per message.
 * @param prefix - The prefix of the stream. This is used to namespace the stream.
 * @param groupName - The name of the group. This is used to group the consumers and workers.
 * @returns The events stream.
 */
export function createEventsStream<
  TMap extends Record<string, Record<string, unknown>>,
  TMeta extends Record<string, unknown> = Record<string, unknown>,
>(prefix: string, groupName: string) {
  type Handler<K extends keyof TMap> = (
    batch: EventBatchItem<TMap[K], TMeta>[]
  ) => Promise<void> | void;
  const registry = new Map<keyof TMap, Handler<keyof TMap>>();

  const streamKey = `stream:${prefix}`;
  const consumerName = `worker-${randomUUID()}`;

  /**
   * Initializes the group.
   * @returns The initialized group.
   */
  const initGroup = async (): Promise<void> => {
    try {
      await redis.xgroup("CREATE", streamKey, groupName, "$", "MKSTREAM");
    } catch (err: unknown) {
      if (err instanceof Error && !err.message.includes("BUSYGROUP")) throw err;
    }
  };

  /**
   * Listens for new messages in the stream.
   * @param batchSize - The batch size to pull the messages from the stream.
   * @returns The listened messages.
   */
  const listen = async (batchSize = 10): Promise<void> => {
    await initGroup();
    console.log(`🚀 [${prefix}] Listening with concurrency: ${batchSize}`);

    while (true) {
      try {
        // Increase COUNT to pull a batch of messages for better throughput
        const data = (await redis.xreadgroup(
          "GROUP",
          groupName,
          consumerName,
          "COUNT",
          batchSize,
          "BLOCK",
          10,
          "STREAMS",
          streamKey,
          ">"
        )) as StreamReadResponse | null;

        if (!data) continue;

        for (const [, messages] of data) {
          // Parse messages and group by action
          const parsed: Array<{
            messageId: string;
            action: keyof TMap;
            payload: TMap[keyof TMap];
            metadata: EventMetadata<TMeta>;
          }> = [];

          for (const [messageId, fields] of messages) {
            const msgObj: Record<string, string> = {};
            for (let i = 0; i < fields.length; i += 2) {
              const key = fields[i];
              const value = fields[i + 1];
              if (key && value) msgObj[key] = value;
            }

            const action = msgObj["action"] as keyof TMap;
            const handler = registry.get(action);
            if (!handler) continue;

            const payload = JSON.parse(msgObj["payload"] || "{}") as TMap[keyof TMap];
            const metadata = JSON.parse(msgObj["metadata"] || "{}") as EventMetadata<TMeta>;
            parsed.push({ messageId, action, payload, metadata });
          }

          // Group by action so each handler is called once with its batch
          const byAction = new Map<
            keyof TMap,
            Array<{ messageId: string; payload: TMap[keyof TMap]; metadata: EventMetadata<TMeta> }>
          >();
          for (const item of parsed) {
            const list = byAction.get(item.action) ?? [];
            list.push({
              messageId: item.messageId,
              payload: item.payload,
              metadata: item.metadata,
            });
            byAction.set(item.action, list);
          }

          // Call each handler once with its batch; ACK all message IDs on success
          await Promise.all(
            Array.from(byAction.entries()).map(async ([action, items]) => {
              const handler = registry.get(action);
              // if the handler is not registered, we ack the messages
              if (!handler) {
                for (const { messageId } of items) {
                  await redis.xack(streamKey, groupName, messageId);
                }
                return;
              }

              const batch = items.map(({ payload, metadata }) => ({ payload, metadata }));

              try {
                await handler(batch);

                for (const { messageId } of items) {
                  await redis.xack(streamKey, groupName, messageId);
                }
              } catch (handlerError) {
                console.error(`Processing failed for ${String(action)}:`, handlerError);
              }
            })
          );
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`Stream Read Error: ${error.message}`);
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  };

  return {
    /**
     * Registers a handler for an action. The handler is called once per batch with an array of
     * { payload, metadata } for that action.
     * @param action - The action to register the handler for.
     * @param cb - The handler function; receives a batch of events for this action.
     * @returns The registered handler.
     */
    on: <K extends keyof TMap & string>(
      action: K,
      cb: (batch: EventBatchItem<TMap[K], TMeta>[]) => Promise<void> | void
    ): void => {
      registry.set(action, cb as Handler<keyof TMap>);
    },

    /**
     * Publishes a message to the stream.
     * @param action - The action to publish the message for.
     * @param payload - The payload to publish.
     * @param metadata - The metadata to publish.
     * @returns The published message.
     * MAXLEN ~ 10000 ensures the stream doesn't grow infinitely (Durability vs Storage)
     */
    publish: async <K extends keyof TMap & string>(
      action: K,
      payload: TMap[K],
      metadata?: Partial<EventMetadata<TMeta>>
    ): Promise<void> => {
      const meta: EventMetadata<TMeta> = {
        timestamp: metadata?.timestamp ?? Date.now(),
        traceId: metadata?.traceId ?? randomUUID(),
        meta: metadata?.meta ?? ({} as TMeta),
      };

      // MAXLEN ~ 10000 ensures the stream doesn't grow infinitely (Durability vs Storage)
      // We can adjust the MAXLEN based on the expected throughput and durability requirements.
      await redis.xadd(
        streamKey,
        "MAXLEN",
        "~",
        "10000",
        "*",
        "action",
        action,
        "payload",
        JSON.stringify(payload),
        "metadata",
        JSON.stringify(meta)
      );
    },

    listen,
  };
}
