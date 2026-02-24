import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import { getUserId } from "@/api/http/v1/middleware/userIdSession.js";
import * as orderService from "@/app/orders/service.js";
import { createSuccessResponse } from "@/lib/response.js";
import type { CreateOrderRequest } from "@repo/schema";
import {
  createOrderRequestSchema,
  createSuccessResponseSchema,
  orderSchema,
  skuSchema,
} from "@repo/schema";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export default async function ordersRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();
  typedApp.post(
    "/",
    {
      schema: {
        body: createOrderRequestSchema,
        response: {
          201: createSuccessResponseSchema(orderSchema),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const body = request.body as CreateOrderRequest;
      const order = await orderService.createOrder(userId, body);
      if (!order) {
        throw new AppError(500, "Failed to create order", "INTERNAL_SERVER_ERROR");
      }
      reply.status(201).send(createSuccessResponse(orderSchema, order));
    }
  );

  app.get(
    "/",
    {
      schema: {
        response: {
          200: createSuccessResponseSchema(orderSchema.array()),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request);
      const order = await orderService.getOrders(userId);
      if (!order) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }
      reply.send(createSuccessResponse(orderSchema.array(), order));
    }
  );

  app.get(
    "/:productSKU",
    {
      schema: {
        params: z.object({ productSKU: skuSchema }),
        response: {
          200: createSuccessResponseSchema(orderSchema),
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { productSKU: string };
      const userId = getUserId(request);
      const order = await orderService.getOrder(userId, params.productSKU);
      if (!order) {
        throw new AppError(404, "Order not found", "NOT_FOUND");
      }
      reply.send(createSuccessResponse(orderSchema, order));
    }
  );
}
