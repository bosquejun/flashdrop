import { describe, expect, it } from "vitest";
import {
  getProductBuyersKey,
  getProductKey,
  getProductsListKey,
  getProductStockKey,
} from "./utils.js";

describe("products/utils", () => {
  describe("getProductKey", () => {
    it("returns key with sku", () => {
      expect(getProductKey("SKU-001")).toBe("product:SKU-001");
    });
    it("returns different keys for different skus", () => {
      expect(getProductKey("A")).toBe("product:A");
      expect(getProductKey("B")).toBe("product:B");
    });
  });

  describe("getProductsListKey", () => {
    it("returns stable key for empty query", () => {
      const key = getProductsListKey({});
      expect(key).toMatch(/^products:list:/);
      expect(getProductsListKey({})).toBe(key);
    });
    it("returns same key for same query object", () => {
      expect(getProductsListKey({ a: 1 })).toBe(getProductsListKey({ a: 1 }));
    });
    it("returns different key for different query", () => {
      expect(getProductsListKey({ a: 1 })).not.toBe(getProductsListKey({ b: 2 }));
    });
  });

  describe("getProductStockKey", () => {
    it("returns key with sku in braces", () => {
      expect(getProductStockKey("SKU-001")).toBe("product:{SKU-001}:stock");
    });
  });

  describe("getProductBuyersKey", () => {
    it("returns key with sku in braces", () => {
      expect(getProductBuyersKey("SKU-001")).toBe("product:{SKU-001}:buyers");
    });
  });
});
