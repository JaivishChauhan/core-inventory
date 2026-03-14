/**
 * Manual migration script — aligns DB to the new schema.
 * Run: pnpm exec tsx lib/db/migrate.ts
 */
import { db } from "./connection"
import { sql } from "drizzle-orm"

async function runMigration() {
  console.log("Running migration...")

  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff');
      END IF;
    END $$;
  `)

  // Add name column to users if missing, drop old auth columns
  await db.execute(sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
      DROP COLUMN IF EXISTS username,
      DROP COLUMN IF EXISTS password_hash;
  `)

  // Create otp_tokens table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS otp_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      hashed_token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  // Drop old otp_codes table
  await db.execute(sql`DROP TABLE IF EXISTS otp_codes;`)

  // Rename reference_document -> reference in stock_moves
  await db.execute(sql`
    ALTER TABLE stock_moves
      RENAME COLUMN reference_document TO reference;
  `)

  // Add user_role type handling
  await db.execute(sql`
    ALTER TABLE users
      ALTER COLUMN role SET DEFAULT 'staff';
  `)

  console.log("Migration complete ✓")
  process.exit(0)
}

runMigration().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})
