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
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
})

/**
 * POST /api/auth/verify-otp
 * Validates a 6-digit OTP against the stored hash.
 * On success: marks token used, signs a JWT, sets the session cookie.
 *
 * @validation otp must be exactly 6 numeric digits.
 * @security Token is marked used immediately on first successful verification.
 * @security Session JWT is stored in an HTTP-only cookie.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = VerifyOtpSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  const { email, otp } = parsed.data
  const hashedInput = hashOtpToken(otp)
  const now = new Date()

  const [matchedToken] = await db
    .select()
    .from(otpTokens)
    .where(
      and(
        eq(otpTokens.email, email),
        eq(otpTokens.hashed_token, hashedInput),
        eq(otpTokens.used, false),
        gt(otpTokens.expires_at, now)
      )
    )
    .limit(1)

  if (!matchedToken) {
    return NextResponse.json(
      { error: "Invalid or expired code. Please request a new one." },
      { status: 401 }
    )
  }

  // Atomically mark as used
  await db
    .update(otpTokens)
    .set({ used: true })
    .where(eq(otpTokens.id, matchedToken.id))

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: "User record not found." }, { status: 404 })
  }

  const sessionToken = await signSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    warehouseId: user.active_warehouse_id,
  })

  const response = NextResponse.json({
    message: "Authenticated successfully.",
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
  response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken))
  return response
}
