# --- STAGE 1: Base & pnpm ---
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# --- STAGE 2: Dependencies ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc* ./
COPY apps/ui/package.json apps/ui/
COPY packages/schema/package.json packages/schema/
COPY packages/typescript-config/ packages/typescript-config/
RUN pnpm install --frozen-lockfile

# --- STAGE 3: Development ---
FROM deps AS development
COPY packages/schema/ packages/schema/
COPY apps/ui/ apps/ui/
WORKDIR /app/apps/ui
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# --- STAGE 4: Build ---
FROM deps AS builder
COPY packages/schema/ packages/schema/
COPY apps/ui/ apps/ui/
RUN pnpm --filter ui build

# --- STAGE 5: Production runner ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && npm install -g serve
COPY --from=builder /app/apps/ui/dist ./dist
EXPOSE 5173
CMD ["serve", "dist", "-s", "-l", "5173"]
