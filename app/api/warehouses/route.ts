import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  createWarehouse,
} from "@/lib/db/inventory-mutations"
import { getInventoryReferenceData } from "@/lib/db/queries/inventory"

const CreateWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  code: z
    .string()
    .min(1, "Warehouse code is required")
    .transform((s) => s.toUpperCase().trim()),
  address: z.string().optional(),
})

/**
 * GET /api/warehouses
 * Returns all warehouses with their locations.
 * @security Requires authenticated session.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const referenceData = await getInventoryReferenceData()
  return NextResponse.json({
    warehouses: referenceData.warehouses,
    locations: referenceData.locations,
  })
}

/**
 * POST /api/warehouses
 * Creates a new warehouse. Code is auto-uppercased and must be unique.
 * @security Requires authenticated session.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateWarehouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid warehouse data" },
      { status: 400 }
    )
  }

  try {
    const warehouse = await createWarehouse(parsed.data)
    return NextResponse.json({ warehouse }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    const isUniqueViolation =
      err instanceof Error && err.message.includes("unique constraint")
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: `Warehouse code "${parsed.data.code}" already exists.` },
        { status: 409 }
      )
    }

    console.error("[POST /api/warehouses]", err)
    return NextResponse.json({ error: "Failed to create warehouse." }, { status: 500 })
  }
}
