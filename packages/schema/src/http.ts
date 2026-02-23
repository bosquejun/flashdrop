import { z } from "zod";

export const httpStatusSchema = z.enum(["ok", "error"]);
export type HttpStatus = z.infer<typeof httpStatusSchema>;

export const errorResponseSchema = z.object({
  status: z.literal("error"),
  data: z.null(),
  error: z.string().or(
    z.object({
      issues: z.record(z.string(), z.any()),
    })
  ),
  timestamp: z.string().datetime(),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Creates a success response schema with a route-specific `data` shape.
 *
 * ```ts
 * const myResponseSchema = createSuccessResponseSchema(myDataSchema);
 * type MyResponse = z.infer<typeof myResponseSchema>;
 * // { status: "ok", data: MyData, error: null, timestamp: string }
 * ```
 */
export function createSuccessResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    status: z.literal("ok"),
    data: dataSchema,
    error: z.null(),
    timestamp: z.string().datetime(),
  });
}

export type SuccessResponse<T> = {
  status: "ok";
  data: T;
  error: null;
  timestamp: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
