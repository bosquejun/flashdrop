import { env } from "@/config/env.js";

/**
 * Configure the CORS middleware.
 * @returns {Object} The CORS configuration.
 */
export const corsConfig = {
  origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
  methods: ["GET", "POST", "OPTIONS"] as string[],
  credentials: true,
  maxAge: 86400,
};
