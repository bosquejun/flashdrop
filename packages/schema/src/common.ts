import { z } from "zod";

export const userIdentifierSchema = z.string().min(1, "User identifier is required").max(255);

export type UserIdentifier = z.infer<typeof userIdentifierSchema>;

export const skuSchema = z.string().min(1, "SKU is required").max(255);

export type Sku = z.infer<typeof skuSchema>;

export const timestampSchema = z.coerce.date();
