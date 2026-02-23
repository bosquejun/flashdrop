import type { ErrorResponse, SuccessResponse } from "@repo/schema";
import type { Response } from "express";
import type { ZodIssue } from "zod";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: SuccessResponse<T> = {
    status: "ok",
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  error: string,
  statusCode = 500,
  issues?: ZodIssue[]
): void {
  const body: ErrorResponse = {
    status: "error",
    data: null,
    error: issues ? { issues } : error,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(body);
}
