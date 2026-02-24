import { randomUUID } from "node:crypto";
import { env } from "@/config/env.js";
import { createLogger } from "@repo/logger";
import { userIdentifierSchema } from "@repo/schema";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "./errorHandler.js";

const COOKIE_NAME = "flashdrop-user-id";
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

const logger = createLogger("userIdSession");

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

export async function userIdSession(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const existingUserId = getUserIdFromRequest(request);
  if (existingUserId) {
    request.userId = existingUserId;
    return;
  }
  const userId = randomUUID();
  request.userId = userId;
  reply.setCookie(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: Math.floor(MAX_AGE_MS / 1000),
    secure: env.NODE_ENV === "production",
  });
}

export function getUserId(request: FastifyRequest): string {
  const id = request.userId;
  if (id === undefined) {
    logger.error("userId not set on request; ensure userIdSession runs first.");
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }
  return id;
}
