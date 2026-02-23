import { getCollection } from "@/lib/db/client.js";
import { createLogger } from "@repo/logger";
import type { Product } from "@repo/schema";
import type { Collection } from "mongodb";

const logger = createLogger("products-repository");

const COLLECTION_NAME = "products";

/**
 * Get the products collection, it will be used to perform CRUD operations on the products collection.
 * @returns {Collection<Product>} The products collection
 */
export async function productsCollection(): Promise<Collection<Product>> {
  return await getCollection<Product>(COLLECTION_NAME);
}

/**
 * Ensure the indexes on the products collection.
 * @returns {Promise<void>}
 */
export async function ensureProductIndexes(): Promise<void> {
  const coll = await productsCollection();
  await coll.createIndex({ sku: 1 }, { unique: true });
  logger.info("Ensured indexes on products collection");
}

/**
 * Find a product by SKU, it will be used to get a product by SKU.
 * @param sku {string} - The SKU of the product to find
 * @returns {Promise<Product | null>} The product if found, otherwise null
 */
export async function findProduct(sku: string): Promise<Product | null> {
  const coll = await productsCollection();
  return coll.findOne({ sku });
}

/**
 * List all products, it will be used to get all products.
 * @returns {Promise<Product[]>} The list of products
 */
export async function listProducts(): Promise<Product[]> {
  const coll = await productsCollection();
  return coll.find({}).toArray();
}

/**
 * Upsert a product, it will be used to upsert a product.
 * @param product {Omit<Product, "_id" | "createdAt">} - The product to upsert
 * @returns {Promise<void>}
 */
export async function upsertProduct(product: Omit<Product, "_id" | "createdAt">): Promise<void> {
  const coll = await productsCollection();
  await coll.updateOne(
    { sku: product.sku },
    {
      $set: {
        sku: product.sku,
        name: product.name,
        description: product.description ?? null,
        price: product.price,
        currency: product.currency,
        imageUrl: product.imageUrl ?? null,
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
  logger.info({ sku: product.sku, name: product.name }, "Product upserted");
}

/**
 * Initialize the products repository, it will be used to ensure the indexes on the products collection.
 * @returns {Promise<void>}
 */
export async function initProductsRepository() {
  logger.debug("Ensuring product indexes...");
  await ensureProductIndexes();
}
