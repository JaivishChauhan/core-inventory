import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  cancelInventoryMove,
} from "@/lib/db/inventory-mutations"

/**
 * PATCH /api/inventory/move/[id]/cancel
 * Cancels a pending stock move (draft, waiting, or ready).
 * @security Requires authenticated session.
 * @throws 409 if move is already validated (done) or canceled.
 */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { id } = await params

  try {
    const move = await cancelInventoryMove(id)
    return NextResponse.json({ move })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[PATCH /api/inventory/move/[id]/cancel]", err)
    return NextResponse.json({ error: "Failed to cancel move." }, { status: 500 })
  }
}
