import { randomUUID } from "node:crypto";
import path from "node:path";
import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import { TTL_ONE_HOUR_MS } from "@/config/constants.js";
import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import { type CreateOrderRequest, type Order, orderSchema } from "@repo/schema";
import { loadLuaScript } from "@repo/utils";
import objectHash from "object-hash";
import { getAndVerifyProductOnFlashSale } from "../products/service.js";
import { getProductBuyersKey, getProductStockKey } from "../products/utils.js";
import { findOrder, insertOrder, listOrders } from "./repository.js";
import { orderEventsStream } from "./subscribers.js";

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

/**
 * Get an order for a user and product, it will check the cache first and if not found, it will fetch from the database and cache the result.
 * cache TTL is 1 hour.
 * @param userId {string} - The ID of the user to get the order for.
 * @param productSKU {string} - The SKU of the product to get the order for.
 * @returns {Promise<Order | null>} The order if found, otherwise null
 */
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

/**
 * Get all orders for a user, it will check the cache first and if not found, it will fetch from the database and cache the result.
 * cache TTL is 1 hour.
 * @param userId {string} - The ID of the user to get the orders for.
 * @returns {Promise<Order[]>} The orders if found, otherwise an empty array
 */
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

/**
 * Complete an order and publish the event to the order-completion stream.
 * @param userId {string} - The ID of the user who placed the order.
 * @param params {CompleteOrderParams} - The parameters for the order.
 * @returns {Promise<Order>} - The completed order.
 */
async function completeOrder(userId: string, params: CompleteOrderParams) {
  const newOrder = await insertOrder({
    userId,
    productSKU: params.productSKU,
    purchasedAt: new Date(),
    price: params.price,
    quantity: params.quantity,
    totalPrice: params.price * params.quantity,
    currency: params.currency,
    status: "completed",
    paymentMethod: "credit_card",
    paymentReference: randomUUID(),
  });

  if (newOrder) {
    // publish the event to the order-completion stream
    void orderEventsStream
      .publish("completed", newOrder)
      .catch((err: Error) => logger.error({ err }, "orderEventsHub.publish failed"));
  }

  return newOrder;
}

/**
 * Verify the result of the create order LUA script.
 * @param result {number} - The result of the create order LUA script.
 * @returns {void}
 */
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
}

/**
 * Create an atomic order transaction. It uses LUA scripts to ensure atomicity and consistency in a horizontal scale environment.
 * 1. Verify if the product is within the flash sale period
 * 2. Check if user's order quantity is within the product's per user limit
 * 3. Apply atomic update to the product stock and buyers count using LUA script
 * 4. Verify if the order was successful
 * 5. Complete the order and publish the event to the order-completion stream
 * 6. If the order completion fails, rollback the stock and buyers count using LUA script
 * @param userId {string} - The ID of the user who placed the order.
 * @param request {CreateOrderRequest} - The request for the order.
 * @returns {Promise<Order>} - The created order.
 */
export async function createOrder(userId: string, request: CreateOrderRequest) {
  try {
    const redis = getRedis();

    // STEP 1: get and verify if product is within the flash sale period
    const product = await getAndVerifyProductOnFlashSale(request.productSKU);

    // STEP 2: check if user's order quantity is within the product's per user limit
    // default to 1
    if (request.quantity && request.quantity > (product.limit?.perUser ?? 1)) {
      throw new AppError(
        400,
        "You have reached the maximum purchase limit for this item.",
        "LIMIT_EXCEEDED"
      );
    }

    const stockKey = getProductStockKey(product.sku);
    const buyersKey = getProductBuyersKey(product.sku);

    const numKeys = 2;
    const buyQty = request.quantity ?? 1;
    const perUserLimit = product?.limit?.perUser ?? 1;

    // STEP 3: apply atomic update to the product stock and buyers count using LUA script
    const result = (await redis.eval(
      createOrderScript,
      numKeys,
      stockKey,
      buyersKey,
      userId,
      String(buyQty),
      String(perUserLimit)
    )) as number;

    // STEP 4: verify if the order was successful
    verifyCreateOrderResult(result);

    // At this point, the user made the order has secured the product and the stock has been decremented.

    /**
     * The current implementation processes order completion synchronously within the same transaction as order creation.
     * While this simplifies the workflow and ensures immediate consistency, it can increase database load and potentially slow down high-traffic events like flash sales.
     * Additionally, if order completion fails after the stock has been decremented, it can lead to inconsistencies. To address this,
     * we use a Lua rollback script to atomically restore both the product stock and user purchase count in Redis.
     *
     * This synchronous design may create an unfair experience, as users spend more time waiting for transactional completion and may miss out due to processing latency.
     *
     * In a more advanced system, order creation and completion could be decoupled: the stock reservation would occur first,
     * then order processing would be completed asynchronously (e.g., via a queue or event stream), followed by reconciliation.
     * Due to the nature of MongoDB wifh High throughput, I chose to keep the order completion synchronous for the sake of simplicity and reliability.
     */
    // STEP 5: complete the order and publish the event to the order-completion stream
    try {
      const order = await completeOrder(userId, {
        price: product.price,
        quantity: buyQty,
        productSKU: product.sku,
        currency: product.currency,
      });
      return order;
    } catch (error) {
      // STEP 6: if the order completion fails, rollback the stock and buyers count using LUA script

      redis
        .eval(rollbackOrderScript, numKeys, stockKey, buyersKey, userId, String(buyQty))
        .then((stockAfterRollback) => {
          logger.warn(
            { productSKU: product.sku, stockAfterRollback },
            "Failed to complete order, rolling back"
          );
        })
        .catch((err: Error) => {
          // If rollback fails, we can apply retry mechanism but logging the error for now
          logger.error({ err }, "rollbackOrderScript failed to rollback stock and buyers count");
        });

      throw error;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw new AppError(error.statusCode, error.message, error.code, error.issues);
    }
    throw new AppError(500, "Failed to create order", "INTERNAL_SERVER_ERROR");
  }
}
