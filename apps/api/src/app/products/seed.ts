import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import type { Product } from "@repo/schema";
import { ObjectId } from "mongodb";
import { productsCollection } from "./repository.js";
import { getProductBuyersKey, getProductStockKey, getProductTotalKey } from "./utils.js";

const logger = createLogger("products-seed");

type ProductSeed = Omit<Product, "_id" | "createdAt">;

const dateNow = new Date();
const startDate = new Date(dateNow.setMinutes(dateNow.getMinutes() + 1));
const endDate = new Date(dateNow.setDate(dateNow.getDate() + 1));

export const PRODUCTS: ProductSeed[] = [
  {
    sku: "IPHONE-17-PRO-MAX-256-BLK",
    name: "iPhone 17 Pro Max",
    description:
      "The all-new iPhone 17 Pro Max with A19 Pro chip, 48MP fusion camera, and titanium design. 256GB — Black Titanium.",
    price: 99999,
    availableStock: 10000,
    totalStock: 10000,
    currency: "USD",
    imageUrl:
      "https://www.apple.com/newsroom/images/2025/09/apple-unveils-iphone-17-pro-and-iphone-17-pro-max/article/Apple-iPhone-17-Pro-cosmic-orange-250909_inline.jpg.large.jpg",
    startDate: startDate,
    endDate: endDate,
    limit: {
      perUser: 1,
    },
  },
];

export async function seedProducts() {
  const products = await productsCollection();

  logger.debug("Flushing products...");
  await products.deleteMany({});
  logger.debug("Flushed products");

  logger.debug("Seeding products...");
  const result = await products.insertMany(
    PRODUCTS.map((p) => ({
      ...p,
      _id: new ObjectId().toString(),
      createdAt: new Date(),
    }))
  );

  // Prepare Redis for products (expire 1 day after flash sale ends)
  const redis = getRedis();
  const oneDayMs = 24 * 60 * 60 * 1000;
  for (const product of PRODUCTS) {
    const stockKey = getProductStockKey(product.sku);
    const totalKey = getProductTotalKey(product.sku);
    const buyersKey = getProductBuyersKey(product.sku);
    await redis.set(stockKey, product.availableStock);
    await redis.set(totalKey, product.totalStock);
    await redis.hset(buyersKey, product.sku, 0);
    const expireAtMs = product.endDate.getTime() + oneDayMs;
    await redis.pexpireat(stockKey, expireAtMs);
    await redis.pexpireat(totalKey, expireAtMs);
    await redis.pexpireat(buyersKey, expireAtMs);
  }

  logger.debug({ insertedCount: result.insertedCount }, "Products seeded");
  logger.debug("Redis prepared for products");
}
