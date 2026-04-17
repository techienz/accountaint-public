# syntax=docker/dockerfile:1.7
# Accountaint — NZ business accounting app
# Multi-stage build on Debian slim (glibc) for native-module compatibility
# (better-sqlite3, @lancedb/lancedb both ship glibc prebuilt binaries).

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — all dependencies (used by builder)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# No Chrome download during dependency install; runner stage installs it.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: prod-deps — production dependencies only (used by runner)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS prod-deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Skip Puppeteer's postinstall Chrome download — the runner stage installs
# Chrome once into PUPPETEER_CACHE_DIR. Otherwise we ship ~500MB of Chrome twice.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: builder — produce .next/standalone output
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Dummy values required at build time (they're not used — real values come from runtime env).
ENV APP_ENCRYPTION_KEY=0000000000000000000000000000000000000000000000000000000000000000 \
    JWT_SECRET=build-time-placeholder-not-used-at-runtime \
    VAPID_PUBLIC_KEY=build-time-placeholder \
    VAPID_PRIVATE_KEY=build-time-placeholder \
    VAPID_EMAIL=mailto:build@placeholder \
    ANTHROPIC_API_KEY=build-time-placeholder

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: runner — minimal runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/data/accountaint.db \
    PUPPETEER_CACHE_DIR=/app/.puppeteer-cache

# Production node_modules (for Puppeteer + native modules the standalone output
# may not have traced because they're loaded via dynamic import).
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules

# Next.js standalone output + static assets + public/
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Migration files + entrypoint script (run migrations before starting server)
COPY --from=builder --chown=node:node /app/drizzle ./drizzle
COPY --from=builder --chown=node:node /app/scripts/migrate-and-start.mjs ./migrate-and-start.mjs

# Runtime deps + Puppeteer's bundled Chrome in one layer so apt index stays valid.
# Puppeteer's own installer pulls in the correct shared libs for whatever
# Chrome for Testing version Puppeteer 24.x targets.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      wget \
      fonts-liberation \
      fonts-noto-color-emoji \
      fonts-noto-cjk \
    && mkdir -p /app/.puppeteer-cache \
    && npx -y puppeteer@24 browsers install chrome --install-deps \
    && chown -R node:node /app/.puppeteer-cache \
    && rm -rf /var/lib/apt/lists/*

# Writable .next for prerender cache
RUN mkdir -p .next && chown node:node .next

# Data mount point. Host must bind-mount ./data here and own it as UID 1000 (node user).
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "migrate-and-start.mjs"]
