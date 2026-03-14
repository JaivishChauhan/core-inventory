import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  updateLocation,
  deleteLocation,
} from "@/lib/db/inventory-mutations"

const UpdateLocationSchema = z.object({
  name: z.string().min(1, "Location name is required").optional(),
  type: z.enum(["internal", "vendor", "customer", "loss"]).optional(),
})

/**
 * PUT /api/locations/[id]
 * Updates a location's name or type.
 * @security Requires authenticated session.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = UpdateLocationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid location data" },
      { status: 400 }
    )
  }

  try {
    const location = await updateLocation(id, parsed.data)
    return NextResponse.json({ location })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[PUT /api/locations/[id]]", err)
    return NextResponse.json({ error: "Failed to update location." }, { status: 500 })
  }
}

/**
 * DELETE /api/locations/[id]
 * Removes a location. Blocked if stock moves reference it.
 * @security Requires authenticated session.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { id } = await params

  try {
    await deleteLocation(id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[DELETE /api/locations/[id]]", err)
    return NextResponse.json({ error: "Failed to delete location." }, { status: 500 })
  }
}
