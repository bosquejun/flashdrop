# Scripts

## Production run for reviewers

One-command production build and deploy for assessors: build images, start Docker Swarm (if needed), deploy the stack as `flashdrop`, and optionally scale the API or run k6 stress tests.

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
