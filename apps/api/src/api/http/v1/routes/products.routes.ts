import { AppError } from "@/api/http/v1/middleware/errorHandler.js";
import * as productService from "@/app/products/service.js";
import { sendSuccess } from "@/lib/response.js";
import { skuSchema } from "@repo/schema";
import { Router } from "express";

const router = Router();

function parseSku(raw: unknown): string {
  const result = skuSchema.safeParse(raw);
  if (!result.success) {
    throw new AppError(400, "Invalid or missing SKU", "VALIDATION_ERROR");
  }
  return result.data;
}

router.get("/", async (_req, res, next) => {
  try {
    const products = await productService.getProducts();
    sendSuccess(res, products);
  } catch (err) {
    next(err);
  }
});

router.get("/:sku", async (req, res, next) => {
  try {
    const sku = parseSku(req.params["sku"]);
    const product = await productService.getProduct(sku);
    if (!product) {
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }
    sendSuccess(res, product);
  } catch (err) {
    next(err);
  }
});

export default router;
