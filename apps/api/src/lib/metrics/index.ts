import type { Request, Response } from "express";
import { randomBytes } from "node:crypto";
import promClient from "prom-client";

const register = new promClient.Registry();

// Instance label: dynamic per process. Use HOSTNAME in Docker/K8s, or a short random id otherwise.
function getInstanceId(): string {
  if (process.env["HOSTNAME"]) return process.env["HOSTNAME"];
  return `api-${randomBytes(4).toString("hex")}`;
}
const instanceId = getInstanceId();
register.setDefaultLabels({ instance: instanceId, service: "api" });

promClient.collectDefaultMetrics({ register, prefix: "node_" });

// Custom gauges updated on each scrape so heap and event loop lag are never empty.
// (prom-client's default event loop lag uses setImmediate and can be one scrape behind.)
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

// Update heap gauges on every metrics scrape so they always have current values.
function syncHeapMetrics(): void {
  try {
    const mem = process.memoryUsage();
    heapUsedBytes.set(mem.heapUsed);
    heapTotalBytes.set(mem.heapTotal);
  } catch {
    // ignore
  }
}

// Measure event loop lag on an interval so the gauge is always populated.
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

export function metricsMiddleware(req: Request, res: Response, next: () => void): void {
  if (req.path === "/metrics") {
    next();
    return;
  }
  const start = performance.now();
  const route = getRoute(req.path);

  res.on("finish", () => {
    const duration = (performance.now() - start) / 1000;
    const status = String(res.statusCode);
    httpRequestDuration.observe({ method: req.method, route, status_code: status }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status_code: status });
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  syncHeapMetrics();
  res.setHeader("Content-Type", register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
}

export { register };
