import { z } from "zod";
import { skuSchema } from "./common";

/**
 * Minimal response for GET /api/v1/products/:sku/sale-status.
 * Status, timing, and stock only. Product display (name, image, price) from GET /products/:sku.
 */
export const saleStatusResponseSchema = z.object({
  status: z.enum(["upcoming", "active", "ended"]),
  startDate: z.string(),
  endDate: z.string(),
  availableStock: z.number().int().nonnegative(),
  totalStock: z.number().int().nonnegative(),
  limitPerUser: z.number().int().nonnegative(),
  sku: skuSchema,
});

export type SaleStatusResponse = z.infer<typeof saleStatusResponseSchema>;
