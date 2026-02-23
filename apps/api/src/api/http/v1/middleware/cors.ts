import { env } from "@/config/env.js";
import cors from "cors";

export const corsMiddleware = cors({
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  maxAge: 86400,
});
