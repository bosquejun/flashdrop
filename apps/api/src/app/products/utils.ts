import objectHash from "object-hash";

/**
 * Get the cached product key, it will be used to identify the cached product by the SKU.
 * @param sku {string} - The SKU of the product to get
 * @returns {string} The cached product key
 */
export function getProductKey(sku: string): string {
  return `product:${sku}`;
}

/**
 * Get the cached products list key, it will be used to identify the cached products list by the query.
 * @param query {object} - The query to get the list of products
 * @returns {string} The cached products list key
 */
export function getProductsListKey<T extends object>(query: T): string {
  return `products:list:${objectHash(query)}`;
}

/**
 * Get the cached product stock key, it will be used to identify the cached product stock by the SKU.
 * @param sku {string} - The SKU of the product to get
 * @returns {string} The cached product stock key
 */
export function getProductStockKey(sku: string) {
  return `product:{${sku}}:stock`;
}

/**
 * Get the cached product buyers key, it will be used to identify the cached product buyers by the SKU.
 * @param sku {string} - The SKU of the product to get
 * @returns {string} The cached product buyers key
 */
export function getProductBuyersKey(sku: string) {
  return `product:{${sku}}:buyers`;
}
