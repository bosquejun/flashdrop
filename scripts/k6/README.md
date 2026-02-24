# k6 stress tests

Requires [k6](https://k6.io/docs/get-started/installation/) installed (CLI binary or Docker).

**Prerequisites:** API, MongoDB, and Redis running; `pnpm seed`; sale window active for create-order/mixed to get 201s.

**Run:**

- `pnpm stress:sale-status` — GET sale-status only (ramp 50→100 VUs, p95 &lt; 500ms, error rate &lt; 1%).
- `pnpm stress:create-order` — POST orders with unique user per iteration (ramp 20→50 VUs; 201/4xx accepted).
- `pnpm stress:mixed` — GET sale-status then POST order when status is "active".

**Env:** `API_URL` or `BASE_URL` (default `http://127.0.0.1:4000`), optional `SKU` (default seed product SKU).

**HTML report:** `k6 run --out html=report.html scripts/k6/sale-status.js`

### Running with Docker

Inside the container, `127.0.0.1` is the container itself, not your host, so the default URL will get "connection refused". Point k6 at the host and (on Linux) add the host gateway:

```bash
# Linux (host.docker.internal needs to be set)
docker run -i --add-host=host.docker.internal:host-gateway \
  -e API_URL=http://host.docker.internal:4000 \
  -v "$(pwd)/scripts/k6:/scripts" \
  grafana/k6 run /scripts/sale-status.js
```

On Mac/Windows Docker Desktop, `host.docker.internal` usually works without `--add-host`; you can omit it and run:

```bash
docker run -i -e API_URL=http://host.docker.internal:4000 \
  -v "$(pwd)/scripts/k6:/scripts" \
  grafana/k6 run /scripts/sale-status.js
```

Using `-v` mounts your scripts so you don't need stdin; replace `sale-status.js` with `create-order.js` or `mixed.js` for the other tests.
