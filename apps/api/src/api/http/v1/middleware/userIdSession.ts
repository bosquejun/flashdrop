import { randomUUID } from "node:crypto";
import { env } from "@/config/env.js";
import { createLogger } from "@repo/logger";
import { userIdentifierSchema } from "@repo/schema";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
const COOKIE_NAME = "flashdrop-user-id";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

const logger = createLogger("userIdSession");

export function getUserIdFromHeaders(headers: unknown): string | undefined {
  const xUserId = (headers as Record<string, string>)["x-user-id"];
  const parsed = userIdentifierSchema.safeParse(xUserId);

  if (!parsed.success) {
    return undefined;
  }

  return parsed.data;
}

export function getUserIdFromRequest(req: Request): string | undefined {
  const raw = req.cookies?.[COOKIE_NAME];
  const parsed =
    typeof raw === "string" ? userIdentifierSchema.safeParse(raw) : { success: false as const };

  if (parsed.success) {
    return parsed.data;
  }

  return undefined;
}

/**
 * Parses cookies and ensures req has a valid userId (from cookie or newly created).
 * Must be used after cookie-parser.
 */
export function userIdSession(req: Request, res: Response, next: NextFunction): void {
  const existingUserId = getUserIdFromRequest(req);

  if (existingUserId) {
    req.userId = existingUserId;
    next();
    return;
  }

  const userId = randomUUID();
  req.userId = userId;

  res.cookie(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE_MS,
    secure: env.NODE_ENV === "production",
  });

  next();
}

/**
 * Returns the current request's userId (set by userIdSession middleware).
 * Use only on routes that run after userIdSession.
 */
export function getUserId(req: Request): string | undefined {
  const id = req.userId;
  if (id === undefined) {
    logger.error("userId not set on request; ensure userIdSession middleware runs first.");
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }
  return id;
}
