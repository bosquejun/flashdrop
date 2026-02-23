import { randomUUID } from "node:crypto";
import path from "node:path";
import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import { TTL_ONE_HOUR_MS } from "@/config/constants.js";
import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import { type CreateOrderRequest, type Order, type Product, orderSchema } from "@repo/schema";
import { loadLuaScript } from "@repo/utils";
import objectHash from "object-hash";
import { verifyProductOrderRequest } from "../products/service.js";
import { getProductBuyersKey, getProductStockKey } from "../products/utils.js";
import { findOrder, insertOrder, listOrders } from "./repository.js";
import { orderEventsHub } from "./subscribers.js";

const logger = createLogger("orders-service");

const createOrderScript = loadLuaScript(path.join(import.meta.dirname, "scripts/create-order.lua"));
const rollbackOrderScript = loadLuaScript(
  path.join(import.meta.dirname, "scripts/rollback-order.lua")
);

export function getOrderKey(userId: string, productSKU: string): string {
  return `order:${objectHash({ userId, productSKU })}`;
}

export function getOrdersListKey<T extends object>(query: T): string {
  return `orders:list:${objectHash(query)}`;
}

export async function getOrder(userId: string, productSKU: string): Promise<Order | null> {
  const redis = getRedis();
  const key = getOrderKey(userId, productSKU);
  const cachedOrder = await redis.get(key);
  if (cachedOrder) {
    logger.debug({ userId, productSKU }, "Order found in cache");
    return orderSchema.parse(JSON.parse(cachedOrder));
  }
  const order = await findOrder(userId, productSKU);
  if (!order) {
    logger.debug({ userId, productSKU }, "Order not found");
    return null;
  }
  await redis.set(key, JSON.stringify(order), "PX", TTL_ONE_HOUR_MS);
  logger.debug({ order }, "Order found");
  return orderSchema.parse(order);
}

export async function getOrders(userId: string): Promise<Order[]> {
  const redis = getRedis();
  const key = getOrdersListKey({ userId });
  const cachedOrders = await redis.get(key);
  if (cachedOrders) {
    logger.debug({ userId }, "Orders found in cache");
    return orderSchema.array().safeParse(JSON.parse(cachedOrders)).data ?? [];
  }
  const orders = await listOrders(userId);
  await redis.set(key, JSON.stringify(orders), "PX", TTL_ONE_HOUR_MS);
  logger.debug({ userId, orders }, "Orders found");
  return orderSchema.array().parse(orders);
}

interface CompleteOrderParams {
  price: number;
  quantity: number;
  productSKU: string;
  currency: string;
}

async function completeOrder(userId: string, params: CompleteOrderParams) {
  const newOrder = await insertOrder({
    userId,
    productSKU: params.productSKU,
    purchasedAt: new Date(),
    price: params.price,
    currency: params.currency,
    status: "completed",
    paymentMethod: "credit_card",
    paymentReference: randomUUID(),
  });

  if (newOrder) {
    void orderEventsHub
      .publish("completed", newOrder)
      .catch((err: Error) => logger.error({ err }, "orderEventsHub.publish failed"));
  }

  return newOrder;
}

// If product has a flash sale, return the quantity from the flash sale limit
// otherwise return the quantity from the request,
// if no quantity is provided, default to 1
function getCorrectOrderQuantity(product: Product, request: CreateOrderRequest) {
  return product.flashSale?.limit?.perUser || (request.quantity ?? 1);
}

function getCorrectOrderPrice(product: Product) {
  return product.flashSale?.price ?? product.price;
}

function verifyCreateOrderResult(result: number) {
  if (result === -2) {
    throw new AppError(409, "This item is currently out of stock.", "OUT_OF_STOCK");
  }
  if (result === -1) {
    throw new AppError(
      403,
      "You have reached the maximum purchase limit for this item.",
      "LIMIT_EXCEEDED"
    );
  }

  if (result === 0) {
    throw new AppError(409, "You have already purchased this item.", "ALREADY_PURCHASED");
  }
}

export async function createOrder(userId: string, request: CreateOrderRequest) {
  try {
    const product = await verifyProductOrderRequest(request);
    const redis = getRedis();
    const stockKey = getProductStockKey(product.sku);
    const buyersKey = getProductBuyersKey(product.sku);

    const numKeys = 2;
    const buyQty = getCorrectOrderQuantity(product, request);
    const perUserLimit = product.flashSale?.limit?.perUser ?? 1;
    const result = (await redis.eval(
      createOrderScript,
      numKeys,
      stockKey,
      buyersKey,
      userId,
      String(buyQty),
      String(perUserLimit)
    )) as number;

    verifyCreateOrderResult(result);

    // At this point, the user made the order has secured the product and the stock has been decremented.

    /**
     * This approach is the simplest one, wherein order completion is done in the same transaction as order creation.
     * However, this may introduce a back pressure in the database and slow down the overall system.
     * Worse, if the order completion fails, it may introduce a data inconsistency in the system.
     * To mitigate this, we created a rollback script via LUA to revert back the stock and the buyers count.
     *
     * From the business perspective. This approach may not be fair for the users who attempt to secure the flash sale.
     *
     * We could have implemented a more sophisticated approach, wherein order completion and reconciliation is done asynchronously (separate transaction).
     * However, this may introduce another complexity in the system, and new trade-offs and may not be worth the effort for the assessment.
     */
    try {
      const order = await completeOrder(userId, {
        price: getCorrectOrderPrice(product),
        quantity: getCorrectOrderQuantity(product, request),
        productSKU: product.sku,
        currency: product.currency,
      });

      return order;
    } catch (error) {
      const numKeys = 2;
      const stockAfterRollback = await redis.eval(
        rollbackOrderScript,
        numKeys,
        stockKey,
        buyersKey,
        userId,
        String(buyQty)
      );
      logger.warn(
        { error, stockAfterRollback, productSKU: product.sku },
        "Failed to complete order, rolling back"
      );

      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.statusCode, error.message, error.code, error.issues);
    }
    throw new AppError(500, "Failed to create order", "INTERNAL_SERVER_ERROR");
  }
}
