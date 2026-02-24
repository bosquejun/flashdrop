import { createSuccessResponse } from "@/lib/response.js";
import { createSuccessResponseSchema } from "@repo/schema";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const healthCheckResponseSchema = z.object({ uptime: z.number() });

export default async function healthRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.get(
    "/",
    {
      schema: {
        response: {
          200: createSuccessResponseSchema(healthCheckResponseSchema),
        },
      },
    },
    async (_request, reply) => {
      reply.send(createSuccessResponse(healthCheckResponseSchema, { uptime: process.uptime() }));
    }
  );
}
