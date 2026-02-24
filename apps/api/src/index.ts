import "dotenv/config";

import cluster from "node:cluster";
import { env } from "./config/env.js";
import server from "./server.js";

/**
 * Start the server in cluster mode.
 * @returns {Promise<void>}
 */
if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < env.WORKERS; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  // start the server in worker mode
  server();
}
