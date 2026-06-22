# 1. Tahap Base (Setup NPM/PNPM)
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 2. Tahap Builder (Build Aplikasi)
FROM base AS builder
WORKDIR /app

# 1. Copy HANYA file terkait dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
# Jika pakai monorepo, copy package.json dari tiap aplikasi/packages
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# 2. Install dependencies (layer ini akan di-cache Docker selama tidak ada penambahan package baru)
RUN pnpm install --frozen-lockfile

# 3. Baru salin seluruh sisa source code
COPY . .

# 4. Build aplikasinya
RUN pnpm --filter web build

# 3. Tahap Runner (Menjalankan Aplikasi)
FROM base AS runner
WORKDIR /app

# BARU SET NODE_ENV=production DI SINI
ENV NODE_ENV=production
ENV PORT=3000

# Copy hasil build standalone Next.js dari tahap builder
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

# Menjalankan Next.js server bawaan hasil standalone build
CMD ["node", "apps/web/server.js"]