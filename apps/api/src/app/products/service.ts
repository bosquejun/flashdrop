import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import { TTL_ONE_HOUR_MS } from "@/config/constants.js";
import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import { type Product, productSchema } from "@repo/schema";
import { z } from "zod";
import { findProduct, listProducts, productsCollection } from "./repository.js";
import { getProductKey, getProductStockKey, getProductsListKey } from "./utils.js";

const logger = createLogger("products-service");

/**
 * Get a product by SKU, it will check the cache first and if not found, it will fetch from the database and cache the result.
 * cache TTL is 1 hour.
 * @param sku {string} - The SKU of the product to get
 * @returns {Product | null} The product if found, otherwise null
 */
export async function getProduct(sku: string): Promise<Product | null> {
  logger.debug({ sku }, "Getting product");
  const redis = getRedis();
  const key = getProductKey(sku);
  const cachedProduct = await redis.get(key);
  if (cachedProduct) {
    logger.debug({ sku }, "Product found in cache");
    return productSchema.parse(JSON.parse(cachedProduct));
  }

  const product = await findProduct(sku);
  if (!product) {
    logger.debug({ sku }, "Product not found");
    return null;
  }

  await redis.set(key, JSON.stringify(product), "PX", TTL_ONE_HOUR_MS);
  logger.debug({ product }, "Product found");
  return productSchema.parse(product);
}

/**
 * Get all products, it will check the cache first and if not found, it will fetch from the database and cache the result.
 * cache TTL is 1 hour.
 * @returns {Product[]} The products if found, otherwise an empty array
 */
export async function getProducts(): Promise<Product[]> {
  logger.debug("Getting products");
  const redis = getRedis();
  const key = getProductsListKey({});
  const cachedProducts = await redis.get(key);
  if (cachedProducts) {
    logger.debug("Products found in cache");
    return z.array(productSchema).parse(JSON.parse(cachedProducts));
  }

  const products = await listProducts();

  if (products.length === 0) {
    logger.debug("No products found");
    return [];
  }

  await redis.set(key, JSON.stringify(products), "PX", TTL_ONE_HOUR_MS);
  logger.debug({ products }, "Products found");

  return products;
}

export async function getAndVerifyProductOnFlashSale(sku: string) {
  const product = await getProduct(sku);

  if (!product) {
    throw new AppError(400, "Product not found", "PRODUCT_NOT_FOUND");
  }

  if (product.endDate < new Date()) {
    throw new AppError(400, "Flash sale has ended", "FLASH_SALE_ENDED");
  }

  if (product.startDate > new Date()) {
    throw new AppError(400, "Flash sale has not started", "FLASH_SALE_NOT_STARTED");
  }

  return product;
}

/**
 * Decrement the stock of a product by a given quantity.
 * This function is used to reconcile the stock of a product after an order is completed.
 * @param sku {string} - The SKU of the product to decrement the stock of
 * @param quantityToDecrement {number} - The quantity to decrement the stock of
 * @returns {Promise<void>}
 */
/**
 * Get current stock for a product. Uses Redis live count when available (flash sale),
 * otherwise returns product.availableStock from DB.
 * @param sku {string} - The SKU of the product
 * @returns {{ availableStock: number; totalStock: number } | null} Stock data or null if product not found
 */
export async function getProductStock(
  sku: string
): Promise<{ availableStock: number; totalStock: number } | null> {
  const product = await getProduct(sku);
  if (!product) return null;

  const redis = getRedis();
  const stockKey = getProductStockKey(sku);
  const redisStock = await redis.get(stockKey);

  const availableStock =
    redisStock !== null ? Number.parseInt(redisStock, 10) : product.availableStock;
  const totalStock = product.totalStock;

  return {
    availableStock: Number.isNaN(availableStock) ? product.availableStock : availableStock,
    totalStock,
  };
}

export async function decrementProductStock(sku: string, quantityToDecrement: number) {
  const product = await getProduct(sku);
  if (!product) {
    throw new AppError(400, "Product not found", "PRODUCT_NOT_FOUND");
  }
  product.availableStock -= quantityToDecrement;
  await (await productsCollection()).updateOne(
    { sku },
    { $inc: { availableStock: -quantityToDecrement } }
  );
}
