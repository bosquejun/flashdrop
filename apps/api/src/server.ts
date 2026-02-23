import loaders, { gracefulShutdown } from "@/lib/loader/index.js";
import { createLogger } from "@repo/logger";
import { createApp } from "./app/index.js";
import { env } from "./config/env.js";

const logger = createLogger("server");

async function server() {
  await loaders();

  const app = createApp();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV, host: env.HOST }, "Server started");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully...");
    server.close(async () => {
      await gracefulShutdown();
      logger.info("Server shut down");
      process.exit(0);
    });
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled rejection");
    process.exit(1);
  });
  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    process.exit(1);
  });
}

export default server;
