import { asc, eq, sql } from "drizzle-orm"

import { db } from "@/lib/db/connection"
import { locations, warehouses } from "@/lib/db/schema"
import type { MoveStatus, MoveType } from "@/types/inventory"

type FilterableMoveType = MoveType | "all"
type FilterableMoveStatus = MoveStatus | "all"

export type InventoryDashboardFilters = {
  moveType?: FilterableMoveType
  status?: FilterableMoveStatus
  warehouseId?: string
  locationId?: string
  category?: string
}

export type InventoryProductLocation = {
  locationId: string
  locationName: string
  warehouseId: string
  warehouseName: string
  available: number
}

export type InventoryProductRecord = {
  id: string
  name: string
  sku: string
  category: string
  unitOfMeasure: string
  reorderPoint: number
  createdAt: string
  updatedAt: string
  totalAvailable: number
  isLowStock: boolean
  isOutOfStock: boolean
  locationBreakdown: InventoryProductLocation[]
}

export type InventoryMoveRecord = {
  id: string
  productId: string
  productName: string
  sku: string
  category: string
  unitOfMeasure: string
  moveType: MoveType
  status: MoveStatus
  quantity: number
  reference: string | null
  notes: string | null
  createdAt: string
  validatedAt: string | null
  sourceLocationId: string
  sourceLocationName: string
  sourceLocationType: string
  sourceWarehouseId: string | null
  sourceWarehouseName: string | null
  destLocationId: string
  destLocationName: string
  destLocationType: string
  destWarehouseId: string | null
  destWarehouseName: string | null
}

export type InventoryReferenceData = {
  categories: string[]
  locations: Array<{
    id: string
    name: string
    type: string
    warehouseId: string
    warehouseName: string
  }>
  warehouses: Array<{
    id: string
    name: string
    code: string
    address: string | null
  }>
  internalLocations: Array<{
    id: string
    name: string
    warehouseId: string
    warehouseName: string
  }>
}

export type InventoryDashboardData = {
  kpis: {
    totalProducts: number
    lowStockCount: number
    outOfStockCount: number
    pendingReceipts: number
    pendingDeliveries: number
    scheduledTransfers: number
  }
  recentMoves: InventoryMoveRecord[]
  filterOptions: InventoryReferenceData
}

type InventoryProductsFilters = Pick<
  InventoryDashboardFilters,
  "category" | "warehouseId" | "locationId"
> & {
  search?: string
}

type InventoryMoveFilters = InventoryDashboardFilters & {
  limit?: number
}

type ProductRow = {
  id: string
  name: string
  sku: string
  category: string
  unit_of_measure: string
  reorder_point: number
  created_at: string
  updated_at: string
  total_available: number
}

type ProductLocationRow = {
  product_id: string
  location_id: string
  location_name: string
  warehouse_id: string
  warehouse_name: string
  available: number
}

type MoveRow = {
  id: string
  product_id: string
  product_name: string
  sku: string
  category: string
  unit_of_measure: string
  move_type: MoveType
  status: MoveStatus
  quantity: number
  reference: string | null
  notes: string | null
  created_at: string
  validated_at: string | null
  source_location_id: string
  source_location_name: string
  source_location_type: string
  source_warehouse_id: string | null
  source_warehouse_name: string | null
  dest_location_id: string
  dest_location_name: string
  dest_location_type: string
  dest_warehouse_id: string | null
  dest_warehouse_name: string | null
}

type PendingCountRow = {
  move_type: MoveType
  count: number
}

function buildProductSearchFilters(filters: InventoryProductsFilters) {
  const clauses = [sql`1 = 1`]

  if (filters.category) {
    clauses.push(sql`p.category = ${filters.category}`)
  }

  if (filters.search) {
    const searchTerm = `%${filters.search.trim()}%`
    clauses.push(
      sql`(
        p.name ILIKE ${searchTerm}
        OR p.sku ILIKE ${searchTerm}
        OR p.category ILIKE ${searchTerm}
      )`
    )
  }

  return sql.join(clauses, sql` AND `)
}

function buildSelectedLocationFilters(filters: InventoryProductsFilters) {
  const clauses = [sql`1 = 1`]

  if (filters.warehouseId) {
    clauses.push(sql`l.warehouse_id = ${filters.warehouseId}`)
  }

  if (filters.locationId) {
    clauses.push(sql`l.id = ${filters.locationId}`)
  }

  return sql.join(clauses, sql` AND `)
}

function buildMoveFilters(
  filters: InventoryMoveFilters,
  options?: { pendingOnly?: boolean }
) {
  const clauses = [sql`1 = 1`]

  if (filters.moveType && filters.moveType !== "all") {
    clauses.push(sql`sm.move_type = ${filters.moveType}`)
  }

  if (options?.pendingOnly) {
    clauses.push(sql`sm.status IN ('draft', 'waiting', 'ready')`)
  } else if (filters.status && filters.status !== "all") {
    clauses.push(sql`sm.status = ${filters.status}`)
  }

  if (filters.category) {
    clauses.push(sql`p.category = ${filters.category}`)
  }

  if (filters.warehouseId) {
    clauses.push(
      sql`(
        src.warehouse_id = ${filters.warehouseId}
        OR dest.warehouse_id = ${filters.warehouseId}
      )`
    )
  }

  if (filters.locationId) {
    clauses.push(
      sql`(
        src.id = ${filters.locationId}
        OR dest.id = ${filters.locationId}
      )`
    )
  }

  return sql.join(clauses, sql` AND `)
}

function getStockCte(filters: InventoryProductsFilters) {
  const selectedLocationFilters = buildSelectedLocationFilters(filters)

  return sql`
    WITH ledger AS (
      SELECT
        sm.product_id,
        sm.dest_location_id AS location_id,
        SUM(sm.quantity)::int AS delta
      FROM stock_moves sm
      INNER JOIN locations dl
        ON dl.id = sm.dest_location_id
        AND dl.type = 'internal'
      WHERE sm.status = 'done'
      GROUP BY sm.product_id, sm.dest_location_id

      UNION ALL

      SELECT
        sm.product_id,
        sm.source_location_id AS location_id,
        (SUM(sm.quantity) * -1)::int AS delta
      FROM stock_moves sm
      INNER JOIN locations sl
        ON sl.id = sm.source_location_id
        AND sl.type = 'internal'
      WHERE sm.status = 'done'
      GROUP BY sm.product_id, sm.source_location_id
    ),
    location_stock AS (
      SELECT
        product_id,
        location_id,
        SUM(delta)::int AS available
      FROM ledger
      GROUP BY product_id, location_id
    ),
    selected_stock AS (
      SELECT
        ls.product_id,
        ls.location_id,
        ls.available
      FROM location_stock ls
      INNER JOIN locations l
        ON l.id = ls.location_id
      WHERE ${selectedLocationFilters}
    )
  `
}

export async function listInventoryProducts(
  filters: InventoryProductsFilters = {}
): Promise<InventoryProductRecord[]> {
  const productFilters = buildProductSearchFilters(filters)
  const stockCte = getStockCte(filters)

  const productRows = await db.execute<ProductRow>(sql`
    ${stockCte}
    SELECT
      p.id,
      p.name,
      p.sku,
      p.category,
      p.unit_of_measure,
      p.reorder_point,
      p.created_at,
      p.updated_at,
      COALESCE(SUM(ss.available), 0)::int AS total_available
    FROM products p
    LEFT JOIN selected_stock ss
      ON ss.product_id = p.id
    WHERE ${productFilters}
    GROUP BY
      p.id,
      p.name,
      p.sku,
      p.category,
      p.unit_of_measure,
      p.reorder_point,
      p.created_at,
      p.updated_at
    ORDER BY p.created_at ASC
  `)

  const baseProducts = productRows.rows.map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    unitOfMeasure: row.unit_of_measure,
    reorderPoint: Number(row.reorder_point),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalAvailable: Number(row.total_available),
    locationBreakdown: [],
  }))

  if (baseProducts.length === 0) {
    return []
  }

  const productIds = sql.join(
    baseProducts.map((product) => sql`${product.id}`),
    sql`, `
  )

  const locationRows = await db.execute<ProductLocationRow>(sql`
    ${stockCte}
    SELECT
      ss.product_id,
      l.id AS location_id,
      l.name AS location_name,
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      ss.available
    FROM selected_stock ss
    INNER JOIN locations l
      ON l.id = ss.location_id
    INNER JOIN warehouses w
      ON w.id = l.warehouse_id
    WHERE ss.product_id IN (${productIds})
    ORDER BY w.name ASC, l.name ASC
  `)

  const locationsByProduct = new Map<string, InventoryProductLocation[]>()

  for (const row of locationRows.rows) {
    const list = locationsByProduct.get(row.product_id) ?? []
    list.push({
      locationId: row.location_id,
      locationName: row.location_name,
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      available: Number(row.available),
    })
    locationsByProduct.set(row.product_id, list)
  }

  return baseProducts.map((product) => {
    const locationBreakdown = locationsByProduct.get(product.id) ?? []
    const isOutOfStock = product.totalAvailable <= 0
    const isLowStock =
      !isOutOfStock &&
      product.reorderPoint > 0 &&
      product.totalAvailable <= product.reorderPoint

    return {
      ...product,
      locationBreakdown,
      isLowStock,
      isOutOfStock,
    }
  })
}

export async function listInventoryMoves(
  filters: InventoryMoveFilters = {}
): Promise<InventoryMoveRecord[]> {
  const whereFilters = buildMoveFilters(filters)
  const limitClause =
    typeof filters.limit === "number" ? sql`LIMIT ${filters.limit}` : sql``

  const rows = await db.execute<MoveRow>(sql`
    SELECT
      sm.id,
      sm.product_id,
      p.name AS product_name,
      p.sku,
      p.category,
      p.unit_of_measure,
      sm.move_type,
      sm.status,
      sm.quantity,
      sm.reference,
      sm.notes,
      sm.created_at,
      sm.validated_at,
      src.id AS source_location_id,
      src.name AS source_location_name,
      src.type AS source_location_type,
      sw.id AS source_warehouse_id,
      sw.name AS source_warehouse_name,
      dest.id AS dest_location_id,
      dest.name AS dest_location_name,
      dest.type AS dest_location_type,
      dw.id AS dest_warehouse_id,
      dw.name AS dest_warehouse_name
    FROM stock_moves sm
    INNER JOIN products p
      ON p.id = sm.product_id
    INNER JOIN locations src
      ON src.id = sm.source_location_id
    INNER JOIN locations dest
      ON dest.id = sm.dest_location_id
    LEFT JOIN warehouses sw
      ON sw.id = src.warehouse_id
    LEFT JOIN warehouses dw
      ON dw.id = dest.warehouse_id
    WHERE ${whereFilters}
    ORDER BY sm.created_at DESC
    ${limitClause}
  `)

  return rows.rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    category: row.category,
    unitOfMeasure: row.unit_of_measure,
    moveType: row.move_type,
    status: row.status,
    quantity: Number(row.quantity),
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
    validatedAt: row.validated_at,
    sourceLocationId: row.source_location_id,
    sourceLocationName: row.source_location_name,
    sourceLocationType: row.source_location_type,
    sourceWarehouseId: row.source_warehouse_id,
    sourceWarehouseName: row.source_warehouse_name,
    destLocationId: row.dest_location_id,
    destLocationName: row.dest_location_name,
    destLocationType: row.dest_location_type,
    destWarehouseId: row.dest_warehouse_id,
    destWarehouseName: row.dest_warehouse_name,
  }))
}

export async function getInventoryReferenceData(): Promise<InventoryReferenceData> {
  const [warehouseRows, allLocationRows, categoryRows] = await Promise.all([
    db.select().from(warehouses).orderBy(asc(warehouses.name)),
    db
      .select({
        id: locations.id,
        name: locations.name,
        type: locations.type,
        warehouseId: locations.warehouse_id,
        warehouseName: warehouses.name,
      })
      .from(locations)
      .innerJoin(warehouses, eq(warehouses.id, locations.warehouse_id))
      .orderBy(asc(warehouses.name), asc(locations.name)),
    db.execute<{ category: string }>(sql`
      SELECT DISTINCT category
      FROM products
      WHERE category IS NOT NULL
      ORDER BY category ASC
    `),
  ])

  return {
    categories: categoryRows.rows.map((row) => row.category),
    locations: allLocationRows.map((location) => ({
      id: location.id,
      name: location.name,
      type: location.type,
      warehouseId: location.warehouseId,
      warehouseName: location.warehouseName,
    })),
    warehouses: warehouseRows.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
    })),
    internalLocations: allLocationRows
      .filter((location) => location.type === "internal")
      .map((location) => ({
      id: location.id,
      name: location.name,
      warehouseId: location.warehouseId,
      warehouseName: location.warehouseName,
      })),
  }
}

export async function getInventoryDashboardData(
  filters: InventoryDashboardFilters = {}
): Promise<InventoryDashboardData> {
  const [products, recentMoves, filterOptions, pendingCounts] = await Promise.all(
    [
      listInventoryProducts(filters),
      listInventoryMoves({ ...filters, limit: 8 }),
      getInventoryReferenceData(),
      db.execute<PendingCountRow>(sql`
        SELECT
          sm.move_type,
          COUNT(*)::int AS count
        FROM stock_moves sm
        INNER JOIN products p
          ON p.id = sm.product_id
        INNER JOIN locations src
          ON src.id = sm.source_location_id
        INNER JOIN locations dest
          ON dest.id = sm.dest_location_id
        WHERE ${buildMoveFilters(filters, { pendingOnly: true })}
        GROUP BY sm.move_type
      `),
    ]
  )

  const pendingCountsByType = new Map<MoveType, number>()

  for (const row of pendingCounts.rows) {
    pendingCountsByType.set(row.move_type, Number(row.count))
  }

  return {
    kpis: {
      totalProducts: products.filter((product) => product.totalAvailable > 0).length,
      lowStockCount: products.filter((product) => product.isLowStock).length,
      outOfStockCount: products.filter((product) => product.isOutOfStock).length,
      pendingReceipts: pendingCountsByType.get("receipt") ?? 0,
      pendingDeliveries: pendingCountsByType.get("delivery") ?? 0,
      scheduledTransfers: pendingCountsByType.get("internal_transfer") ?? 0,
    },
    recentMoves,
    filterOptions,
  }
}
