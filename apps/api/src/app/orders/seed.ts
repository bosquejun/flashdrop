import { createLogger } from "@repo/logger";
import { ordersCollection } from "./repository.js";

const logger = createLogger("orders-seed");
export async function seedOrders() {
  const orders = await ordersCollection();

  logger.debug("Flushing orders...");
  await orders.deleteMany({});
  logger.debug("Flushed orders");
}
