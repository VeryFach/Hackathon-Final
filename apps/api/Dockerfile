FROM node:22-slim AS base
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# ======================
# PRUNER
# ======================
FROM base AS pruner
WORKDIR /app

COPY . .
RUN pnpm dlx turbo prune api --docker

# ======================
# INSTALLER
# ======================
FROM base AS installer
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# generate prisma MANUAL (NOT postinstall)
RUN pnpm --filter api exec prisma generate

# ======================
# BUILD
# ======================
FROM installer AS builder

RUN pnpm turbo run build --filter=api

# ======================
# RUNTIME
# ======================
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN useradd -m appuser
USER appuser

# 1. Salin node_modules root dan level aplikasi agar NestJS bisa berjalan
COPY --from=installer --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=installer --chown=appuser:appuser /app/apps/api/node_modules ./apps/api/node_modules

# 2. Salin packages berbagi (seperti @repo/dto) agar symlink pnpm tidak putus
COPY --from=builder --chown=appuser:appuser /app/packages ./packages

# 3. Salin hasil build dari builder ke posisi aslinya
COPY --from=builder --chown=appuser:appuser /app/apps/api/dist ./apps/api/dist

# 3.5 Salin package.json root dan aplikasi
COPY --from=installer --chown=appuser:appuser /app/package.json ./package.json
COPY --from=installer --chown=appuser:appuser /app/apps/api/package.json ./apps/api/package.json

COPY --from=installer --chown=appuser:appuser /app/apps/api/prisma ./apps/api/prisma
COPY --from=installer --chown=appuser:appuser /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts

EXPOSE 3001

CMD ["sh", "-c", "cd apps/api && npx prisma db push && node dist/src/main.js"]
