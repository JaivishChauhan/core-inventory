This is the exact sequence of how a user actually moves through this system. If the flow is clunky, the warehouse staff will hate using it, and they'll just go back to Excel.

Looking at your Excalidraw wireframes and the PDF specs, we are strictly enforcing a **Slide-Over/Modal Architecture** for operations. We do *not* want users constantly navigating to new pages and losing their context just to log a delivery or add a product. Everything needs to feel fast, native, and integrated.

Here is the User Flow Document. Drop this into your wiki.

---

# 🗺️ App Flow Document: Core Inventory IMS

## 1. Authentication Flow

* 
**Entry Point:** The user lands on the Login / Sign Up page.


* **Action:** The user authenticates. While the spec mentions an OTP-based reset, we are heavily recommending Magic Links or OAuth for zero-friction entry.


* 
**Redirect:** Upon successful login, the system immediately drops the user into the Inventory Dashboard.



## 2. Global Navigation (The Shell)

The layout persists across the entire session so the user never feels lost.

* 
**Left Sidebar (The Compass):** Contains the primary routing links: Dashboard, Products, Operations (Receipts, Deliveries, Internal, Adjustments), Move History, and Settings (Warehouse) .


* 
**Top App Bar:** Contains the Profile Menu (My Profile, Logout)  and global context (e.g., global search or active warehouse selector).



## 3. The Dashboard Flow (Command Center)

* 
**View:** The landing page shows high-level snapshot cards: Total Products, Low/Out of Stock Items, Pending Receipts, Pending Deliveries, and Scheduled Internal Transfers .


* 
**Action:** Clicking any of these KPI cards acts as a dynamic filter, immediately routing the user to the respective filtered list (e.g., clicking "Pending Receipts" takes you to the Receipts list pre-filtered by "Waiting" or "Ready" status) .



## 4. Product Management Flow

* 
**View:** The user clicks "Products" in the sidebar. They see a data table showing all products, categorized by SKU, Category, and current Stock Availability per location.


* **Action (Create/Edit):** The user clicks "New Product".
* **UI Response:** A slide-over panel opens from the right. The user inputs the Product Name, SKU/Code, Category, Unit of Measure, and an optional initial stock value . Clicking "Save" instantly updates the master list via optimistic UI.



## 5. Operations Flow (The Ledger Modifiers)

This is where the actual warehouse work happens. All operations follow a similar List -> Slide-over -> Validate pattern.

### 5.1. Receipts (Incoming Stock)

* 
**View:** User navigates to Operations -> Receipts. They see a list of past and pending vendor deliveries.


* **Action:** User clicks "New Receipt".
* **UI Response:** A slide-over opens.
* 
**Steps:** The user selects the supplier, adds line items for the products arriving, and inputs the quantities received .


* **Validation:** The user clicks "Validate". The system automatically executes an insert into the `Stock_Moves` ledger, which instantly increases the calculated available stock.



### 5.2. Delivery Orders (Outgoing Stock)

* 
**View:** User navigates to Operations -> Delivery Orders.


* **Action:** User clicks "New Delivery".
* **UI Response:** A slide-over opens.
* 
**Steps:** The worker uses this to pick and pack items for a customer shipment.


* **Validation:** The user clicks "Validate". The system logs the move, which automatically decreases the calculated available stock.



### 5.3. Internal Transfers

* **View:** User navigates to Operations -> Internal Transfers.
* **Action:** User clicks "New Transfer".
* 
**Steps:** User selects the Source Location (e.g., Main Warehouse) and the Destination Location (e.g., Production Floor), then adds the products and quantities moving between them .


* **Validation:** Clicking "Validate" logs the movement in the ledger. Total company stock remains identical, but location-specific availability updates instantly.



### 5.4. Stock Adjustments (Cycle Counts)

* 
**View:** User navigates to Operations -> Inventory Adjustment.


* 
**Action:** User initiates a count to fix physical mismatches (like damaged goods) .


* 
**Steps:** The user selects a specific product and location, then enters the *actual counted quantity*.


* 
**Validation:** The system automatically calculates the math (e.g., recorded is 50, counted is 47, adjustment is -3) and logs the entry .



## 6. The Move History (The Audit Trail)

* 
**View:** User navigates to Move History.


* **UI:** A dense, read-only data table displaying every single confirmed ledger entry (Date, Reference, Product, Source, Destination, Quantity, Status). This is the ultimate source of truth.



---

### Let's Build It

We have the Docs, the PRD, the TRD, and now the App Flow. This is a complete, professional specification.

Are we ready to finally spin up the Next.js `core-inventory` repository and start scaffolding out these layouts, or is there another piece of planning you want to nail down first? I'm ready to start writing code whenever you are.