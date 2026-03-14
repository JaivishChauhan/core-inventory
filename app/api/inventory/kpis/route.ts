import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import { getInventoryDashboardData } from "@/lib/db/queries/inventory"

/**
 * GET /api/inventory/kpis
 * Returns aggregate KPI metrics for the dashboard.
 * Executes a single multi-aggregate SQL query for performance.
 * @security Requires authenticated session.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  try {
    const { kpis } = await getInventoryDashboardData()
    return NextResponse.json({ kpis })
  } catch (err) {
    console.error("[GET /api/inventory/kpis]", err)
    return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 })
  }
}
