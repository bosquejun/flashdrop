import { createHash, randomUUID } from "node:crypto";
import { env } from "@/config/env.js";
import { createLogger } from "@repo/logger";
import { userIdentifierSchema } from "@repo/schema";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./errorHandler.js";

export const COOKIE_NAME = "flashdrop-user-id";
export const AUTH_IDENTIFIER_COOKIE_NAME = "flashdrop-auth-identifier";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

const logger = createLogger("userIdSession");

/** Hash identifier to userId (same algorithm as frontend: SHA-256 hex, first 32 chars). */
export function hashUserId(identifier: string): string {
  const normalized = identifier.toLowerCase().trim();
  const hex = createHash("sha256").update(normalized, "utf8").digest("hex");
  return hex.substring(0, 32);
}

export function getUserIdFromHeaders(headers: unknown): string | undefined {
  const xUserId = (headers as Record<string, string>)["x-user-id"];
  const parsed = userIdentifierSchema.safeParse(xUserId);
  if (!parsed.success) return undefined;
  return parsed.data;
}

export function getUserIdFromRequest(request: FastifyRequest): string | undefined {
  const raw = request.cookies?.[COOKIE_NAME];
  const parsed =
    typeof raw === "string" ? userIdentifierSchema.safeParse(raw) : { success: false as const };
  if (parsed.success) return parsed.data;
  return undefined;
}

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: Math.floor(MAX_AGE_MS / 1000),
  secure: env.NODE_ENV === "production",
  path: "/",
};

export async function userIdSession(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const fromCookie = getUserIdFromRequest(request);
  if (fromCookie) {
    request.userId = fromCookie;
    return;
  }
  const fromHeader = getUserIdFromHeaders(request.headers);
  if (fromHeader) {
    request.userId = fromHeader;
    reply.setCookie(COOKIE_NAME, fromHeader, COOKIE_OPTS);
    return;
  }
  const userId = randomUUID();
  request.userId = userId;
  reply.setCookie(COOKIE_NAME, userId, COOKIE_OPTS);
}

export function getUserId(request: FastifyRequest): string {
  const id = request.userId;
  if (id === undefined) {
    logger.error("userId not set on request; ensure userIdSession runs first.");
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }
  return id;
}
