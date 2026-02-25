import {
  AUTH_IDENTIFIER_COOKIE_NAME,
  COOKIE_NAME,
  COOKIE_OPTS,
  hashUserId,
} from "@/api/http/v1/middleware/userIdSession.js";
import { createSuccessResponse } from "@/lib/response.js";
import { createSuccessResponseSchema, userIdentifierSchema } from "@repo/schema";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

const loginBodySchema = z.object({
  identifier: userIdentifierSchema,
});

const loginResponseSchema = z.object({
  userId: z.string(),
  identifier: z.string(),
});

export default async function authRoutes(app: FastifyInstance): Promise<void> {
  const typedApp = app.withTypeProvider<ZodTypeProvider>();

  typedApp.post(
    "/login",
    {
      schema: {
        body: loginBodySchema,
        response: {
          200: createSuccessResponseSchema(loginResponseSchema),
        },
      },
    },
    async (request, reply) => {
      const body = loginBodySchema.parse(request.body);
      const userId = hashUserId(body.identifier);
      reply.setCookie(COOKIE_NAME, userId, COOKIE_OPTS);
      reply.setCookie(AUTH_IDENTIFIER_COOKIE_NAME, body.identifier, {
        ...COOKIE_OPTS,
        httpOnly: false,
      });
      request.userId = userId;
      return reply.send(
        createSuccessResponse(loginResponseSchema, { userId, identifier: body.identifier })
      );
    }
  );
}
