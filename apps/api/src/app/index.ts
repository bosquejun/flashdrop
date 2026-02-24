import { corsConfig } from "@/api/http/v1/middleware/cors.js";
import { errorHandler } from "@/api/http/v1/middleware/errorHandler.js";
import { globalRateLimitConfig } from "@/api/http/v1/middleware/rateLimiter.js";
import { userIdSession } from "@/api/http/v1/middleware/userIdSession.js";
import v1Routes from "@/api/http/v1/routes/index.js";
import { env } from "@/config/env.js";
import { metricsHandler, metricsOnRequest, metricsOnResponse } from "@/lib/metrics/index.js";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

/**
 * Create the Fastify app.
 * @returns {Promise<FastifyInstance>} The Fastify app.
 */
export async function createApp() {
  const app = Fastify({
    trustProxy: true,
    logger: true,
    bodyLimit: 100 * 1024, // 100kb
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cookie);
  await app.register(cors, corsConfig);

  // register the global rate limiter if the feature flag is enabled
  // global rate limiter is disabled by default for stress testing purposes
  if (env.ENABLE_GLOBAL_RATE_LIMITER) {
    await app.register(rateLimit, globalRateLimitConfig);
  }

  app.addHook("onRequest", metricsOnRequest);
  app.addHook("onResponse", metricsOnResponse);

  // add the user ID session middleware to the app
  // this is just for the sake of the assessment and not a best practice
  // proper authentication and authorization should be implemented in a production environment
  app.addHook("preHandler", userIdSession);

  // add the metrics handler to the app
  app.get("/metrics", metricsHandler);

  // register the v1 routes to the app
  await app.register(v1Routes, { prefix: "/api/v1" });

  // set the error handler to the app
  app.setErrorHandler(errorHandler);

  // return the app with the Zod type provider
  // this is used to validate the request and response bodies
  return app.withTypeProvider<ZodTypeProvider>();
}
