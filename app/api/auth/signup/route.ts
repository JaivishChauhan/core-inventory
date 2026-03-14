import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db/connection"
import { users } from "@/lib/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { signSessionToken } from "@/lib/auth/jwt"
import { buildSessionCookieHeader } from "@/lib/auth/session"
import { eq } from "drizzle-orm"

const SignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

/**
 * POST /api/auth/signup
 * Creates a new user account with email, name, and password.
 * On success: signs a JWT and sets the session cookie.
 *
 * @validation email must be valid and unique.
 * @validation password must be at least 8 characters.
 * @security Password is hashed with bcrypt before storage.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = SignupSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
      { status: 400 }
    )
  }

  const { email, name, password } = parsed.data

  try {
    // Check if user already exists
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      )
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        password_hash: passwordHash,
      })
      .returning()

    // Sign session token
    const sessionToken = await signSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      warehouseId: newUser.active_warehouse_id,
    })

    const response = NextResponse.json({
      message: "Account created successfully.",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
    })
    response.headers.set("Set-Cookie", buildSessionCookieHeader(sessionToken))
    return response
  } catch (error) {
    console.error("[POST /api/auth/signup]", error)
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    )
  }
}
