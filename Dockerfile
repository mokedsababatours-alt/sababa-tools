# Dockerfile
FROM node:20-alpine AS base

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl openssl-dev python3 make g++
WORKDIR /app

COPY package*.json ./

RUN npm ci --ignore-scripts

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm rebuild better-sqlite3

# Ensure public directory exists (Next.js expects it; COPY fails if missing)    
RUN mkdir -p public

RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache openssl wget curl su-exec

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY scripts/docker-entrypoint.sh /entrypoint.sh

RUN mkdir -p /app/data /app/public/uploads/icons && \
    chown nextjs:nodejs /app/data && \
    chown -R nextjs:nodejs /app/public/uploads && \
    chmod +x /entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
