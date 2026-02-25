# Reviewer production setup: build, swarm deploy, optional scale and k6.
# Usage: .\scripts\run-production.ps1 [-ApiReplicas N] [-RunK6] [-Help]

param(
    [int]$ApiReplicas = 0,
    [switch]$RunK6,
    [switch]$Help
)

$ErrorActionPreference = "Stop"
$StackName = "flashdrop"

function Write-Usage {
    @"
Usage: $(Split-Path -Leaf $MyInvocation.ScriptName) [OPTIONS]

  Build production images, deploy the stack as '$StackName', optionally scale API and run k6.

Options:
  -ApiReplicas N   Scale ${StackName}_api to N replicas after deploy (default: stack default 1)
  -RunK6           After deploy, run k6 mixed stress test via Docker
  -Help            Show this help and exit

Prerequisites: Docker, Docker Compose v2, Node and pnpm (for seed). For -RunK6: sale window active.
"@
}

function Die {
    param([string]$Message)
    Write-Error "Error: $Message"
    exit 1
}

if ($Help) {
    Write-Usage
    exit 0
}

# Resolve repo root
$ScriptDir = Split-Path -Parent $MyInvocation.ScriptName
$Root = $ScriptDir
try {
    $gitRoot = & git -C $ScriptDir rev-parse --show-toplevel 2>$null
    if ($gitRoot) { $Root = $gitRoot }
} catch {
    $Root = Split-Path -Parent $ScriptDir
    if (-not ((Test-Path (Join-Path $Root "docker-compose.prod.yaml")) -and (Test-Path (Join-Path $Root "docker-stack.yml")))) {
        Die "Repo root not found (missing docker-compose.prod.yaml or docker-stack.yml)"
    }
}
Set-Location $Root

# --- Prerequisites ---
try {
    $null = & docker --version 2>&1
} catch {
    Die "Docker is required. Install from https://docs.docker.com/get-docker/"
}
if ($LASTEXITCODE -ne 0) {
    Die "Docker is required. Install from https://docs.docker.com/get-docker/"
}

try {
    $null = & docker compose version 2>&1
} catch {
    Die "Docker Compose v2 is required (usually included with Docker Desktop)."
}
if ($LASTEXITCODE -ne 0) {
    Die "Docker Compose v2 is required (usually included with Docker Desktop)."
}

& docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Die "Docker daemon is not running. Please start Docker and retry."
}

# --- Build ---
Write-Host "Building production images (api, frontend)..."
& docker compose -f docker-compose.prod.yaml build api frontend
if ($LASTEXITCODE -ne 0) { Die "Build failed." }

# --- Swarm init ---
$SwarmState = & docker info -f "{{.Swarm.LocalNodeState}}" 2>$null
if ($SwarmState -ne "active") {
    Write-Host "Initializing Docker Swarm..."
    & docker swarm init
    if ($LASTEXITCODE -ne 0) { Die "Swarm init failed." }
}

# --- Stack deploy ---
Write-Host "Deploying stack '$StackName'..."
& docker stack deploy -c docker-stack.yml $StackName
if ($LASTEXITCODE -ne 0) { Die "Stack deploy failed." }

# --- Seed (MongoDB + Redis via apps/api seeder) ---
Write-Host "Waiting for stack services to be ready..."
Start-Sleep -Seconds 15
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Die "Node and pnpm are required for seeding. Install from https://pnpm.io/installation or run 'pnpm seed' manually after the stack is up."
}
Write-Host "Running seed (apps/api)..."
$env:DATABASE_URL = "mongodb://127.0.0.1:27017/flashdrop"
$env:REDIS_URL = "redis://127.0.0.1:6379"
& pnpm seed
if ($LASTEXITCODE -ne 0) { Die "Seed failed." }

# --- Optional scale ---
if ($ApiReplicas -gt 0) {
    Write-Host "Scaling ${StackName}_api to $ApiReplicas replicas..."
    & docker service scale "${StackName}_api=$ApiReplicas"
    if ($LASTEXITCODE -ne 0) { Die "Scale failed." }
}

# --- Optional k6 ---
if ($RunK6) {
    Write-Host "Waiting for API to be reachable..."
    $maxAttempts = 30
    $attempt = 0
    $reached = $false
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:4000/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) { $reached = $true; break }
        } catch {}
        $attempt++
        if ($attempt -eq $maxAttempts) { Die "API did not become reachable at http://127.0.0.1:4000" }
        Start-Sleep -Seconds 2
    }
    Write-Host "Running k6 mixed stress test..."
    $k6Args = @("run", "--rm", "-i")
    if ($IsLinux) {
        $k6Args += "--add-host=host.docker.internal:host-gateway"
    }
    $k6Args += "-e", "API_URL=http://host.docker.internal:4000", "-v", "${Root}/scripts/k6:/scripts:ro", "grafana/k6", "run", "/scripts/mixed.js"
    & docker $k6Args
    Write-Host "Note: For create-order/mixed, ensure sale window is active (seed data includes a default product)."
}

# --- Success: print URLs (127.0.0.1) ---
Write-Host ""
Write-Host "Stack is up. Use these URLs (127.0.0.1):"
Write-Host "  API:        http://127.0.0.1:4000"
Write-Host "  Frontend:   http://127.0.0.1:5173"
Write-Host "  Prometheus: http://127.0.0.1:9090"
Write-Host "  Grafana (monitoring): http://127.0.0.1:4001"
Write-Host ""
Write-Host "Grafana is preconfigured for basic monitoring; open the Grafana URL to view dashboards."
