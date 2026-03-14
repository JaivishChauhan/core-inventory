# Backend Architecture Document: Core Inventory IMS

## 1. Backend Philosophy & Stack

- **The Stance:** The backend is owned entirely by the application team. No Backend-as-a-Service, hosted auth product, or third-party inventory platform should be required for core functionality.
- **Database Choice:** **Local PostgreSQL** is the source of truth for application data, inventory calculations, and ledger history.
- **Application Layer:** Next.js server actions and route handlers execute mutations, validations, and authenticated business workflows.
- **Data Access:** Server-side code talks directly to PostgreSQL through the application's chosen database layer.

## 2. Authentication & Security

The original OTP requirement stays in place.

- **Authentication Method:** Email or username plus password.
- **Password Recovery:** OTP-based password reset is required.
- **Verification Flow:** OTPs are generated, stored securely, expired automatically, and marked used after successful verification.
- **Authorization Model:** Access control is enforced by the application and backed by database constraints, roles, and immutable ledger rules.
- **Rule 1:** Users must be authenticated to read or write operational data.
- **Rule 2:** Warehouse staff can create stock moves but cannot modify validated ledger records.
- **Rule 3:** Only admin users can manage warehouses, locations, and user administration.

## 3. Database Schema

### 3.1 Core Entities

- **`users`**
  - Columns: `id` (UUID), `email` (unique), `username` (unique), `password_hash`, `role` (enum: admin, staff), `active_warehouse_id` (FK), `created_at`, `updated_at`

- **`otp_codes`**
  - Columns: `id`, `user_id` (FK), `code_hash`, `purpose`, `expires_at`, `used_at`, `created_at`

- **`warehouses`**
  - Columns: `id`, `name`, `code`, `address`, `created_at`

- **`locations`**
  - Columns: `id`, `warehouse_id` (FK), `name`, `type` (enum: internal, vendor, customer, loss), `created_at`

- **`products`**
  - Columns: `id`, `sku` (unique), `name`, `category`, `uom`, `reorder_point`, `created_at`, `updated_at`

### 3.2 The Master Ledger (`stock_moves`)

This is the source of truth for stock.

- Columns:
  - `id` (UUID, primary key)
  - `product_id` (FK to products)
  - `source_location_id` (FK to locations)
  - `dest_location_id` (FK to locations)
  - `quantity` (integer)
  - `move_type` (enum: receipt, delivery, transfer, adjustment)
  - `status` (enum: draft, waiting, ready, done, canceled)
  - `reference`
  - `created_at`
  - `created_by` (FK to users)

## 4. Business Logic

### 4.1 Calculating Current Stock

The frontend should never calculate inventory by downloading the entire ledger.

- Use PostgreSQL views, stored procedures, or carefully structured aggregate queries.
- Available stock is calculated from completed ledger entries:
  - inbound quantity into internal locations
  - minus outbound quantity from internal locations

### 4.2 Handling Validations

When a worker validates a receipt, delivery, transfer, or adjustment:

1. The authenticated request reaches the application backend.
2. The backend verifies the user's permissions.
3. The backend checks business constraints, including available stock for deliveries and transfers.
4. The backend updates the move status to `done` inside a transaction.
5. The UI refreshes inventory and KPI data from PostgreSQL-backed queries after the transaction completes.

## 5. Non-Functional Direction

- The system must operate without mandatory third-party backend services.
- PostgreSQL must be runnable in a local development environment.
- Authentication, OTP flows, and inventory logic must remain under application control.
- The ledger must remain append-only once moves are validated.
