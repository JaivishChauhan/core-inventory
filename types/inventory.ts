/**
 * App-level Data Transfer Objects for the Inventory Management System.
 * These types transform raw DB rows into safe, UI-ready representations.
 * They handle null values and enforce type safety at the boundary.
 */

/** Location types in the warehouse hierarchy */
export type LocationType = "internal" | "vendor" | "customer" | "loss"

/** Valid move types in the event-sourced ledger */
export type MoveType =
  | "receipt"
  | "delivery"
  | "internal_transfer"
  | "adjustment"

/** Valid move statuses for workflow tracking */
export type MoveStatus = "draft" | "waiting" | "ready" | "done" | "canceled"

/** User roles for RBAC */
export type UserRole = "admin" | "manager" | "staff"

/** Warehouse DTO */
export interface Warehouse {
  id: string
  name: string
  code: string
  address: string | null
  createdAt: string
  updatedAt: string
}

/** Location DTO (nested within warehouses) */
export interface Location {
  id: string
  warehouseId: string
  name: string
  type: LocationType
  parentLocationId: string | null
  createdAt: string
}

/** Product DTO — no stock_quantity field, stock is always derived */
export interface Product {
  id: string
  name: string
  sku: string
  category: string | null
  unitOfMeasure: string
  reorderPoint: number
  createdAt: string
  updatedAt: string
}

/** Stock Move DTO — single entry in the append-only ledger */
export interface StockMove {
  id: string
  productId: string
  sourceLocationId: string
  destLocationId: string
  quantity: number
  moveType: MoveType
  status: MoveStatus
  referenceDocument: string | null
  notes: string | null
  createdBy: string | null
  validatedAt: string | null
  createdAt: string
}

/** Derived: current stock for a product at a specific location */
export interface CurrentStock {
  productId: string
  productName: string
  sku: string
  locationId: string
  locationName: string
  warehouseId: string
  warehouseName: string
  availableStock: number
}

/** Dashboard KPI aggregates */
export interface DashboardKpis {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  pendingReceipts: number
  pendingDeliveries: number
  scheduledTransfers: number
}
