import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import * as productService from "@/app/products/service.js";
import { createSuccessResponse } from "@/lib/response.js";
import { createSuccessResponseSchema, productSchema, skuSchema } from "@repo/schema";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const stockResponseSchema = z.object({
  availableStock: z.number().int().nonnegative(),
  totalStock: z.number().int().nonnegative(),
});

export default async function productsRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/:sku/stock",
    {
      schema: {
        params: z.object({ sku: skuSchema }),
        response: {
          200: createSuccessResponseSchema(stockResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { sku: string };
      const stock = await productService.getProductStock(params.sku);
      if (!stock) {
        throw new AppError(404, "Product not found", "NOT_FOUND");
      }
      reply.send(createSuccessResponse(stockResponseSchema, stock));
    }
  );

  typedApp.get(
    "/",
    {
      schema: {
        response: {
          200: createSuccessResponseSchema(productSchema.array()),
        },
      },
    },
    async (_request, reply) => {
      const products = await productService.getProducts();
      reply.send(createSuccessResponse(productSchema.array(), products));
    }
  );

  typedApp.get(
    "/:sku",
    {
      schema: {
        params: z.object({ sku: skuSchema }),
        response: {
          200: createSuccessResponseSchema(productSchema),
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { sku: string };
      const product = await productService.getProduct(params.sku);
      if (!product) {
        throw new AppError(404, "Product not found", "NOT_FOUND");
      }
      reply.send(createSuccessResponse(productSchema, product));
    }
  );
}
