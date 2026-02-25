#!/usr/bin/env bash
set -e

# Reviewer production setup: build, swarm deploy, optional scale and k6.
# Usage: ./scripts/run-production.sh [--api-replicas N] [--run-k6] [--help]

STACK_NAME="flashdrop"
API_REPLICAS=""
RUN_K6=false
SCRIPT_DIR=""
ROOT=""

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

  Build production images, deploy the stack as '$STACK_NAME', optionally scale API and run k6.

Options:
  --api-replicas N, -n N   Scale flashdrop_api to N replicas after deploy (default: stack default 1)
  --run-k6, --k6           After deploy, run k6 mixed stress test via Docker
  --help                   Show this help and exit

Prerequisites: Docker, Docker Compose v2, Node and pnpm (for seed). For --run-k6: sale window active.
EOF
}

die() {
  echo "Error: $1" >&2
  exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-replicas|-n)
      [[ -n "${2:-}" && "$2" =~ ^[0-9]+$ ]] || die "--api-replicas requires a positive integer"
      API_REPLICAS="$2"
      shift 2
      ;;
    --run-k6|--k6)
      RUN_K6=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

# Resolve script dir and repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
if git -C "$SCRIPT_DIR" rev-parse --show-toplevel &>/dev/null; then
  ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
else
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  [[ -f "$ROOT/docker-compose.prod.yaml" && -f "$ROOT/docker-stack.yml" ]] || die "Repo root not found (missing docker-compose.prod.yaml or docker-stack.yml)"
fi
cd "$ROOT"

# --- Prerequisites ---
command -v docker >/dev/null 2>&1 || die "Docker is required. Install from https://docs.docker.com/get-docker/"
docker --version >/dev/null 2>&1 || die "Docker is required. Install from https://docs.docker.com/get-docker/"

docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is required (usually included with Docker Desktop)."

if ! docker info >/dev/null 2>&1; then
  die "Docker daemon is not running. Please start Docker and retry."
fi

# --- Build ---
echo "Building production images (api, frontend)..."
docker compose -f docker-compose.prod.yaml build api frontend || die "Build failed."

# --- Swarm init ---
SWARM_STATE="$(docker info -f '{{.Swarm.LocalNodeState}}' 2>/dev/null || true)"
if [[ "$SWARM_STATE" != "active" ]]; then
  echo "Initializing Docker Swarm..."
  docker swarm init || die "Swarm init failed."
fi

# --- Stack deploy ---
echo "Deploying stack '$STACK_NAME'..."
docker stack deploy -c docker-stack.yml "$STACK_NAME" || die "Stack deploy failed."

# --- Seed (MongoDB + Redis via apps/api seeder) ---
echo "Waiting for stack services to be ready..."
sleep 15
command -v pnpm >/dev/null 2>&1 || die "Node and pnpm are required for seeding. Install from https://pnpm.io/installation or run 'pnpm seed' manually after the stack is up."
echo "Running seed (apps/api)..."
DATABASE_URL="mongodb://127.0.0.1:27017/flashdrop" REDIS_URL="redis://127.0.0.1:6379" pnpm seed || die "Seed failed."

# --- Optional scale ---
if [[ -n "$API_REPLICAS" ]]; then
  echo "Scaling ${STACK_NAME}_api to $API_REPLICAS replicas..."
  docker service scale "${STACK_NAME}_api=$API_REPLICAS" || die "Scale failed."
fi

# --- Optional k6 ---
if [[ "$RUN_K6" == true ]]; then
  echo "Waiting for API to be reachable..."
  for i in {1..30}; do
    if curl -sf "http://127.0.0.1:4000/api/v1/health" >/dev/null 2>&1; then
      break
    fi
    [[ $i -eq 30 ]] && die "API did not become reachable at http://127.0.0.1:4000"
    sleep 2
  done
  echo "Running k6 mixed stress test..."
  K6_EXTRA=""
  case "$(uname -s)" in
    Linux*) K6_EXTRA="--add-host=host.docker.internal:host-gateway" ;;
  esac
  docker run --rm -i $K6_EXTRA \
    -e API_URL="http://host.docker.internal:4000" \
    -v "${ROOT}/scripts/k6:/scripts:ro" \
    grafana/k6 run /scripts/mixed.js || true
  echo "Note: For create-order/mixed, ensure sale window is active (seed data includes a default product)."
fi

# --- Success: print URLs (127.0.0.1) ---
echo ""
echo "Stack is up. Use these URLs (127.0.0.1):"
echo "  API:       http://127.0.0.1:4000"
echo "  Frontend:  http://127.0.0.1:5173"
echo "  Prometheus: http://127.0.0.1:9090"
echo "  Grafana (monitoring): http://127.0.0.1:4001"
echo ""
echo "Grafana is preconfigured for basic monitoring; open the Grafana URL to view dashboards."
