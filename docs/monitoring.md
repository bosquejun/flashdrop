# Monitoring and observability

Flashdrop uses Prometheus for metrics and Grafana for dashboards. The API is instrumented with [prom-client](https://github.com/siimon/prom-client); metrics are exposed at `/metrics`.

## Running the stack (Docker Compose)

From the repo root:

```bash
docker compose up
```

- **Prometheus**: `http://127.0.0.1:9090` — scrapes `api:4000/metrics` every 15s.
- **Grafana**: `http://127.0.0.1:4001` (HTTP port is set to 4001 to avoid conflicts with the API on 4000).

### Grafana access

| Item | Value |
|------|--------|
| URL | http://127.0.0.1:4001 |
| Username | `admin` |
| Password | `admin` |

Change the default password on first login. For production, set `GF_SECURITY_ADMIN_PASSWORD` (and optionally `GF_SECURITY_ADMIN_USER`) in the Grafana service environment.

### Dashboards

Dashboards are provisioned from `grafana/provisioning/dashboards/json/` and appear under the **Flashdrop** folder in Grafana:

- **Flashdrop API** — Throughput (req/s), latency (p95, p99), error rate, HTTP status breakdown, rate-limit rejections (429), Redis and MongoDB operation metrics, flash sale stock gauges.

No manual import is required when using Docker Compose with the provisioned setup.

## Metrics

The API exposes standard HTTP metrics plus custom gauges:

- `http_requests_total` — Counter by method, path (normalized), status, instance.
- `http_request_duration_seconds` — Histogram by method, path, status, instance.
- `http_rate_limit_exceeded_total` — Counter for 429 responses when the global rate limiter is enabled.
- Flash sale stock gauges (e.g. `flashdrop_stock_available`, `flashdrop_stock_total`) — Synced from Redis at scrape time for the seeded product(s).

Path normalization: `/metrics` is reported as `/metrics`; other paths may be grouped to limit cardinality.

## Instance identity (multi-replica)

When running multiple API replicas (e.g. Docker Swarm or Kubernetes), each instance should have a unique `HOSTNAME` (or equivalent) so Prometheus labels and Grafana dashboards can distinguish them. The API uses the `instance` label from the scrape target; in Swarm, Prometheus is configured with DNS discovery (`tasks.flashdrop_api`) so each task gets a different target and label.

## Rate limiter and 429

The global rate limiter is **disabled by default** (e.g. for stress tests). Set `ENABLE_GLOBAL_RATE_LIMITER=true` for the API to enable it. When enabled, rate-limit rejections are counted in `http_rate_limit_exceeded_total` and can be visualized in the Flashdrop API dashboard.

## Production notes

- Use strong Grafana credentials and consider auth proxy or SSO.
- Prometheus retention and storage: adjust `--storage.tsdb.retention.time` and volume size as needed.
- For alerting, add Alertmanager and configure rules in Prometheus; optionally add Grafana alerting.
