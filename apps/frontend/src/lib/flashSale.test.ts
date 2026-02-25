import type { Product } from "@repo/schema";
import { describe, expect, it } from "vitest";
import { productToFlashSaleInfo } from "./flashSale";

function baseProduct(overrides: Partial<Product> = {}): Product {
  const now = Date.now();
  return {
    _id: "id1",
    sku: "SKU-001",
    name: "Test Product",
    description: null,
    price: 1999,
    totalStock: 100,
    availableStock: 50,
    startDate: new Date(now - 3600000),
    endDate: new Date(now + 3600000),
    limit: { perUser: 2 },
    currency: "USD",
    imageUrl: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("productToFlashSaleInfo", () => {
  it("returns active when sale is live", () => {
    const product = baseProduct();
    const info = productToFlashSaleInfo(product);
    expect(info.status).toBe("active");
    expect(info.limitPerUser).toBe(2);
    expect(info.startDate).toBeInstanceOf(Date);
    expect(info.endDate).toBeInstanceOf(Date);
  });

  it("returns ended when availableStock is 0", () => {
    const product = baseProduct({ availableStock: 0 });
    const info = productToFlashSaleInfo(product);
    expect(info.status).toBe("ended");
  });

  it("returns ended when endDate is in the past", () => {
    const product = baseProduct({
      startDate: new Date(Date.now() - 7200000),
      endDate: new Date(Date.now() - 3600000),
    });
    const info = productToFlashSaleInfo(product);
    expect(info.status).toBe("ended");
  });

  it("returns upcoming when startDate is in the future", () => {
    const product = baseProduct({
      startDate: new Date(Date.now() + 3600000),
      endDate: new Date(Date.now() + 7200000),
    });
    const info = productToFlashSaleInfo(product);
    expect(info.status).toBe("upcoming");
  });

  it("accepts date strings and converts to Date", () => {
    const now = Date.now();
    const product = {
      ...baseProduct(),
      startDate: new Date(now - 1000).toISOString(),
      endDate: new Date(now + 1000).toISOString(),
    } as unknown as Product;
    const info = productToFlashSaleInfo(product);
    expect(info.startDate).toBeInstanceOf(Date);
    expect(info.endDate).toBeInstanceOf(Date);
    expect(info.status).toBe("active");
  });

  it("defaults limitPerUser to 1 when limit.perUser missing", () => {
    const product = baseProduct({ limit: {} });
    const info = productToFlashSaleInfo(product);
    expect(info.limitPerUser).toBe(1);
  });
});
