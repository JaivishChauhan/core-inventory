import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  updateProduct,
  deleteProduct,
} from "@/lib/db/inventory-mutations"

const UpdateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  unit_of_measure: z.string().min(1, "Unit of measure is required").optional(),
  reorder_point: z.number().int().min(0, "Reorder point must be 0 or greater").optional(),
})

/**
 * PUT /api/products/[id]
 * Updates a product's catalog fields. SKU is immutable.
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
  const parsed = UpdateProductSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product data" },
      { status: 400 }
    )
  }

  try {
    const product = await updateProduct(id, parsed.data)
    return NextResponse.json({ product })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    const isUniqueViolation =
      err instanceof Error && err.message.includes("unique constraint")
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "A product with this code already exists." },
        { status: 409 }
      )
    }

    console.error("[PUT /api/products/[id]]", err)
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 })
  }
}

/**
 * DELETE /api/products/[id]
 * Removes a product from the catalog. Blocked if stock moves exist.
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
    await deleteProduct(id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error("[DELETE /api/products/[id]]", err)
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 })
  }
}
