import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSession } from "@/lib/auth/session"
import {
  InventoryMutationError,
  createProductWithInitialStock,
} from "@/lib/db/inventory-mutations"
import { listInventoryProducts } from "@/lib/db/queries/inventory"

const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z
    .string()
    .min(1, "SKU is required")
    .transform((s) => s.toUpperCase().trim()),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().int().min(0, "Reorder point must be 0 or greater").default(0),
  initial_stock: z.number().int().min(0, "Initial stock must be 0 or greater").optional(),
  initial_location_id: z.string().uuid("Invalid initial stock location").optional(),
})

/**
 * GET /api/products
 * Returns all products ordered by creation date.
 * @security Requires authenticated session.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const products = await listInventoryProducts()
  return NextResponse.json({ products })
}

/**
 * POST /api/products
 * Creates a new product in the catalog.
 * SKU is automatically uppercased and whitespace-trimmed.
 *
 * @validation Zod schema enforces all required fields.
 * @returns 201 with the created product row.
 * @returns 400 with human-readable validation error.
 * @returns 409 on SKU collision.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product data" },
      { status: 400 }
    )
  }

  try {
    const result = await createProductWithInitialStock(
      parsed.data,
      session.userId,
      session.warehouseId
    )
    return NextResponse.json(result, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof InventoryMutationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    const isUniqueViolation =
      err instanceof Error && err.message.includes("unique constraint")
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: `SKU "${parsed.data.sku}" already exists.` },
        { status: 409 }
      )
    }
    console.error("[POST /api/products]", err)
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 })
  }
}
