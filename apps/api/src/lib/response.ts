import { type ErrorResponse, errorResponseSchema } from "@repo/schema";
import type { FastifyReply } from "fastify";
import type { ZodIssue, z } from "zod";

/**
 * Creates a success response. schema is just used to infer the type of the data, validation is handled from the Fastify route handler.
 * @param schema - The schema of the data. This is just used to infer the type of the data.
 * @param data - The data to send in the response.
 * @returns The success response.
 */
export function createSuccessResponse<T extends z.ZodTypeAny>(_: T, data: z.infer<T>) {
  return {
    status: "ok" as const,
    data,
    code: null,
    error: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sends a validated error response.
 * @param reply - The Fastify reply object.
 * @param error - The error message.
 * @param statusCode - The status code of the response.
 * @param issues - The issues of the response.
 * @param code - Optional error code for client mapping (e.g. FLASH_SALE_ENDED).
 * @returns The error response.
 */
export function sendError(
  reply: FastifyReply,
  error: string,
  statusCode = 500,
  issues?: ZodIssue[],
  code?: string
): void {
  const body: ErrorResponse = {
    status: "error",
    data: null,
    error: issues ? { issues } : error,
    code,
    timestamp: new Date().toISOString(),
  };
  reply.status(statusCode).send(errorResponseSchema.parse(body));
}
