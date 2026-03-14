/**
 * Database seed script — populates initial data for demo/hackathon.
 * Run: pnpm exec tsx lib/db/seed.ts
 *
 * Creates:
 *  - 1 Admin user
 *  - 1 Warehouse
 *  - 4 Locations (vendor, customer, 2x internal)
 *  - 5 Products
 *  - 5 done stock_moves (receipts) to show real stock on dashboard
 */
import "dotenv/config"
import { db } from "./connection"
import {
  users,
  warehouses,
  locations,
  products,
  stockMoves,
} from "./schema"
import { eq } from "drizzle-orm"

async function seed() {
  console.log("🌱 Seeding database...")

  // 1. Admin user
  const [existingAdmin] = await db.select().from(users).where(eq(users.email, "admin@coreinventory.app")).limit(1)
  const adminUser = existingAdmin ?? (await db.insert(users).values({
    email: "admin@coreinventory.app",
    name: "Admin User",
    role: "admin",
  }).returning())[0]
  console.log("✓ Admin user:", adminUser.email)

  // 2. Warehouse
  const [existingWarehouse] = await db.select().from(warehouses).where(eq(warehouses.code, "MW-01")).limit(1)
  const warehouse = existingWarehouse ?? (await db.insert(warehouses).values({
    name: "Main Warehouse",
    code: "MW-01",
    address: "Plot 42, Industrial Estate, Mumbai, MH 400001",
  }).returning())[0]
  console.log("✓ Warehouse:", warehouse.name)

  // 3. Locations
  const locationData = [
    { name: "Vendor", type: "vendor" as const },
    { name: "Customer", type: "customer" as const },
    { name: "Main Store", type: "internal" as const },
    { name: "Production Floor", type: "internal" as const },
  ]

  const locationMap: Record<string, string> = {}
  for (const loc of locationData) {
    const [existing] = await db
      .select()
      .from(locations)
      .where(eq(locations.name, loc.name))
      .limit(1)
    const location = existing ?? (await db.insert(locations).values({
      warehouse_id: warehouse.id,
      name: loc.name,
      type: loc.type,
    }).returning())[0]
    locationMap[loc.name] = location.id
    console.log(`✓ Location: ${location.name} (${location.type})`)
  }

  // 4. Products
  const productData = [
    { name: "Steel Rods 12mm", sku: "STL-ROD-12", category: "Raw Materials", unit_of_measure: "kg", reorder_point: 500, price_in_cents: 6500 }, // ₹65.00
    { name: "Timber Planks 2x4", sku: "TMB-PLK-24", category: "Raw Materials", unit_of_measure: "piece", reorder_point: 200, price_in_cents: 35000 }, // ₹350.00
    { name: "Cement Bags 50kg", sku: "CMT-BAG-50", category: "Construction", unit_of_measure: "bag", reorder_point: 100, price_in_cents: 40000 }, // ₹400.00
    { name: "Copper Wire 2.5mm", sku: "CPR-WIR-25", category: "Electrical", unit_of_measure: "m", reorder_point: 1000, price_in_cents: 4500 }, // ₹45.00
    { name: "PVC Pipe 4-inch", sku: "PVC-PIP-4I", category: "Plumbing", unit_of_measure: "m", reorder_point: 300, price_in_cents: 60000 }, // ₹600.00
  ]

  const productMap: Record<string, string> = {}
  for (const product of productData) {
    const [existing] = await db.select().from(products).where(eq(products.sku, product.sku)).limit(1)
    const row = existing ?? (await db.insert(products).values(product).returning())[0]
    productMap[product.sku] = row.id
    console.log(`✓ Product: ${row.name} [${row.sku}]`)
  }

  // 5. Seed stock moves (receipts → done) to simulate existing stock
  const receipts = [
    { sku: "STL-ROD-12", qty: 1200 },
    { sku: "TMB-PLK-24", qty: 450 },
    { sku: "CMT-BAG-50", qty: 280 },
    { sku: "CPR-WIR-25", qty: 3000 },
    { sku: "PVC-PIP-4I", qty: 600 },
  ]

  for (const receipt of receipts) {
    const productId = productMap[receipt.sku]
    if (!productId) continue

    // Check if this receipt already exists
    const [existing] = await db
      .select()
      .from(stockMoves)
      .where(eq(stockMoves.product_id, productId))
      .limit(1)

    if (!existing) {
      await db.insert(stockMoves).values({
        product_id: productId,
        source_location_id: locationMap["Vendor"]!,
        dest_location_id: locationMap["Main Store"]!,
        quantity: receipt.qty,
        move_type: "receipt",
        status: "done",
        reference: `SEED-RECEIPT-${receipt.sku}`,
        created_by: adminUser.id,
        validated_at: new Date(),
      })
      console.log(`✓ Receipt: ${receipt.qty} units of ${receipt.sku}`)
    } else {
      console.log(`⟳ Skipped: ${receipt.sku} (already seeded)`)
    }
  }

  console.log("\n✅ Seed complete!")
  process.exit(0)
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
