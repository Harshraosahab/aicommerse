# ==============================================================================
# Production Dockerfile: Node.js Backend API
# Multi-stage build with minimal attack surface and non-root execution
# ==============================================================================

# --- Stage 1: Build & TypeScript Compilation ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Prune dev dependencies for lean runtime artifact
RUN npm prune --production

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root system user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy compiled artifacts and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ensure app directory permissions
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

# Health check using native Node.js process check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/v1/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
