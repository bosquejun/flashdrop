import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import { TTL_ONE_HOUR_MS } from "@/config/constants.js";
import getRedis from "@/lib/redis.js";
import { createLogger } from "@repo/logger";
import { type CreateOrderRequest, type Product, productSchema } from "@repo/schema";
import { z } from "zod";
import { findProduct, listProducts } from "./repository.js";
import { getProductKey, getProductsListKey } from "./utils.js";

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

function verifyNormalOrderRequest(product: Product, request: CreateOrderRequest) {
  if (request.quantity && request.quantity <= 0) {
    throw new AppError(400, "Quantity is required", "QUANTITY_REQUIRED");
  }

  if (request.quantity && request.quantity > product.availableStock) {
    throw new AppError(400, "This item is currently out of stock.", "OUT_OF_STOCK");
  }
}

function verifyFlashSaleOrderRequest(product: Product) {
  const { flashSale } = product;

  const { data, success, error } = productSchema.shape.flashSale.safeParse(flashSale);

  if (!success || !data) {
    // This should never happen and must be validated during flash sale creation, but if it does, we need to log the error and throw an error
    throw new AppError(500, "Invalid flash sale data", "INVALID_FLASH_SALE_DATA", error?.issues);
  }

  if (data.endDate < new Date()) {
    throw new AppError(400, "Flash sale has ended", "FLASH_SALE_ENDED");
  }

  if (data.startDate > new Date()) {
    throw new AppError(400, "Flash sale has not started", "FLASH_SALE_NOT_STARTED");
  }

  if (data.stock <= 0 || data.stock < data.limit.perUser) {
    throw new AppError(409, "This item is currently out of stock.", "OUT_OF_STOCK");
  }
}

export async function verifyProductOrderRequest(request: CreateOrderRequest) {
  const product = await getProduct(request.productSKU);
  if (!product) {
    throw new AppError(400, "Product not found", "PRODUCT_NOT_FOUND");
  }

  // If product has a flash sale, verify the flash sale request
  if (product?.flashSale) {
    verifyFlashSaleOrderRequest(product);
  } else {
    // If product does not have a flash sale, verify the normal order request
    verifyNormalOrderRequest(product, request);
  }

  return product;
}
