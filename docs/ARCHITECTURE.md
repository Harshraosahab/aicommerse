# System Architecture - Phase 1 Foundation

## High-Level Topology

```
+-------------------------------------------------------------+
|                      Client (Browser)                       |
|               React 18 + TypeScript + Vite                  |
|               Mobile-First Responsive Layout                |
+------------------------------+------------------------------+
                               |
                               | REST (JSON)
                               v
+-------------------------------------------------------------+
|                     Backend API Server                      |
|                  Node.js + Express + TS                     |
|  - Centralized Error Handling  - Structured Winston Logging  |
|  - Zod Environment Validation  - Security Headers & CORS    |
|  - Rate Limiting Foundation   - Versioned Routes (/api/v1)  |
+---------------+-----------------------------+---------------+
                |                             |
                | Mongoose                    | HTTP / Internal RPC
                v                             v
+-------------------------------+   +-------------------------+
|        MongoDB Cluster        |   |    AI / ML Service      |
|    (Connection Manager with   |   |   Python 3.14 + FastAPI |
|      Retry & Diagnostics)     |   |   (Stateless Microsvc)  |
+-------------------------------+   +-------------------------+
```

## Architectural Tenets
1. **Separation of Concerns**:
   - UI concerns live strictly in `frontend/`.
   - Business orchestration, security, data access, and API versioning live in `backend/`.
   - Machine learning algorithms, vector indexing, and recommendation inference will live in `ai-service/`.
2. **Stateless API Tier**:
   - Backend servers maintain no in-memory session state, allowing horizontal scaling behind load balancers.
3. **Strict Data-First Principle**:
   - Zero mock data arrays, zero fake products, zero fake users.
   - Dynamic contracts with fallback empty states until downstream phases populate real data.
4. **Resilient Dependency Management**:
   - Database and AI service connectivity states are monitored and reflected via `/api/v1/health`.
   - Fail-fast environment validation prevents startup with malformed configurations.

---

## Phase 3: Authentication & User System Architecture

```
+--------------------------------------------------------------------------------+
|                                Frontend Client                                 |
|  - AuthProvider & useAuth Hook (React Context)                                 |
|  - ProtectedRoute Guard (/profile, /admin/*)                                   |
|  - Pages: LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage,      |
|           ProfilePage (Personal details, Password change, Address CRUD)        |
|  - apiClient: credentials: 'include' for cross-origin SameSite cookies         |
+---------------------------------------+----------------------------------------+
                                        |
                 HTTP-only Cookies / Authorization Bearer
                                        v
+--------------------------------------------------------------------------------+
|                               Express API Router                               |
|  - cookie-parser middleware & security headers                                 |
|  - authLimiter: 20 requests per 15 min for auth brute-force protection         |
|  - authenticate middleware: decodes JWT, verifies user active in MongoDB       |
|  - authorizeRoles middleware: restricts access by role ('USER' | 'ADMIN')       |
|  - IDOR prevention: All /users/me/* routes bind directly to req.user._id       |
+-------------------+------------------------------------+-----------------------+
                    |                                    |
                    v                                    v
+---------------------------------------+  +-------------------------------------+
|          MongoDB User Model           |  |            Email Service            |
|  - bcryptjs (12 rounds) hash hook     |  |  - Safe Nodemailer abstraction      |
|  - comparePassword instance method    |  |  - Real SMTP support (configurable) |
|  - crypto SHA-256 reset/verify tokens |  |  - Development safe fallbacks       |
|  - Account lockout tracking           |  +-------------------------------------+
|  - Embedded Address subdocuments      |
+---------------------------------------+
```

### Security Tenets
1. **Password Hashing**: `bcryptjs` with 12 salt rounds triggered automatically via pre-save hooks on modified password fields.
2. **Session Storage**: JWT stored in `HttpOnly`, `SameSite: Lax` (or `None` in production with SSL), `Secure` cookies with fallback support for standard `Authorization: Bearer <token>` headers.
3. **Brute Force Protection**: Account lockout after 5 consecutive failed attempts, plus rate-limiting on sensitive auth routes (`authLimiter`).
4. **IDOR Mitigation**: All user profile and address management endpoints operate on the authenticated token subject (`req.user._id`), preventing horizontal privilege escalation.

---

## Phase 4: Product Catalog & Discovery Architecture

```
+--------------------------------------------------------------------------------+
|                                Frontend Client                                 |
|  - Pages: ProductsPage, ProductDetailPage, CategoriesPage,                     |
|           CategoryDetailPage, BrandDetailPage                                 |
|  - Components: ProductCard, ProductFilter, ProductSort, Pagination, SearchBar   |
|  - URL State Sync: Query params sync search, category, brand, sort, & page     |
|  - SEO: Schema.org Product/Offer JSON-LD structured data on detail pages       |
|  - Zero Mock Data: Clean empty states when database collections are empty      |
+---------------------------------------+----------------------------------------+
                                        |
                 REST API Client (/api/v1/products, /categories, /brands)
                                        v
+--------------------------------------------------------------------------------+
|                               Express API Router                               |
|  - Query validation: Zod allowlisted sort keys, sanitized regex, page/limit    |
|  - Public read routes: GET /products, /categories, /brands, /suggestions       |
|  - Protected write routes: POST/PUT/DELETE restricted to ADMIN role            |
|  - Projection & Lean Queries: Lightweight payloads for catalog listing grids   |
+-------------------+--------------------+-------------------+-------------------+
                    |                    |                   |
                    v                    v                   v
+-----------------------+  +-------------------+  +------------------------------+
|     Product Model     |  |  Category Model   |  |         Brand Model          |
| - Text & compound idx |  | - Slug & hierarchy|  | - Slug & metadata            |
| - Variant & attributes|  | - Subcategories   |  | - Active brand filter        |
| - Real inventory/SKU  |  | - Active filter   |  +------------------------------+
+-----------------------+  +-------------------+
```

### Catalog Tenets & Safety
1. **Allowlisted Sorting**: Client sort parameters map strictly to internal DB sort expressions (`price_asc`, `price_desc`, `newest`, `rating`, `reviews`, `discount`). Unrecognized sort parameters are rejected with HTTP 400.
2. **Regex Injection Protection**: Search queries escape RegExp special characters (`[-\/\\^$*+?.()|[\]{}]`) before executing prefix and keyword matching against indexed fields.
3. **Dynamic Empty States**: When MongoDB collections or query filters return zero records, the UI renders dynamic empty state illustrations with guidance to reset filters. Zero hardcoded mock products.
4. **Relational Consistency**: Categories, subcategories, and brands are populated dynamically through Mongoose ObjectIds or resolved via verified slugs.

---

## Phase 5: Cart, Wishlist & Checkout Preparation Architecture

```
+--------------------------------------------------------------------------------+
|                                Frontend Client                                 |
|  - CartProvider & useCart Hook (React Context with optimistic state sync)       |
|  - Pages: CartPage, WishlistPage, CheckoutPage                                 |
|  - Components: Dynamic Cart/Wishlist Badges in Header                          |
|  - ProductDetailPage: Variant Selection, Quantity Stepper, Add to Cart/Wishlist |
|  - Zero Mock Data: Clean empty states when cart or wishlist is empty           |
+---------------------------------------+----------------------------------------+
                                        |
                 REST API Client (/api/v1/cart, /wishlist, /checkout)
                 Credentials: 'include' (Authenticated User Session)
                                        v
+--------------------------------------------------------------------------------+
|                               Express API Router                               |
|  - authenticate middleware: Bound strictly to req.user._id (Zero IDOR)          |
|  - Input validation: Zod schemas for quantity (1-50), ObjectId, SKU, addressId |
|  - Financial integrity: Zero client trust for prices, shipping, tax, or totals |
+-------------------+--------------------+-------------------+-------------------+
                    |                    |                   |
                    v                    v                   v
+-----------------------+  +-------------------+  +------------------------------+
|      Cart Model       |  |  Wishlist Model   |  |       Checkout Service       |
| - user: ObjectId (idx)|  | - user: ObjectId  |  | - Revalidates all cart items |
| - items: [            |  | - items: [        |  | - Checks live DB inventory   |
|     product: ObjectId,|  |     product,      |  | - Detects price changes      |
|     variantSku,       |  |     variantSku,   |  | - Validates delivery address |
|     quantity (max 50),|  |     addedAt       |  | - Calculates server-side:    |
|     priceAtAddition   |  |   ]               |  |     subtotal, shipping,      |
|   ]                   |  +-------------------+  |     nexus tax, final total   |
+-----------------------+                         +------------------------------+
```

### Cart, Wishlist & Checkout Tenets
1. **Server-Side Financial Authority**:
   - The frontend NEVER supplies subtotals, shipping fees, tax rates, or order totals.
   - All calculations occur server-side by dynamically fetching live product/variant records from MongoDB.
   - Financial math uses standard cent rounding (`Math.round(amt * 100) / 100`) to avoid floating-point inaccuracies.
2. **Dynamic Stock & Stale Price Detection**:
   - During cart retrieval and checkout summary calculation, each cart item is cross-referenced with live database inventory and pricing.
   - If stock is insufficient or a product is inactive, `stockSufficient: false` and specific warnings are flagged.
   - If prices shifted since addition, `priceChanged: true` alerts the buyer before checkout completion.
3. **Atomic Wishlist-to-Cart Transfers**:
   - Moving an item from Wishlist to Cart is performed in a fail-safe order: the item is first appended/incremented in the user's cart; only upon successful database persistence is it removed from the wishlist.
4. **Order Placement Boundary (Phase 5 -> Phase 6)**:
   - Phase 5 established the checkout preparation flow: delivery address selection, address creation, payment method preference selection, and real-time order-summary calculation.
   - Actual order placement, payment gateway integration, webhook signature validation, transactional inventory decrements, cancellation, and return lifecycles are implemented in Phase 6.

---

## Phase 6: Orders, Payments & Returns Architecture

```
+--------------------------------------------------------------------------------+
|                                Frontend Client                                 |
|  - Pages: CheckoutPage (Place Order / Online Pay), OrdersPage (History & Tabs),|
|           OrderDetailPage (Tracking, Invoice, Cancel, Return),                 |
|           OrderSuccessPage (Verified confirmation), PaymentFailurePage (Retry) |
|  - currency.ts: formatCurrency (Intl.NumberFormat with configurable ISO code)  |
|  - orderApi.ts: Centralized, typed API client for orders & payments            |
+---------------------------------------+----------------------------------------+
                                        |
                 REST API Client (/api/v1/orders, /api/v1/payments)
                 Credentials: 'include' (Authenticated User Session)
                                        v
+--------------------------------------------------------------------------------+
|                               Express API Router                               |
|  - authenticate middleware: Bound strictly to req.user._id (Zero IDOR)          |
|  - orderValidator: Zod schemas for order initiation, payment verification,     |
|                    cancellation, and returns                                   |
|  - Idempotency-Key support: Header-based deduping with unique sparse index     |
+-------------------+--------------------+-------------------+-------------------+
                    |                    |                   |
                    v                    v                   v
+-----------------------+  +-------------------+  +------------------------------+
|      Order Model      |  |  Payment Service  |  |       Order Service          |
| - user: ObjectId (idx)|  | - IPaymentProvider|  | - initiateOrder:             |
| - orderNumber (unique)|  | - RazorpayProvider|  |   Validate stock, snapshot   |
| - items: [Snapshot]   |  |   * REST creation |  |   pricing/address, compute   |
| - shippingAddress     |  |   * Timing-safe   |  |   orderNumber & invoiceNumber|
| - paymentInfo         |  |     HMAC verify   |  |   Atomic stock dec (COD)     |
| - status & history    |  |   * Webhook verify|  | - verifyPayment:             |
| - tracking & invoice  |  | - CodProvider     |  |   Cryptographic verify,      |
| - cancellation/returns|  |   * Instant pay   |  |   atomic stock dec (online), |
| - inventoryDeducted   |  |   * Pending settle|  |   status -> PAID/CONFIRMED   |
+-----------------------+  +-------------------+  | - cancelOrder:               |
                                                  |   Atomic stock restoration,  |
                                                  |   refund dispatch if paid    |
                                                  | - requestReturn:             |
                                                  |   14-day window enforcement, |
                                                  |   item & quantity validation |
                                                  | - getOrderInvoice:           |
                                                  |   Self-contained tax invoice |
                                                  +------------------------------+
```

### Orders & Payments Tenets
1. **Zero Fake Transactions & Honest Status Tagging**:
   - Zero hardcoded mock transactions or generated fake gateway IDs (`TXN123456`).
   - Payment confirmation is NEVER granted unless cryptographically verified via HMAC-SHA256 signature verification matching gateway payloads.
   - When external provider credentials (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are not configured in environment variables, the system reports `CONFIGURATION_REQUIRED` and securely guides users to Cash on Delivery.
2. **Atomic Inventory Lifecycle & Overselling Protection**:
   - Stock decrements utilize atomic MongoDB queries with condition checks (`$gte: quantity` in `$inc: -quantity`) to ensure concurrent orders cannot oversell limited inventory.
   - For COD orders, stock is reserved immediately upon initiation. For online payments, stock is reserved upon successful payment verification.
   - Upon order cancellation, reserved stock is atomically restored (`$inc: +quantity`) to the product catalog and variant records, guarded by the `inventoryDeducted` boolean flag.
3. **Immutable Snapshots**:
   - Order items snapshot unit prices, product titles, variant SKUs, and imagery at the moment of order placement. Subsequent catalog price or product changes NEVER alter historic orders or computed invoice totals.
   - Delivery addresses snapshot recipient details (`name`, `phone`, `street`, `city`, `state`, `postalCode`, `country`) so address profile updates do not retroactively modify past shipping destinations.
4. **State Machine & Lifecycle Guards**:
   - Valid Order Transitions:
     - `PENDING` -> `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED`
     - `PENDING` / `CONFIRMED` / `PROCESSING` -> `CANCELLED`
     - `DELIVERED` -> `RETURN_REQUESTED` -> `RETURNED`
   - Cancellations are strictly rejected once an order is marked `SHIPPED` or `DELIVERED`.
   - Returns are strictly rejected if the order is not `DELIVERED` or exceeds the configurable 14-day return window (`RETURN_WINDOW_DAYS`).
5. **IDOR & Authorization Protection**:
   - All customer-facing order routes enforce ownership (`order.user.toString() === req.user._id.toString()`). Any attempt to access, cancel, or return an order belonging to another customer is rejected with HTTP 403 / 404.

---

## Phase 7: Complete Admin Panel & Operations Management Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    Frontend Admin Client                                |
|  - Layout: AdminLayout (Full-viewport dashboard shell, responsive sidebar, topbar,      |
|            mobile drawer, active admin profile, "Back to Storefront" quick link)        |
|  - ProtectedRoute: Guarded by requireAdmin / administrative role verification           |
|  - Pages:                                                                               |
|    * AdminDashboardPage: Real MongoDB aggregations, period growth KPI cards, SVG sales  |
|      analytics chart, recent orders table                                               |
|    * AdminProductsPage: Catalog CRUD, SKU uniqueness, category filters, soft deactivation|
|    * AdminInventoryPage: Stock ledger, low-stock alerts, auditable delta adjustments   |
|    * AdminOrdersPage: Order status pipeline, carrier/tracking number, admin cancel      |
|    * AdminReturnsRefundsPage: Return inspection, approval/rejection, refund ledger      |
|    * AdminPaymentsPage: Razorpay/COD transactions ledger, audit breakdown               |
|    * AdminUsersPage: Customer & staff accounts, status toggle, Super Admin role assign  |
|    * AdminReviewsPage: Review moderation queue, automatic product rating re-computation |
|    * AdminCouponsPage: Promotions & coupon lifecycle management                         |
|    * AdminSupportPage: Customer ticket threads, staff reply workflow, resolution status |
|    * AdminAuditLogsPage: Immutable audit trail, diff inspector (before/after state)     |
|    * AdminAbandonedCartsPage: Real inactive shopping cart sessions (>24 hours idle)     |
|    * AdminSettingsPage: Safe platform parameters, masked secrets guarantee             |
+--------------------------------------------+--------------------------------------------+
                                             |
                      HTTP-only Cookie / Bearer Token (/api/v1/admin/*)
                                             v
+-----------------------------------------------------------------------------------------+
|                                   Express API Router                                    |
|  - authenticate: Validates active JWT session and user presence in MongoDB              |
|  - requireAdmin: Blocks normal 'USER' accounts with HTTP 403 Forbidden                  |
|  - authorizePermission: Granular RBAC gates (MANAGE_PRODUCTS, MANAGE_ORDERS, etc.)       |
|  - Zod Validators: Strict payload and query schemas (admin.validator.ts)                |
|  - auditLogger: Automatically redacts credentials and persists immutable diff trail     |
+-------------------+--------------------+--------------------+---------------------------+
                    |                    |                    |
                    v                    v                    v
+-----------------------+  +-------------------+  +---------------------------------------+
|  Domain Admin Models  |  |  AuditLog Model   |  |        Admin Business Services        |
| - Product, Variant    |  | - adminId (idx)   |  | - dashboard.service.ts:               |
| - Category, Brand     |  | - action, resource|  |   Real period aggregations & growth   |
| - Order, Payment      |  | - resourceId (idx)|  | - productAdmin.service.ts:            |
| - User (extended roles|  | - oldValues (diff)|  |   Safe deactivation, SKU uniqueness   |
| - Review (moderated)  |  | - newValues (diff)|  | - inventoryAdmin.service.ts:          |
| - Coupon, Banner      |  | - reason (string) |  |   Atomic delta adjustments & logs     |
| - Cart (abandoned)    |  | - ipAddress, agent|  | - orderAdmin.service.ts:              |
| - SupportTicket (new) |  | - createdAt (idx) |  |   Transitions, tracking, cancellation |
+-----------------------+  +-------------------+  | - paymentRefundAdmin.service.ts:      |
                                                  |   Refund ledger & maximum bounds      |
                                                  | - userAdmin.service.ts:               |
                                                  |   Account toggles & role promotions   |
                                                  | - supportReviewAdmin.service.ts:      |
                                                  |   Rating recalculation & ticket threads|
                                                  | - systemAdmin.service.ts:             |
                                                  |   Safe runtime settings inspection    |
                                                  +---------------------------------------+
```

### Admin Panel & Management Tenets
1. **Absolute Real Data Principle (Zero Fake Metrics)**:
   - Zero hardcoded revenue numbers, zero mock orders, zero fabricated charts.
   - All executive dashboard metrics (Gross Revenue, Net Revenue, Paid Orders, Customer Count, Low Stock items) are dynamically aggregated from real MongoDB documents (`Order`, `User`, `Product`, `Cart`).
   - Sales analytics charts over time (7d, 30d, 90d, 1y) execute chronological `$group` and `$sum` aggregations against real completed orders.
2. **Strict Multi-Tier RBAC & Backend Authorization**:
   - Every administrative endpoint (`/api/v1/admin/*`) is strictly guarded on the backend by `authenticate`, `requireAdmin`, and `authorizePermission(...)`.
   - Normal customer accounts (`role: 'USER'`) receive immediate HTTP 403 Forbidden responses.
   - Granular roles:
     - `SUPER_ADMIN`: Unrestricted platform access, including staff role assignment and setting inspection.
     - `ADMIN`: Full operational authority across commerce modules.
     - `PRODUCT_MANAGER`: Products, categories, brands, and warehouse inventory.
     - `ORDER_MANAGER`: Order fulfillment, shipping status, carrier tracking, and cancellations.
     - `SUPPORT_MANAGER`: Customer service tickets, reviews moderation, returns, and refunds.
     - `MARKETING_MANAGER`: Coupons, discounts, banners, and promotional campaigns.
     - `MODERATOR`: Customer review moderation and support inquiries.
3. **Immutable Audit Trail & Diff Logging**:
   - All state-altering administrative operations (stock adjustment, order status transition, order cancellation, refund processing, product soft deletion, role elevation, review moderation) are logged to the `AuditLog` collection.
   - Audit logs capture `adminId`, `action`, `resource`, `resourceId`, `oldValues`, `newValues`, `reason`, `ipAddress`, `userAgent`, and `createdAt`.
   - Sensitive fields (passwords, tokens, secrets) are redacted before persisting.
4. **Safe Product Deactivation & Historic Order Preservation**:
   - Products associated with historical customer orders are prevented from hard deletion to preserve financial records, receipts, and order summaries.
   - Instead, products are deactivated (`isActive: false`), removing them from customer-facing discovery while preserving full historical integrity.
5. **Traceable Inventory Adjustments & Negative Stock Prevention**:
   - Direct stock modifications require an administrative reason for the audit trail.
   - Inventory adjustments calculate stock status dynamically (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`) and atomically prevent negative stock levels.
6. **Refund Bounds & Financial Reconciliation**:
   - Refunds cannot exceed the order's actual settled amount (`order.totalAmount - order.refund.amount`).
   - Order cancellations by staff automatically restore reserved inventory if it was previously deducted.
7. **Customer Review Moderation & Rating Consistency**:
   - Reviews require administrative moderation (`isApproved: true`).
   - Approving, rejecting, or deleting a customer review automatically re-aggregates the average rating and review count directly onto the associated Product document.
8. **Safe Platform Configuration & Secret Redaction Guarantee**:
   - Administrative settings inspection exposes active runtime parameters (`NODE_ENV`, `PORT`, `CORS_ORIGIN`, currency, tax rates, shipping fee thresholds, return window days) without revealing credentials.
   - All secret variables (`JWT_SECRET`, `MONGODB_URI`, `RAZORPAY_KEY_SECRET`, `SMTP_PASS`) are masked as `[CONFIGURED]` and never leaked to the frontend client.

---

## Phase 8: AI-Powered Personalized Recommendation Engine Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    Frontend Client                                      |
|  - RecommendationSection.tsx (Responsive carousel/grid with match badges & pills)       |
|  - Automatic VIEW impression telemetry tracking on render (non-blocking)                |
|  - CLICK interaction telemetry on product engagement                                    |
|  - HomePage: "Recommended For You" (Personalized + Cold-start trending fallback)        |
|  - ProductDetailPage: "AI Similar Products" (Multi-feature content similarity)          |
|  - AdminDashboardPage: AI Engine Telemetry & Health Panel (CTR, Impressions, Clicks)    |
|  - recommendationApi.ts (Client with guest session token persistence)                   |
+--------------------------------------------+--------------------------------------------+
                                             |
                          REST API Requests  |  Telemetry Events (POST /interactions)
                                             v
+-----------------------------------------------------------------------------------------+
|                                  Backend Orchestrator                                   |
|  - /api/v1/interactions: Rate-limited (120/min), deduplicated (5s), JWT-bound telemetry |
|  - /api/v1/recommendations/personalized: Hybrid profile generation & candidate scoring |
|  - /api/v1/recommendations/product/:productId: Content-based similarity query           |
|  - /api/v1/recommendations/trending: Real interaction velocity from MongoDB            |
|  - /api/v1/admin/dashboard/recommendations-analytics: Telemetry aggregation & CTR      |
|  - recommendation.service.ts:                                                           |
|    * Fetches user interactions from MongoDB                                             |
|    * Hydrates active candidate products (isActive: true, stock > 0)                     |
|    * Calls Python AI service with 1500ms AbortSignal.timeout guard                      |
|    * Resilient Fallback: DB Category/Tag Affinity & Velocity Trending on service down   |
+----------------------+-----------------------------------+------------------------------+
                       |                                   |
                       | Mongoose Queries                  | Fast HTTP RPC (1500ms timeout)
                       v                                   v
+-----------------------------------------------+   +-------------------------------------+
|                MongoDB Database               |   |       Python AI Microservice        |
|  - Interaction collection:                    |   |        (FastAPI + Pydantic)         |
|    { user, sessionToken, product, action,     |   |  - POST /recommendations/personalized|
|      metadata, timestamp }                    |   |    * User affinity vector profiling |
|    * Compound index: { user: 1, timestamp:-1 }|   |    * Recency & action weights       |
|    * Compound index: { product: 1, action: 1 }|   |    * Category, brand, tag affinity  |
|  - Product collection:                        |   |  - POST /recommendations/similar     |
|    { name, category, brand, tags, price,      |   |    * Multi-feature content similarity|
|      rating, reviewCount, isActive, stock }   |   |    * Jaccard token & tag overlap    |
|  - Order collection (Order velocity telemetry)|   |  - GET /recommendations/model-info  |
+-----------------------------------------------+   +-------------------------------------+
```

### Recommendation Engine Tenets & Guarantees
1. **Absolute Real Data Guarantee**:
   - Zero hardcoded recommendations, zero synthetic product shuffles disguised as AI, zero fabricated interaction data in the database.
   - All personalization is calculated dynamically from real user interactions, real active catalog attributes, and real customer order velocities.
2. **Honest Cold-Start Handling**:
   - New visitors with zero interaction history receive transparent trending recommendations (`isColdStart: true`, badge: `🔥 Trending Picks`).
   - Cold-start items are derived from real interaction aggregations and verified bestseller catalog performance, never fictitious AI scores.
3. **Fault-Tolerant Microservice Integration**:
   - Python AI service requests are protected with a strict 1500ms timeout (`AbortSignal.timeout(1500)`).
   - If the AI engine is offline, slow, or encounters an unexpected exception, the backend orchestrator immediately and seamlessly degrades to genuine MongoDB-level category and tag affinity matching (`db_affinity_fallback`), ensuring zero 500 errors or broken UI states for the user.
4. **Multi-Feature Content-Based Similarity**:
   - Similar products algorithm combines:
     - Category identity match (weight: 0.35)
     - Brand identity match (weight: 0.20)
     - Tag Jaccard similarity (weight: 0.25)
     - Title/Description token Jaccard overlap (weight: 0.10)
     - Price bracket proximity (weight: 0.10)
   - Excludes the target product itself and produces human-readable match explanations.
5. **Secure, Deduplicated Interaction Telemetry**:
   - Interaction actions supported: `VIEW`, `SEARCH`, `CLICK`, `ADD_TO_CART`, `REMOVE_FROM_CART`, `WISHLIST`, `PURCHASE`.
   - Action weights: `PURCHASE: 5`, `ADD_TO_CART: 4`, `WISHLIST: 3`, `CLICK: 2`, `SEARCH: 2`, `VIEW: 1`, `REMOVE_FROM_CART: -1`.
   - Rapid repeated events (e.g. rapid page reloads or multiple clicks on the same product within 5 seconds) are automatically deduplicated.
   - User identity is cryptographically bound to the authenticated JWT token, preventing impersonation. Guests are tracked via persistent anonymous `sessionToken`.
6. **Admin Telemetry & Model Health**:
   - The Admin Dashboard features real-time recommendation analytics:
     - Recommendation impressions and clicks
     - Click-Through Rate (CTR = `(clicks / impressions) * 100`) with safe zero-division handling
     - Total platform interaction breakdown by action type
     - Live Python AI engine connectivity status and model version inspection (`v1.0.0-hybrid`).

---

## Phase 9: Advanced AI Features Architecture

```
+-----------------------------------------------------------------------------------------+
|                                     Frontend Client                                     |
|  - ShoppingAssistantWidget (Floating accessible assistant, tool card previews)          |
|  - ReviewSummaryCard (Aspect praises/considerations, honest insufficient data banner)  |
|  - SearchBar & ProductsPage (Smart Search natural language intent pill banner)          |
|  - AdminAIInsightsPage (RFM Segments, Stockout Risk Alerts, Catalog AI Copilot)        |
+--------------------------------------------+--------------------------------------------+
                                             |
                          REST JSON (/api/v1/ai, /api/v1/admin/ai)
                                             v
+-----------------------------------------------------------------------------------------+
|                                Backend AI Orchestration Layer                           |
|  - SmartSearchService: NLP query parsing, dynamic filter mapping, hybrid ranking        |
|  - AssistantService: Intent routing, prompt injection defense, safe real DB tools      |
|    * searchProducts, getProduct, compareProducts, getRecommendations, getUserCartSummary|
|  - ReviewAIService: Aspect summarization (3+ reviews guard), moderation flagging       |
|  - AIAnalyticsService: RFM customer segmentation, inventory sales velocity anomaly     |
|  - ProductAIService: Category/tag proposals, grounded specification description drafts |
+--------------------------------------------+--------------------------------------------+
                      |                                              |
         Mongoose Queries (Active DB)                 HTTP RPC with 1500-2000ms Timeout
                      v                                              v
+--------------------------------------------+  +-----------------------------------------+
|              MongoDB Database              |  |         Python AI Microservice          |
|  - Product, Review, Order, User, Cart      |  |          (FastAPI + NLP Engines)        |
|  - RFM Aggregation Pipelines               |  |  - /api/v1/search/parse-query           |
|  - Sales Velocity & Stockout Calculation   |  |  - /api/v1/ai/reviews/summarize         |
|  - Pure Real Data, Zero Fake Analytics    |  |  - /api/v1/assistant/chat               |
|                                            |  |  - /api/v1/ai/product/analyze           |
|                                            |  |  - /api/v1/ai/product/description       |
+--------------------------------------------+  +-----------------------------------------+
```

### Phase 9 Core Tenets & Security Guarantees
1. **Grounded In Real Catalog Data**:
   - Product descriptions and category suggestions are strictly derived from real admin-supplied attributes and specifications, never halluncinating fictional features.
   - Review summarization is only triggered when at least 3 genuine customer reviews exist in MongoDB; otherwise, an honest `INSUFFICIENT_DATA` response is returned.
2. **AI Shopping Assistant Security & Sandboxing**:
   - Active defense against prompt injection patterns (system prompt override, admin impersonation, price modification, password extraction).
   - Assistant executes safe, read-only tools strictly isolated to the authenticated user's session (cannot mutate prices, cannot place unauthorized orders, cannot access other customers' carts or order histories).
3. **Fault-Tolerant Resilience**:
   - All microservice calls execute with strict 1500-2000ms timeout guards.
   - If the Python service is stopped, slow, or throws an error, the backend seamlessly falls back to MongoDB keyword regex search, local assistant intents, and baseline rating distributions without throwing 500 errors.
4. **Grounded Business Intelligence**:
   - Customer RFM segmentation classifies real customers into Champions, Loyal Shoppers, Recent Explorers, At-Risk, and New/Inactive based on actual orders and interaction recency.
   - Demand velocity and stockout warnings alert administrators when current 30-day order run rates threaten inventory depletion within 7 to 15 days, honestly indicating insufficient data if fewer than 5 orders exist.

---

## Phase 10: Notifications, Email & Customer Support Architecture

```
+-----------------------------------------------------------------------------------------+
|                                     Frontend Client                                     |
|  - Header Notification Bell (Live unread badge count, 15-second polling, flyout preview)|
|  - NotificationsPage (Categorized tabs, mark single/all as read, clear read, pagination)|
|  - NotificationPreferencesPage (Granular email vs in-app channel toggles per event type)|
|  - SupportPage & NewSupportTicketPage (Ticket creation, order association, priority)    |
|  - SupportTicketDetailPage (Live conversation thread, customer replies, self-close)     |
|  - HelpCenterPage & FAQDetailPage (Searchable FAQs, category pills, JSON-LD Schema)     |
|  - AdminNotificationsPage & AdminFAQPage (Broadcast console, FAQ CRUD & seed defaults)  |
+--------------------------------------------+--------------------------------------------+
                                             |
                          REST JSON (/api/v1/notifications, /api/v1/support, /api/v1/faqs)
                                             v
+-----------------------------------------------------------------------------------------+
|                               Backend Services & Controllers                            |
|  - NotificationService: In-app dispatch, idempotency key defense, preference checking   |
|  - EmailService: Responsive transactional HTML templates, sanitization, simulated audit |
|  - SupportService: Ticket sequence (TKT-YYYYMMDD-XXXX), BOLA/IDOR order validation     |
|  - FAQService: Published FAQ filtering, slug resolution, semantic search, admin CRUD    |
|  - AbandonedCartService: 2hr inactivity scanner, stock verification, recovery emails    |
|  - StockAlertService: Price drop and back-in-stock alerts for active wishlists          |
+--------------------------------------------+--------------------------------------------+
                                             |
                       Mongoose Models & Lifecycle Hooks
                                             v
+-----------------------------------------------------------------------------------------+
|                                     MongoDB Database                                    |
|  - Notification (sparse unique idempotencyKey, channel, priority, read status, action)  |
|  - SupportTicket (ticketNumber, user, relatedOrder, status, category, conversation thread|
|  - FAQ (question, answer, category, slug, order, isPublished, viewCount, helpfulCount)  |
|  - CommunicationLog (audit log of email dispatches, status, simulated flag, metadata)   |
|  - User.notificationPreferences (matrix of email/inApp toggles for order, promo, etc.)  |
+-----------------------------------------------------------------------------------------+
```

### Phase 10 Core Tenets & System Guarantees
1. **Idempotency & Duplicate Suppression**:
   - Every transactional notification and email uses deterministic `idempotencyKey` strings (e.g. `order-confirmation-${orderId}`, `order-shipped-${orderId}-${trackingNumber}`, `cart-reminder-${cartId}-${dayDate}`).
   - MongoDB sparse unique indexes guarantee that rapid order status changes or retries never trigger duplicate emails or notification spam.
2. **Honest, Resilient SMTP & Communication Audit**:
   - When SMTP credentials are unconfigured in development/test environments, the system safely records the dispatch in `CommunicationLog` as `status: 'SENT'` with `metadata: { simulated: true }`.
   - Never crashes the checkout or order processing pipeline and never fabricates false delivery statuses.
3. **Strict IDOR / BOLA Prevention & Order Ownership Verification**:
   - Support tickets require strict session ownership (`user: req.user._id`).
   - Associating a ticket with an order number verifies that the order exists and belongs to the calling user; associating another user's order is rejected with 404/403.
4. **Granular User Notification Preferences**:
   - Customers can independently toggle `email` and `inApp` alerts across categories: Order Updates, Promotions/Coupons, Support Inquiries, and Inventory/Wishlist Alerts.
   - Notification dispatch services inspect preferences before queuing or saving records.
5. **SEO-Optimized Help Center**:
   - Dynamic FAQs with categorized browsing and keyword search.
   - Dedicated article pages inject Google-standard JSON-LD `FAQPage` schema markup for rich snippet search visibility.

---

## Phase 11: SEO, Mobile, Performance & Traffic Optimization Architecture

```
+-----------------------------------------------------------------------------------------+
|                                     Frontend Client                                     |
|  - Dynamic SEO Component (<head> injection for title, meta, canonical, og:*, twitter:*)  |
|  - JSON-LD Structured Data: Product, BreadcrumbList, Organization, FAQPage              |
|  - Route-Level Code Splitting: React.lazy() + Suspense across 30+ routes                |
|  - Manual Bundle Chunking: vendor-react (208kB), vendor-icons (20kB), index (59kB)      |
|  - Zero CLS Image Stability: Explicit aspect-ratio, width, and height on all visuals    |
|  - Robots Directive Engine: Strict noindex, nofollow on /admin, /orders, /cart, /auth   |
|  - Mobile Viewport Responsiveness: Fluid containers, wrap-safe flexboxes, 320px-1440px  |
+--------------------------------------------+--------------------------------------------+
                                             |
                          HTTP / Compression (Gzip)
                                             v
+-----------------------------------------------------------------------------------------+
|                               Express Backend API Tier                                  |
|  - Compression Middleware: Gzip compression on all JSON, XML, and text payloads        |
|  - Performance Tracking Middleware: Latency p95, p99, request throughput, status codes  |
|  - In-Memory TTL Cache (appCache): Sub-millisecond reads with automatic invalidation    |
|  - Dynamic XML Sitemap Generator (/sitemap.xml & /api/v1/sitemap.xml): Real DB URLs     |
|  - Dynamic robots.txt Generator (/robots.txt & /api/v1/robots.txt): Crawler rules       |
|  - Metrics Telemetry Endpoint: GET /api/v1/health/metrics (uptime, mem, latency, cache) |
+--------------------------------------------+--------------------------------------------+
                                             |
                         Compound Indexed Queries (Mongoose)
                                             v
+-----------------------------------------------------------------------------------------+
|                                     MongoDB Database                                    |
|  - Product Compound Indexes: { isActive: 1, category: 1, createdAt: -1 }               |
|                              { isActive: 1, brand: 1, createdAt: -1 }                  |
|                              { isActive: 1, price: 1 }, { slug: 1, isActive: 1 }       |
|  - Review Compound Index:   { product: 1, isApproved: 1, createdAt: -1 }                |
|  - Category & Brand Indexes: { slug: 1, isActive: 1 }                                  |
|  - Zero Fake Data: Sitemaps and Schemas generated 100% from live stored documents       |
+-----------------------------------------------------------------------------------------+
```

### Phase 11 Core Tenets & Technical Guarantees
1. **Dynamic, Authentic SEO & Sitemaps**:
   - `/sitemap.xml` queries active products, categories, brands, and published FAQs from MongoDB in real time with authentic `lastmod` timestamps and SEO priorities.
   - Sitemaps and structured data omit inactive or unapproved entities, ensuring search engines index only valid, purchasable assets.
2. **Schema.org Rich Snippet Compliance Without Fabrication**:
   - `Product` structured data includes `offers`, `sku`, `brand`, and `availability`.
   - `aggregateRating` and review markup are rendered **only** when genuine customer reviews and non-zero ratings exist in the database.
   - `BreadcrumbList`, `Organization`, and `FAQPage` schemas are fully validated and formatted according to Schema.org standards.
3. **Private Route Protection**:
   - All authenticated, user-specific, administrative, and transaction flow routes (`/admin/*`, `/cart`, `/checkout`, `/orders/*`, `/profile`, `/notifications/*`, `/support/*`, `/login`, `/register`, `/forgot-password`, `/reset-password/*`, `/order-success/*`, `/payment-failure`, `*` 404) are protected with `<meta name="robots" content="noindex, nofollow" />` and configured with `Disallow` in `/robots.txt`.
4. **Sub-Millisecond In-Memory Caching with Automatic Invalidation**:
   - Catalog listing reads (`categories:all`, `brands:all`, `faqs:published:all`, `product:slug:*`) are cached in-memory with configurable TTLs.
   - Any create, update, or delete administrative mutation triggers immediate prefix-based cache invalidation (`appCache.deletePrefix('categories:')`), preventing stale reads while maintaining lightning-fast response times.
5. **Route-Level Code Splitting & Core Web Vitals**:
   - Vite and Rollup split customer and administrative pages into lazy chunks, reducing initial JavaScript transfer from over 600 kB to 59 kB (17.6 kB gzip).
   - Images specify explicit dimensions or aspect ratios (`aspectRatio: '1 / 1'`, explicit `width` & `height`), eliminating Cumulative Layout Shift (CLS).
6. **Compound Indexing & Query Acceleration**:
   - Multi-key compound indexes support frequent catalog filtering, price range queries, and sorted pagination runs in $O(\log N)$ index scan operations rather than full collection scans.

