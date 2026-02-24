import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { Product } from "@repo/schema";
import { errorHandler } from "@/api/http/v1/middleware/errorHandler.js";
import productsRoutes from "./products.routes.js";

const mockGetProducts = vi.fn();
const mockGetProduct = vi.fn();
const mockGetProductStock = vi.fn();

vi.mock("@/app/products/service.js", () => ({
  getProducts: (...args: unknown[]) => mockGetProducts(...args),
  getProduct: (...args: unknown[]) => mockGetProduct(...args),
  getProductStock: (...args: unknown[]) => mockGetProductStock(...args),
}));

function createMockProduct(overrides: Partial<Product> = {}): Product {
  const now = new Date();
  const start = new Date(now.getTime() - 60_000);
  const end = new Date(now.getTime() + 60_000);
  return {
    _id: "prod-1",
    sku: "SKU-001",
    name: "Test Product",
    description: null,
    price: 29.99,
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

async function buildProductsApp() {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  await app.register(productsRoutes, { prefix: "/" });
  return app;
}

describe("products routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /", () => {
    it("returns 200 and list of products when getProducts succeeds", async () => {
      const products = [
        createMockProduct({ _id: "p1", sku: "SKU-A", name: "Product A" }),
        createMockProduct({ _id: "p2", sku: "SKU-B", name: "Product B" }),
      ];
      mockGetProducts.mockResolvedValue(products);

      const app = await buildProductsApp();
      const res = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.error).toBeNull();
      expect(body.data).toHaveLength(2);
      expect(body.data[0].sku).toBe("SKU-A");
      expect(body.data[1].sku).toBe("SKU-B");
      expect(mockGetProducts).toHaveBeenCalledTimes(1);
    });

    it("returns 200 and empty array when getProducts returns empty", async () => {
      mockGetProducts.mockResolvedValue([]);

      const app = await buildProductsApp();
      const res = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.data).toEqual([]);
    });
  });

  describe("GET /:sku", () => {
    it("returns 200 and product when getProduct succeeds", async () => {
      const product = createMockProduct({ sku: "SKU-XYZ", name: "Flash Item" });
      mockGetProduct.mockResolvedValue(product);

      const app = await buildProductsApp();
      const res = await app.inject({
        method: "GET",
        url: "/SKU-XYZ",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.data.sku).toBe("SKU-XYZ");
      expect(body.data.name).toBe("Flash Item");
      expect(mockGetProduct).toHaveBeenCalledWith("SKU-XYZ");
    });

    it("returns 404 when getProduct returns null", async () => {
      mockGetProduct.mockResolvedValue(null);

      const app = await buildProductsApp();
      const res = await app.inject({
        method: "GET",
        url: "/SKU-MISSING",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.status).toBe("error");
      expect(body.error).toBe("Product not found");
      expect(mockGetProduct).toHaveBeenCalledWith("SKU-MISSING");
    });
  });

  describe("GET /:sku/stock", () => {
    it("returns 200 and stock when getProductStock succeeds", async () => {
      mockGetProductStock.mockResolvedValue({
        availableStock: 42,
        totalStock: 100,
      });

      const app = await buildProductsApp();
      const res = await app.inject({
        method: "GET",
        url: "/SKU-XYZ/stock",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.data).toEqual({ availableStock: 42, totalStock: 100 });
      expect(mockGetProductStock).toHaveBeenCalledWith("SKU-XYZ");
    });

    it("returns 404 when getProductStock returns null", async () => {
      mockGetProductStock.mockResolvedValue(null);

      const app = await buildProductsApp();
      const res = await app.inject({
        method: "GET",
        url: "/SKU-MISSING/stock",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.status).toBe("error");
      expect(body.error).toBe("Product not found");
      expect(mockGetProductStock).toHaveBeenCalledWith("SKU-MISSING");
    });
  });
});
