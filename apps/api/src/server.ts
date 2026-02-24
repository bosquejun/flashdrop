import loaders, { gracefulShutdown } from "@/lib/loader/index.js";
import { createLogger } from "@repo/logger";
import { createApp } from "./app/index.js";
import { env } from "./config/env.js";

const logger = createLogger("server");

/**
 * Start the server.
 * @returns {Promise<void>}
 */
async function server() {
  // load the database, Redis, and subscribers
  await loaders();

  // create the Fastify app
  const app = await createApp();

  // start the server on the specified port and host
  await app.listen({ port: env.PORT, host: env.HOST });

  logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV, host: env.HOST }, "Server started");

  /**
   * Shutdown the server gracefully.
   * @param signal {string} - The signal that triggered the shutdown.
   * @returns {Promise<void>}
   */
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down gracefully...");
    await app.close();
    await gracefulShutdown();
    logger.info("Server shut down");
    process.exit(0);
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
