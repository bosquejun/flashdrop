# Scripts

## Production run

One-command production build and deploy: build images, start Docker Swarm, deploy the stack as `flashdrop`, and optionally scale the API or run k6 stress tests.

**Usage (Linux / macOS, or Windows via Git Bash / WSL):**

```bash
./scripts/run-production.sh [--api-replicas N] [--run-k6] [--help]
```

**Usage (Windows PowerShell):**

```powershell
.\scripts\run-production.ps1 [-ApiReplicas N] [-RunK6] [-Help]
```

**Options:**

- `--api-replicas N` / `-ApiReplicas N` — Scale `flashdrop_api` to N replicas after deploy (default: 1).
- `--run-k6` / `-RunK6` — After deploy, run the k6 mixed stress test via Docker (no local k6 install required).

**Prerequisites:**

- Docker and Docker Compose v2 (see [Get Docker](https://docs.docker.com/get-docker/)).
- Node and pnpm (used to run the API seeder from `apps/api` after the stack is up; see [pnpm installation](https://pnpm.io/installation)).
- For `--run-k6`: an active sale window (the script seeds the DB automatically; ensure the seeded product’s sale window includes current time).

After a successful run, the script prints URLs (API, Frontend, Prometheus, Grafana) using `http://127.0.0.1`; open the Grafana URL for preconfigured monitoring dashboards.

---

- [k6 stress tests](k6/README.md) — Sale-status, create-order, mixed; run locally or via Docker.


## Node cluster workers configuration

The API server runs in a Node.js cluster for high throughput. **You can configure the number of worker processes per container/replica using the `WORKERS` environment variable.** This controls how many Node.js workers are spawned by each API instance, enabling you to tune concurrency per replica.

- **Docker Compose:**  
  In [`docker-compose.yaml`](../docker-compose.yaml), set the number of workers by editing the `WORKERS` variable under the `api.environment` section (see around line 47):

  ```yaml
  api:
    # ...
    environment:
      # ...
      WORKERS: 1  # <-- set to desired worker count, e.g. number of CPU cores
  ```

- **Production/Swarm:**  
  The same environment variable is used in `docker-stack.yml` for Swarm deployments.

**Recommendations:**
- For local development or most laptops, `WORKERS: 1` is usually plenty.
- On production servers, you may set `WORKERS` to the number of available CPU cores (`WORKERS: 4`, `WORKERS: 8`, etc.) for improved concurrency per container.

> **Note:** Each API container will create the specified number of workers. If scaling out with `--api-replicas N`, the *total* number of Node workers will be `N * WORKERS`.

See [docker-compose.yaml](../docker-compose.yaml) (`api.environment.WORKERS`, line 47) and API README for details.
