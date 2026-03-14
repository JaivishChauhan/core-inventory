import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { products } from "@/lib/db/schema"
import { getServerSession } from "@/lib/auth/session"
import { asc } from "drizzle-orm"

const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z
    .string()
    .min(1, "SKU is required")
    .transform((s) => s.toUpperCase().trim()),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().int().min(0, "Reorder point must be 0 or greater").default(0),
})

/**
 * GET /api/products
 * Returns all products ordered by creation date.
 * @security Requires authenticated session.
 */
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const rows = await db.select().from(products).orderBy(asc(products.created_at))
  return NextResponse.json({ products: rows })
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
    const [created] = await db.insert(products).values(parsed.data).returning()
    return NextResponse.json({ product: created }, { status: 201 })
  } catch (err: unknown) {
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
