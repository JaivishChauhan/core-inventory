import { and, asc, eq, sql } from "drizzle-orm"

import { db } from "@/lib/db/connection"
import { locations, products, stockMoves } from "@/lib/db/schema"
import type { MoveStatus, MoveType } from "@/types/inventory"

type InventoryExecutor = Pick<
  typeof db,
  "execute" | "insert" | "select" | "update"
>

type VirtualLocationType = "customer" | "loss" | "vendor"

type CreateProductInput = {
  name: string
  sku: string
  category: string
  unit_of_measure: string
  reorder_point: number
  initial_stock?: number
  initial_location_id?: string
}

type CreateMoveInput = {
  product_id: string
  source_location_id: string
  dest_location_id: string
  quantity: number
  move_type: MoveType
  status?: Exclude<MoveStatus, "done" | "canceled">
  reference?: string
  notes?: string
  validate_now?: boolean
}

type ApplyAdjustmentInput = {
  product_id: string
  location_id: string
  counted_quantity: number
  reference?: string
  notes?: string
}

export class InventoryMutationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = "InventoryMutationError"
  }
}

async function getAvailableStockAtLocation(
  executor: InventoryExecutor,
  productId: string,
  locationId: string
) {
  const result = await executor.execute<{ available: number }>(sql`
    SELECT
      COALESCE(SUM(
        CASE
          WHEN sm.dest_location_id = ${locationId}
            AND dest.type = 'internal'
            AND sm.status = 'done'
          THEN sm.quantity
          ELSE 0
        END
      ), 0)
      -
      COALESCE(SUM(
        CASE
          WHEN sm.source_location_id = ${locationId}
            AND src.type = 'internal'
            AND sm.status = 'done'
          THEN sm.quantity
          ELSE 0
        END
      ), 0) AS available
    FROM stock_moves sm
    LEFT JOIN locations dest
      ON dest.id = sm.dest_location_id
    LEFT JOIN locations src
      ON src.id = sm.source_location_id
    WHERE sm.product_id = ${productId}
  `)

  return Number(result.rows[0]?.available ?? 0)
}

async function ensureVirtualLocation(
  executor: InventoryExecutor,
  warehouseId: string,
  type: VirtualLocationType
) {
  const [existingLocation] = await executor
    .select()
    .from(locations)
    .where(
      and(eq(locations.warehouse_id, warehouseId), eq(locations.type, type))
    )
    .limit(1)

  if (existingLocation) {
    return existingLocation
  }

  const nameByType: Record<VirtualLocationType, string> = {
    customer: "Customer",
    loss: "Inventory Loss",
    vendor: "Vendor",
  }

  const [createdLocation] = await executor
    .insert(locations)
    .values({
      warehouse_id: warehouseId,
      name: nameByType[type],
      type,
    })
    .returning()

  return createdLocation
}

async function resolveInternalLocation(
  executor: InventoryExecutor,
  locationId?: string,
  warehouseId?: string | null
) {
  if (locationId) {
    const [location] = await executor
      .select()
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.type, "internal")))
      .limit(1)

    if (!location) {
      throw new InventoryMutationError(
        "Select a valid internal location before saving stock.",
        400
      )
    }

    return location
  }

  const query = executor
    .select()
    .from(locations)
    .where(
      warehouseId
        ? and(
            eq(locations.type, "internal"),
            eq(locations.warehouse_id, warehouseId)
          )
        : eq(locations.type, "internal")
    )
    .orderBy(asc(locations.created_at))
    .limit(1)

  const [defaultLocation] = await query

  if (!defaultLocation) {
    throw new InventoryMutationError(
      "Create an internal warehouse location before adding stock.",
      409
    )
  }

  return defaultLocation
}

async function ensureMoveCanValidate(
  executor: InventoryExecutor,
  move: {
    id: string
    move_type: MoveType
    status: MoveStatus
    quantity: number
    product_id: string
    source_location_id: string
  }
) {
  if (move.status === "done") {
    throw new InventoryMutationError(
      "This move has already been validated.",
      409
    )
  }

  if (move.status === "canceled") {
    throw new InventoryMutationError("Cannot validate a canceled move.", 409)
  }

  if (
    move.move_type === "delivery" ||
    move.move_type === "internal_transfer"
  ) {
    const availableStock = await getAvailableStockAtLocation(
      executor,
      move.product_id,
      move.source_location_id
    )

    if (availableStock < move.quantity) {
      throw new InventoryMutationError(
        `Insufficient stock at the source location. Available: ${availableStock}. Requested: ${move.quantity}.`,
        422
      )
    }
  }
}

export async function createProductWithInitialStock(
  input: CreateProductInput,
  userId: string,
  activeWarehouseId?: string | null
) {
  return db.transaction(async (tx) => {
    const [createdProduct] = await tx
      .insert(products)
      .values({
        name: input.name,
        sku: input.sku,
        category: input.category,
        unit_of_measure: input.unit_of_measure,
        reorder_point: input.reorder_point,
      })
      .returning()

    if (!input.initial_stock || input.initial_stock <= 0) {
      return { product: createdProduct, initialMove: null }
    }

    const destinationLocation = await resolveInternalLocation(
      tx,
      input.initial_location_id,
      activeWarehouseId
    )
    const lossLocation = await ensureVirtualLocation(
      tx,
      destinationLocation.warehouse_id,
      "loss"
    )

    const [initialMove] = await tx
      .insert(stockMoves)
      .values({
        product_id: createdProduct.id,
        source_location_id: lossLocation.id,
        dest_location_id: destinationLocation.id,
        quantity: input.initial_stock,
        move_type: "adjustment",
        status: "done",
        reference: `INIT-${createdProduct.sku}`,
        notes: "Initial stock created during product setup.",
        created_by: userId,
        validated_at: new Date(),
      })
      .returning()

    return { product: createdProduct, initialMove }
  })
}

export async function createInventoryMove(input: CreateMoveInput, userId: string) {
  return db.transaction(async (tx) => {
    const [createdMove] = await tx
      .insert(stockMoves)
      .values({
        product_id: input.product_id,
        source_location_id: input.source_location_id,
        dest_location_id: input.dest_location_id,
        quantity: input.quantity,
        move_type: input.move_type,
        status: input.status ?? "draft",
        reference: input.reference,
        notes: input.notes,
        created_by: userId,
      })
      .returning()

    if (!input.validate_now) {
      return createdMove
    }

    await ensureMoveCanValidate(tx, createdMove)

    const [validatedMove] = await tx
      .update(stockMoves)
      .set({
        status: "done",
        validated_at: new Date(),
      })
      .where(eq(stockMoves.id, createdMove.id))
      .returning()

    return validatedMove
  })
}

export async function validateInventoryMove(moveId: string) {
  return db.transaction(async (tx) => {
    const [move] = await tx
      .select()
      .from(stockMoves)
      .where(eq(stockMoves.id, moveId))
      .limit(1)

    if (!move) {
      throw new InventoryMutationError("Stock move not found.", 404)
    }

    await ensureMoveCanValidate(tx, move)

    const [validatedMove] = await tx
      .update(stockMoves)
      .set({
        status: "done",
        validated_at: new Date(),
      })
      .where(eq(stockMoves.id, move.id))
      .returning()

    return validatedMove
  })
}

export async function applyInventoryAdjustment(
  input: ApplyAdjustmentInput,
  userId: string
) {
  return db.transaction(async (tx) => {
    const [location] = await tx
      .select()
      .from(locations)
      .where(and(eq(locations.id, input.location_id), eq(locations.type, "internal")))
      .limit(1)

    if (!location) {
      throw new InventoryMutationError(
        "Select a valid internal location for the adjustment.",
        400
      )
    }

    const currentStock = await getAvailableStockAtLocation(
      tx,
      input.product_id,
      input.location_id
    )
    const delta = input.counted_quantity - currentStock

    if (delta === 0) {
      throw new InventoryMutationError(
        "The counted quantity matches the current stock. No adjustment is needed.",
        409
      )
    }

    const lossLocation = await ensureVirtualLocation(tx, location.warehouse_id, "loss")

    const [adjustmentMove] = await tx
      .insert(stockMoves)
      .values({
        product_id: input.product_id,
        source_location_id: delta > 0 ? lossLocation.id : input.location_id,
        dest_location_id: delta > 0 ? input.location_id : lossLocation.id,
        quantity: Math.abs(delta),
        move_type: "adjustment",
        status: "done",
        reference: input.reference,
        notes:
          input.notes ??
          `Counted quantity ${input.counted_quantity}; previous stock ${currentStock}.`,
        created_by: userId,
        validated_at: new Date(),
      })
      .returning()

    return {
      move: adjustmentMove,
      previousQuantity: currentStock,
      countedQuantity: input.counted_quantity,
    }
  })
}
