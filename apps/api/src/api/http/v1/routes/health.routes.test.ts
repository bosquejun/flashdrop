import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import healthRoutes from "./health.routes.js";

describe("health routes", () => {
  it("GET / returns 200 with uptime", async () => {
    const app = Fastify().withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    await app.register(healthRoutes, { prefix: "/" });

    const res = await app.inject({
      method: "GET",
      url: "/",
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.data).toEqual({ uptime: expect.any(Number) });
    expect(body.error).toBeNull();
    expect(body.data.uptime).toBeGreaterThanOrEqual(0);
  });
});
