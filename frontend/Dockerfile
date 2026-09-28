# ==============================================================================
# Production Dockerfile: React + Vite Single Page Application
# Multi-stage build: Compile frontend -> Serve static assets with Nginx Alpine
# ==============================================================================

# --- Stage 1: Build Application ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.node.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# --- Stage 2: Serve with Nginx Alpine ---
FROM nginx:1.27-alpine AS runner

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built static artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized SPA nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
