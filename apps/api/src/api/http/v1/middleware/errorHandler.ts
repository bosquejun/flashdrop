import { sendError } from "@/lib/response.js";
import { createLogger } from "@repo/logger";
import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodIssue } from "zod";

const logger = createLogger("error-handler");

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

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, "Validation error", 400, err.issues);
    return;
  }

  logger.error({ err }, "Unhandled error");
  sendError(res, "Internal server error", 500);
}
