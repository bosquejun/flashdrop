import pino, { type Logger, type LoggerOptions } from "pino";

const isNode =
  typeof process !== "undefined" && process.versions != null && process.versions.node != null;

function getLogLevel(): string {
  if (isNode && process.env["LOG_LEVEL"]) {
    return process.env["LOG_LEVEL"];
  }
  if (isNode && process.env["NODE_ENV"] === "production") {
    return "info";
  }
  return "debug";
}

function buildOptions(name: string, logPath?: string): LoggerOptions {
  const level = getLogLevel();

  if (!isNode) {
    return {
      name,
      level,
      browser: { asObject: false },
    };
  }

  const usePretty =
    process.env["LOG_PRETTY"] === "true" || process.env["NODE_ENV"] !== "production";

  return {
    name,
    level,
    transport: {
      targets: [
        // Target 1: Console Output
        {
          target: usePretty ? "pino-pretty" : "pino/file",
          level,
          options: usePretty
            ? { colorize: true, translateTime: "SYS:HH:MM:ss.l" }
            : { destination: 1 }, // 1 is stdout
        },
        ...(logPath
          ? [
              {
                target: "pino/file",
                level,
                options: {
                  destination: logPath,
                  mkdir: true, // Automatically creates the folder if it doesn't exist
                },
              },
            ]
          : []),
      ],
    },
  };
}

export function createLogger(name: string, logPath?: string): Logger {
  return pino(buildOptions(name, logPath));
}

export type { Logger } from "pino";
