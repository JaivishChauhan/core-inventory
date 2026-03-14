import {
  text,
  integer,
  boolean,
  timestamp,
  pgTable,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core"

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"])
export const locationTypeEnum = pgEnum("location_type", [
  "internal",
  "vendor",
  "customer",
  "loss",
])
export const moveStatusEnum = pgEnum("move_status", [
  "draft",
  "waiting",
  "ready",
  "done",
  "canceled",
])
export const moveTypeEnum = pgEnum("move_type", [
  "receipt",
  "delivery",
  "internal_transfer",
  "adjustment",
])

/**
 * Users table — owns authentication identity.
 * OTP-based: no password_hash required.
 * Role distinguishes admin from warehouse staff.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").default("staff").notNull(),
  active_warehouse_id: uuid("active_warehouse_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

/**
 * OTP tokens — e-mail keyed, short-lived, single-use.
 * Token is stored hashed (SHA-256). Never store raw OTP.
 * @security Invalidate all prior tokens for email on new request.
 */
export const otpTokens = pgTable("otp_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  hashed_token: text("hashed_token").notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Warehouses — top-level physical location entity.
 * Multi-warehouse support as required by PRD §4.5.
 */
export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Locations — granular physical spots inside a warehouse.
 * Type enum models virtual vendor/customer locations for ledger flow.
 */
export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  warehouse_id: uuid("warehouse_id")
    .references(() => warehouses.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: locationTypeEnum("type").default("internal").notNull(),
  parent_location_id: uuid("parent_location_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Products — the master product catalog.
 * @security NO stock column. Stock is always derived from stock_moves ledger.
 */
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  unit_of_measure: text("unit_of_measure").notNull(),
  reorder_point: integer("reorder_point").default(0).notNull(),
  price_in_cents: integer("price_in_cents").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Stock Moves — the immutable event-sourced ledger.
 * This is the single source of truth for all inventory.
 * A move is append-only once validated (status = 'done').
 *
 * Stock is: SUM(inbound to internal) - SUM(outbound from internal)
 * filtered by status = 'done'.
 *
 * @security validated_at and status='done' must only be set by the server.
 */
export const stockMoves = pgTable("stock_moves", {
  id: uuid("id").primaryKey().defaultRandom(),
  product_id: uuid("product_id")
    .references(() => products.id, { onDelete: "restrict" })
    .notNull(),
  source_location_id: uuid("source_location_id")
    .references(() => locations.id, { onDelete: "restrict" })
    .notNull(),
  dest_location_id: uuid("dest_location_id")
    .references(() => locations.id, { onDelete: "restrict" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  move_type: moveTypeEnum("move_type").notNull(),
  status: moveStatusEnum("status").default("draft").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  validated_at: timestamp("validated_at", { withTimezone: true }),
})
