import { db } from "@/lib/db/connection"
import { sql } from "drizzle-orm"

export type StockLevel = {
  productId: string
  locationId: string
  locationName: string
  warehouseId: string
  available: number
}

export type InventoryKpis = {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  pendingReceipts: number
  pendingDeliveries: number
  scheduledTransfers: number
}

/**
 * Calculates current stock levels for a product broken down by location.
 *
 * Formula:
 *   available = SUM(inbound quantity to internal locations)
 *             - SUM(outbound quantity from internal locations)
 *   where status = 'done'
 *
 * @param productId - UUID of the product to calculate stock for
 * @param warehouseId - Optional: filter to a specific warehouse
 * @security Stock is NEVER read from a static column. This is the canonical source of truth.
 */
export async function calculateStockByLocation(
  productId: string,
  warehouseId?: string
): Promise<StockLevel[]> {
  const warehouseFilter = warehouseId
    ? sql`AND l.warehouse_id = ${warehouseId}`
    : sql``

  const rows = await db.execute<{
    location_id: string
    location_name: string
    warehouse_id: string
    available: number
  }>(sql`
    SELECT
      l.id AS location_id,
      l.name AS location_name,
      l.warehouse_id,
      COALESCE(SUM(
        CASE WHEN sm.dest_location_id = l.id THEN sm.quantity ELSE 0 END
      ), 0)
      -
      COALESCE(SUM(
        CASE WHEN sm.source_location_id = l.id THEN sm.quantity ELSE 0 END
      ), 0) AS available
    FROM locations l
    LEFT JOIN stock_moves sm
      ON (sm.dest_location_id = l.id OR sm.source_location_id = l.id)
      AND sm.product_id = ${productId}
      AND sm.status = 'done'
    WHERE l.type = 'internal'
    ${warehouseFilter}
    GROUP BY l.id, l.name, l.warehouse_id
    HAVING
      COALESCE(SUM(CASE WHEN sm.dest_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN sm.source_location_id = l.id THEN sm.quantity ELSE 0 END), 0)
      != 0
      OR EXISTS (
        SELECT 1 FROM stock_moves WHERE product_id = ${productId} AND (dest_location_id = l.id OR source_location_id = l.id)
      )
  `)

  return rows.rows.map((r) => ({
    productId,
    locationId: r.location_id,
    locationName: r.location_name,
    warehouseId: r.warehouse_id,
    available: Number(r.available),
  }))
}

/**
 * Returns the total available stock for a product across all warehouses.
 * Derived entirely from the stock_moves ledger.
 */
export async function getTotalAvailableStock(productId: string): Promise<number> {
  const levels = await calculateStockByLocation(productId)
  return levels.reduce((sum, l) => sum + l.available, 0)
}

/**
 * Computes all KPI values needed for the dashboard.
 * Uses a single multi-aggregate SQL query to minimize round-trips.
 */
export async function getInventoryKpis(): Promise<InventoryKpis> {
  const result = await db.execute<{
    total_products: string
    pending_receipts: string
    pending_deliveries: string
    scheduled_transfers: string
  }>(sql`
    SELECT
      (SELECT COUNT(*) FROM products)::int AS total_products,
      (SELECT COUNT(*) FROM stock_moves WHERE status IN ('draft', 'waiting', 'ready') AND move_type = 'receipt')::int AS pending_receipts,
      (SELECT COUNT(*) FROM stock_moves WHERE status IN ('draft', 'waiting', 'ready') AND move_type = 'delivery')::int AS pending_deliveries,
      (SELECT COUNT(*) FROM stock_moves WHERE status IN ('draft', 'waiting', 'ready') AND move_type = 'internal_transfer')::int AS scheduled_transfers
  `)

  const row = result.rows[0]

  return {
    totalProducts: Number(row.total_products),
    lowStockCount: 0, // Phase 2: JOIN with reorder_point after stock view is created
    outOfStockCount: 0,
    pendingReceipts: Number(row.pending_receipts),
    pendingDeliveries: Number(row.pending_deliveries),
    scheduledTransfers: Number(row.scheduled_transfers),
  }
}
