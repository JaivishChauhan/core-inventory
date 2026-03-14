import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { users, otpTokens } from "@/lib/db/schema"
import { hashOtpToken } from "@/lib/auth/otp"
import { hashPassword } from "@/lib/auth/password"
import { eq, and, gt } from "drizzle-orm"

const ResetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

/**
 * POST /api/auth/reset-password
 * Validates a 6-digit OTP and resets the user's password.
 * On success: marks token used and updates password hash.
 *
 * @validation otp must be exactly 6 numeric digits.
 * @validation newPassword must be at least 8 characters.
 * @security Token is marked used immediately on first successful verification.
 * @security Password is hashed with bcrypt before storage.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = ResetPasswordSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    )
  }

  const { email, otp, newPassword } = parsed.data
  const hashedInput = hashOtpToken(otp)
  const now = new Date()

  try {
    // Verify OTP
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

    // Mark OTP as used
    await db
      .update(otpTokens)
      .set({ used: true })
      .where(eq(otpTokens.id, matchedToken.id))

    // Update user password
    const passwordHash = await hashPassword(newPassword)
    await db
      .update(users)
      .set({ password_hash: passwordHash, updated_at: new Date() })
      .where(eq(users.email, email))

    return NextResponse.json({
      message: "Password reset successfully. You can now log in with your new password.",
    })
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error)
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
