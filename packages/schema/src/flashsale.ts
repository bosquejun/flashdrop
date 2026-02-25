import { z } from "zod";

export const flashSaleSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  limit: z.object({
    perUser: z.number().int().nonnegative().default(1).optional(),
  }),
  status: z.enum(["upcoming", "active", "ended"]),
  reconcilationStatus: z
    .enum(["pending", "completed", "failed", "not-started"])
    .default("not-started")
    .optional(),
});

export type FlashSale = z.infer<typeof flashSaleSchema>;
