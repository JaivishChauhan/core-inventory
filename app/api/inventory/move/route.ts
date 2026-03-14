import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { stockMoves } from "@/lib/db/schema"
import { getServerSession } from "@/lib/auth/session"
import { getTotalAvailableStock } from "@/lib/db/queries/stock"
import { desc } from "drizzle-orm"

const CreateMoveSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  source_location_id: z.string().uuid("Invalid source location ID"),
  dest_location_id: z.string().uuid("Invalid destination location ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  move_type: z.enum(["receipt", "delivery", "internal_transfer", "adjustment"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/inventory/move
 * Returns all stock moves ordered by creation date (newest first).
 * Used for the Move History audit log.
 * @security Requires authenticated session.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const rows = await db.select().from(stockMoves).orderBy(desc(stockMoves.created_at))
  return NextResponse.json({ moves: rows })
}

/**
 * POST /api/inventory/move
 * Creates a new stock move record (starts in 'draft' status).
 *
 * @businessLogic Delivery and internal transfer moves check that sufficient
 * stock is available BEFORE creating the move (fails with 422 if not).
 *
 * @validation Full Zod schema on all inputs.
 * @security Only the server can set status='done' via the /validate endpoint.
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

  const data = parsed.data

  // Guard: outbound moves need available stock
  if (data.move_type === "delivery" || data.move_type === "internal_transfer") {
    const availableStock = await getTotalAvailableStock(data.product_id)
    if (availableStock < data.quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Available: ${availableStock} units. Requested: ${data.quantity} units.`,
        },
        { status: 422 }
      )
    }
  }

  try {
    const [move] = await db
      .insert(stockMoves)
      .values({
        ...data,
        created_by: session.userId,
      })
      .returning()

    return NextResponse.json({ move }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/inventory/move]", err)
    return NextResponse.json({ error: "Failed to create stock move." }, { status: 500 })
  }
}
