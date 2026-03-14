# App Flow Document: Core Inventory IMS

## 1. Authentication Flow

- **Entry Point:** The user lands on the Login or Sign Up page.
- **Login:** The user authenticates with email or username plus password.
- **Password Reset:** If the user forgets their password, they request an OTP, verify it, and then set a new password.
- **Redirect:** After successful authentication, the user is routed to the Inventory Dashboard.

## 2. Global Navigation

- **Left Sidebar:** Dashboard, Products, Receipts, Deliveries, Transfers, Adjustments, Move History, and Settings.
- **Top App Bar:** Profile menu, logout, active warehouse selector, and global search.

## 3. Dashboard Flow

- The landing page shows KPI cards for inventory health and pending operational work.
- Clicking a KPI card routes the user to the relevant filtered list.

## 4. Product Management Flow

- The user opens Products from the sidebar.
- Creating or editing a product opens a slide-over.
- Saving a product updates the product catalog and, if needed, creates an initial adjustment ledger entry.

## 5. Operations Flow

All operational flows follow List -> Slide-over -> Validate.

### 5.1 Receipts

- The user opens Receipts and creates a new receipt.
- The user adds vendor-facing source information, products, and quantities.
- Validation creates stock movement entries that increase available inventory.

### 5.2 Deliveries

- The user opens Deliveries and creates a new delivery.
- The user completes picking and packing details.
- Validation creates stock movement entries that decrease available inventory.

### 5.3 Internal Transfers

- The user selects source and destination locations.
- Validation updates location-level availability while keeping total stock unchanged.

### 5.4 Adjustments

- The user records a counted quantity for a product and location.
- The system computes the variance and logs the resulting adjustment entry.

## 6. Move History

- Move History presents a read-only table of all confirmed stock ledger entries.
- This is the audit source for stock movement tracking and operational review.
