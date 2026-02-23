import { corsMiddleware } from "@/api/http/v1/middleware/cors.js";
import { errorHandler } from "@/api/http/v1/middleware/errorHandler.js";
import { requestLogger } from "@/api/http/v1/middleware/requestLogger.js";
import { userIdSession } from "@/api/http/v1/middleware/userIdSession.js";
import v1Routes from "@/api/http/v1/routes/index.js";
import { metricsHandler, metricsMiddleware } from "@/lib/metrics/index.js";
import cookieParser from "cookie-parser";
import express from "express";

export function createApp(): express.Express {
  const app = express();

  // Trust first proxy (nginx) so X-Forwarded-* and rate-limiting use the real client IP
  app.set("trust proxy", 1);

  // Metrics: middleware first (to time all requests), then scrape endpoint
  app.use(metricsMiddleware);
  app.get("/metrics", metricsHandler);

  // Middleware
  // CORS
  app.use(corsMiddleware);
  // JSON body parser
  app.use(express.json({ limit: "100kb" }));
  // Cookies (required for userId session)
  app.use(cookieParser());

  app.use(userIdSession);
  // Request logger
  app.use(requestLogger);
  // Rate limiter
  // app.use(globalLimiter);

  // Routes
  app.use("/api/v1", v1Routes);

  // Error handler
  app.use(errorHandler);

  app.use((err: Error, req: express.Request, res: express.Response) => {
    console.error("🔥 REAL ERROR:", {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });

    res.status(500).json({ error: "Internal Server Error" });
  });

  return app;
}
