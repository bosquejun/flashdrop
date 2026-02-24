import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import type { Order } from "@repo/schema";
import { errorHandler } from "@/api/http/v1/middleware/errorHandler.js";
import ordersRoutes from "./orders.routes.js";

const mockCreateOrder = vi.fn();
const mockGetOrders = vi.fn();
const mockGetOrder = vi.fn();

vi.mock("@/api/http/v1/middleware/userIdSession.js", () => ({
  getUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/app/orders/service.js", () => ({
  createOrder: (...args: unknown[]) => mockCreateOrder(...args),
  getOrders: (...args: unknown[]) => mockGetOrders(...args),
  getOrder: (...args: unknown[]) => mockGetOrder(...args),
}));

function createMockOrder(overrides: Partial<Order> = {}): Order {
  return {
    _id: "order-1",
    createdAt: new Date(),
    productSKU: "SKU-001",
    userId: "test-user-id",
    purchasedAt: new Date(),
    quantity: 1,
    totalPrice: 99.99,
    price: 99.99,
    currency: "USD",
    status: "completed",
    paymentMethod: "credit_card",
    paymentReference: "pay-ref-1",
    ...overrides,
  };
}

async function buildOrdersApp() {
  const app = Fastify().withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler(errorHandler);
  await app.register(ordersRoutes, { prefix: "/" });
  return app;
}

describe("orders routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /", () => {
    it("returns 201 and order when createOrder succeeds", async () => {
      const order = createMockOrder();
      mockCreateOrder.mockResolvedValue(order);

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "POST",
        url: "/",
        payload: { productSKU: "SKU-001", quantity: 1 },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.error).toBeNull();
      expect(body.data).toBeDefined();
      expect(body.data._id).toBe(order._id);
      expect(body.data.productSKU).toBe("SKU-001");
      expect(body.data.userId).toBe("test-user-id");
      expect(mockCreateOrder).toHaveBeenCalledWith("test-user-id", {
        productSKU: "SKU-001",
        quantity: 1,
      });
    });

    it("returns 201 with default quantity when body omits quantity", async () => {
      const order = createMockOrder({ quantity: 1 });
      mockCreateOrder.mockResolvedValue(order);

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "POST",
        url: "/",
        payload: { productSKU: "SKU-002" },
      });

      expect(res.statusCode).toBe(201);
      expect(mockCreateOrder).toHaveBeenCalledWith(
        "test-user-id",
        expect.objectContaining({ productSKU: "SKU-002" })
      );
    });

    it("returns error status when createOrder throws AppError", async () => {
      const { AppError } = await import(
        "@/api/http/v1/middleware/errorHandler.js"
      );
      mockCreateOrder.mockRejectedValue(
        new AppError(409, "Out of stock", "OUT_OF_STOCK")
      );

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "POST",
        url: "/",
        payload: { productSKU: "SKU-001", quantity: 2 },
      });

      expect(res.statusCode).toBe(409);
      const body = res.json();
      expect(body.status).toBe("error");
      expect(body.error).toBe("Out of stock");
    });

    it("returns 400 when body is invalid", async () => {
      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "POST",
        url: "/",
        payload: { productSKU: "" },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /", () => {
    it("returns 200 and list of orders when getOrders succeeds", async () => {
      const orders = [
        createMockOrder({ _id: "o1", productSKU: "SKU-A" }),
        createMockOrder({ _id: "o2", productSKU: "SKU-B" }),
      ];
      mockGetOrders.mockResolvedValue(orders);

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.data).toHaveLength(2);
      expect(body.data[0]._id).toBe("o1");
      expect(body.data[1]._id).toBe("o2");
      expect(mockGetOrders).toHaveBeenCalledWith("test-user-id");
    });

    it("returns 404 when getOrders returns null", async () => {
      mockGetOrders.mockResolvedValue(null);

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "GET",
        url: "/",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.status).toBe("error");
      expect(body.error).toBe("Order not found");
    });
  });

  describe("GET /:productSKU", () => {
    it("returns 200 and order when getOrder succeeds", async () => {
      const order = createMockOrder({ productSKU: "SKU-XYZ" });
      mockGetOrder.mockResolvedValue(order);

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "GET",
        url: "/SKU-XYZ",
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBe("ok");
      expect(body.data.productSKU).toBe("SKU-XYZ");
      expect(mockGetOrder).toHaveBeenCalledWith("test-user-id", "SKU-XYZ");
    });

    it("returns 404 when getOrder returns null", async () => {
      mockGetOrder.mockResolvedValue(null);

      const app = await buildOrdersApp();
      const res = await app.inject({
        method: "GET",
        url: "/SKU-MISSING",
      });

      expect(res.statusCode).toBe(404);
      const body = res.json();
      expect(body.status).toBe("error");
      expect(body.error).toBe("Order not found");
    });
  });
});
