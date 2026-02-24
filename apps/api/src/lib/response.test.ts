import type { FastifyReply } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createSuccessResponse, sendError } from "./response.js";

/** Minimal reply mock for sendError. */
function createReply(send = vi.fn()): FastifyReply {
  return {
    status: vi.fn().mockReturnThis(),
    send,
  } as unknown as FastifyReply;
}

describe("lib/response", () => {
  describe("createSuccessResponse", () => {
    const schema = z.object({ id: z.string(), name: z.string() });

    it("returns object with status ok and data", () => {
      const data = { id: "1", name: "test" };
      const result = createSuccessResponse(schema, data);
      expect(result.status).toBe("ok");
      expect(result.data).toEqual(data);
      expect(result.code).toBeNull();
      expect(result.error).toBeNull();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    });

    it("uses ISO timestamp", () => {
      const result = createSuccessResponse(schema, { id: "1", name: "x" });
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe("sendError", () => {
    it("calls reply.status and reply.send with error body", () => {
      const send = vi.fn();
      const reply = createReply(send);

      sendError(reply, "Something failed", 500);

      expect(reply.status).toHaveBeenCalledWith(500);
      expect(send).toHaveBeenCalledTimes(1);
      const body = send.mock.calls[0]?.[0];
      expect(body).toBeDefined();
      expect(body!.status).toBe("error");
      expect(body!.data).toBeNull();
      expect(body!.error).toBe("Something failed");
      expect(body!.timestamp).toBeDefined();
    });

    it("uses default statusCode 500 when not provided", () => {
      const send = vi.fn();
      const reply = createReply(send);

      sendError(reply, "Error");

      expect(reply.status).toHaveBeenCalledWith(500);
    });

    it("sends issues when provided", () => {
      const send = vi.fn();
      const reply = createReply(send);
      const issues = [
        { message: "Invalid", path: ["field"], code: "custom" as const },
      ];

      sendError(reply, "Validation error", 400, issues);

      const body = send.mock.calls[0]?.[0];
      expect(body).toBeDefined();
      expect(body!.error).toEqual({ issues });
    });
  });
});
