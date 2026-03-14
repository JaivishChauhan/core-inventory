import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"

/**
 * GET /api/auth/me
 * Returns the current authenticated user's session payload.
 * Used by client components to identity-check without a DB round-trip.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  }
  return NextResponse.json({ user: session })
}
