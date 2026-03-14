# Technical Requirements Document: Core Inventory IMS

## 1. Tech Stack

- **Frontend Framework:** Next.js App Router
- **Language:** TypeScript
- **Database:** Local PostgreSQL
- **Styling:** Tailwind CSS with `shadcn/ui`
- **State Management:** TanStack Query for server state and request synchronization
- **Deployment Target:** The frontend can be deployed separately, but the backend requirements must not depend on BaaS products or hosted auth tools

## 2. Backend Requirements

- The application must run without Supabase, Convex, Clerk, Firebase, or similar third-party backend platforms.
- Core business logic must be owned by the application server and PostgreSQL.
- The local development environment must support running PostgreSQL directly.
- Inventory calculations must be query-driven from the ledger, not from a mutable `stock_quantity` column.

## 3. Database Schema Requirements

### Warehouses and Locations

- **`warehouses`** table: `id`, `name`, `code`, `address`
- **`locations`** table: `id`, `warehouse_id`, `name`, `type`
- Vendor and customer records can be modeled as virtual locations for movement tracking.

### Products

- **`products`** table:
  - `id`
  - `name`
  - `sku`
  - `category`
  - `unit_of_measure`
  - `reorder_point`

### Authentication

- **`users`** table:
  - `id`
  - `email`
  - `username`
  - `password_hash`
  - `role`
  - `active_warehouse_id`

- **`otp_codes`** table:
  - `id`
  - `user_id`
  - `code_hash`
  - `purpose`
  - `expires_at`
  - `used_at`

### Stock Ledger

- **`stock_moves`** table:
  - `id`
  - `product_id`
  - `source_location_id`
  - `dest_location_id`
  - `quantity`
  - `move_type`
  - `status`
  - `reference_document`
  - `created_at`
  - `created_by`

## 4. Data Fetching & Business Logic

- Current stock must be calculated using PostgreSQL views, materialized views, functions, or aggregate queries.
- Validation flows for deliveries and transfers must reject insufficient stock within a transaction.
- Dashboard metrics should refresh from server queries after completed operations.
- All validated stock moves must remain immutable.

## 5. Authentication & Security

- Authentication must use application-managed email or username plus password.
- OTP-based password reset is required.
- OTP records must be hashed at rest, time-bound, single-use, and tied to a clear purpose.
- Role-based access control must distinguish `admin/manager` from `staff`.
- Sensitive operations must execute only on the server.

## 6. Operational Constraints

- No required third-party backend service may sit in the critical path.
- Local development must work with a locally available PostgreSQL instance.
- Environment variables should configure database connections and OTP delivery settings without changing code.
