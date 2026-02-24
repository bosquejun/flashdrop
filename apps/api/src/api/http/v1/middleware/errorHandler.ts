import { sendError } from "@/lib/response.js";
import { createLogger } from "@repo/logger";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError, type ZodIssue } from "zod";

const logger = createLogger("error-handler");

/**
 * Custom error class for the application.
 * @param statusCode {number} - The HTTP status code.
 * @param message {string} - The error message.
 * @param code {string} - The error code.
 * @param issues {ZodIssue[]} - The Zod validation issues.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public issues?: ZodIssue[]
  ) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "AppError";
  }
}

function validationToIssues(validation: Array<{ message?: string; path?: string }>): ZodIssue[] {
  return validation.map((v) => ({
    message: v.message ?? "Validation failed",
    path: (v.path ?? []) as (string | number)[],
    code: "custom" as const,
  }));
}

export function errorHandler(
  err: Error | FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  if (reply.sent) {
    logger.warn({ err }, "Error after response already sent");
    return;
  }

  if (err instanceof AppError) {
    sendError(reply, err.message, err.statusCode, err.issues, err.code);
    return;
  }

  const statusCode = (err as Error & { statusCode?: number }).statusCode;
  if (typeof statusCode === "number" && statusCode >= 400 && statusCode < 600) {
    sendError(reply, err.message, statusCode);
    return;
  }

  if (err instanceof ZodError) {
    sendError(reply, "Validation error", 400, err.issues);
    return;
  }

  const fastifyErr = err as FastifyError & {
    validation?: Array<{ message?: string; path?: string }>;
  };
  if (fastifyErr.code === "FST_ERR_VALIDATION" && fastifyErr.validation) {
    const issues = validationToIssues(fastifyErr.validation);
    sendError(reply, "Validation error", 400, issues);
    return;
  }

  logger.error(
    {
      err,
      message: err.message,
      code: (err as FastifyError).code,
      name: err.name,
    },
    "Unhandled error (500)"
  );
  sendError(reply, "Internal server error", 500);
}
