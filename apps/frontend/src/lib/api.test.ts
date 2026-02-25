import { describe, expect, it } from "vitest";
import { ApiError, isApiError } from "./api";

describe("ApiError", () => {
  it("creates error with message and statusCode", () => {
    const err = new ApiError("Not found", 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Not found");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("ApiError");
    expect(err.code).toBeUndefined();
  });

  it("accepts optional code", () => {
    const err = new ApiError("Limit exceeded", 400, "LIMIT_EXCEEDED");
    expect(err.code).toBe("LIMIT_EXCEEDED");
  });
});

describe("isApiError", () => {
  it("returns true for ApiError instances", () => {
    expect(isApiError(new ApiError("x", 500))).toBe(true);
  });

  it("returns false for generic Error", () => {
    expect(isApiError(new Error("x"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError("error")).toBe(false);
  });
});
