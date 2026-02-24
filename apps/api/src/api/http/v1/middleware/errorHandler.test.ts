import type { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { AppError, errorHandler } from "./errorHandler.js";

/** Minimal reply mock for errorHandler (only used props). */
function createReply(): FastifyReply & { send: ReturnType<typeof vi.fn> } {
  return {
    sent: false,
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
  } as unknown as FastifyReply & { send: ReturnType<typeof vi.fn> };
}

describe("errorHandler", () => {
  describe("AppError", () => {
    it("sets statusCode, message, and code", () => {
      const err = new AppError(404, "Not found", "NOT_FOUND");
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe("Not found");
      expect(err.code).toBe("NOT_FOUND");
      expect(err.name).toBe("AppError");
    });

    it("accepts optional issues", () => {
      const issues = [{ message: "x", path: ["a"], code: "custom" as const }];
      const err = new AppError(400, "Bad request", "VALIDATION", issues);
      expect(err.issues).toEqual(issues);
    });
  });

  describe("errorHandler", () => {
    it("sends AppError with its statusCode and message", () => {
      const reply = createReply();
      const request = {} as FastifyRequest;
      const err = new AppError(403, "Forbidden", "FORBIDDEN");

      errorHandler(err, request, reply);

      expect(reply.status).toHaveBeenCalledWith(403);
      expect(reply.send).toHaveBeenCalledTimes(1);
      const body = reply.send.mock.calls[0]?.[0];
      expect(body).toBeDefined();
      expect(body!.status).toBe("error");
      expect(body!.error).toBe("Forbidden");
    });

    it("does nothing when reply.sent is true", () => {
      const reply = createReply();
      reply.sent = true;
      const request = {} as FastifyRequest;

      errorHandler(new AppError(500, "Error", "ERROR"), request, reply);

      expect(reply.send).not.toHaveBeenCalled();
    });

    it("handles ZodError with 400 and issues", () => {
      const reply = createReply();
      const request = {} as FastifyRequest;
      const zodErr = new ZodError([
        { message: "Invalid", path: ["x"], code: "custom" },
      ]);

      errorHandler(zodErr, request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledTimes(1);
      const body = reply.send.mock.calls[0]?.[0];
      expect(body).toBeDefined();
      expect(body!.error).toEqual({ issues: zodErr.issues });
    });

    it("handles error with statusCode 4xx/5xx", () => {
      const reply = createReply();
      const request = {} as FastifyRequest;
      const err = Object.assign(new Error("Conflict"), { statusCode: 409 });

      errorHandler(err, request, reply);

      expect(reply.status).toHaveBeenCalledWith(409);
      expect(reply.send).toHaveBeenCalledTimes(1);
    });

    it("sends 500 for unhandled errors", () => {
      const reply = createReply();
      const request = {} as FastifyRequest;

      errorHandler(new Error("Unknown"), request, reply);

      expect(reply.status).toHaveBeenCalledWith(500);
      const body = reply.send.mock.calls[0]?.[0];
      expect(body).toBeDefined();
      expect(body!.error).toBe("Internal server error");
    });
  });
});
