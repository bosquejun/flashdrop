import { createEventsStream } from "@/lib/events-stream.js";
import { createLogger } from "@repo/logger";
import type { Order } from "@repo/schema";
import { decrementProductStock } from "../products/service.js";

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
  orderEventsStream.on("completed", async (order) => {
    logger.info({ orderId: order._id }, "Order completed. Updating product stock");

    // update the product stock on database
    await decrementProductStock(order.productSKU, order.quantity);

    logger.debug(
      { orderId: order._id, productSKU: order.productSKU, quantity: order.quantity },
      "Product stock updated"
    );
  });

  // listen to the order-completion stream
  // 100 is the batch size to pull the messages from the stream
  orderEventsStream
    .listen(100)
    .catch((err: Error) => logger.error({ err }, "orderEventsStream.listen failed"));

  logger.info("Order-completion subscribers initialized");
}
