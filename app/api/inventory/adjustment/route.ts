import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  applyInventoryAdjustment,
} from "@/lib/db/inventory-mutations"

const CreateAdjustmentSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  location_id: z.string().uuid("Invalid location ID"),
  counted_quantity: z.number().int().min(0, "Counted quantity must be 0 or greater"),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/inventory/adjustment
 * Reconciles a physical count against the current stock at a location and logs the delta.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateAdjustmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid adjustment data" },
      { status: 400 }
    )
  }

  try {
    const result = await applyInventoryAdjustment(parsed.data, session.userId)
    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[POST /api/inventory/adjustment]", err)
    return NextResponse.json({ error: "Failed to apply adjustment." }, { status: 500 })
  }
}
