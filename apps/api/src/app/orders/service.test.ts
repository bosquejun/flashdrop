import { describe, expect, it, vi } from "vitest";
import { getOrderKey, getOrdersListKey } from "./service.js";

// Avoid events-stream creating a real Redis connection when service (and subscribers) load
vi.mock("@/lib/events-stream.js", () => ({
  createEventsStream: () => ({ on: vi.fn(), publish: vi.fn(), listen: vi.fn() }),
}));

describe("orders/service", () => {
  describe("getOrderKey", () => {
    it("returns stable key for same userId and productSKU", () => {
      const key = getOrderKey("user-1", "SKU-001");
      expect(key).toMatch(/^order:/);
      expect(getOrderKey("user-1", "SKU-001")).toBe(key);
    });
    it("returns different keys for different userId or productSKU", () => {
      expect(getOrderKey("user-1", "SKU-001")).not.toBe(getOrderKey("user-2", "SKU-001"));
      expect(getOrderKey("user-1", "SKU-001")).not.toBe(getOrderKey("user-1", "SKU-002"));
    });
  });

  describe("getOrdersListKey", () => {
    it("returns stable key for same query", () => {
      const key = getOrdersListKey({ userId: "user-1" });
      expect(key).toMatch(/^orders:list:/);
      expect(getOrdersListKey({ userId: "user-1" })).toBe(key);
    });
    it("returns different key for different query", () => {
      expect(getOrdersListKey({ userId: "a" })).not.toBe(getOrdersListKey({ userId: "b" }));
    });
  });
});
