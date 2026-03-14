import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/connection"
import { stockMoves } from "@/lib/db/schema"
import { getServerSession } from "@/lib/auth/session"
import { eq } from "drizzle-orm"

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

  const { id } = await params

  const [move] = await db
    .select()
    .from(stockMoves)
    .where(eq(stockMoves.id, id))
    .limit(1)

  if (!move) {
    return NextResponse.json({ error: "Stock move not found." }, { status: 404 })
  }
  if (move.status === "done") {
    return NextResponse.json(
      { error: "This move has already been validated." },
      { status: 409 }
    )
  }
  if (move.status === "canceled") {
    return NextResponse.json(
      { error: "Cannot validate a canceled move." },
      { status: 409 }
    )
  }

  const [validated] = await db
    .update(stockMoves)
    .set({ status: "done", validated_at: new Date() })
    .where(eq(stockMoves.id, id))
    .returning()

  return NextResponse.json({ move: validated })
}
