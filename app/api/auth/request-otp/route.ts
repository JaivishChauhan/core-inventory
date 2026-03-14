import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { users, otpTokens } from "@/lib/db/schema"
import { generateOtpCode, hashOtpToken, getOtpExpiryDate } from "@/lib/auth/otp"
import { sendOtpEmail } from "@/lib/auth/mailer"
import { eq } from "drizzle-orm"

const RequestOtpSchema = z.object({
  email: z.string().email("Invalid email format"),
})

/**
 * POST /api/auth/request-otp
 * Generates a 6-digit OTP for password reset.
 * User must already exist in the system.
 *
 * @validation email must be valid RFC-5322 format.
 * @security Raw OTP is never stored — only SHA-256 hash.
 * @security All outstanding OTPs for the email are invalidated before creating a new one.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = RequestOtpSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    )
  }

  const { email } = parsed.data

  try {
    // Check if user exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!existingUser) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      )
    }

    // Revoke all prior OTPs for this email to prevent replay attacks
    await db.delete(otpTokens).where(eq(otpTokens.email, email))

    // Generate OTP, hash it, and store the hash
    const rawOtp = generateOtpCode()
    await db.insert(otpTokens).values({
      email,
      hashed_token: hashOtpToken(rawOtp),
      expires_at: getOtpExpiryDate(),
    })

    await sendOtpEmail(email, rawOtp)

    return NextResponse.json({ message: "Password reset code sent to your email." })
  } catch (error) {
    console.error("[POST /api/auth/request-otp]", error)
    return NextResponse.json(
      { error: "Failed to send reset code. Please try again." },
      { status: 500 }
    )
  }
}
