import path from "node:path";
import { createLogger } from "@repo/logger";
import { pinoHttp } from "pino-http";
import { getUserId } from "./userIdSession.js";

const logger = createLogger(
  "http",
  path.join(process.cwd(), "logs", `${new Date().toISOString()}.log`)
);

export const requestLogger = pinoHttp({
  logger,
  serializers: {
    req(req) {
      const userId = getUserId(req.raw);
      return {
        method: req.method,
        url: req.url,
        userId,
      };
    },
    res(res) {
      const { method, url, userId } = res.raw.req;
      return {
        userId,
        method,
        url,
        statusCode: res.statusCode,
      };
    },
  },
});
