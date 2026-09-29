# Nexus Commerce

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8.12-47A248?logo=mongodb)](https://www.mongodb.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.12-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment_Gateway-0C2340?logo=razorpay)](https://razorpay.com/)
[![Vitest](https://img.shields.io/badge/Vitest-103_Tests_Passed-yellow?logo=vitest)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

Nexus Commerce is a full-stack, scalable e-commerce platform built with a microservice architecture. It combines a React + TypeScript single-page application, a Node.js/Express transactional API with MongoDB, and an asynchronous Python FastAPI service for semantic product search and catalog intelligence.

---

## Table of Contents
- [Architecture](#architecture)
- [Features](#features)
  - [Storefront & Catalog](#storefront--catalog)
  - [Payments & Checkout](#payments--checkout)
  - [Search & Catalog Intelligence](#search--catalog-intelligence)
  - [Admin Dashboard](#admin-dashboard)
  - [Support & Notifications](#support--notifications)
- [Security & Resilience](#security--resilience)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Running with Docker Compose](#running-with-docker-compose)
  - [Running Standalone Locally](#running-standalone-locally)
- [Environment Variables](#environment-variables)
- [Health Probes & Telemetry](#health-probes--telemetry)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Architecture

```
+-----------------------------------------------------------------------------------------+
|                                  Frontend Client (SPA)                                  |
|         React 18 + TypeScript + Vite + Route-Level Code Splitting (45+ Chunks)          |
|         Accessible UI + Google Schema.org JSON-LD + Responsive (320px - 1440px)         |
|         Razorpay Checkout SDK Integration (Asynchronous Preload & Handshake)            |
+--------------------------------------------+--------------------------------------------+
                                             |
                   HTTP / Gzip Compression + Correlation ID (X-Request-Id)
                                             v
+-----------------------------------------------------------------------------------------+
|                                Express Backend API Tier                                 |
|  - Security: Helmet, CORS, Rate Limiting, NoSQL Injection Sanitization                  |
|  - Concurrency: Atomic Stock Reservation, Idempotent Order Processing                   |
|  - Payments: Razorpay Gateway, HMAC-SHA256 Signature Verification, Webhooks            |
|  - Performance: In-Memory TTL Cache (appCache) with Automatic Invalidation             |
|  - Observability: Winston Structured Logging, Health Probes (/health/live, /ready)      |
+---------------------+---------------------------------------------+---------------------+
                      |                                             |
           Mongoose (Connection Pool)                    HTTP / Internal Proxy
                      v                                             v
+---------------------------------------+         +---------------------------------------+
|            MongoDB Cluster            |         |         AI / Search Service           |
|  - Compound Indexes for Product Query |         |       Python 3.12+ / FastAPI          |
|  - Atomic $inc Inventory Decrement    |         |  - TF-IDF Vector Recommender          |
|  - Unique Sparse Idempotency Keys     |         |  - Natural Language Intent Search     |
|  - Referential Integrity Constraints  |         |  - Catalog Copilot & Insights         |
+---------------------------------------+         +---------------------------------------+
```

---

## Features

### Storefront & Catalog
- **Product Browsing**: Filter by category, brand, rating, and price range with sorting options.
- **Cart & Wishlist**: Server-persisted shopping cart with real-time stock validation and line-item calculation.
- **Responsive Design**: Mobile-first design system verified from 320px screens up to 1440px desktop displays.
- **SEO Optimization**: Schema.org JSON-LD structured data for `Product`, `BreadcrumbList`, and `Organization`.
- **E-Commerce Footer**: Service highlights, store directory, newsletter subscription, and accepted payment method badges.

### Payments & Checkout
- **Payment Methods**: Credit/Debit Cards, UPI, NetBanking, and Cash on Delivery (COD).
- **Razorpay Integration**: Native checkout modal with dynamic SDK script loader and preloading.
- **Digital Signature Verification**: Timing-safe HMAC SHA-256 signature verification comparing `order_id + "|" + payment_id` against the secret key.
- **Server Webhooks**: Direct webhook handler (`/api/v1/payments/webhook`) ensuring orders update to `PAID` even if customer drops connection.
- **Idempotency Support**: Client-supplied idempotency keys prevent duplicate order creation on network retries.

### Search & Catalog Intelligence
- **Semantic Smart Search**: Intent parsing extracting target categories, specifications, and maximum budgets from natural language queries.
- **Product Recommendations**: Hybrid recommendations using user session telemetry and category affinity scoring, with bestseller fallbacks.
- **Catalog Copilot**: Administrative tools for generating product summaries and SEO tags.

### Admin Dashboard
- **Product & Inventory**: Stock level monitoring with low-stock warnings and SKU management.
- **Order Management**: Status tracking (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`).
- **Payment & Refund Ledger**: Transaction logs with support for full and partial refunds.
- **Audit Logs**: Immutable activity logging for administrative actions.

### Support & Notifications
- **Ticketing System**: Sequenced support tickets (`TKT-YYYYMMDD-XXXX`) with threaded messaging.
- **Knowledge Base**: Searchable Help Center and FAQ articles.
- **Notifications Hub**: In-app alerts for order updates and user preference controls.

---

## Security & Resilience

- **Atomic Inventory Deductions**: Uses MongoDB atomic updates (`$inc: { stock: -qty }` with condition `{ stock: { $gte: qty } }`) to prevent overselling during concurrent checkouts.
- **Zero Plain-Text Credential Leaks**: Sensitive configuration keys (`MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_SECRET`) are masked before transmission.
- **NoSQL Injection Sanitization**: Strips operator injection keys (`$gt`, `$ne`, `$where`) across request bodies, queries, and params.
- **JWT via Secure Cookies**: Session tokens stored with `httpOnly`, `SameSite: Lax`, and `Secure` flags.
- **Rate Limiting**: Multi-tiered rate limiters protecting authentication routes and global API endpoints.
- **Security Headers**: Standard security headers configured via Helmet along with origin-restricted CORS.

---

## Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router v6, Context API, CSS Variables |
| **Backend** | Node.js, Express, TypeScript, Mongoose / MongoDB, Zod |
| **Search / AI** | Python 3.12+, FastAPI, Uvicorn, Pydantic, HTTPX |
| **Payments** | Razorpay Node SDK, Razorpay Checkout JS, HMAC SHA-256 |
| **Security & Logging**| Helmet, express-rate-limit, bcryptjs, Winston, cookie-parser |
| **Testing** | Vitest, React Testing Library, Supertest, Pytest |
| **Deployment** | Docker, Docker Compose |

---

## Repository Structure

```
├── frontend/               # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/     # UI components (catalog, layout, common)
│   │   ├── context/        # Auth, Cart, Theme contexts
│   │   ├── pages/          # Customer & Admin routes (code-split)
│   │   ├── routes/         # React Router configuration
│   │   ├── services/       # Typed API clients
│   │   ├── styles/         # CSS variables & layout styles
│   │   ├── utils/          # Helpers (razorpay.ts, currency.ts, etc.)
│   │   └── tests/          # 19 test suites, 103 unit/integration tests
│   └── index.html          # HTML entry point with Razorpay SDK
├── backend/                # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/         # Environment validation (Zod) & DB setup
│   │   ├── controllers/    # API endpoint controllers
│   │   ├── middleware/     # Auth, rate-limit, sanitizer, error handler
│   │   ├── models/         # Mongoose models (Order, Product, User, etc.)
│   │   ├── routes/         # API route definitions (/api/v1/*)
│   │   ├── services/       # Business logic, Razorpay provider, inventory
│   │   └── utils/          # Errors, crypto helpers, Winston logger
│   └── tests/              # Backend integration tests
├── ai-service/             # Python FastAPI Service
│   ├── app/
│   │   ├── api/            # Search & recommendation routers
│   │   ├── core/           # Settings & configuration
│   │   └── services/       # Intent parser & recommender models
│   └── tests/              # Pytest test suite
├── docs/                   # System architecture and operational runbooks
└── docker-compose.yml      # Multi-container orchestration
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- MongoDB 7.0+ (Local or MongoDB Atlas)
- Git

### Running with Docker Compose

```bash
# 1. Clone repository
git clone <repo-url>
cd ecomm

# 2. Configure environment
cp .env.example .env

# 3. Start containers
docker compose up --build -d

# 4. Check status
docker compose ps
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`

---

### Running Standalone Locally

#### 1. AI / Search Service
```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

#### 2. Backend API
```bash
cd backend
npm install
npm run seed:admin              # Seeds default admin user
npm run dev
```

#### 3. Frontend Application
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Sample `.env` file configuration:

```env
# Server
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000/api/v1

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ecomm_platform

# Security
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# AI Microservice
AI_SERVICE_URL=http://localhost:8000
```

---

## Health Probes & Telemetry

| Endpoint | Method | Description | Response |
| :--- | :--- | :--- | :--- |
| `/api/v1/health/live` | `GET` | Liveness probe | `{"status": "ok"}` |
| `/api/v1/health/ready` | `GET` | Readiness probe (DB connection check) | `{"status": "ready"}` |
| `/api/v1/health/metrics` | `GET` | Real-time latency and cache statistics | JSON metrics |
| `/api/v1/health` | `GET` | Full diagnostic report (Node, Mongo, AI) | Diagnostic JSON |

---

## Testing

### Frontend Test Suite
```bash
cd frontend
npm test -- --run
```
*Runs 19 test suites covering 103 unit and integration tests (responsiveness, authentication, cart, checkout, admin).*

### Backend Integration Tests
```bash
cd backend
npm test
```

### Production Build Verification
```bash
cd frontend
npm run build

cd ../backend
npm run build
```

---

## Documentation

- [System Architecture Blueprint](docs/ARCHITECTURE.md) &mdash; Detailed system design, data topology, and protocol specifications.
- [Database Schema & Data Models](docs/DATA_MODELS.md) &mdash; Entity schemas, indexes, and relations.
- [Operations Runbook](docs/RUNBOOK.md) &mdash; Deployment steps, operational commands, and troubleshooting guides.
- [Disaster Recovery & Backup Policy](docs/BACKUP_AND_DISASTER_RECOVERY.md) &mdash; RPO, RTO, and database failover procedures.

---

## License
MIT License &copy; 2026 Nexus Commerce Inc.
