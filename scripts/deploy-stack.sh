#!/usr/bin/env bash
# Deploy Flashdrop stack to Docker Swarm.
# Usage:
#   ./scripts/deploy-stack.sh              # build local image and deploy
#   ./scripts/deploy-stack.sh --push       # build, push to registry, deploy
#   ./scripts/deploy-stack.sh --deploy-only  # deploy only (use existing API_IMAGE)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STACK_NAME="${STACK_NAME:-flashdrop}"

DEPLOY_ONLY=false
PUSH=false
for arg in "$@"; do
  case "$arg" in
    --deploy-only) DEPLOY_ONLY=true ;;
    --push)        PUSH=true ;;
  esac
done

# Load env for API_IMAGE, DATABASE_URL, etc.
if [[ -f "$ROOT_DIR/.env.stack" ]]; then
  set -a
  source "$ROOT_DIR/.env.stack"
  set +a
fi

export API_IMAGE="${API_IMAGE:-flashdrop/api:latest}"

if [[ "$DEPLOY_ONLY" != true ]]; then
  echo "Building API image: $API_IMAGE"
  docker build -t "$API_IMAGE" -f "$ROOT_DIR/apps/api/Dockerfile" "$ROOT_DIR"
  if [[ "$PUSH" == true ]]; then
    docker push "$API_IMAGE"
  fi
fi

echo "Deploying stack $STACK_NAME..."
(cd "$ROOT_DIR" && docker stack deploy -c docker-stack.yml --with-registry-auth "$STACK_NAME")

echo "Done. Check: docker stack services $STACK_NAME"
