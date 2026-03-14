# Core Inventory IMS — Full Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Build a production-grade, event-sourced Inventory Management System with custom OTP auth, RESTful API, and a full Enterprise UI — ready for Odoo hackathon evaluation.

**Architecture:** Next.js App Router with server components for data fetching, Route Handlers for REST endpoints, Drizzle ORM talking directly to Postgres (via `DATABASE_URL`). Auth uses custom OTP-to-JWT flow stored in HTTP-only cookies. Stock levels are never stored — always computed from the `stock_moves` ledger.

**Tech Stack:** Next.js 16, TypeScript (strict), Drizzle ORM, Zod, `jose` (JWT), `nodemailer` (SMTP), React Query, Tailwind CSS + shadcn/ui, Sonner (toasts)

**Path Convention:** All new files follow `a:\Oddoxindus\core-inventory\` root. API routes go in `app/api/`, shared logic in `lib/`, types in `types/`.

---

## ⚠️ Pre-Flight Checks (Do Before Phase 1)

The schema is already pushed to Postgres. The following packages need installing:

```bash
pnpm add jose nodemailer bcryptjs
pnpm add -D @types/nodemailer @types/bcryptjs
```

**Drizzle schema changes needed (schema.ts):**
1. Rename `otpCodes` table → align with spec: use `email` directly (not `user_id` FK) for the `otp_tokens` table. This allows OTP-based signup before a `users` row exists.
2. Add `name` field to `users` table.
3. `users.password_hash` is not needed (we are doing OTP-only, passwordless auth per spec).

---

## Phase 1: Schema Correction + Auth Infrastructure

### Task 1.1: Fix Drizzle Schema to Match Auth Spec

**Files:**
- Modify: `lib/db/schema.ts`

**Step 1: Replace the schema file**

```typescript
// lib/db/schema.ts — COMPLETE REPLACEMENT
import { text, integer, boolean, timestamp, pgTable, uuid, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);
export const locationTypeEnum = pgEnum("location_type", ["internal", "vendor", "customer", "loss"]);
export const moveStatusEnum = pgEnum("move_status", ["draft", "waiting", "ready", "done", "canceled"]);
export const moveTypeEnum = pgEnum("move_type", ["receipt", "delivery", "internal_transfer", "adjustment"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").default("staff").notNull(),
  active_warehouse_id: uuid("active_warehouse_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const otpTokens = pgTable("otp_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  hashed_token: text("hashed_token").notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  address: text("address"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  warehouse_id: uuid("warehouse_id").references(() => warehouses.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  type: locationTypeEnum("type").default("internal").notNull(),
  parent_location_id: uuid("parent_location_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(),
  unit_of_measure: text("unit_of_measure").notNull(),
  reorder_point: integer("reorder_point").default(0).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stockMoves = pgTable("stock_moves", {
  id: uuid("id").primaryKey().defaultRandom(),
  product_id: uuid("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
  source_location_id: uuid("source_location_id").references(() => locations.id, { onDelete: "restrict" }).notNull(),
  dest_location_id: uuid("dest_location_id").references(() => locations.id, { onDelete: "restrict" }).notNull(),
  quantity: integer("quantity").notNull(),
  move_type: moveTypeEnum("move_type").notNull(),
  status: moveStatusEnum("status").default("draft").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  created_by: uuid("created_by").references(() => users.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  validated_at: timestamp("validated_at", { withTimezone: true }),
});
```

**Step 2: Push schema to DB**
```bash
pnpm exec drizzle-kit push
# Expected: [✓] Changes applied
```

**Step 3: Commit**
```bash
git add lib/db/schema.ts
git commit -m "feat(db): align schema with OTP auth spec, add otp_tokens table"
```

---

### Task 1.2: Auth Utilities

**Files:**
- Create: `lib/auth/jwt.ts`
- Create: `lib/auth/otp.ts`
- Create: `lib/auth/session.ts`

**Step 1: Create JWT utility** (`lib/auth/jwt.ts`)

```typescript
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production-min-32-chars"
)

export type SessionPayload = {
  userId: string
  email: string
  role: "admin" | "staff"
  warehouseId: string | null
}

/**
 * Signs a new JWT session token.
 * @security HTTP-only cookie only. Never exposed to client JS.
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

/**
 * Verifies a session token and returns the payload.
 * Returns null if invalid or expired — never throws to callers.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
```

**Step 2: Create OTP utility** (`lib/auth/otp.ts`)

```typescript
import { randomInt } from "crypto"
import { createHash } from "crypto"

export const OTP_EXPIRY_MINUTES = 10

/**
 * Generates a 6-digit numeric OTP.
 * Uses cryptographically secure random source.
 */
export function generateOtpCode(): string {
  return String(randomInt(100000, 999999))
}

/**
 * Hashes an OTP for secure DB storage.
 * SHA-256 is sufficient for short-lived OTPs with rate limiting.
 */
export function hashOtpToken(otp: string): string {
  return createHash("sha256").update(otp).digest("hex")
}

/**
 * Returns a timestamp for OTP expiry based on OTP_EXPIRY_MINUTES.
 */
export function getOtpExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
}
```

**Step 3: Create session cookie utility** (`lib/auth/session.ts`)

```typescript
import { cookies } from "next/headers"
import { verifySessionToken, type SessionPayload } from "./jwt"

const SESSION_COOKIE = "ci_session"

/**
 * Reads and verifies the session from the HTTP-only cookie.
 * Returns null if unauthenticated or token expired.
 * @security Read from server-side cookies only.
 */
export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/**
 * Sets the session cookie on a NextResponse.
 * @security HTTP-only, Secure (in production), SameSite=Lax
 */
export function buildSessionCookieHeader(token: string): string {
  const isProd = process.env.NODE_ENV === "production"
  const maxAge = 7 * 24 * 60 * 60 // 7 days
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${isProd ? "; Secure" : ""}`
}

/**
 * Clears the session cookie (logout).
 */
export function buildLogoutCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}
```

**Step 4: Commit**
```bash
git add lib/auth/
git commit -m "feat(auth): add JWT signing, OTP generation, and session utilities"
```

---

### Task 1.3: Email Utility (Nodemailer)

**Files:**
- Create: `lib/auth/mailer.ts`

```typescript
import nodemailer from "nodemailer"

/**
 * Creates a nodemailer transporter.
 * Uses SMTP env vars. For dev: set SMTP_HOST=smtp.ethereal.email with a free account.
 * @security Never log email credentials.
 */
function createMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

/**
 * Sends the OTP code to the user's email.
 * @throws Will throw if SMTP is misconfigured — caller must catch.
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const transporter = createMailTransporter()
  await transporter.sendMail({
    from: `"Core Inventory" <${process.env.SMTP_FROM ?? "noreply@coreinventory.app"}>`,
    to: email,
    subject: "Your Login Code — Core Inventory",
    text: `Your one-time login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it.`,
    html: `<p>Your one-time login code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  })
}
```

Add SMTP env vars to `.env`:
```
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-user
SMTP_PASS=your-ethereal-pass
SMTP_FROM=noreply@coreinventory.app
JWT_SECRET=change-this-to-a-random-32-char-string-in-prod
```

**Step 2: Commit**
```bash
git add lib/auth/mailer.ts .env
git commit -m "feat(auth): add nodemailer email utility for OTP delivery"
```

---

## Phase 2: REST API Route Handlers

### Task 2.1: Auth API Routes

**Files:**
- Create: `app/api/auth/request-otp/route.ts`
- Create: `app/api/auth/verify-otp/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/me/route.ts`

**Step 1: `POST /api/auth/request-otp`**

```typescript
// app/api/auth/request-otp/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { users, otpTokens } from "@/lib/db/schema"
import { generateOtpCode, hashOtpToken, getOtpExpiryDate } from "@/lib/auth/otp"
import { sendOtpEmail } from "@/lib/auth/mailer"
import { eq } from "drizzle-orm"

const RequestOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = RequestOtpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    )
  }

  const { email, name } = parsed.data

  try {
    // Upsert user — creates on first login
    const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!existingUser) {
      if (!name) {
        return NextResponse.json({ error: "Name is required for first-time registration" }, { status: 400 })
      }
      await db.insert(users).values({ email, name })
    }

    // Invalidate existing OTPs for this email
    await db.delete(otpTokens).where(eq(otpTokens.email, email))

    // Generate + hash + store new OTP
    const otp = generateOtpCode()
    await db.insert(otpTokens).values({
      email,
      hashed_token: hashOtpToken(otp),
      expires_at: getOtpExpiryDate(),
    })

    // Send email (fire and forget in dev for speed)
    await sendOtpEmail(email, otp)

    return NextResponse.json({ message: "OTP sent to your email." })
  } catch (error) {
    console.error("[request-otp]", error)
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 })
  }
}
```

**Step 2: `POST /api/auth/verify-otp`**

```typescript
// app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { users, otpTokens } from "@/lib/db/schema"
import { hashOtpToken } from "@/lib/auth/otp"
import { signSessionToken } from "@/lib/auth/jwt"
import { buildSessionCookieHeader } from "@/lib/auth/session"
import { eq, and, gt } from "drizzle-orm"

const VerifyOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must be numeric"),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = VerifyOtpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, otp } = parsed.data
  const hashedOtp = hashOtpToken(otp)
  const now = new Date()

  const [token] = await db
    .select()
    .from(otpTokens)
    .where(
      and(
        eq(otpTokens.email, email),
        eq(otpTokens.hashed_token, hashedOtp),
        eq(otpTokens.used, false),
        gt(otpTokens.expires_at, now)
      )
    )
    .limit(1)

  if (!token) {
    return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 401 })
  }

  // Mark OTP as used
  await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.id, token.id))

  // Fetch the user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  // Sign JWT
  const sessionToken = await signSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    warehouseId: user.active_warehouse_id,
  })

  const response = NextResponse.json({ message: "Authenticated successfully.", user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken))
  return response
}
```

**Step 3: `POST /api/auth/logout` + `GET /api/auth/me`**

```typescript
// app/api/auth/logout/route.ts
import { NextResponse } from "next/server"
import { buildLogoutCookieHeader } from "@/lib/auth/session"

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." })
  response.headers.set("Set-Cookie", buildLogoutCookieHeader())
  return response
}
```

```typescript
// app/api/auth/me/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })
  return NextResponse.json({ user: session })
}
```

**Step 4: Commit**
```bash
git add app/api/auth/
git commit -m "feat(api): add OTP request, verify, logout, and /me auth endpoints"
```

---

### Task 2.2: Middleware for Route Protection

**Files:**
- Modify: `middleware.ts`

```typescript
// middleware.ts — COMPLETE REPLACEMENT
import { NextResponse, type NextRequest } from "next/server"
import { verifySessionToken } from "@/lib/auth/jwt"

const PUBLIC_PATHS = ["/login", "/api/auth/request-otp", "/api/auth/verify-otp"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const token = request.cookies.get("ci_session")?.value

  if (!isPublic) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    const session = await verifySessionToken(token)
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("ci_session")
      return response
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && token) {
    const session = await verifySessionToken(token)
    if (session) return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
```

**Step 2: Commit**
```bash
git add middleware.ts
git commit -m "feat(auth): protect all routes via middleware, redirect to /login"
```

---

### Task 2.3: Inventory API Routes

**Files:**
- Create: `lib/db/queries/stock.ts` — stock calculation utility
- Create: `app/api/products/route.ts`
- Create: `app/api/inventory/move/route.ts`
- Create: `app/api/inventory/stock/route.ts`

**Step 1: Stock Calculation Utility** (`lib/db/queries/stock.ts`)

```typescript
import { db } from "@/lib/db/connection"
import { stockMoves, locations } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

export type StockLevel = {
  productId: string
  locationId: string
  locationName: string
  warehouseId: string
  available: number
}

/**
 * Calculates current stock for a product in a warehouse.
 * Event-sourced: SUM(inbound) - SUM(outbound) from done stock_moves.
 * NEVER reads a static stock column — ledger is the source of truth.
 *
 * @param productId - UUID of product to calculate for
 * @param warehouseId - optional filter by warehouse
 */
export async function calculateStockForProduct(
  productId: string,
  warehouseId?: string
): Promise<StockLevel[]> {
  // Inbound: dest is internal location in the warehouse
  const inbound = db
    .select({
      location_id: stockMoves.dest_location_id,
      total: sql<number>`CAST(SUM(${stockMoves.quantity}) AS INTEGER)`.as("total"),
    })
    .from(stockMoves)
    .innerJoin(locations, eq(stockMoves.dest_location_id, locations.id))
    .where(
      and(
        eq(stockMoves.product_id, productId),
        eq(stockMoves.status, "done"),
        eq(locations.type, "internal"),
        warehouseId ? eq(locations.warehouse_id, warehouseId) : undefined
      )
    )
    .groupBy(stockMoves.dest_location_id)
    .as("inbound")

  const outbound = db
    .select({
      location_id: stockMoves.source_location_id,
      total: sql<number>`CAST(SUM(${stockMoves.quantity}) AS INTEGER)`.as("total"),
    })
    .from(stockMoves)
    .innerJoin(locations, eq(stockMoves.source_location_id, locations.id))
    .where(
      and(
        eq(stockMoves.product_id, productId),
        eq(stockMoves.status, "done"),
        eq(locations.type, "internal"),
        warehouseId ? eq(locations.warehouse_id, warehouseId) : undefined
      )
    )
    .groupBy(stockMoves.source_location_id)
    .as("outbound")

  // Use raw SQL for the final calculation — cleaner than complex Drizzle joins
  const rows = await db.execute(sql`
    SELECT
      l.id as location_id,
      l.name as location_name,
      l.warehouse_id,
      COALESCE(i.total, 0) - COALESCE(o.total, 0) AS available
    FROM locations l
    LEFT JOIN (${inbound}) i ON i.location_id = l.id
    LEFT JOIN (${outbound}) o ON o.location_id = l.id
    WHERE l.type = 'internal'
      AND (i.total IS NOT NULL OR o.total IS NOT NULL)
      ${warehouseId ? sql`AND l.warehouse_id = ${warehouseId}` : sql``}
  `)

  return (rows.rows as Array<{ location_id: string; location_name: string; warehouse_id: string; available: number }>).map((r) => ({
    productId,
    locationId: r.location_id,
    locationName: r.location_name,
    warehouseId: r.warehouse_id,
    available: r.available,
  }))
}

/**
 * Returns total available stock across ALL locations for a product.
 */
export async function getTotalStockForProduct(productId: string): Promise<number> {
  const levels = await calculateStockForProduct(productId)
  return levels.reduce((sum, l) => sum + l.available, 0)
}

/**
 * Gets KPI summary for the dashboard.
 */
export async function getInventoryKpis(): Promise<{
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  pendingReceipts: number
  pendingDeliveries: number
  scheduledTransfers: number
}> {
  const [counts] = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM products) AS total_products,
      (SELECT COUNT(*) FROM stock_moves WHERE status IN ('draft', 'waiting', 'ready') AND move_type = 'receipt') AS pending_receipts,
      (SELECT COUNT(*) FROM stock_moves WHERE status IN ('draft', 'waiting', 'ready') AND move_type = 'delivery') AS pending_deliveries,
      (SELECT COUNT(*) FROM stock_moves WHERE status IN ('draft', 'waiting', 'ready') AND move_type = 'internal_transfer') AS scheduled_transfers
  `)
  const row = (counts as any).rows[0]
  return {
    totalProducts: Number(row.total_products),
    lowStockCount: 0,  // TODO: join with reorder_point
    outOfStockCount: 0,
    pendingReceipts: Number(row.pending_receipts),
    pendingDeliveries: Number(row.pending_deliveries),
    scheduledTransfers: Number(row.scheduled_transfers),
  }
}
```

**Step 2: Products Route** (`app/api/products/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { products } from "@/lib/db/schema"
import { getServerSession } from "@/lib/auth/session"
import { eq } from "drizzle-orm"

const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required").toUpperCase(),
  category: z.string().min(1, "Category is required"),
  unit_of_measure: z.string().min(1, "Unit of measure is required"),
  reorder_point: z.number().int().min(0).default(0),
})

export async function GET(_req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const rows = await db.select().from(products).orderBy(products.created_at)
  return NextResponse.json({ products: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const [created] = await db.insert(products).values(parsed.data).returning()
  return NextResponse.json({ product: created }, { status: 201 })
}
```

**Step 3: Inventory Move Route** (`app/api/inventory/move/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { stockMoves, locations } from "@/lib/db/schema"
import { getServerSession } from "@/lib/auth/session"
import { eq, and } from "drizzle-orm"
import { getTotalStockForProduct } from "@/lib/db/queries/stock"

const CreateMoveSchema = z.object({
  product_id: z.string().uuid("Invalid product ID"),
  source_location_id: z.string().uuid("Invalid source location ID"),
  dest_location_id: z.string().uuid("Invalid destination location ID"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  move_type: z.enum(["receipt", "delivery", "internal_transfer", "adjustment"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const rows = await db.select().from(stockMoves).orderBy(stockMoves.created_at)
  return NextResponse.json({ moves: rows })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateMoveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const data = parsed.data

  // Business rule: deliveries and transfers need sufficient stock
  if (data.move_type === "delivery" || data.move_type === "internal_transfer") {
    const available = await getTotalStockForProduct(data.product_id)
    if (available < data.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${available}, Requested: ${data.quantity}` },
        { status: 422 }
      )
    }
  }

  const [move] = await db
    .insert(stockMoves)
    .values({
      ...data,
      created_by: session.userId,
    })
    .returning()

  return NextResponse.json({ move }, { status: 201 })
}
```

**Step 4: Validate/Done Route** (`app/api/inventory/move/[id]/validate/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/connection"
import { stockMoves } from "@/lib/db/schema"
import { getServerSession } from "@/lib/auth/session"
import { eq, and } from "drizzle-orm"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const { id } = await params
  const [move] = await db.select().from(stockMoves).where(eq(stockMoves.id, id)).limit(1)

  if (!move) return NextResponse.json({ error: "Move not found" }, { status: 404 })
  if (move.status === "done") return NextResponse.json({ error: "Move is already validated" }, { status: 409 })
  if (move.status === "canceled") return NextResponse.json({ error: "Cannot validate a canceled move" }, { status: 409 })

  const [updated] = await db
    .update(stockMoves)
    .set({ status: "done", validated_at: new Date() })
    .where(eq(stockMoves.id, id))
    .returning()

  return NextResponse.json({ move: updated })
}
```

**Step 5: Stock Query Route** (`app/api/inventory/stock/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import { calculateStockForProduct } from "@/lib/db/queries/stock"

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const productId = req.nextUrl.searchParams.get("productId")
  const warehouseId = req.nextUrl.searchParams.get("warehouseId") ?? undefined

  if (!productId) return NextResponse.json({ error: "productId query param is required" }, { status: 400 })

  const levels = await calculateStockForProduct(productId, warehouseId)
  return NextResponse.json({ stock: levels })
}
```

**Step 6: KPI Route** (`app/api/inventory/kpis/route.ts`)

```typescript
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"
import { getInventoryKpis } from "@/lib/db/queries/stock"

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const kpis = await getInventoryKpis()
  return NextResponse.json({ kpis })
}
```

**Step 7: Commit**
```bash
git add lib/db/queries/ app/api/
git commit -m "feat(api): add inventory REST endpoints with Zod + ledger stock calculation"
```

---

## Phase 3: Frontend Pages

### Task 3.1: Login Page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/layout.tsx`

```typescript
// app/login/layout.tsx
import type { Metadata } from "next"
export const metadata: Metadata = { title: "Sign In | Core Inventory" }
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      {children}
    </div>
  )
}
```

```typescript
// app/login/page.tsx — "use client"
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Package } from "lucide-react"

type Step = "email" | "otp"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        // If name required for first-time user, show name field
        if (data.error?.includes("Name is required")) {
          setIsNewUser(true)
          toast.info("Looks like you're new! Please enter your name.")
        } else {
          toast.error(data.error ?? "Failed to send OTP")
        }
        return
      }
      toast.success("OTP sent! Check your email.")
      setStep("otp")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Invalid OTP")
        return
      }
      toast.success("Welcome to Core Inventory!")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      {/* Atmospheric blur orb */}
      <div className="blur-orb h-96 w-96 -top-24 -left-24 bg-gradient-to-br from-indigo-400 to-violet-400" />
      <div className="blur-orb h-64 w-64 bottom-24 right-24 bg-gradient-to-br from-violet-400 to-indigo-400" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-button">
            <Package className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="text-gradient">Core Inventory</span>
          </h1>
          <p className="text-sm text-muted-foreground">Enterprise Warehouse Management</p>
        </div>

        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle>{step === "email" ? "Sign In" : "Enter Your Code"}</CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email to receive a one-time code."
                : `We sent a 6-digit code to ${email}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                {isNewUser && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:-translate-y-0.5 transition-all rounded-lg"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Send Code
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-Digit Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl font-mono tracking-[0.5em]"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:-translate-y-0.5 transition-all rounded-lg"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify & Sign In
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep("email"); setOtp("") }}
                >
                  Back
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

### Task 3.2: Dashboard Page (Live KPIs from API)

**Files:**
- Modify: `app/(dashboard)/page.tsx` — fetch real KPIs from `/api/inventory/kpis`

The dashboard page becomes a Server Component that calls getInventoryKpis() directly (no fetch, just import the server-side function).

```typescript
// app/(dashboard)/page.tsx — Server Component
import { getInventoryKpis } from "@/lib/db/queries/stock"
import { getServerSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
// ... KpiCard component stays the same, just replace static data with real data
// Replace the kpis constant with:
// const kpis = await getInventoryKpis()
```

---

### Task 3.3: Products Page (Full CRUD Table)

**Files:**
- Modify: `app/(dashboard)/products/page.tsx`
- Create: `components/products/product-form.tsx`

The products page needs a table with real data + a slide-over for creating products. Use React Query for client-side data management.

---

### Task 3.4: Operations Pages (Receipts, Deliveries, Transfers, Adjustments)

**Files:**
- Modify existing stub pages in `app/(dashboard)/operations/*/page.tsx`
- Create: `components/operations/move-form.tsx`

Each operations page follows the same pattern: Table of moves + Slide-over form to create a new move. The form validates client-side with Zod + React Hook Form and calls the `/api/inventory/move` endpoint.

---

### Task 3.5: Move History Page

**Files:**
- Create: `app/(dashboard)/move-history/page.tsx`

A full-width, read-only server-rendered table of all `stock_moves` entries with status badges and filters.

---

## Phase 4: Seed Data + Final Polish

### Task 4.1: Database Seed Script

**Files:**
- Create: `lib/db/seed.ts`

Inserts:
- 1 warehouse: "Main Warehouse" (Code: MW-01)
- 4 locations: Vendor, Customer, Main Store (internal), Production Floor (internal)
- 5 sample products: Steel Rods, Timber Planks, Cement Bags, Copper Wire, PVC Pipes
- A few sample receipts (done status) to show real stock numbers

Run with: `pnpm exec tsx lib/db/seed.ts`

---

### Task 4.2: README update

Final step: update `README.md` with setup instructions, screenshots, and architecture overview for hackathon evaluators.

---

## Execution Notes

- **Run order is strict:** Phase 1 → 2 → 3 → 4
- **After Task 1.1:** Run `pnpm exec drizzle-kit push` before any API work
- **After Task 1.3:** Create Ethereal email account at https://ethereal.email and add credentials to `.env`
- **typecheck after every commit:** `pnpm run typecheck` must pass
