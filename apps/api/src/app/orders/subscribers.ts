import { createEventsStream } from "@/lib/events-stream.js";
import { createLogger } from "@repo/logger";
import type { Order } from "@repo/schema";
import { reconcileProductStock } from "../products/service.js";

const logger = createLogger("products-subscribers");

type OrderEvents = {
  created: Order;
  updated: Partial<Order>;
  deleted: Pick<Order, "_id" | "productSKU">;
  completed: Order;
};

export const orderEventsStream = createEventsStream<OrderEvents>("order", "order-completion");

/**
 * Initialize the order-completion subscribers.
 * It subscribes to the order-completion stream and updates the product stock when an order is completed.
 * @returns {Promise<void>}
 */
export default async function initOrderSubscribers() {
  // subscribe to the order completed event
  orderEventsStream.on("completed", async (batch) => {
    if (batch.length === 0) return;
    logger.info(
      { count: batch.length, orderIds: batch.map(({ payload }) => payload._id) },
      "Orders completed. Reconciling products stocks"
    );
    // aggregate the quantity per product to reconcile
    const aggregatedProduct = batch.reduce(
      (acc, { payload }) => {
        acc[payload.productSKU] = (acc[payload.productSKU] ?? 0) + (payload.quantity ?? 1);
        return acc;
      },
      {} as Record<string, number>
    );

    // reconcile the stock for each product
    for (const [sku, quantity] of Object.entries(aggregatedProduct)) {
      await reconcileProductStock(sku, -quantity);
    }

    logger.debug("Product stock reconciled for batch");
  });

  // listen to the order-completion stream
  // 100 is the batch size to pull the messages from the stream
  orderEventsStream
    .listen(100)
    .catch((err: Error) => logger.error({ err }, "orderEventsStream.listen failed"));

  logger.info("Order-completion subscribers initialized");
}
