# 📋 Product Requirements Document: Core Inventory IMS

## 1. Problem Statement

Build a modular Inventory Management System (IMS) that digitizes and streamlines all stock-related operations within a business.

The goal is to replace manual registers, Excel sheets, and scattered tracking methods with a centralized, real-time, and easy-to-use application.

---

## 2. Target Users

- **Inventory Managers**
  - Manage incoming and outgoing stock
  - Monitor operations via dashboard KPIs and filters

- **Warehouse Staff**
  - Perform transfers, picking, shelving, and counting
  - Execute operational workflows for receipts, deliveries, and adjustments

---

## 3. Authentication & Access Flow

- User signs up / logs in
- OTP-based password reset is supported
- After successful authentication, user is redirected to the **Inventory Dashboard**

---

## 4. Dashboard View (Landing Page)

The dashboard acts as a real-time operational snapshot.

### 4.1 Dashboard KPIs

- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Internal Transfers Scheduled

### 4.2 Dynamic Filters

- By document type: `Receipts` / `Delivery` / `Internal` / `Adjustments`
- By status: `Draft`, `Waiting`, `Ready`, `Done`, `Canceled`
- By warehouse or location
- By product category

---

## 5. Navigation & Information Architecture

### 5.1 Main Navigation

1. **Products**
   - Create/update products
   - Stock availability per location
   - Product categories
   - Reordering rules

2. **Operations**
   1. Receipts (Incoming Stock)
   2. Delivery Orders (Outgoing Stock)
   3. Inventory Adjustment
   4. Move History

3. **Dashboard**

4. **Setting**
   - Warehouse

### 5.2 Profile Menu (Left Sidebar)

- My Profile
- Logout

---

## 6. Core Features

### 6.1 Product Management

Create products with:

- Name
- SKU / Code
- Category
- Unit of Measure
- Initial stock (optional)

### 6.2 Receipts (Incoming Goods)

Used when items arrive from vendors.

**Process:**

1. Create a new receipt
2. Add supplier and products
3. Input quantities received
4. Validate → stock increases automatically

**Example:**

- Receive 50 units of **Steel Rods** → stock `+50`

### 6.3 Delivery Orders (Outgoing Goods)

Used when stock leaves the warehouse for customer shipment.

**Process:**

1. Pick items
2. Pack items
3. Validate → stock decreases automatically

**Example:**

- Sales order for 10 chairs → chairs stock `-10`

### 6.4 Internal Transfers

Move stock within the company, such as:

- Main Warehouse → Production Floor
- Rack A → Rack B
- Warehouse 1 → Warehouse 2

Each movement is logged in the stock ledger.

### 6.5 Stock Adjustments

Used to fix mismatches between:

1. Recorded stock
2. Physical count

**Steps:**

- Select product/location
- Enter counted quantity
- System auto-updates stock and logs the adjustment

---

## 7. Additional Features

- Low-stock alerts
- Multi-warehouse support
- SKU search and smart filters

---

## 8. Simplified Inventory Flow Example

### Step 1: Receive goods from vendor

- Receive **100 kg Steel**
- Stock impact: `+100`

### Step 2: Move to production rack

- Internal transfer: Main Store → Production Rack
- Total stock unchanged, location updated

### Step 3: Deliver finished goods

- Deliver **20 steel**
- Stock impact: `-20`

### Step 4: Adjust damaged items

- Record **3 kg steel damaged**
- Stock impact: `-3`

✅ Everything is logged in the **Stock Ledger**.

---

## 9. Mockup Reference

- Excalidraw mockup: https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R
