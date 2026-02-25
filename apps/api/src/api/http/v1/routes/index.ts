import type { FastifyInstance } from "fastify";
import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import ordersRoutes from "./orders.routes.js";
import productsRoutes from "./products.routes.js";

export default async function v1Routes(app: FastifyInstance): Promise<void> {
  void app.register(healthRoutes, { prefix: "/health" });
  void app.register(authRoutes, { prefix: "/auth" });
  void app.register(productsRoutes, { prefix: "/products" });
  void app.register(ordersRoutes, { prefix: "/orders" });
}
