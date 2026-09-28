# Database Architecture & Domain Models Specification

This document details the MongoDB data layer and 11 core Mongoose domain models established in Phase 2 for the Nexus Commerce platform.

---

## 1. Domain Relationship Map

```
                  +-------------------+
                  |       User        |
                  +---------+---------+
                            |
       +------------+-------+-------+------------+------------+
       |            |               |            |            |
       v            v               v            v            v
  +----+---+   +----+-----+     +---+----+   +---+----+  +----+--------+
  |  Cart  |   | Wishlist |     | Orders |   | Review |  | Interaction |
  +----+---+   +----+-----+     +---+----+   +---+----+  +----+--------+
       |            |               |            |            |
       +------------+-------+-------+------------+            |
                            |                                 |
                            v                                 |
                  +---------+---------+                       |
                  |      Product      |<----------------------+
                  +----+---------+----+
                       |         |
                       v         v
                +------+---+ +---+------+
                | Category | |  Brand   |
                +----------+ +----------+
```

---

## 2. Models Inventory & Specifications

### 2.1 User (`User`)
- **Collection**: `users`
- **Purpose**: Identity, credentials (hashed in Phase 3), authorization roles, and customer address ledger.
- **Key Fields**:
  - `name`: String, required, 2-100 chars.
  - `email`: String, required, unique, lowercase, trimmed, validated via RFC-compliant email regex.
  - `phone`: String, optional.
  - `password`: String, required, minlength 8, `select: false` to ensure password hashes are excluded from default queries.
  - `role`: Enum `['USER', 'ADMIN', 'MODERATOR']`, default: `'USER'`.
  - `addresses`: Array of address subdocuments (`street`, `city`, `state`, `postalCode`, `country`, `isDefault`).
  - `isActive`: Boolean, default true.
  - `emailVerified`: Boolean, default false.
- **Indexes**:
  - `{ email: 1 }` (unique)
  - `{ role: 1 }`
  - `{ createdAt: -1 }`

---

### 2.2 Category (`Category`)
- **Collection**: `categories`
- **Purpose**: Hierarchical merchandise taxonomy (e.g., Electronics -> Audio -> Headphones).
- **Key Fields**:
  - `name`: String, required, max 100 chars.
  - `slug`: String, required, unique, lowercase, indexed.
  - `description`: String, max 1000 chars.
  - `image`: String URL.
  - `parentCategory`: ObjectId (ref: `Category`), default `null` for root-level categories.
  - `isActive`: Boolean, default true.
- **Indexes**:
  - `{ slug: 1 }` (unique)
  - `{ parentCategory: 1 }`
  - `{ isActive: 1 }`

---

### 2.3 Brand (`Brand`)
- **Collection**: `brands`
- **Purpose**: Manufacturer and merchant brand registry.
- **Key Fields**:
  - `name`: String, required, max 100 chars.
  - `slug`: String, required, unique, lowercase, indexed.
  - `description`: String.
  - `logo`: String URL.
  - `website`: String URL.
  - `isActive`: Boolean, default true.
- **Indexes**:
  - `{ slug: 1 }` (unique)
  - `{ isActive: 1 }`

---

### 2.4 Product (`Product`)
- **Collection**: `products`
- **Purpose**: Master merchandise catalog supporting dynamic attributes, variants, and inventory tracking.
- **Key Fields**:
  - `name`: String, required, max 200 chars.
  - `slug`: String, required, unique, lowercase, indexed.
  - `description`: String, required.
  - `shortDescription`: String, max 500 chars.
  - `brand`: ObjectId (ref: `Brand`), indexed.
  - `category`: ObjectId (ref: `Category`), required, indexed.
  - `subcategory`: ObjectId (ref: `Category`).
  - `images`: Array of `{ url, alt, isPrimary }`.
  - `price`: Number, required, min 0, indexed.
  - `compareAtPrice`: Number, min 0.
  - `discount`: Number, min 0, max 100 (percentage).
  - `stock`: Number, required, min 0, default 0.
  - `SKU`: String, required, unique, uppercase, indexed.
  - `tags`: Array of strings.
  - `specifications`: Array of `{ name, value }`.
  - `attributes`: Flexible attribute array for category-specific dimensions (e.g. Size, Color, RAM, Processor).
  - `variants`: Array of subdocuments with `name`, `sku`, `price`, `stock`, and `attributes`.
  - `rating`: Number, min 0, max 5, default 0.
  - `reviewCount`: Number, min 0, default 0.
  - `isActive`, `isFeatured`, `isBestseller`, `isNewArrival`: Flags.
- **Indexes**:
  - `{ slug: 1 }` (unique)
  - `{ SKU: 1 }` (unique)
  - `{ category: 1 }`
  - `{ brand: 1 }`
  - `{ price: 1 }`
  - `{ rating: -1 }`
  - `{ createdAt: -1 }`
  - `{ isActive: 1, isFeatured: 1 }` (compound)
  - `{ category: 1, price: 1 }` (compound)
  - `{ name: 'text', description: 'text', tags: 'text' }` (full-text search)

---

### 2.5 Cart (`Cart`)
- **Collection**: `carts`
- **Purpose**: Persistent shopping cart session bound to registered customers.
- **Key Fields**:
  - `user`: ObjectId (ref: `User`), required, unique index (enforces 1 active cart per user).
  - `items`: Array of `{ product: ObjectId (ref: Product), variant: String, quantity: Number (min 1), priceAtAddition: Number (min 0) }`.
- **Indexes**:
  - `{ user: 1 }` (unique)

---

### 2.6 Wishlist (`Wishlist`)
- **Collection**: `wishlists`
- **Purpose**: Saved items ledger for customer bookmarks and restock alerts.
- **Key Fields**:
  - `user`: ObjectId (ref: `User`), required, unique index.
  - `items`: Array of `{ product: ObjectId (ref: Product), variant: String, addedAt: Date }`.
- **Indexes**:
  - `{ user: 1 }` (unique)

---

### 2.7 Order (`Order`)
- **Collection**: `orders`
- **Purpose**: Transactional order ledger tracking fulfillment states and payments.
- **Key Fields**:
  - `orderNumber`: String, required, unique (e.g., `ORD-20260909-XXXX`).
  - `user`: ObjectId (ref: `User`), required, indexed.
  - `items`: Array of `{ product: ObjectId (ref: Product), name, variant, price, quantity (min 1) }`.
  - `shippingAddress`: Address subdocument.
  - `billingAddress`: Address subdocument.
  - `subtotal`, `discount`, `tax`, `shippingFee`, `totalAmount`: Non-negative numbers.
  - `paymentStatus`: Enum `['PENDING', 'PAID', 'FAILED', 'REFUNDED']`.
  - `paymentMethod`: String, required.
  - `orderStatus`: Enum `['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED']`.
  - `transactionReference`: String.
- **Indexes**:
  - `{ orderNumber: 1 }` (unique)
  - `{ user: 1 }`
  - `{ orderStatus: 1 }`
  - `{ paymentStatus: 1 }`
  - `{ createdAt: -1 }`
  - `{ user: 1, createdAt: -1 }` (compound for fast customer history)

---

### 2.8 Review (`Review`)
- **Collection**: `reviews`
- **Purpose**: Customer feedback, star ratings, and verified purchase flags.
- **Key Fields**:
  - `user`: ObjectId (ref: `User`), required.
  - `product`: ObjectId (ref: `Product`), required.
  - `order`: ObjectId (ref: `Order`), optional.
  - `rating`: Number, required, 1-5.
  - `title`: String, max 120 chars.
  - `comment`: String, required, max 2000 chars.
  - `images`: Array of strings.
  - `isVerifiedPurchase`: Boolean, default false.
  - `isApproved`: Boolean, default true.
- **Indexes**:
  - `{ product: 1 }`
  - `{ user: 1 }`
  - `{ product: 1, user: 1 }` (compound)
  - `{ rating: -1 }`
  - `{ createdAt: -1 }`

---

### 2.9 Coupon (`Coupon`)
- **Collection**: `coupons`
- **Purpose**: Promotional discount codes and cart checkout rules.
- **Key Fields**:
  - `code`: String, required, unique, uppercase, 3-30 chars.
  - `type`: Enum `['PERCENTAGE', 'FIXED_AMOUNT']`.
  - `value`: Number, required, min 0.
  - `minimumOrderValue`: Number, min 0.
  - `maximumDiscount`: Number, min 0.
  - `startDate`, `expiryDate`: Date.
  - `usageLimit`: Number, optional.
  - `usedCount`: Number, default 0.
  - `perUserLimit`: Number, default 1.
  - `applicableProducts`: Array of ObjectId (ref: `Product`).
  - `applicableCategories`: Array of ObjectId (ref: `Category`).
  - `isActive`: Boolean, default true.
- **Indexes**:
  - `{ code: 1 }` (unique)
  - `{ isActive: 1, expiryDate: 1 }` (compound for validity lookups)

---

### 2.10 Interaction (`Interaction`)
- **Collection**: `interactions`
- **Purpose**: Telemetry and event tracking for AI recommendation training and clickstream analytics.
- **Key Fields**:
  - `user`: ObjectId (ref: `User`), optional (null for anonymous visitors).
  - `sessionToken`: String (session ID for guest tracing).
  - `product`: ObjectId (ref: `Product`), optional.
  - `action`: Enum `['VIEW', 'SEARCH', 'CLICK', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'WISHLIST', 'PURCHASE']`.
  - `metadata`: Flexible key-value dictionary (e.g. `{ searchQuery: 'wireless keyboard', dwellTimeMs: 4500 }`).
  - `timestamp`: Date, default `Date.now`.
- **Indexes**:
  - `{ user: 1 }`
  - `{ product: 1 }`
  - `{ action: 1 }`
  - `{ timestamp: -1 }`
  - `{ user: 1, action: 1, timestamp: -1 }` (compound for user preference aggregations)
  - `{ product: 1, action: 1, timestamp: -1 }` (compound for item popularity scores)

---

### 2.11 Notification (`Notification`)
- **Collection**: `notifications`
- **Purpose**: In-app notifications and customer alerts.
- **Key Fields**:
  - `user`: ObjectId (ref: `User`), required.
  - `type`: Enum `['ORDER_UPDATE', 'PROMOTION', 'SYSTEM', 'ACCOUNT', 'INVENTORY']`.
  - `title`: String, required, max 150 chars.
  - `message`: String, required, max 1000 chars.
  - `data`: Flexible dictionary payload.
  - `isRead`: Boolean, default false.
- **Indexes**:
  - `{ user: 1 }`
  - `{ user: 1, isRead: 1, createdAt: -1 }` (compound for unread alerts query)

---

## 3. Data Integrity & Validation Tenets

1. **Negative Numeric Prevention**: Prices, stock levels, discounts, and order amounts have explicit `{ min: 0 }` validations.
2. **String Hygiene**: All slugs, emails, codes, and SKUs enforce automatic trimming, case normalization (`lowercase` or `uppercase`), and format regexes.
3. **Safe Credentials**: Passwords enforce `select: false` at the schema level to avoid leaking hashes in user retrieval queries.
4. **Relational Consistency**: Subdocuments and cross-collection references (`Types.ObjectId`) are strictly defined.
5. **Zero Seed Policy**: Collections are initialized empty. Records will only be created through live API interactions in subsequent phases.
