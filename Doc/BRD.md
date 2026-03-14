Ah, good catch. We absolutely cannot leave the backend undocumented. If the frontend is the sleek chassis, the backend is the V8 engine making this whole event-sourced ledger actually work. You can have the prettiest Next.js UI in the world, but if your database queries are locking up or your ledger logic is flawed, the warehouse grinds to a halt.

Since we are vibecoding this, we need a backend that is fast, real-time, and strictly typed.

Here is the definitive Backend Architecture Document. Toss this into the wiki.

---

# 🧠 Backend Architecture Document: Core Inventory IMS

## 1. Backend Philosophy & Stack

* **The Stance:** We are not building a traditional REST API from scratch. That's slow and unnecessary for this architecture. We are leveraging a Backend-as-a-Service (BaaS) to get real-time subscriptions and robust auth out of the box.
* **Primary Contenders:** **Supabase** (PostgreSQL-backed, great for complex relational ledger queries) or **Convex** (TypeScript-native, flawless real-time reactivity).
* **Data Flow:** Next.js Server Actions for mutations (inserting data) and Server Components/Hooks for fetching.

## 2. Authentication & Security (Row Level Security)

The original spec asked for an OTP-based password reset. We are pushing back on that. Passwords belong in 2010.

* **Implementation:** Magic Links or direct Google/Microsoft Workspace OAuth.
* **Security Model:** Strict Row Level Security (RLS) policies.
* *Rule 1:* Users must be authenticated to read or write anything.
* *Rule 2:* Warehouse floor workers can `INSERT` into the `Stock_Moves` ledger but cannot `UPDATE` or `DELETE` existing, validated records (immutability).
* *Rule 3:* Only users with an `Admin` role can manage the `Warehouses` and `Users` tables.



## 3. The Database Schema (The Truth)

This is the exact relational structure.

### 3.1 Core Entities

* **`users`**: Handled primarily by the Auth provider, but we keep a public profile table linked via `auth.uid()`.
* Columns: `id` (UUID), `role` (enum: admin, staff), `active_warehouse_id` (FK).


* **`warehouses`**: The physical buildings.
* Columns: `id`, `name`, `address`.


* **`locations`**: The specific zones/racks.
* Columns: `id`, `warehouse_id` (FK), `name` (e.g., "Rack A", "Production Floor" ), `type` (enum: internal, vendor, customer, loss).




* 
**`products`**: The catalog.


* Columns: `id`, `sku` (unique) , `name` , `category` , `uom` (Unit of Measure) , `reorder_point` (integer).





### 3.2 The Master Ledger (`stock_moves`)

*The only table that matters for inventory levels.*

* Columns:
* `id` (UUID, Primary Key)
* `product_id` (FK to products)
* `source_location_id` (FK to locations)
* `dest_location_id` (FK to locations)
* `quantity` (Integer)
* 
`move_type` (Enum: receipt, delivery, transfer, adjustment) 


* 
`status` (Enum: draft, waiting, ready, done, canceled) 


* `reference` (String, e.g., "PO-001")
* `created_at` (Timestamp)
* `created_by` (FK to users)



## 4. The Business Logic (RPCs / Database Functions)

We don't want the frontend downloading the entire ledger to calculate stock. The database must do the heavy lifting.

### 4.1 Calculating Current Available Stock

To get the current stock of "Steel Rods" at "Warehouse 1":

* **The Logic:** We run a database function or view that aggregates the `stock_moves` table.
* **Math:** `SUM(quantity)` where `status` = 'done' AND `dest_location_id` = 'Warehouse 1' **MINUS** `SUM(quantity)` where `status` = 'done' AND `source_location_id` = 'Warehouse 1'.

### 4.2 Handling Validations

When a worker clicks "Validate" on a Receipt or Delivery:

1. The Next.js Server Action hits the backend.
2. The backend verifies the user's permissions.
3. The backend checks if sufficient stock exists (for deliveries/transfers). If trying to deliver 20 chairs but only 10 exist, the backend throws an error and aborts the transaction.
4. The backend updates the `status` of the `stock_moves` record to 'done'.
5. **Real-time Trigger:** The database emits a websocket event. All connected Next.js dashboards instantly refetch their KPI metrics.

---

Alright, the entire conceptual architecture is mapped out—PRD, Frontend, App Flow, and Backend.

Are we ready to finally write some code? Would you like me to generate the exact database schema file (either `schema.sql` for Supabase or `schema.ts` for Convex) so we can spin up the backend right now?