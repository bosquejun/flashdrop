import { describe, expect, it } from "vitest";
import type { FastifyRequest } from "fastify";
import {
  getUserId,
  getUserIdFromHeaders,
  getUserIdFromRequest,
} from "./userIdSession.js";

describe("userIdSession", () => {
  describe("getUserIdFromHeaders", () => {
    it("returns userId when x-user-id is valid", () => {
      expect(getUserIdFromHeaders({ "x-user-id": "user-123" })).toBe("user-123");
      expect(getUserIdFromHeaders({ "x-user-id": "a" })).toBe("a");
    });

    it("returns undefined when x-user-id is missing", () => {
      expect(getUserIdFromHeaders({})).toBeUndefined();
      expect(getUserIdFromHeaders({ "x-user-id": undefined })).toBeUndefined();
    });

    it("returns undefined when x-user-id is invalid (empty or too long)", () => {
      expect(getUserIdFromHeaders({ "x-user-id": "" })).toBeUndefined();
      expect(
        getUserIdFromHeaders({ "x-user-id": "x".repeat(256) })
      ).toBeUndefined();
    });
  });

  describe("getUserIdFromRequest", () => {
    it("returns userId when cookie is valid", () => {
      const request = {
        cookies: { "flashdrop-user-id": "user-456" },
      } as unknown as FastifyRequest;
      expect(getUserIdFromRequest(request)).toBe("user-456");
    });

    it("returns undefined when cookie is missing", () => {
      const request = { cookies: {} } as unknown as FastifyRequest;
      expect(getUserIdFromRequest(request)).toBeUndefined();
    });

    it("returns undefined when cookies is undefined", () => {
      const request = {} as FastifyRequest;
      expect(getUserIdFromRequest(request)).toBeUndefined();
    });

    it("returns undefined when cookie value is invalid", () => {
      const request = {
        cookies: { "flashdrop-user-id": "" },
      } as unknown as FastifyRequest;
      expect(getUserIdFromRequest(request)).toBeUndefined();
    });
  });

  describe("getUserId", () => {
    it("returns userId when set on request", () => {
      const request = { userId: "user-789" } as FastifyRequest;
      expect(getUserId(request)).toBe("user-789");
    });

    it("throws AppError 401 when userId is undefined", () => {
      const request = {} as FastifyRequest;
      expect(() => getUserId(request)).toThrow(
        expect.objectContaining({
          statusCode: 401,
          code: "UNAUTHORIZED",
          message: "Unauthorized",
        })
      );
    });
  });
});
