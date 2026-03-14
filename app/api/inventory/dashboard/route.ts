import { NextRequest, NextResponse } from "next/server"

import { getServerSession } from "@/lib/auth/session"
import { getInventoryDashboardData } from "@/lib/db/queries/inventory"

/**
 * GET /api/inventory/dashboard
 * Returns dashboard KPIs, recent moves, and filter options in one request.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  try {
    const moveType = req.nextUrl.searchParams.get("moveType")
    const status = req.nextUrl.searchParams.get("status")
    const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? undefined
    const locationId = req.nextUrl.searchParams.get("locationId") ?? undefined
    const category = req.nextUrl.searchParams.get("category") ?? undefined

    const dashboard = await getInventoryDashboardData({
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
    })

    return NextResponse.json(dashboard)
  } catch (err) {
    console.error("[GET /api/inventory/dashboard]", err)
    return NextResponse.json(
      { error: "Failed to load dashboard data." },
      { status: 500 }
    )
  }
}
