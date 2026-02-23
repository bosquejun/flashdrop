import { sendSuccess } from "@/lib/response.js";
import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  sendSuccess(res, { uptime: process.uptime() });
});

export default router;
