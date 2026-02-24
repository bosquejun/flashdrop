FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc* ./
COPY apps/ui/package.json apps/ui/
COPY packages/shared-schemas/package.json packages/shared-schemas/
COPY packages/typescript-config/ packages/typescript-config/

RUN pnpm install --no-frozen-lockfile

COPY packages/shared-schemas/ packages/shared-schemas/
COPY apps/ui/ apps/ui/

WORKDIR /app/apps/ui

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]
