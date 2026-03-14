
Here is your no-BS Technical Requirements Document.

---

# ⚙️ Technical Requirements Document: Core Inventory IMS

## 1. The Tech Stack

We are bypassing legacy stacks and going straight for modern, real-time infrastructure to handle the dynamic dashboard and ledger updates.

* **Frontend Framework:** Next.js (App Router). Server Components for heavy data fetching (like calculating total stock from the ledger) and Client Components for the interactive data tables.
* **Backend & Database:** Supabase or Convex.
* *Why?* Both give us instant real-time websocket subscriptions. When a warehouse worker hits "Validate" on a delivery, the manager's dashboard updates instantly without a page refresh. Supabase gives us raw PostgreSQL power (perfect for ledger constraints), while Convex offers seamless TypeScript integration.


* **Styling & UI:** Tailwind CSS + `shadcn/ui`.
* **State Management:** React Query (if using Supabase REST/RPC) or native Convex hooks. No Redux. Keep the state on the server where it belongs.
* **Deployment:** Vercel for the Next.js frontend to ensure edge-network speed.

## 2. The Database Schema (The Event-Sourced Ledger)

This is the most critical part of the app. We do *not* have a `stock_quantity` column in the `Products` table. We derive stock from the `Stock_Moves` ledger.

### `Warehouses` & `Locations`

To support multi-warehouse operations:

* **`Warehouses` Table:** `id`, `name`, `code`, `address`.
* 
**`Locations` Table:** `id`, `warehouse_id` (Foreign Key), `name` (e.g., "Rack A", "Production Floor"), `type` (internal, vendor, customer, loss).


* *Note:* "Vendor" and "Customer" are virtual locations. A receipt is a move from "Vendor" to "Internal". A delivery is a move from "Internal" to "Customer".



### `Products`

The master catalog.

* **`Products` Table:**
* `id` (UUID)
* 
`name` (String) 


* 
`sku` (String, Unique) 


* 
`category` (String) 


* 
`unit_of_measure` (String - e.g., kg, units) 


* 
`reorder_point` (Integer) - For low-stock alerts.





### `Stock_Moves` (The Master Ledger)

Every single operation  writes to this table. It is append-only.

* **`Stock_Moves` Table:**
* `id` (UUID)
* `product_id` (Foreign Key)
* `source_location_id` (Foreign Key)
* `dest_location_id` (Foreign Key)
* `quantity` (Integer)
* 
`move_type` (Enum: Receipt, Delivery, Internal_Transfer, Adjustment) 


* 
`status` (Enum: Draft, Waiting, Ready, Done, Canceled) 


* `reference_document` (String - e.g., "PO-001", "SO-099")
* `created_at` (Timestamp)



*How it works in practice:*

* 
**Receipt:** Source = Vendor (Virtual), Dest = Warehouse 1, Qty = 50.


* 
**Delivery:** Source = Warehouse 1, Dest = Customer (Virtual), Qty = 10.


* 
**Transfer:** Source = Rack A, Dest = Rack B, Qty = 5.



## 3. Data Fetching & Business Logic

* **Calculating Current Stock:** We will use a database View or an RPC function (if Supabase) to calculate the current stock.
* *Logic:* Sum of all `quantity` where `dest_location` is an internal warehouse location, MINUS sum of all `quantity` where `source_location` is that same internal location.


* **Real-time Subscriptions:** The Next.js dashboard will subscribe to the `Stock_Moves` table. Any insert with a status of "Done" triggers a re-fetch of the KPI metrics.



## 4. Authentication & Security

* **Auth Provider:** Supabase Auth or Clerk.
* **Method:** Magic Links (Email) or OAuth (Google). We are dropping the OTP/Password requirement to reduce login friction for warehouse staff on mobile devices.


* 
**Role-Based Access Control (RBAC):** * `Admin/Manager`: Can view dashboard, create products, and view move history.


* 
`Staff`: Restricted to executing Operations (Receipts, Deliveries, Transfers, Adjustments).





---

