import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import { calculateStockByLocation } from "@/lib/db/queries/stock"

/**
 * GET /api/inventory/stock?productId=<uuid>&warehouseId=<uuid>
 * Returns per-location stock breakdown for a single product.
 * All values are computed from the stock_moves ledger — never a static column.
 *
 * @param productId (required) - UUID of the product
 * @param warehouseId (optional) - filter by warehouse
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const productId = req.nextUrl.searchParams.get("productId")
  const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? undefined

  if (!productId) {
    return NextResponse.json(
      { error: "productId query parameter is required" },
      { status: 400 }
    )
  }

  const levels = await calculateStockByLocation(productId, warehouseId)
  return NextResponse.json({ stock: levels })
}
