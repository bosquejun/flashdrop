import { createEventsHub } from "@/lib/events-hub.js";
import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import type { Order } from "@repo/schema";
import { getOrdersListKey } from "./service.js";

const logger = createLogger("products-subscribers");

type OrderEvents = {
  created: Order;
  updated: Partial<Order>;
  deleted: Pick<Order, "_id" | "productSKU">;
  completed: Order;
};

export const orderEventsHub = createEventsHub<OrderEvents>("order");

export default function initOrderSubscribers() {
  orderEventsHub.on("completed", async (order) => {
    const redis = getRedis();
    logger.info({ userId: order.userId }, "Order completed. Invalidating relevant caches");

    // invalidate orders list cache
    await redis.del(getOrdersListKey({ userId: order.userId }));

    logger.debug("Relevant caches invalidated");
  });

  logger.info("Order subscribers initialized");
}
