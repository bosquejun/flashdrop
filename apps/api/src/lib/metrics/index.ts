import { randomBytes } from "node:crypto";
import { env } from "@/config/env.js";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "ioredis";
import promClient from "prom-client";

const register = new promClient.Registry();

function getInstanceId(): string {
  if (env.SERVICE_INSTANCE_NAME) {
    return env.SERVICE_INSTANCE_NAME;
  }
  if (env.HOSTNAME) {
    return env.HOSTNAME;
  }
  return `api-${randomBytes(4).toString("hex")}`;
}

const instanceId = getInstanceId();
register.setDefaultLabels({ instance: instanceId, service: "api" });
promClient.collectDefaultMetrics({ register, prefix: "node_" });

const heapUsedBytes = new promClient.Gauge({
  name: "nodejs_heap_size_used_bytes",
  help: "Process heap size used from Node.js in bytes (synced on scrape).",
  registers: [register],
});
const heapTotalBytes = new promClient.Gauge({
  name: "nodejs_heap_size_total_bytes",
  help: "Process heap size from Node.js in bytes (synced on scrape).",
  registers: [register],
});
const eventLoopLagSeconds = new promClient.Gauge({
  name: "nodejs_eventloop_lag_seconds",
  help: "Lag of event loop in seconds (measured on interval).",
  registers: [register],
});

const processUptimeSeconds = new promClient.Gauge({
  name: "process_uptime_seconds",
  help: "Process uptime in seconds (time since process start).",
  registers: [register],
});

export function syncHeapMetrics(): void {
  try {
    const mem = process.memoryUsage();
    heapUsedBytes.set(mem.heapUsed);
    heapTotalBytes.set(mem.heapTotal);
    processUptimeSeconds.set(process.uptime());
  } catch {
    // ignore
  }
}

function startEventLoopLagMeasurement(): void {
  function measure(): void {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delta = process.hrtime.bigint() - start;
      const seconds = Number(delta) / 1e9;
      eventLoopLagSeconds.set(seconds);
    });
  }
  measure();
  setInterval(measure, 1000);
}
startEventLoopLagMeasurement();

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRateLimitExceededTotal = new promClient.Counter({
  name: "http_rate_limit_exceeded_total",
  help: "Total number of requests rejected due to rate limiting (429)",
  labelNames: ["route"],
  registers: [register],
});

function getRoute(path: string): string {
  if (path === "/metrics") return "/metrics";
  if (path.startsWith("/api/v1/")) {
    const rest = path.slice("/api/v1".length) || "/";
    const parts = rest.split("/").filter(Boolean);
    if (parts.length >= 1) return `/api/v1/${parts[0]}`;
    return "/api/v1";
  }
  return path;
}

const METRICS_START = Symbol("metricsStart");

export function metricsOnRequest(
  request: FastifyRequest,
  _reply: FastifyReply,
  done: () => void
): void {
  if (request.url === "/metrics") {
    done();
    return;
  }
  (request as FastifyRequest & { [METRICS_START]?: number })[METRICS_START] = performance.now();
  done();
}

export function metricsOnResponse(
  request: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const start = (request as FastifyRequest & { [METRICS_START]?: number })[METRICS_START];
  if (start === undefined) {
    done();
    return;
  }
  const duration = (performance.now() - start) / 1000;
  const route = getRoute(request.url);
  const status = String(reply.statusCode);
  httpRequestDuration.observe({ method: request.method, route, status_code: status }, duration);
  httpRequestsTotal.inc({ method: request.method, route, status_code: status });
  if (reply.statusCode === 429) {
    httpRateLimitExceededTotal.inc({ route });
  }
  done();
}

const redisCommandsTotal = new promClient.Counter({
  name: "redis_commands_total",
  help: "Total number of Redis commands",
  labelNames: ["command", "status"],
  registers: [register],
});

const redisCommandsDuration = new promClient.Histogram({
  name: "redis_commands_duration_seconds",
  help: "Redis command duration in seconds",
  labelNames: ["command"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

const mongodbOperationsTotal = new promClient.Counter({
  name: "mongodb_operations_total",
  help: "Total number of MongoDB operations",
  labelNames: ["collection", "operation", "status"],
  registers: [register],
});

const mongodbOperationsDuration = new promClient.Histogram({
  name: "mongodb_operations_duration_seconds",
  help: "MongoDB operation duration in seconds",
  labelNames: ["collection", "operation"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const mongoStartedByRequestId = new Map<unknown, { commandName: string; collection: string }>();

export function instrumentMongo(client: {
  on: (event: string, handler: (event: Record<string, unknown>) => void) => void;
}): void {
  client.on("commandStarted", (event: Record<string, unknown>) => {
    const requestId = event.requestId;
    const commandName = String(event.commandName ?? "unknown");
    const cmd = (event.command as Record<string, unknown>) ?? {};
    const collection =
      (typeof cmd[commandName] === "string"
        ? (cmd[commandName] as string)
        : (cmd.collection as string)) ?? "unknown";
    mongoStartedByRequestId.set(requestId, { commandName, collection });
  });

  client.on("commandSucceeded", (event: Record<string, unknown>) => {
    const requestId = event.requestId;
    const info = mongoStartedByRequestId.get(requestId);
    mongoStartedByRequestId.delete(requestId);
    const commandName = info?.commandName ?? String(event.commandName ?? "unknown");
    const collection = info?.collection ?? "unknown";
    const durationMs = Number(event.duration ?? 0);
    mongodbOperationsTotal.inc({ collection, operation: commandName, status: "ok" });
    mongodbOperationsDuration.observe({ collection, operation: commandName }, durationMs / 1000);
  });

  client.on("commandFailed", (event: Record<string, unknown>) => {
    const requestId = event.requestId;
    const info = mongoStartedByRequestId.get(requestId);
    mongoStartedByRequestId.delete(requestId);
    const commandName = info?.commandName ?? String(event.commandName ?? "unknown");
    const collection = info?.collection ?? "unknown";
    mongodbOperationsTotal.inc({ collection, operation: commandName, status: "error" });
  });
}

export function instrumentRedis(client: Redis): void {
  const originalSendCommand = client.sendCommand.bind(client);
  client.sendCommand = ((command: Parameters<Redis["sendCommand"]>[0]) => {
    const cmdName =
      command && typeof (command as { name?: string }).name !== "undefined"
        ? String((command as { name: string }).name).toLowerCase()
        : "unknown";
    const start = performance.now();
    const result = originalSendCommand(command) as Promise<unknown>;
    if (result && typeof result.then === "function") {
      result.then(
        () => {
          redisCommandsTotal.inc({ command: cmdName, status: "ok" });
          redisCommandsDuration.observe({ command: cmdName }, (performance.now() - start) / 1000);
        },
        () => {
          redisCommandsTotal.inc({ command: cmdName, status: "error" });
          redisCommandsDuration.observe({ command: cmdName }, (performance.now() - start) / 1000);
        }
      );
    }
    return result;
  }) as Redis["sendCommand"];
}

export async function metricsHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  syncHeapMetrics();
  reply.type(register.contentType);
  const metrics = await register.metrics();
  reply.send(metrics);
}

export { register };
