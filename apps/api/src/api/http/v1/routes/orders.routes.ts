import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import { getUserId } from "@/api/http/v1/middleware/userIdSession.js";
import * as orderService from "@/app/orders/service.js";
import { sendSuccess } from "@/lib/response.js";
import { createLogger } from "@repo/logger";
import { createOrderRequestSchema, skuSchema } from "@repo/schema";
import { Router } from "express";

const router = Router();

const logger = createLogger("orders-routes");

router.post("/", async (req, res, next) => {
  try {
    const body = createOrderRequestSchema.safeParse(req.body);
    if (!body.success) {
      logger.error(body.error.formErrors.fieldErrors, "create order request validation errors");
      throw new AppError(400, "Invalid request body", "VALIDATION_ERROR", body.error.issues);
    }
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }
    const order = await orderService.createOrder(userId, body.data);

    sendSuccess(res, order, 201);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }
    const order = await orderService.getOrders(userId);
    if (!order) {
      throw new AppError(404, "Order not found", "NOT_FOUND");
    }
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

router.get("/:productSKU", async (req, res, next) => {
  try {
    const productSKU = req.params["productSKU"];
    const userId = getUserId(req);
    if (!userId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }
    const productSKUResult = skuSchema.safeParse(productSKU);
    if (!productSKUResult.success) {
      throw new AppError(400, "Path productSKU are required", "VALIDATION_ERROR");
    }
    const order = await orderService.getOrder(userId, productSKUResult.data);
    if (!order) {
      throw new AppError(404, "Order not found", "NOT_FOUND");
    }
    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
});

export default router;
