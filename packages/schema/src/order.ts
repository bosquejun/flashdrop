// @ts-ignore
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { skuSchema, userIdentifierSchema } from "./common";

export const orderSchema = z.object({
  _id: z.string(),
  createdAt: z.coerce.date().default(new Date()),
  productSKU: skuSchema,
  userId: userIdentifierSchema,
  purchasedAt: z.coerce.date(),
  quantity: z.number().int().nonnegative().default(1),
  totalPrice: z.number().nonnegative(),
  price: z.number().nonnegative(),
  currency: z.string().length(3).default("USD"),
  status: z.enum(["pending", "completed", "failed"]),
  paymentMethod: z.enum(["credit_card", "paypal", "bank_transfer"]),
  paymentReference: z.string().min(1).max(255).default(randomUUID()),
});

/** When flashSaleId is provided, quantity is optional; otherwise required. */
export const createOrderRequestSchema = orderSchema
  .pick({
    productSKU: true,
  })
  .extend({
    quantity: z.number().int().nonnegative().default(1).optional(),
  });

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export type Order = z.infer<typeof orderSchema>;

export const orderResponseSchema = orderSchema;

export type OrderResponse = z.infer<typeof orderResponseSchema>;
