import { NextRequest, NextResponse } from "next/server"

import { getServerSession } from "@/lib/auth/session"
import {
  getInventoryReferenceData,
  listInventoryProducts,
} from "@/lib/db/queries/inventory"

/**
 * GET /api/inventory/reference-data
 * Shared form/query options for warehouses, locations, categories, and products.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  try {
    const includeProducts = req.nextUrl.searchParams.get("includeProducts") === "1"
    const [referenceData, products] = await Promise.all([
      getInventoryReferenceData(),
      includeProducts ? listInventoryProducts() : Promise.resolve([]),
    ])

    return NextResponse.json({
      ...referenceData,
      products,
    })
  } catch (err) {
    console.error("[GET /api/inventory/reference-data]", err)
    return NextResponse.json(
      { error: "Failed to load inventory reference data." },
      { status: 500 }
    )
  }
}
