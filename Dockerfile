# ============================================================
# Multi-stage Dockerfile for Plex2Stash v3.1.0
# ============================================================

# --- Stage 1: Base ---
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# --- Stage 2: Dependencies ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/plex-types/package.json ./packages/plex-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

# --- Stage 3: Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/plex-types/node_modules ./packages/plex-types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Remove Synology @eaDir directories that break Next.js App Router
RUN find . -name '@eaDir' -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Build packages first, then apps
RUN pnpm --filter @plex2stash/plex-types build
RUN pnpm --filter @plex2stash/api build
RUN DOCKER_BUILD=1 pnpm --filter @plex2stash/web build

# --- Stage 4: Production runner ---
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/data
ENV NEXT_PUBLIC_API_URL=http://localhost:8787

# Copy built API
COPY --from=build /app/packages/plex-types/dist ./packages/plex-types/dist
COPY --from=build /app/packages/plex-types/package.json ./packages/plex-types/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# Copy built Web (Next.js standalone)
COPY --from=build /app/apps/web/.next/standalone ./apps/web-standalone
COPY --from=build /app/apps/web/.next/static ./apps/web-standalone/apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web-standalone/apps/web/public
#COPY --from=build /app/apps/web/public ./apps/web-standalone/apps/web/public 2>/dev/null || true

# Copy root package files
COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create data volume mount point
RUN mkdir -p /data

EXPOSE 8787 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
