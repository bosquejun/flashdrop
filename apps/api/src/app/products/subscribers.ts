import { createEventsHub } from "@/lib/events-hub.js";
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

const productHub = createEventsHub<ProductEvents, { userId?: string }>("product");

export default function initProductSubscribers() {
  // subscribe to the product created event
  productHub.on("created", async (product) => {
    const redis = getRedis();
    logger.info(
      { id: product._id, sku: product.sku },
      "Product created. Invalidating product list cache"
    );

    await redis.del(getProductsListKey({}));

    logger.debug("Product list cache invalidated");
  });

  // subscribe to the product updated event
  productHub.on("updated", async (product) => {
    const redis = getRedis();
    await redis.del(getProductsListKey({}));

    if (product.sku) {
      await redis.del(getProductKey(product.sku));
    }

    logger.debug("Product list cache invalidated");
  });

  // subscribe to the product deleted event
  productHub.on("deleted", async (product) => {
    const redis = getRedis();
    await redis.del(getProductsListKey({}));

    if (product.sku) {
      await redis.del(getProductKey(product.sku));
    }
  });

  logger.info("Product subscribers initialized");
}
