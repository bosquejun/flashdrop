# --- STAGE 1: Base & pnpm ---
FROM node:22-alpine AS base
RUN npm install -g pnpm@9.0.0
WORKDIR /app

# --- STAGE 2: Build Environment ---
FROM base AS builder
COPY . .
# 1. Install ALL dependencies (including devDeps for building)
RUN pnpm install --frozen-lockfile
# 2. Build the app
RUN pnpm --filter api build
# 3. ISOLATE the api app and its PROD dependencies into /app/pruned
RUN pnpm --filter api --prod deploy /app/pruned

# --- STAGE 3: Production Runner ---
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
