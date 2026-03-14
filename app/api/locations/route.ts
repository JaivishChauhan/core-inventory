import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  createLocation,
} from "@/lib/db/inventory-mutations"
import { getInventoryReferenceData } from "@/lib/db/queries/inventory"

const CreateLocationSchema = z.object({
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  name: z.string().min(1, "Location name is required"),
  type: z
    .enum(["internal", "vendor", "customer", "loss"])
    .default("internal"),
})

/**
 * GET /api/locations
 * Returns all locations grouped by warehouse.
 * @security Requires authenticated session.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const referenceData = await getInventoryReferenceData()
  return NextResponse.json({ locations: referenceData.locations })
}

/**
 * POST /api/locations
 * Creates a new location inside a warehouse.
 * @security Requires authenticated session.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateLocationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid location data" },
      { status: 400 }
    )
  }

  try {
    const location = await createLocation(parsed.data)
    return NextResponse.json({ location }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[POST /api/locations]", err)
    return NextResponse.json({ error: "Failed to create location." }, { status: 500 })
  }
}
