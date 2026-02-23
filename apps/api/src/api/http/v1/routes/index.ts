import { Router } from "express";
import healthRoutes from "./health.routes.js";
import ordersRoutes from "./orders.routes.js";
import productsRoutes from "./products.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/products", productsRoutes);
router.use("/orders", ordersRoutes);

export default router;
