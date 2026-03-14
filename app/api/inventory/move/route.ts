import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  createInventoryMove,
} from "@/lib/db/inventory-mutations"
import { listInventoryMoves } from "@/lib/db/queries/inventory"

const CreateMoveSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  source_location_id: z.string().uuid("Invalid source location ID"),
  dest_location_id: z.string().uuid("Invalid destination location ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  move_type: z.enum(["receipt", "delivery", "internal_transfer", "adjustment"]),
  status: z.enum(["draft", "waiting", "ready"]).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  validate_now: z.boolean().optional(),
})

/**
 * GET /api/inventory/move
 * Returns ledger moves with product and location metadata.
 * Supports filtering by move type, status, warehouse, location, and category.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const moveType = req.nextUrl.searchParams.get("moveType")
  const status = req.nextUrl.searchParams.get("status")
  const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? undefined
  const locationId = req.nextUrl.searchParams.get("locationId") ?? undefined
  const category = req.nextUrl.searchParams.get("category") ?? undefined
  const limitParam = req.nextUrl.searchParams.get("limit")
  const parsedLimit = limitParam ? Number(limitParam) : undefined

  const moves = await listInventoryMoves({
    moveType:
      moveType === null
        ? undefined
        : (moveType as "adjustment" | "all" | "delivery" | "internal_transfer" | "receipt"),
    status:
      status === null
        ? undefined
        : (status as "all" | "canceled" | "done" | "draft" | "ready" | "waiting"),
    warehouseId,
    locationId,
    category,
    limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
  })

  return NextResponse.json({ moves })
}

/**
 * POST /api/inventory/move
 * Creates a stock move in draft/waiting/ready status, optionally validating it immediately.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateMoveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid move data" },
      { status: 400 }
    )
  }

  try {
    const move = await createInventoryMove(parsed.data, session.userId)
    return NextResponse.json({ move }, { status: 201 })
  } catch (err) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[POST /api/inventory/move]", err)
    return NextResponse.json({ error: "Failed to create stock move." }, { status: 500 })
  }
}
