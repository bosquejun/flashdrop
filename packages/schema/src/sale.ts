import { z } from "zod";
import { skuSchema } from "./common";

export const saleStatusEnum = z.enum(["upcoming", "active", "ended"]);
export type SaleStatus = z.infer<typeof saleStatusEnum>;

export const saleConfigSchema = z.object({
  sku: skuSchema,
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  totalStock: z.number().int().positive(),
});
export type SaleConfig = z.infer<typeof saleConfigSchema>;

export const saleStatusResponseSchema = z.object({
  sku: skuSchema,
  status: saleStatusEnum,
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  totalStock: z.number().int().nonnegative(),
  remainingStock: z.number().int().nonnegative(),
});
export type SaleStatusResponse = z.infer<typeof saleStatusResponseSchema>;
