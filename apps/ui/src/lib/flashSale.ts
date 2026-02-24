import type { Product } from "@repo/schema";

export type FlashSaleStatus = "upcoming" | "active" | "ended";

export interface ProductFlashSaleInfo {
  status: FlashSaleStatus;
  startDate: Date;
  endDate: Date;
  availableStock: number;
  totalStock: number;
  limitPerUser: number;
  price: number;
  currency: string;
  /** Product snapshot for display */
  name: string;
  description: string | null;
  imageUrl: string | null;
  sku: string;
}

/**
 * Derive flash sale status and display info from API Product.
 * Single source of truth for "flash sale info" on the product detail page.
 */
export function productToFlashSaleInfo(product: Product): ProductFlashSaleInfo {
  const now = Date.now();
  const startDate = product.startDate instanceof Date ? product.startDate : new Date(product.startDate);
  const endDate = product.endDate instanceof Date ? product.endDate : new Date(product.endDate);
  const start = startDate.getTime();
  const end = endDate.getTime();

  let status: FlashSaleStatus = "active";
  if (product.availableStock === 0 || end < now) {
    status = "ended";
  } else if (start > now) {
    status = "upcoming";
  }

  return {
    status,
    startDate,
    endDate,
    availableStock: product.availableStock,
    totalStock: product.totalStock,
    limitPerUser: product.limit?.perUser ?? 1,
    price: product.price,
    currency: product.currency,
    name: product.name,
    description: product.description ?? null,
    imageUrl: product.imageUrl ?? null,
    sku: product.sku,
  };
}
