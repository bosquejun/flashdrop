import type { Product, SaleStatusResponse } from "@repo/schema";

/** Flash sale display info derived from API Product. Dates as Date for UI. */
export type ProductFlashSaleInfo = Pick<
  Product,
  "name" | "description" | "imageUrl" | "sku" | "price" | "currency" | "availableStock" | "totalStock"
> & {
  status: SaleStatusResponse["status"];
  startDate: Date;
  endDate: Date;
  limitPerUser: number;
};

/**
 * Derive flash sale status and display info from API Product.
 * Single source of truth for the product detail page.
 */
export function productToFlashSaleInfo(product: Product): ProductFlashSaleInfo {
  const now = Date.now();
  const startDate = product.startDate instanceof Date ? product.startDate : new Date(product.startDate);
  const endDate = product.endDate instanceof Date ? product.endDate : new Date(product.endDate);
  const start = startDate.getTime();
  const end = endDate.getTime();

  let status: SaleStatusResponse["status"] = "active";
  if (product.availableStock === 0 || end < now) {
    status = "ended";
  } else if (start > now) {
    status = "upcoming";
  }

  return {
    ...product,
    status,
    startDate,
    endDate,
    limitPerUser: product.limit?.perUser ?? 1,
  };
}
