# 📋 Product Requirements Document: Core Inventory IMS

## 1. Product Overview & Vision

**Problem Statement:** Warehouses are currently operating in the dark ages, relying on manual registers, scattered Excel sheets, and disconnected tracking methods. This leads to stock mismatches, lost items, and zero operational visibility.
**The Solution:** A centralized, real-time, and mobile-friendly Inventory Management System (IMS). The primary directive is absolute data integrity: **every single stock movement must be logged in an immutable ledger**.

## 2. Target Users

The system is designed for two distinct user profiles:

* **Inventory Managers:** The overseers. They need a high-level view of operations, KPI tracking, and the ability to manage incoming (vendor) and outgoing (customer) flows.


* **Warehouse Staff:** The boots on the ground. They are executing the physical work: performing internal transfers, picking items for delivery, shelving received goods, and conducting cycle counts/adjustments.



## 3. Core Architecture & Philosophy (Technical Stance)

We are explicitly rejecting the standard "update the stock column" approach.

* 
**Event-Sourced Ledger:** The total stock of any item is a dynamically calculated sum of its entire move history.


* **Real-time Sync:** Dashboard KPIs and stock levels must update instantaneously across clients when a warehouse worker validates a movement on the floor.

## 4. Feature Specifications

### 4.1. Authentication & Onboarding

* 
**Requirement:** Users must be able to sign up, log in, and securely access the system.


* 
**Proposed Pivot:** The specs call for an OTP-based password reset. **Opinion:** Managing passwords is a massive friction point and security liability. We should pivot to Passwordless Magic Links or OAuth (Google/Microsoft) via Supabase Auth or Clerk to streamline access and eliminate password reset flows entirely.


* 
**Flow:** Upon successful authentication, the user is immediately routed to the main Inventory Dashboard.



### 4.2. The Command Center (Dashboard)

The landing page serves as a real-time snapshot of the warehouse's heartbeat.

* **Live KPIs:**
* Total count of Products in Stock.


* Alerts for Low Stock or Out of Stock items.


* Queue sizes for Pending Receipts and Pending Deliveries.


* Number of Scheduled Internal Transfers.




* 
**Global Smart Filters:** Ability to slice dashboard data by document type (Receipts, Delivery, Internal, Adjustments), status (Draft, Waiting, Ready, Done, Canceled), specific warehouse/location, or product category .



### 4.3. Product Management (Catalog)

The master database of all physical goods.

* 
**Data Model:** Ability to create and update products with a Name, unique SKU/Code, Category, and Unit of Measure (UoM) .


* 
**Initial State:** Support for setting an initial stock level during creation (which under the hood, generates an initial "Adjustment" ledger entry).


* 
**Visibility:** Instant view of stock availability broken down per specific physical location.


* 
**Automation:** Configurable reordering rules to trigger low-stock alerts.



### 4.4. Operations (The Stock Ledger Workflows)

This is the engine of the app. All operations affect the ledger.

* 
**Receipts (Incoming Goods):** Processing items arriving from vendors. Users create a receipt, add the supplier, list products, input received quantities, and hit Validate, which automatically increments the stock ledger .


* 
**Delivery Orders (Outgoing Goods):** Processing items leaving for customers. Follows a Pick -> Pack -> Validate workflow, which automatically decrements the stock ledger upon validation .


* 
**Internal Transfers:** Moving stock *within* the company (e.g., Main Warehouse to Production Floor, or Rack A to Rack B) . The total company stock remains unchanged, but the item's location metadata is updated in the ledger.


* 
**Inventory Adjustments:** The audit tool to fix reality vs. system mismatches . Users select a product/location, enter the actual physical physical count, and the system auto-calculates the difference and logs the adjustment (e.g., logging a -3 for damaged items) .


* 
**Move History:** A master, immutable audit log of every transaction.



### 4.5. Settings & Infrastructure

* 
**Multi-Warehouse Support:** The database must support multiple distinct warehouse entities.


* **Location Hierarchy:** Ability to define granular locations (zones, aisles, racks) nested within a specific Warehouse.

---
