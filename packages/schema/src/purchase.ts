import { z } from "zod";
import { skuSchema, userIdentifierSchema } from "./common";

export const purchaseAttemptSchema = z.object({
  userId: userIdentifierSchema,
  sku: skuSchema,
});
export type PurchaseAttempt = z.infer<typeof purchaseAttemptSchema>;

export const purchaseResultEnum = z.enum([
  "success",
  "already_purchased",
  "sale_not_active",
  "sold_out",
]);
export type PurchaseResult = z.infer<typeof purchaseResultEnum>;

export const purchaseResponseSchema = z.object({
  result: purchaseResultEnum,
  message: z.string(),
});
export type PurchaseResponse = z.infer<typeof purchaseResponseSchema>;

export const userPurchaseStatusSchema = z.object({
  purchased: z.boolean(),
  purchasedAt: z.string().datetime().nullable(),
});
export type UserPurchaseStatus = z.infer<typeof userPurchaseStatusSchema>;

export const userPurchaseQuerySchema = z.object({
  userId: userIdentifierSchema,
  sku: skuSchema,
});
export type UserPurchaseQuery = z.infer<typeof userPurchaseQuerySchema>;
