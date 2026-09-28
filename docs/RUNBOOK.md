# Nexus Commerce Production Operations Runbook

This runbook provides actionable standard operating procedures (SOPs) for site reliability engineers (SREs), system operators, and developers maintaining the **Nexus Commerce** platform in staging and production environments.

---

## 1. Service Port & Architecture Matrix

| Service | Technology | Port | Liveness Probe | Readiness Probe |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Nginx | `3000` / `80` | `GET /` | `GET /` |
| **Backend API** | Node.js 22 + Express | `5000` | `GET /api/v1/health/live` | `GET /api/v1/health/ready` |
| **AI Microservice** | Python 3.12 + FastAPI | `8000` | `GET /health` | `GET /health` |
| **Database** | MongoDB 7.0 | `27017` | `mongosh --eval "db.adminCommand('ping')"` | Native ping |

---

## 2. Startup & Shutdown Procedures

### A. Local / Containerized Startup
```bash
# 1. Start all infrastructure and applications via Docker Compose
docker compose up -d

# 2. Verify all services are running and healthy
docker compose ps
```

### B. Manual Standalone Startup
```bash
# Terminal 1: AI Microservice
cd ai-service
./.venv/Scripts/python -m uvicorn app.main:app --port 8000

# Terminal 2: Backend API
cd backend
npm start

# Terminal 3: Frontend
cd frontend
npm run preview
```

### C. Graceful Shutdown
The backend service listens for `SIGTERM` and `SIGINT`:
1. Closes HTTP listener to stop accepting new requests.
2. Drains in-flight requests (10-second timeout).
3. Closes MongoDB connection pool via `dbManager.disconnect()`.
4. Flushes in-memory Winston logging buffers.

---

## 3. Health & Diagnostic Checks

### 1. Check Liveness Probe (Is process running?)
```bash
curl -i http://localhost:5000/api/v1/health/live
```
**Expected Response:** HTTP 200 OK
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 1420,
    "timestamp": "2026-09-16T12:00:00.000Z"
  }
}
```

### 2. Check Readiness Probe (Can traffic be served?)
```bash
curl -i http://localhost:5000/api/v1/health/ready
```
**Expected Response:** HTTP 200 OK (if connected) or HTTP 503 Service Unavailable (if DB down)

### 3. Check Real-Time Performance & Cache Metrics
```bash
curl -i http://localhost:5000/api/v1/health/metrics
```
Returns latency percentiles (average, p95, max), request throughput, memory usage, and cache hit/miss rates.

---

## 4. Log Inspection & Correlation

All backend requests generate structured JSON Winston logs with correlation IDs:
- **Header**: `X-Request-Id` (propagated from frontend client).
- **Log Locations**:
  - Stdout in containerized environments (`docker logs -f ecomm-backend`)
  - File sink in production: `backend/logs/app.log` and `backend/logs/error.log`

### Grep by Request ID:
```bash
grep "req-uuid-12345" backend/logs/app.log
```

---

## 5. Incident Response Playbooks

### Incident A: Sudden Spike in HTTP 500 Errors
1. Inspect error log:
   ```bash
   tail -n 50 backend/logs/error.log
   ```
2. Check MongoDB connectivity:
   ```bash
   curl -i http://localhost:5000/api/v1/health/ready
   ```
3. Check memory consumption:
   ```bash
   curl -s http://localhost:5000/api/v1/health | jq .data.system.memoryUsageMB
   ```
4. If out-of-memory occurs, restart the container:
   ```bash
   docker restart ecomm-backend
   ```

### Incident B: High Latency (> 1000ms p95)
1. Inspect slow query metrics:
   ```bash
   curl -s http://localhost:5000/api/v1/health/metrics | jq .data.latency
   ```
2. Verify cache efficiency:
   ```bash
   curl -s http://localhost:5000/api/v1/health/metrics | jq .data.cache
   ```
3. Check MongoDB current operations:
   ```bash
   mongosh "${MONGODB_URI}" --eval "db.currentOp({ 'secs_running': { '\$gte': 2 } })"
   ```

### Incident C: AI Service Unreachable
- Core e-commerce will continue operating without disruption.
- Recommendations gracefully switch to bestseller catalog fallbacks.
- To restart AI microservice:
  ```bash
  docker restart ecomm-ai-service
  ```

---

## 6. Zero-Downtime Deployment & Rollback Strategy

1. Deploy new container version in rolling fashion.
2. In-flight transactions are protected by connection draining.
3. If health checks fail during deployment:
   ```bash
   # Roll back to previous git revision or image tag
   git checkout <previous_stable_commit>
   npm run build
   npm start
   ```
