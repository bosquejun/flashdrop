import { z } from "zod";
import { skuSchema } from "./common";

export const productSchema = z.object({
  _id: z.string(),
  sku: skuSchema,
  name: z.string().min(1).max(500),
  description: z.string().max(2000).nullable().default(null),
  price: z.number().nonnegative(),
  totalStock: z.number().int().nonnegative(),
  availableStock: z.number().int().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  limit: z.object({
    perUser: z.number().int().nonnegative().default(1).optional(),
  }),
  currency: z.string().length(3).default("USD"),
  imageUrl: z.string().url().nullable().default(null),
  createdAt: z.coerce.date().default(new Date()),
});
export type Product = z.infer<typeof productSchema>;
