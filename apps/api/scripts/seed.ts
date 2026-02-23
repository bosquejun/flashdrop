import "dotenv/config";
import { seedOrders } from "../src/app/orders/seed";
import { seedProducts } from "../src/app/products/seed";
import loaders, { gracefulShutdown } from "../src/lib/loader";
import getRedis from "../src/lib/redis";

export default async function seed() {
  await loaders();
  const redis = getRedis();

  // Flush Redis
  await redis.flushall();
  console.info("Redis flushed");

  await seedProducts();
  await seedOrders();

  await gracefulShutdown();

  process.exit(0);
}

seed().catch(console.error);
