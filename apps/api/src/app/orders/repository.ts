import { randomUUID } from "node:crypto";
import { getCollection } from "@/lib/db/client.js";
import { createLogger } from "@repo/logger";
import type { Order } from "@repo/schema";
import type { Collection } from "mongodb";

const logger = createLogger("orders-repository");

const COLLECTION_NAME = "orders";

export async function ordersCollection(): Promise<Collection<Order>> {
  return await getCollection<Order>(COLLECTION_NAME);
}

export async function ensureFlashSaleIndexes(): Promise<void> {
  const coll = await ordersCollection();
  await coll.createIndex({ productSKU: 1, userId: 1 }, { unique: true });
  logger.info("Ensured indexes on orders collection");
}

export async function getOrderByID(id: string): Promise<Order | null> {
  const coll = await ordersCollection();
  return await coll.findOne({ _id: id });
}

export async function findOrder(userId: string, productSKU: string): Promise<Order | null> {
  const coll = await ordersCollection();
  return await coll.findOne({ userId, productSKU });
}

export async function listOrders(userId: string): Promise<Order[]> {
  const coll = await ordersCollection();
  return await coll.find({ userId }).toArray();
}

export async function insertOrder(order: Omit<Order, "_id" | "createdAt">): Promise<Order | null> {
  const coll = await ordersCollection();
  const result = await coll.insertOne({
    ...order,
    _id: randomUUID(),
    createdAt: new Date(),
  });

  return getOrderByID(result.insertedId.toString());
}
