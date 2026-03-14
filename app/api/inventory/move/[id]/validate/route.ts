import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  validateInventoryMove,
} from "@/lib/db/inventory-mutations"

/**
 * POST /api/inventory/move/[id]/validate
 * Marks a stock move as 'done', making it part of the immutable ledger.
 *
 * @businessLogic A move can only transition draft/waiting/ready → done.
 * Moves that are already 'done' or 'canceled' are rejected.
 *
 * @security Only the server controls the 'done' transition.
 * @security validated_at is set server-side to prevent client-side time spoofing.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  try {
    const { id } = await params
    const move = await validateInventoryMove(id)
    return NextResponse.json({ move })
  } catch (err) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[POST /api/inventory/move/[id]/validate]", err)
    return NextResponse.json({ error: "Failed to validate stock move." }, { status: 500 })
  }
}
