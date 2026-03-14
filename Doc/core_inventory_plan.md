# Core Inventory IMS — Implementation Plan (Updated)

## 1) Objective

Build a modular Inventory Management System (IMS) that digitizes and streamlines stock operations, replacing manual registers and spreadsheets with a centralized, real-time application.

---

## 2) Scope to Deliver

### 2.1 Target users

- **Inventory Managers**: oversee incoming/outgoing stock and monitor KPIs
- **Warehouse Staff**: execute transfers, picking, shelving, and counting

### 2.2 Authentication

- Sign up / log in flow
- OTP-based password reset
- Redirect authenticated users to dashboard

### 2.3 Dashboard requirements

KPIs:

- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

Filters:

- Document type: `Receipts`, `Delivery`, `Internal`, `Adjustments`
- Status: `Draft`, `Waiting`, `Ready`, `Done`, `Canceled`
- Warehouse/location
- Product category

### 2.4 Navigation requirements

1. **Products**
   - Create/update products
   - Stock availability per location
   - Product categories
   - Reordering rules
2. **Operations**
   - Receipts
   - Delivery Orders
   - Inventory Adjustment
   - Move History
3. **Dashboard**
4. **Setting**
   - Warehouse
5. **Profile Menu (Left Sidebar)**
   - My Profile
   - Logout

---

## 3) Core Functional Workflows

### 3.1 Product Management

Product fields:

- Name
- SKU / Code
- Category
- Unit of Measure
- Initial stock (optional)

### 3.2 Receipts (Incoming Goods)

Flow:

1. Create receipt
2. Add supplier + products
3. Enter quantities received
4. Validate (stock increases)

Example: receive 50 units of Steel Rods → stock `+50`

### 3.3 Delivery Orders (Outgoing Goods)

Flow:

1. Pick items
2. Pack items
3. Validate (stock decreases)

Example: sales order for 10 chairs → stock `-10`

### 3.4 Internal Transfers

Examples:

- Main Warehouse → Production Floor
- Rack A → Rack B
- Warehouse 1 → Warehouse 2

Transfer changes location balances; movement is logged in ledger.

### 3.5 Stock Adjustments

Used to reconcile recorded stock vs physical count.

Flow:

1. Select product/location
2. Enter counted quantity
3. System computes difference and logs adjustment

---

## 4) Additional Features

- Low-stock alerts
- Multi-warehouse support
- SKU search and smart filters

---

## 5) Technical Delivery Plan

### Phase A — Foundation

- Confirm DB schema supports products, warehouses, locations, stock moves, users, and auth artifacts
- Ensure stock is ledger-driven (derived from movements), not manually edited totals
- Validate enum/status coverage for operations and dashboard filters

### Phase B — Authentication and Access Control

- Implement login/signup and OTP reset flow
- Secure session handling and route guards
- Redirect to dashboard post-auth

### Phase C — Core APIs

- Products API: create/update/list
- Inventory operations API: receipts, deliveries, transfers, adjustments
- Move history API for immutable audit trail
- KPI and filter APIs for dashboard views

### Phase D — Frontend Experiences

- Dashboard KPI cards and filter controls
- Products module with create/edit forms
- Operations screens: Receipts, Deliveries, Adjustments, Transfers
- Move history with status and document filtering
- Settings (warehouse management) and profile menu actions

### Phase E — Validation and QA

- End-to-end inventory flow tests
- Verify stock math after each validated operation
- Validate role-appropriate visibility and actions
- Regression checks for filtering and KPI correctness

---

## 6) Acceptance Criteria

The implementation is considered complete when:

1. Authentication works with OTP reset and dashboard redirect
2. Dashboard KPIs and filters operate on live inventory data
3. Products can be created/updated with required fields
4. Receipts increase stock after validation
5. Deliveries decrease stock after validation
6. Transfers reallocate stock between internal locations and are logged
7. Adjustments reconcile physical count and are logged
8. Move history records all stock movements immutably
9. Multi-warehouse support is functional
10. SKU search and smart filters are usable across relevant screens

---

## 7) Simplified Inventory Flow (Reference)

1. Receive 100 kg Steel → stock `+100`
2. Transfer Main Store → Production Rack → total unchanged, location updated
3. Deliver 20 steel → stock `-20`
4. Adjust 3 kg damaged → stock `-3`

All actions must be recorded in the Stock Ledger.

---

## 8) Design Reference

- Mockup: https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R
