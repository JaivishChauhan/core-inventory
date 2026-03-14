import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  updateWarehouse,
  deleteWarehouse,
} from "@/lib/db/inventory-mutations"

const UpdateWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required").optional(),
  code: z
    .string()
    .min(1, "Warehouse code is required")
    .transform((s) => s.toUpperCase().trim())
    .optional(),
  address: z.string().nullable().optional(),
})

/**
 * PUT /api/warehouses/[id]
 * Updates a warehouse's name, code, or address.
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
  const parsed = UpdateWarehouseSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid warehouse data" },
      { status: 400 }
    )
  }

  try {
    const warehouse = await updateWarehouse(id, parsed.data)
    return NextResponse.json({ warehouse })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    const isUniqueViolation =
      err instanceof Error && err.message.includes("unique constraint")
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "A warehouse with this code already exists." },
        { status: 409 }
      )
    }

    console.error("[PUT /api/warehouses/[id]]", err)
    return NextResponse.json({ error: "Failed to update warehouse." }, { status: 500 })
  }
}

/**
 * DELETE /api/warehouses/[id]
 * Removes a warehouse. Blocked if child locations have stock moves.
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
    await deleteWarehouse(id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[DELETE /api/warehouses/[id]]", err)
    return NextResponse.json({ error: "Failed to delete warehouse." }, { status: 500 })
  }
}
