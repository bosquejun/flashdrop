# --- STAGE 1: Base & pnpm ---
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# --- STAGE 2: Dependencies (for development) ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json .npmrc* ./
COPY apps/api/package.json apps/api/
COPY packages/schema/package.json packages/schema/
COPY packages/logger/package.json packages/logger/
COPY packages/utils/package.json packages/utils/
COPY packages/typescript-config/ packages/typescript-config/
RUN pnpm install --frozen-lockfile

# --- STAGE 3: Development ---
FROM deps AS development
COPY packages/schema/ packages/schema/
COPY packages/logger/ packages/logger/
COPY packages/utils/ packages/utils/
COPY apps/api/ apps/api/
WORKDIR /app
EXPOSE 4000
CMD ["pnpm", "--filter", "api", "dev"]

# --- STAGE 4: Build Environment ---
FROM base AS builder
COPY . .
# 1. Install ALL dependencies (including devDeps for building)
RUN pnpm install --frozen-lockfile
# 2. Build the app
RUN pnpm --filter api build
# 3. ISOLATE the api app and its PROD dependencies into /app/pruned
RUN pnpm --filter api --prod deploy /app/pruned

# --- STAGE 5: Production Runner ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy the isolated/pruned folder created by pnpm deploy
COPY --from=builder /app/pruned ./

# Move into the isolated api folder
WORKDIR /app
EXPOSE 4000

# Run the compiled code directly
CMD ["node", "dist/index.js"]
