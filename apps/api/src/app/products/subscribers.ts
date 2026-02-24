import { createEventsStream } from "@/lib/events-stream.js";
import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import type { Product } from "@repo/schema";
import { getProductKey, getProductsListKey } from "./utils.js";

const logger = createLogger("products-subscribers");

type ProductEvents = {
  created: Product;
  updated: Partial<Product>;
  deleted: Pick<Product, "_id" | "sku">;
};

const productEventsStream = createEventsStream<ProductEvents, { userId?: string }>(
  "product",
  "product-events"
);

/**
 * Initialize the product subscribers.
 * It subscribes to the product events and invalidates the product list cache when a product is created, updated or deleted.
 * @returns {Promise<void>}
 */
export default async function initProductSubscribers() {
  // subscribe to the product created event
  productEventsStream.on("created", async (product) => {
    const redis = getRedis();
    logger.info(
      { id: product._id, sku: product.sku },
      "Product created. Invalidating product list cache"
    );

    await redis.del(getProductsListKey({}));

    logger.debug("Product list cache invalidated");
  });

  // subscribe to the product updated event
  productEventsStream.on("updated", async (product) => {
    const redis = getRedis();
    await redis.del(getProductsListKey({}));

    if (product.sku) {
      await redis.del(getProductKey(product.sku));
    }

    logger.debug("Product list cache invalidated");
  });

  // subscribe to the product deleted event
  productEventsStream.on("deleted", async (product) => {
    const redis = getRedis();
    await redis.del(getProductsListKey({}));

    if (product.sku) {
      await redis.del(getProductKey(product.sku));
    }
  });

  productEventsStream
    .listen()
    .catch((err: Error) => logger.error({ err }, "productEventsStream.listen failed"));

  logger.info("Product subscribers initialized");
}
