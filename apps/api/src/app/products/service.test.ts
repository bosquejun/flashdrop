import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@repo/schema";
import * as productService from "./service.js";

const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();

vi.mock("@/lib/redis.js", () => ({
  default: () => ({
    get: mockRedisGet,
    set: mockRedisSet,
  }),
}));

const mockFindProduct = vi.fn();
vi.mock("@/app/products/repository.js", () => ({
  findProduct: (...args: unknown[]) => mockFindProduct(...args),
  listProducts: vi.fn(),
  productsCollection: vi.fn(),
  ensureProductIndexes: vi.fn(),
  upsertProduct: vi.fn(),
  initProductsRepository: vi.fn(),
}));

function createMockProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date();
  const start = new Date(now.getTime() - 60_000);
  const end = new Date(now.getTime() + 60_000);
  return {
    _id: "id-1",
    sku: "SKU-001",
    name: "Product",
    description: null,
    price: 10,
    totalStock: 100,
    availableStock: 50,
    startDate: start,
    endDate: end,
    limit: { perUser: 2 },
    currency: "USD",
    imageUrl: null,
    createdAt: now,
    ...overrides,
  };
}

describe("products/service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAndVerifyProductOnFlashSale", () => {
    it("returns product when found and within flash sale period", async () => {
      const product = createMockProduct();
      mockRedisGet.mockResolvedValue(JSON.stringify(product));

      const result = await productService.getAndVerifyProductOnFlashSale("SKU-001");
      expect(result).toEqual(product);
    });

    it("throws PRODUCT_NOT_FOUND when product is null", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockFindProduct.mockResolvedValue(null);

      await expect(productService.getAndVerifyProductOnFlashSale("SKU-001")).rejects.toMatchObject({
        message: "Product not found",
        code: "PRODUCT_NOT_FOUND",
        statusCode: 400,
      });
    });

    it("throws FLASH_SALE_ENDED when endDate is in the past", async () => {
      const product = createMockProduct({
        endDate: new Date(Date.now() - 60_000),
        startDate: new Date(Date.now() - 120_000),
      });
      mockRedisGet.mockResolvedValue(JSON.stringify(product));

      await expect(productService.getAndVerifyProductOnFlashSale("SKU-001")).rejects.toMatchObject({
        message: "Flash sale has ended",
        code: "FLASH_SALE_ENDED",
        statusCode: 400,
      });
    });

    it("throws FLASH_SALE_NOT_STARTED when startDate is in the future", async () => {
      const product = createMockProduct({
        startDate: new Date(Date.now() + 60_000),
        endDate: new Date(Date.now() + 120_000),
      });
      mockRedisGet.mockResolvedValue(JSON.stringify(product));

      await expect(productService.getAndVerifyProductOnFlashSale("SKU-001")).rejects.toMatchObject({
        message: "Flash sale has not started",
        code: "FLASH_SALE_NOT_STARTED",
        statusCode: 400,
      });
    });
  });
});
