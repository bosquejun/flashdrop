/**
 * Frontend types: only what is not in @repo/schema and is required.
 * Prefer extending or picking from schema types.
 */
import type { SaleStatusResponse } from "@repo/schema";

/** Sale status literal – use schema source of truth. */
export type FlashSaleStatus = SaleStatusResponse["status"];
/** Alias for FlashSaleStatus. */
export type SaleStatus = FlashSaleStatus;

/**
 * Landing page merged data: SaleStatusResponse + product snapshot and price for display.
 * useSaleStatus merges getSaleStatus + getProduct. Use top-level sku, startDate, endDate, totalStock, availableStock from schema.
 */
export interface LandingSaleData extends SaleStatusResponse {
  /** Product _id for keys when needed */
  _id?: string;
  /** Product snapshot for hero/cards (name, description, imageUrl) */
  snapshot?: { name: string; description: string; imageUrl: string };
  /** Current price (from Product.price) */
  salePrice?: number;
  /** Original price for display (e.g. Product.price before discount) */
  originalPrice?: number;
}

/** Response from legacy POST /api/sale/purchase – not in schema. */
export interface PurchaseResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

/** Response from legacy GET /api/sale/:sku/order/:userId – not in schema. */
export interface OrderCheckResponse {
  purchased: boolean;
  orderId?: string;
}
