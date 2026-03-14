import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
import { verifyPassword } from "@/lib/auth/password"
import { signSessionToken } from "@/lib/auth/jwt"
import { buildSessionCookieHeader } from "@/lib/auth/session"
import { eq } from "drizzle-orm"

const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

/**
 * POST /api/auth/login
 * Authenticates a user with email and password.
 * On success: signs a JWT and sets the session cookie.
 *
 * @validation email must be valid.
 * @security Password is verified using bcrypt constant-time comparison.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = LoginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      )
    }

    // Sign session token
    const sessionToken = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      warehouseId: user.active_warehouse_id,
    })

    const response = NextResponse.json({
      message: "Authenticated successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
    response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken))
    return response
  } catch (error) {
    console.error("[POST /api/auth/login]", error)
    return NextResponse.json(
      { error: "Failed to authenticate. Please try again." },
      { status: 500 }
    )
  }
}
