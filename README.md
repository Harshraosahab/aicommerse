# Nexus Commerce &bull; Production-Ready AI-Powered E-Commerce Platform

Nexus Commerce is a comprehensive, production-hardened, and enterprise-grade e-commerce platform designed from the ground up for high traffic, real dynamic data resilience, horizontal scalability, advanced AI/ML capabilities, and strict security compliance.

---

## System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                  Frontend Client (SPA)                                  |
|         React 18 + TypeScript + Vite + Route-Level Code Splitting (45 Chunks)           |
|         Zero CLS Visuals + Google Schema.org JSON-LD + Mobile-First (320px - 1440px)    |
+--------------------------------------------+--------------------------------------------+
                                             |
                   HTTP / Gzip Compression + Correlation ID (X-Request-Id)
                                             v
+-----------------------------------------------------------------------------------------+
|                                Express Backend API Tier                                 |
|  - Security: Helmet, Strict CORS, Rate Limiting, NoSQL Injection Sanitization           |
|  - Performance: Gzip Compression, In-Memory TTL Cache (appCache) with Invalidation      |
|  - Observability: Winston Structured Logging, Performance Telemetry, Correlation IDs   |
|  - Probes: /health/live (Liveness), /health/ready (Readiness), /health/metrics          |
|  - Resilient Shutdown: 10s Connection Draining on SIGTERM/SIGINT                         |
+---------------------+---------------------------------------------+---------------------+
                      |                                             |
           Mongoose (Connection Pool)                    HTTP / Non-blocking Proxy
                      v                                             v
+---------------------------------------+         +---------------------------------------+
|            MongoDB Cluster            |         |         AI / ML Microservice          |
|  - Compound Indexes for O(log N) runs |         |       Python 3.12/3.14 + FastAPI      |
|  - Atomic Inventory Decrements        |         |  - TF-IDF Vector Space Recommender    |
|  - Sparse Unique Idempotency Keys     |         |  - Smart Search Query NLP             |
|  - Zero Mock Data in Production       |         |  - Shopping Assistant LLM Gateway     |
+---------------------------------------+         +---------------------------------------+
```

---

## Implemented Capabilities (Phases 1 &ndash; 12)

1. **Authentication & User Management**:
   - Secure password hashing via `bcryptjs` (12 rounds) with account lockout defense.
   - JWT authentication via `HttpOnly`, `SameSite: Lax` secure cookies and `Bearer` headers.
   - Granular RBAC supporting `USER`, `ADMIN`, `SUPER_ADMIN`, `SUPPORT_AGENT`, and `PRODUCT_MANAGER`.
   - Complete IDOR/BOLA protection: profile and order queries bind strictly to authenticated tokens.

2. **Product Catalog & Discovery**:
   - Dynamic product search, filtering, and price range querying supported by MongoDB compound indexes.
   - Real-time stock status, SKU tracking, and multi-image galleries with explicit aspect ratios (zero CLS).

3. **Cart, Wishlist & Checkout**:
   - Server-side authoritative pricing, tax, and shipping fee calculation.
   - Atomic inventory stock reservation prevents overselling and race conditions under high concurrent checkouts.
   - Real coupon discount validation with usage caps.

4. **Order Management & Payment Gateway**:
   - Razorpay integration with timing-safe HMAC SHA-256 signature and webhook verification.
   - Deterministic idempotency keys prevent duplicate payments and duplicate order generation.
   - Order history, milestone tracking, and customer return/refund workflows.

5. **AI Recommendation Engine & Advanced Intelligence**:
   - Multi-strategy personalization: Personalized Feed, Similar Products, Related Category items, and Bestseller fallbacks.
   - Smart Search intent parsing extracting product categories and budget constraints.
   - Conversational AI Shopping Assistant with real-time catalog grounding.
   - Review sentiment intelligence, customer behavioral segmentation, and demand/inventory alerts.

6. **Customer Communications & Support**:
   - In-app notification center with real-time polling, categorized filtering, and preference toggles.
   - Transactional email dispatch with responsive HTML templates and unconfigured SMTP audit logging.
   - Full customer support ticketing system with sequence IDs (`TKT-YYYYMMDD-XXXX`) and threaded replies.
   - Searchable Help Center and FAQ knowledgebase with Google `FAQPage` Schema.org injection.

7. **Technical SEO & Mobile Responsiveness**:
   - Dynamic XML sitemap (`/sitemap.xml`) and crawler control (`/robots.txt`) generated from live MongoDB models.
   - Automated Schema.org JSON-LD: `Product` (authentic ratings only), `BreadcrumbList`, `Organization`, `FAQPage`.
   - Strict `noindex, nofollow` robots directives for private customer and administrative routes.
   - Tested responsive layout verified from 320px mobile screens up to 1440px desktop displays.

8. **Performance, Caching & Scalability**:
   - Route-level code splitting (`React.lazy()`) drops initial bundle size to **59.32 kB** (17.69 kB gzip).
   - In-memory TTL caching foundation (`appCache`) with automated prefix invalidation on database mutations.
   - Gzip HTTP compression on all JSON, XML, and HTML payloads.
   - MongoDB connection pooling (`maxPoolSize: 50`, `minPoolSize: 5`, `maxIdleTimeMS: 30000`).

---

## Production Security Controls

- **NoSQL Injection Defense**: Global middleware cleanses all request bodies, queries, and route parameters by stripping operator injection keys (`$gt`, `$ne`, `$where`, etc.).
- **Strict Authorization**: User ownership validation across cart, wishlist, orders, notifications, support tickets, and profile endpoints.
- **Rate Limiting**: Tiered limits on authentication attempts (20 req / 15 min) and API requests (1,000 req / 15 min).
- **Security Headers**: Configured via Helmet including `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and strict CORS origin whitelisting.
- **Non-Root Containers**: Docker images run as unprivileged system users (`appuser` / `nginx`).

---

## Local Development & Docker Orchestration

### Prerequisites
- Node.js 22+ & npm
- Python 3.12+ (or 3.14)
- MongoDB 7.0 (local instance or Docker)

### Option A: Running via Docker Compose (Recommended)
```bash
# 1. Clone repository
git clone <repo-url>
cd ecomm

# 2. Start fullstack stack (MongoDB, AI Service, Backend, Frontend)
docker compose up --build -d

# 3. Check health status
docker compose ps
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`

### Option B: Running Standalone Locally
```bash
# 1. Start AI Microservice
cd ai-service
./.venv/Scripts/python -m uvicorn app.main:app --port 8000

# 2. Start Backend API
cd ../backend
npm install
npm run dev

# 3. Start Frontend Client
cd ../frontend
npm install
npm run dev
```

---

## Health Probes & Monitoring Endpoints

| Endpoint | Method | Purpose | Response |
| :--- | :--- | :--- | :--- |
| `/api/v1/health/live` | `GET` | Kubernetes Liveness Probe | HTTP 200 `{ status: "ok" }` |
| `/api/v1/health/ready` | `GET` | Kubernetes Readiness Probe (DB Ping) | HTTP 200 (Ready) / HTTP 503 (Unready) |
| `/api/v1/health/metrics`| `GET` | Real-Time Telemetry (Latency, Cache) | HTTP 200 (Latency percentiles, RPS) |
| `/api/v1/health` | `GET` | Comprehensive System Diagnostics | HTTP 200 (Memory, Node, AI status, DB) |

---

## Testing & Quality Verification

### Run Full Test Suite
```bash
# Backend (17 test files, 150+ tests)
cd backend && npm test

# Frontend (18 test files, 99 tests)
cd ../frontend && npm test -- --run

# AI Service (4 test files, 17 tests)
cd ../ai-service && pytest
```

### Run Automated Load Test
```bash
cd backend
npx tsx scripts/load-test.ts
```

### Run Production Builds
```bash
# Backend
cd backend && npm run build

# Frontend
cd ../frontend && npm run build
```

---

## Production Runbooks & Disaster Recovery
- [Disaster Recovery & Backup Strategy](docs/BACKUP_AND_DISASTER_RECOVERY.md)
- [Production Operations Runbook](docs/RUNBOOK.md)
- [System Architecture Specification](docs/ARCHITECTURE.md)

---

## Known Limitations & Configuration Required

1. **Payment Gateway**: Live payment transactions require valid `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. In development, orders default to Cash on Delivery (COD) or simulated test tokens.
2. **Email Delivery (SMTP)**: Transactional emails require production SMTP credentials (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). When unconfigured, dispatches are logged to `CommunicationLog` as simulated for development safety.
3. **Multi-Region Distributed Caching**: In-memory caching (`appCache`) operates within individual backend instances. For multi-region multi-node deployments with hundreds of backend instances, configure Redis or Memcached as a distributed cache layer.
