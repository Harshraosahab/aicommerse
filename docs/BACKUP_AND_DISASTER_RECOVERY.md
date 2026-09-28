# Production Database Backup & Disaster Recovery Architecture

## 1. Objective & Scope

This document outlines the operational disaster recovery (DR) procedures, backup strategies, and recovery objectives for the **Nexus Commerce** platform across its core data stores, backend APIs, AI microservices, and external payment integration.

---

## 2. Recovery Objectives

| Metric | Target | Rationale |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 1 Hour** | Maximum tolerable transactional data loss in an catastrophic multi-AZ outage. Point-in-Time Recovery (PITR) via continuous oplog capture minimizes data loss to minutes. |
| **Recovery Time Objective (RTO)** | **< 30 Minutes** | Time required to provision standby resources, restore database volumes, and re-point load balancers. |

---

## 3. MongoDB Backup Architecture

### A. Backup Frequency & Retention Policy

1. **Continuous Oplog Archival (Point-in-Time Recovery)**:
   - Captured continuously on MongoDB replica sets to enable point-in-time rollbacks to any second within the past 7 days.
2. **Daily Snapshots**:
   - Automated full snapshot captured daily at 02:00 UTC (off-peak traffic window).
   - Retained for **30 days**.
3. **Weekly & Monthly Cold Archives**:
   - Weekly snapshots retained for **12 weeks**.
   - Monthly snapshots encrypted and exported to object storage (e.g. AWS S3 Glacier or GCS Coldline) with write-once-read-many (WORM) immutability, retained for **1 year** for compliance.

### B. Backup Execution Procedures

#### 1. Native CLI Backup (`mongodump` with Gzip)
For self-hosted or Docker-orchestrated deployments:
```bash
# Execute compressed archive dump with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mongodump --uri="${MONGODB_URI}" \
  --gzip \
  --archive="/backups/mongodb_dump_${TIMESTAMP}.gz"

# Verify archive integrity
gzip -t "/backups/mongodb_dump_${TIMESTAMP}.gz" && echo "Backup verified successfully."
```

#### 2. Restoration Procedure
```bash
# Restore archive into target database
mongorestore --uri="${TARGET_MONGODB_URI}" \
  --gzip \
  --archive="/backups/mongodb_dump_${TIMESTAMP}.gz" \
  --drop
```

> [!WARNING]
> Never run destructive restoration commands (`--drop`) against production clusters without verifying the target connection string and snapshot timestamp.

---

## 4. Disaster Recovery Scenarios & Playbooks

### Scenario 1: Primary Database Instance Failure
1. **Automated Behavior**:
   - In a 3-node MongoDB replica set, the primary election automatically promotes a secondary node within 5–10 seconds.
   - The backend `dbManager` automatically retries disconnected queries using exponential backoff (2000ms delay, up to 5 attempts).
2. **Manual Intervention (If Cluster Down)**:
   - Check `GET /api/v1/health/ready` (returns HTTP 503 while database is disconnected).
   - Verify cluster connectivity: `mongosh "${MONGODB_URI}" --eval "db.adminCommand('ping')"`.
   - If storage is corrupted, restore the latest daily snapshot to a fresh replica set and update `MONGODB_URI` in container environment.

---

### Scenario 2: AI / Machine Learning Microservice Outage
1. **Degraded Mode Protection**:
   - The core e-commerce platform is architected to **never** crash or reject customer checkouts if the Python AI service is unreachable.
   - Recommendation queries gracefully fall back to genuine in-memory and database bestseller rules (`Product.find({ isActive: true, isBestseller: true })`).
   - Smart Search intent parsing safely falls back to standard text and catalog category regex matching.
2. **Recovery Playbook**:
   - Inspect AI service health: `curl -f http://localhost:8000/health`.
   - Inspect container logs: `docker logs ecomm-ai-service`.
   - Restart the microservice: `docker restart ecomm-ai-service`.

---

### Scenario 3: Payment Gateway (Razorpay) Outage
1. **Behavioral Protection**:
   - Checkout displays clean error notifications: `"Payment provider temporarily unavailable. Please try again or choose Cash on Delivery."`
   - Zero orphaned orders: Inventory reservation is tied to payment completion; failed checkouts do not hold negative stock.
2. **Recovery Playbook**:
   - Inspect provider status page (e.g. status.razorpay.com).
   - In case of delayed webhooks, the idempotency key in `Order.idempotencyKey` prevents duplicate order confirmation even if duplicate webhook payloads arrive after service recovery.

---

### Scenario 4: Failed Deployment / Bad Release
1. **Rollback Strategy**:
   - Revert load balancer to previous Docker image tag or previous GitHub release:
     ```bash
     # Revert to previous production container image
     docker compose pull backend:previous
     docker compose up -d --no-deps backend
     ```
   - Verify readiness probe: `curl -f http://localhost:5000/api/v1/health/ready`.
